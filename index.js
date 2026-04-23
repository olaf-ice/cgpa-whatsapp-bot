
const express = require("express");
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const fs = require('fs');
const path = require('path');

const app = express();

// Trust Render's reverse proxy (required for correct IP/protocol detection)
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const gradeMap = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
    F: 0
};

const CONTROL_WINDOW_MS = 2 * 60 * 1000;    // 2 minutes
const LOCK_DURATION_MS  = 24 * 60 * 60 * 1000; // 24 hours
const STATE_FILE = path.join(__dirname, 'state.json');

// ─── Persistence ────────────────────────────────────────────────────────────

let userStates = new Map();

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            userStates = new Map(Object.entries(data));
            console.log(`Loaded state for ${userStates.size} user(s).`);
        }
    } catch (err) {
        console.error('Failed to load state:', err.message);
    }
}

function saveState() {
    try {
        const data = Object.fromEntries(userStates);
        fs.writeFileSync(STATE_FILE, JSON.stringify(data));
    } catch (err) {
        console.error('Failed to save state:', err.message);
    }
}

loadState();

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseCourses(message) {
    return message.split(",")
        .map(part => part.trim())
        .filter(Boolean)
        .map(part => {
            const pieces = part.split(/\s+/);
            if (pieces.length < 3) return null;
            const code  = pieces[0].toUpperCase();
            const grade = pieces[1].toUpperCase();
            const unit  = parseInt(pieces[2], 10);
            if (!code || !grade || Number.isNaN(unit) || unit <= 0) return null;
            // Flag unknown grades instead of silently dropping
            if (!(grade in gradeMap)) return { code, grade, unit, invalid: true };
            return { code, grade, unit, invalid: false };
        })
        .filter(Boolean);
}

function computeCGPA(courses) {
    const validCourses = courses.filter(c => !c.invalid);
    const totalPoints = validCourses.reduce((sum, c) => sum + gradeMap[c.grade] * c.unit, 0);
    const totalUnits  = validCourses.reduce((sum, c) => sum + c.unit, 0);
    if (totalUnits === 0) return null;
    return { cgpa: (totalPoints / totalUnits).toFixed(2), totalUnits, totalPoints };
}

function computeCumulativeCGPA(semesters) {
    let totalPoints = 0;
    let totalUnits  = 0;
    semesters.forEach(sem => {
        totalPoints += sem.totalPoints;
        totalUnits  += sem.totalUnits;
    });
    if (totalUnits === 0) return null;
    return (totalPoints / totalUnits).toFixed(2);
}

function isDifferentRecord(previous, current) {
    if (!previous || previous.length === 0 || current.length === 0) return false;

    const previousCodes = new Set(previous.map(c => c.code));
    const currentCodes  = new Set(current.map(c => c.code));
    const previousMap   = Object.fromEntries(previous.map(c => [c.code, c]));

    const addedCodes   = [...currentCodes].filter(code => !previousCodes.has(code)).length;
    const removedCodes = [...previousCodes].filter(code => !currentCodes.has(code)).length;

    let changedCommon = 0;
    current.forEach(c => {
        const prev = previousMap[c.code];
        if (prev && (prev.grade !== c.grade || prev.unit !== c.unit)) changedCommon++;
    });

    const prevUnits = previous.reduce((s, c) => s + c.unit, 0);
    const currUnits = current.reduce((s, c) => s + c.unit, 0);
    const unitDiff  = Math.abs(currUnits - prevUnits);

    if (addedCodes + removedCodes >= 2)                          return true;
    if (changedCommon >= 2)                                      return true;
    if ((addedCodes + removedCodes) >= 1 && unitDiff >= 3)      return true;
    return false;
}

function getUserState(phone) {
    if (!userStates.has(phone)) {
        userStates.set(phone, {
            warningCount:    0,
            attempts:        0,
            recentAttempts:  [],
            lastCourses:     null,
            lastActivity:    0,
            remainingCalc:   0,
            lockedUntil:     0,
            semesters:       []     // cumulative tracking
        });
    }
    const state = userStates.get(phone);
    if (!state.semesters) state.semesters = []; // migrate old entries
    return state;
}

function pruneRecentAttempts(state, now) {
    state.recentAttempts = state.recentAttempts.filter(ts => now - ts <= CONTROL_WINDOW_MS);
}

function resetAbuse(state) {
    state.warningCount   = 0;
    state.attempts       = 0;
    state.recentAttempts = [];
    state.lastCourses    = null;
    state.remainingCalc  = 0;
    state.lockedUntil    = 0;
    // semesters are intentionally preserved across abuse resets
}

// ─── Routes ─────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
    res.json({ status: "ok", service: "CGPA WhatsApp Bot", uptime: process.uptime() });
});

/**
 * POST /calculate
 * Body: { courses: [{ code, grade, unit }] }
 * grade must be one of A B C D E F (case-insensitive).
 */
app.post("/calculate", (req, res) => {
    const courses = req.body.courses;
    if (!Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ error: "courses array is required" });
    }

    let totalPoints = 0;
    let totalUnits  = 0;
    const invalid   = [];

    courses.forEach(course => {
        const grade = (course.grade || '').toUpperCase();
        const unit  = Number(course.unit);
        const point = gradeMap[grade];

        if (point === undefined || Number.isNaN(unit) || unit <= 0) {
            invalid.push(course.code || 'unknown');
        } else {
            totalPoints += point * unit;
            totalUnits  += unit;
        }
    });

    if (totalUnits === 0) {
        return res.status(400).json({ error: "No valid courses provided", invalid });
    }

    res.json({ cgpa: (totalPoints / totalUnits).toFixed(2), totalUnits, invalid });
});

/**
 * POST /webhook  — Twilio WhatsApp webhook
 */
app.post("/webhook", (req, res) => {
    try {
        const twiml   = new MessagingResponse();
        const body    = req.body || {};
        const from    = body.From || "unknown";
        const message = (body.Body || "").trim();
        const now     = Date.now();
        const state   = getUserState(from);

        // ── Locked check ────────────────────────────────────────────────────
        if (state.lockedUntil > now) {
            twiml.message(
                "🔒 Access temporarily restricted due to multiple profile usage. " +
                "This account is for one student only. " +
                "To continue, please reactivate access or wait 24 hours."
            );
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        // ── Inactivity reset (24 h gap resets abuse counters) ───────────────
        if (now - state.lastActivity > LOCK_DURATION_MS) {
            resetAbuse(state);
        }

        if (!message) return res.sendStatus(200);

        const upperMsg = message.toUpperCase();

        // ── Special commands ─────────────────────────────────────────────────
        if (upperMsg === 'HELP') {
            twiml.message(
                "📚 *CGPA Bot Help*\n\n" +
                "*Format:* CODE GRADE UNIT, CODE GRADE UNIT\n" +
                "*Example:* GST101 A 3, MTH102 B 4\n\n" +
                "*Commands:*\n" +
                "• CUMULATIVE — view overall CGPA across all semesters\n" +
                "• RESET — clear all your saved semester records\n" +
                "• HELP — show this message\n\n" +
                "*Grades:* A=5.0, B=4.0, C=3.0, D=2.0, E=1.0, F=0.0"
            );
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        if (upperMsg === 'RESET' || upperMsg === 'CLEAR') {
            state.semesters = [];
            resetAbuse(state);
            saveState();
            twiml.message("🔄 All your semester records have been cleared. Send your courses to start fresh.\n\nFormat: GST101 A 3, MTH102 B 4");
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        if (upperMsg === 'CUMULATIVE' || upperMsg === 'TOTAL' || upperMsg === 'CGPA') {
            if (state.semesters.length === 0) {
                twiml.message("📭 No semesters recorded yet.\n\nSend your courses to get started:\nGST101 A 3, MTH102 B 4");
            } else {
                const cumulative = computeCumulativeCGPA(state.semesters);
                twiml.message(
                    `📈 *Cumulative CGPA* across ${state.semesters.length} semester(s): *${cumulative}* 🎓\n\n` +
                    "Send RESET to clear all records, or send a new semester's courses."
                );
            }
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        // ── Parse courses ─────────────────────────────────────────────────────
        console.log(`[${from}] said: ${message}`);

        const parsedCourses  = parseCourses(message);
        const invalidGrades  = parsedCourses.filter(c => c.invalid);
        const validCourses   = parsedCourses.filter(c => !c.invalid);
        const hasValidCourses = validCourses.length > 0;

        // Unknown grades with nothing valid → reject early
        if (!hasValidCourses && invalidGrades.length > 0) {
            const codes = invalidGrades.map(c => c.code).join(', ');
            twiml.message(
                `❌ Unknown grade(s) for: *${codes}*\n` +
                "Valid grades are: A, B, C, D, E, F\n\n" +
                "Format: GST101 A 3, MTH102 B 4"
            );
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        if (!hasValidCourses) {
            twiml.message(
                "❌ Invalid format.\n\n" +
                "Use: CODE GRADE UNIT, CODE GRADE UNIT\n" +
                "Example: GST101 A 3, MTH102 B 4\n\n" +
                "Type HELP for more info."
            );
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        // ── Abuse detection ──────────────────────────────────────────────────
        pruneRecentAttempts(state, now);
        state.recentAttempts.push(now);
        state.attempts    += 1;
        state.lastActivity = now;

        const tooFast       = state.recentAttempts.length >= 3;
        const differentRec  = isDifferentRecord(state.lastCourses, validCourses);

        if (differentRec || tooFast) state.warningCount++;
        state.lastCourses = validCourses;

        // ── Compute result ───────────────────────────────────────────────────
        const result = computeCGPA(validCourses);

        if (!result) {
            twiml.message("❌ Could not compute CGPA. Please check your course units are positive numbers.");
        } else if (state.warningCount >= 3) {
            state.lockedUntil = now + LOCK_DURATION_MS;
            twiml.message(
                "🔒 Access temporarily restricted due to multiple profile usage. " +
                "This account is for one student only. " +
                "To continue, please reactivate access or wait 24 hours."
            );
        } else {
            // Store this semester
            state.semesters.push({
                totalPoints: result.totalPoints,
                totalUnits:  result.totalUnits,
                timestamp:   now
            });

            const semCount   = state.semesters.length;
            const cumulative = computeCumulativeCGPA(state.semesters);

            // Warn notice (still gives result)
            let prefix = '';
            if (state.warningCount === 1 && (differentRec || tooFast)) {
                prefix = "⚠️ This looks like a different academic record. This access is meant for one student only.\n\n";
            } else if (state.warningCount === 2) {
                if (state.remainingCalc <= 0) state.remainingCalc = 1;
                prefix = "⚠️ Multiple different records detected. You can only run 1 more calculation before access is restricted.\n\n";
                state.remainingCalc--;
            }

            // Warn about any skipped invalid grades
            let suffix = '';
            if (invalidGrades.length > 0) {
                const codes = invalidGrades.map(c => c.code).join(', ');
                suffix = `\n\n⚠️ Skipped unknown grade(s): ${codes}`;
            }

            if (semCount === 1) {
                twiml.message(
                    `${prefix}📊 Semester CGPA: *${result.cgpa}* 🎯${suffix}\n\n` +
                    "Send another semester to track your cumulative CGPA, or type HELP."
                );
            } else {
                twiml.message(
                    `${prefix}📊 Semester CGPA: *${result.cgpa}* 🎯\n` +
                    `📈 Cumulative CGPA: *${cumulative}* (${semCount} semesters)${suffix}\n\n` +
                    "Type CUMULATIVE to view overall, RESET to clear."
                );
            }
        }

        saveState();

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown (Render sends SIGTERM before stopping the container)
process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    saveState();
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});