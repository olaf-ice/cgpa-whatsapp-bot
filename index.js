
const express  = require("express");
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const axios    = require('axios');

const app = express();
app.set('trust proxy', 1);

// Raw body MUST come before urlencoded for Paystack signature verification
app.use('/paystack-webhook', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Constants ────────────────────────────────────────────────────────────────

const gradeMap = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

const CONTROL_WINDOW_MS = 2 * 60 * 1000;
const LOCK_DURATION_MS  = 24 * 60 * 60 * 1000;
const SEMESTER_MS       = 90 * 24 * 60 * 60 * 1000; // 3 months
const AMOUNT_KOBO       = 100000;                    // ₦1,000
const STATE_FILE        = path.join(__dirname, 'state.json');
const VALID_LEVELS      = ['100','200','300','400','500','600','700'];
const PAYSTACK_SECRET   = process.env.PAYSTACK_SECRET_KEY || '';

const PHASE = {
    UNREGISTERED:        'unregistered',
    AWAITING_NAME:       'awaiting_name',
    AWAITING_MATRIC:     'awaiting_matric',
    AWAITING_FACULTY:    'awaiting_faculty',
    AWAITING_DEPARTMENT: 'awaiting_department',
    AWAITING_LEVEL:      'awaiting_level',
    AWAITING_EMAIL:      'awaiting_email',
    REGISTERED:          'registered'
};

// ─── Persistence ──────────────────────────────────────────────────────────────

let userStates = new Map();

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            userStates = new Map(Object.entries(data));
            console.log(`Loaded state for ${userStates.size} user(s).`);
        }
    } catch (err) { console.error('Failed to load state:', err.message); }
}

function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(Object.fromEntries(userStates)));
    } catch (err) { console.error('Failed to save state:', err.message); }
}

loadState();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserState(phone) {
    if (!userStates.has(phone)) {
        userStates.set(phone, {
            phase:           PHASE.UNREGISTERED,
            profile:         { name: null, matric: null, faculty: null, department: null, level: null, email: null },
            freeCheckUsed:   false,
            isPaid:          false,
            paidUntil:       0,
            warningCount:    0,
            attempts:        0,
            recentAttempts:  [],
            lastCourses:     null,
            lastActivity:    0,
            remainingCalc:   0,
            lockedUntil:     0,
            semesters:       []
        });
    }
    const s = userStates.get(phone);
    // Migrate old users
    if (!s.phase)          s.phase          = PHASE.REGISTERED;
    if (!s.profile)        s.profile        = { name: null, matric: null, faculty: null, department: null, level: null, email: null };
    if (!s.profile.email)  s.profile.email  = null;
    if (!s.semesters)      s.semesters      = [];
    if (s.freeCheckUsed === undefined) s.freeCheckUsed = true;  // old users keep full access
    if (s.isPaid       === undefined) s.isPaid         = true;  // old users keep full access
    if (s.paidUntil    === undefined) s.paidUntil      = 0;
    return s;
}

function isPaidActive(state) {
    return state.isPaid && Date.now() < state.paidUntil;
}

function parseCourses(message) {
    return message.split(",")
        .map(p => p.trim()).filter(Boolean)
        .map(p => {
            const parts = p.split(/\s+/);
            if (parts.length < 3) return null;
            const code  = parts[0].toUpperCase();
            const grade = parts[1].toUpperCase();
            const unit  = parseInt(parts[2], 10);
            if (!code || !grade || isNaN(unit) || unit <= 0) return null;
            if (!(grade in gradeMap)) return { code, grade, unit, invalid: true };
            return { code, grade, unit, invalid: false };
        }).filter(Boolean);
}

function computeCGPA(courses) {
    const valid = courses.filter(c => !c.invalid);
    const tp    = valid.reduce((s, c) => s + gradeMap[c.grade] * c.unit, 0);
    const tu    = valid.reduce((s, c) => s + c.unit, 0);
    if (tu === 0) return null;
    return { cgpa: (tp / tu).toFixed(2), totalUnits: tu, totalPoints: tp };
}

function computeCumulativeCGPA(semesters) {
    const tp = semesters.reduce((s, x) => s + x.totalPoints, 0);
    const tu = semesters.reduce((s, x) => s + x.totalUnits, 0);
    return tu === 0 ? null : (tp / tu).toFixed(2);
}

function isDifferentRecord(previous, current) {
    if (!previous || previous.length === 0 || current.length === 0) return false;
    const prevCodes = new Set(previous.map(c => c.code));
    const currCodes = new Set(current.map(c => c.code));
    const prevMap   = Object.fromEntries(previous.map(c => [c.code, c]));
    const added   = [...currCodes].filter(x => !prevCodes.has(x)).length;
    const removed = [...prevCodes].filter(x => !currCodes.has(x)).length;
    let changed = 0;
    current.forEach(c => {
        const p = prevMap[c.code];
        if (p && (p.grade !== c.grade || p.unit !== c.unit)) changed++;
    });
    const unitDiff = Math.abs(
        current.reduce((s, c) => s + c.unit, 0) -
        previous.reduce((s, c) => s + c.unit, 0)
    );
    if (added + removed >= 2)                    return true;
    if (changed >= 2)                            return true;
    if ((added + removed) >= 1 && unitDiff >= 3) return true;
    return false;
}

function resetAbuse(s) {
    s.warningCount = 0; s.attempts = 0; s.recentAttempts = [];
    s.lastCourses = null; s.remainingCalc = 0; s.lockedUntil = 0;
}

function pruneAttempts(s, now) {
    s.recentAttempts = s.recentAttempts.filter(t => now - t <= CONTROL_WINDOW_MS);
}

function profileText(p, paid, paidUntil) {
    const expiry = paid && paidUntil > Date.now()
        ? `✅ Active until ${new Date(paidUntil).toDateString()}`
        : '🔒 Free tier (1 calculation used)';
    return (
        `👤 *Your Profile*\n\n` +
        `📛 Name: ${p.name}\n` +
        `🎓 Matric No: ${p.matric}\n` +
        `🏛️ Faculty: ${p.faculty}\n` +
        `📚 Department: ${p.department}\n` +
        `📊 Level: ${p.level}L\n` +
        `📧 Email: ${p.email}\n\n` +
        `💳 Subscription: ${expiry}`
    );
}

function upgradePrompt() {
    return (
        `🔒 *Full Access Required*\n\n` +
        `Your free check has been used.\n\n` +
        `Upgrade for *₦1,000/semester* to unlock:\n` +
        `• Unlimited CGPA calculations\n` +
        `• Cumulative CGPA tracking\n` +
        `• Semester history\n` +
        `• Profile & Reset commands\n\n` +
        `👉 Send *PAY* to get your payment link.`
    );
}

function send(twiml, res, text) {
    twiml.message(text);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
}

async function initializePaystackPayment(email, phone) {
    const reference = `cgpa_${phone.replace(/\D/g, '')}_${Date.now()}`;
    const response  = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email, amount: AMOUNT_KOBO, reference, metadata: { phone } },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' } }
    );
    return { url: response.data.data.authorization_url, reference };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
    res.json({ status: "ok", service: "CGPA WhatsApp Bot", uptime: process.uptime() });
});

app.post("/calculate", (req, res) => {
    const courses = req.body.courses;
    if (!Array.isArray(courses) || courses.length === 0)
        return res.status(400).json({ error: "courses array is required" });
    let tp = 0, tu = 0;
    const invalid = [];
    courses.forEach(c => {
        const grade = (c.grade || '').toUpperCase();
        const unit  = Number(c.unit);
        const point = gradeMap[grade];
        if (point === undefined || isNaN(unit) || unit <= 0) invalid.push(c.code || 'unknown');
        else { tp += point * unit; tu += unit; }
    });
    if (tu === 0) return res.status(400).json({ error: "No valid courses provided", invalid });
    res.json({ cgpa: (tp / tu).toFixed(2), totalUnits: tu, invalid });
});

// ─── Paystack Webhook ─────────────────────────────────────────────────────────

app.post("/paystack-webhook", (req, res) => {
    try {
        const secret = PAYSTACK_SECRET;
        if (!secret) return res.sendStatus(400);

        const signature = req.headers['x-paystack-signature'];
        const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');

        if (hash !== signature) {
            console.warn('Invalid Paystack signature');
            return res.sendStatus(401);
        }

        const event = JSON.parse(req.body.toString());

        if (event.event === 'charge.success') {
            const phone = event.data.metadata && event.data.metadata.phone;
            if (phone && userStates.has(phone)) {
                const state     = userStates.get(phone);
                state.isPaid    = true;
                state.paidUntil = Date.now() + SEMESTER_MS;
                saveState();
                console.log(`✅ Payment confirmed for ${phone} — paid until ${new Date(state.paidUntil).toDateString()}`);
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Paystack webhook error:', err.message);
        res.sendStatus(500);
    }
});

// ─── WhatsApp Webhook ─────────────────────────────────────────────────────────

app.post("/webhook", async (req, res) => {
    try {
        const twiml = new MessagingResponse();
        const body  = req.body || {};
        const from  = body.From || "unknown";
        const msg   = (body.Body || "").trim();
        const upper = msg.toUpperCase().trim();
        const now   = Date.now();
        const state = getUserState(from);

        // ── Locked ──────────────────────────────────────────────────────────
        if (state.lockedUntil > now) {
            return send(twiml, res,
                "🔒 Access temporarily restricted due to multiple profile usage. " +
                "This account is for one student only. Wait 24 hours."
            );
        }

        if (!msg) return res.sendStatus(200);

        // ── REGISTRATION FLOW ────────────────────────────────────────────────

        if (state.phase === PHASE.UNREGISTERED || upper === 'REGISTER') {
            state.phase = PHASE.AWAITING_NAME;
            saveState();
            return send(twiml, res,
                "🎓 *Welcome to the UI CGPA Calculator!*\n\n" +
                "Let's set up your profile — takes less than a minute.\n\n" +
                "📛 Enter your *Full Name*:"
            );
        }

        if (state.phase === PHASE.AWAITING_NAME) {
            if (msg.length < 2)
                return send(twiml, res, "❌ Name too short. Enter your *Full Name*:");
            state.profile.name = msg;
            state.phase = PHASE.AWAITING_MATRIC;
            saveState();
            return send(twiml, res,
                `✅ Got it, *${msg}*!\n\n` +
                "🎓 Enter your *Matric Number*:\n_(e.g. 23/0001 or 2023/12345)_"
            );
        }

        if (state.phase === PHASE.AWAITING_MATRIC) {
            if (msg.length < 3)
                return send(twiml, res, "❌ Invalid. Enter your *Matric Number*:");
            state.profile.matric = msg.toUpperCase();
            state.phase = PHASE.AWAITING_FACULTY;
            saveState();
            return send(twiml, res,
                "✅ Noted!\n\n🏛️ Enter your *Faculty*:\n_(e.g. Science, Arts, Social Sciences, Education, Law)_"
            );
        }

        if (state.phase === PHASE.AWAITING_FACULTY) {
            if (msg.length < 2)
                return send(twiml, res, "❌ Enter a valid *Faculty* name:");
            state.profile.faculty = msg;
            state.phase = PHASE.AWAITING_DEPARTMENT;
            saveState();
            return send(twiml, res,
                "✅ Got it!\n\n📚 Enter your *Department*:\n_(e.g. Computer Science, Mathematics, English)_"
            );
        }

        if (state.phase === PHASE.AWAITING_DEPARTMENT) {
            if (msg.length < 2)
                return send(twiml, res, "❌ Enter a valid *Department* name:");
            state.profile.department = msg;
            state.phase = PHASE.AWAITING_LEVEL;
            saveState();
            return send(twiml, res,
                "✅ Almost done!\n\n📊 What *Level* are you?\nReply with: *100, 200, 300, 400, 500, 600, or 700*"
            );
        }

        if (state.phase === PHASE.AWAITING_LEVEL) {
            const lvl = msg.replace(/[lL]/g, '').trim();
            if (!VALID_LEVELS.includes(lvl))
                return send(twiml, res,
                    "❌ Invalid. Reply with: *100, 200, 300, 400, 500, 600, or 700*"
                );
            state.profile.level = lvl;
            state.phase = PHASE.AWAITING_EMAIL;
            saveState();
            return send(twiml, res,
                "✅ Great!\n\n📧 Finally, enter your *Email Address*:\n_(Used for your payment receipt)_"
            );
        }

        if (state.phase === PHASE.AWAITING_EMAIL) {
            if (!msg.includes('@') || !msg.includes('.'))
                return send(twiml, res, "❌ Enter a valid *Email Address*:");
            state.profile.email = msg.toLowerCase();
            state.phase = PHASE.REGISTERED;
            saveState();
            return send(twiml, res,
                `🎉 *Registration Complete!*\n\n` +
                `Welcome, *${state.profile.name}*! 🎓\n\n` +
                `${profileText(state.profile, false, 0)}\n\n` +
                `─────────────────────\n` +
                `🆓 You have *1 free CGPA calculation*.\n\n` +
                `📌 Send your courses to try it:\n` +
                `*GST101 A 3, MTH102 B 4*\n\n` +
                `Type *HELP* to see all commands.`
            );
        }

        // ── From here: REGISTERED user ───────────────────────────────────────

        const paid = isPaidActive(state);

        if (now - state.lastActivity > LOCK_DURATION_MS) resetAbuse(state);

        // ── HELP ─────────────────────────────────────────────────────────────
        if (upper === 'HELP') {
            const paidCmds = paid
                ? "• CUMULATIVE — overall CGPA across all semesters\n• PROFILE — view your details & subscription\n• RESET — clear semester records\n"
                : "• PAY / UPGRADE — unlock full access (₦1,000/semester)\n• PROFILE — view your registration details\n";
            return send(twiml, res,
                "📚 *CGPA Bot Help*\n\n" +
                "*Format:* CODE GRADE UNIT, CODE GRADE UNIT\n" +
                "*Example:* GST101 A 3, MTH102 B 4\n\n" +
                "*Commands:*\n" +
                paidCmds +
                "• STATUS — check subscription status\n" +
                "• REGISTER — update registration info\n" +
                "• HELP — show this message\n\n" +
                "*Grades:* A=5.0  B=4.0  C=3.0  D=2.0  E=1.0  F=0.0"
            );
        }

        // ── STATUS ───────────────────────────────────────────────────────────
        if (upper === 'STATUS') {
            if (paid) {
                const days = Math.ceil((state.paidUntil - now) / (1000 * 60 * 60 * 24));
                return send(twiml, res,
                    `💳 *Subscription Status*\n\n` +
                    `✅ Active — expires ${new Date(state.paidUntil).toDateString()}\n` +
                    `⏳ ${days} day(s) remaining\n\n` +
                    `Send *PAY* to renew when it expires.`
                );
            }
            return send(twiml, res,
                `💳 *Subscription Status*\n\n` +
                `🔒 Free tier${state.freeCheckUsed ? ' (free check used)' : ' (1 free check remaining)'}\n\n` +
                `Send *PAY* to unlock full access for ₦1,000/semester.`
            );
        }

        // ── PAY / UPGRADE ─────────────────────────────────────────────────────
        if (upper === 'PAY' || upper === 'UPGRADE') {
            if (!PAYSTACK_SECRET) {
                return send(twiml, res,
                    "⚙️ *Payment not yet active.*\n\n" +
                    "The payment system is being set up. Check back soon!"
                );
            }
            if (paid) {
                const days = Math.ceil((state.paidUntil - now) / (1000 * 60 * 60 * 24));
                return send(twiml, res,
                    `✅ You already have an active subscription!\n` +
                    `Expires: ${new Date(state.paidUntil).toDateString()} (${days} days left)\n\n` +
                    `Send *PAY* again close to expiry to renew.`
                );
            }
            try {
                const email = state.profile.email || `${state.profile.matric || 'student'}@ui.edu.ng`;
                const { url } = await initializePaystackPayment(email, from);
                return send(twiml, res,
                    `💳 *Pay ₦1,000 for Semester Access*\n\n` +
                    `Click the link below to complete payment:\n${url}\n\n` +
                    `✅ Your access will unlock automatically once payment is confirmed.\n\n` +
                    `_(Link expires in 1 hour)_`
                );
            } catch (err) {
                console.error('Paystack error:', err.message);
                return send(twiml, res,
                    "❌ Could not generate payment link. Please try again in a moment."
                );
            }
        }

        // ── PROFILE (paid or free) ────────────────────────────────────────────
        if (upper === 'PROFILE') {
            return send(twiml, res, profileText(state.profile, paid, state.paidUntil));
        }

        // ── PAID-ONLY COMMANDS ────────────────────────────────────────────────
        if (upper === 'RESET' || upper === 'CLEAR') {
            if (!paid) return send(twiml, res, upgradePrompt());
            state.semesters = [];
            resetAbuse(state);
            saveState();
            return send(twiml, res,
                "🔄 Semester records cleared. Send your courses to start fresh.\n\nFormat: GST101 A 3, MTH102 B 4"
            );
        }

        if (upper === 'CUMULATIVE' || upper === 'TOTAL' || upper === 'CGPA') {
            if (!paid) return send(twiml, res, upgradePrompt());
            if (state.semesters.length === 0)
                return send(twiml, res,
                    "📭 No semesters recorded yet.\n\nSend your courses:\nGST101 A 3, MTH102 B 4"
                );
            const cum = computeCumulativeCGPA(state.semesters);
            return send(twiml, res,
                `📈 *Cumulative CGPA* across ${state.semesters.length} semester(s): *${cum}* 🎓\n\n` +
                "Send RESET to clear, or send a new semester's courses."
            );
        }

        // ── Parse courses ─────────────────────────────────────────────────────
        console.log(`[${from}] said: ${msg}`);
        const parsed   = parseCourses(msg);
        const invalid  = parsed.filter(c => c.invalid);
        const valid    = parsed.filter(c => !c.invalid);
        const hasValid = valid.length > 0;

        if (!hasValid && invalid.length > 0) {
            return send(twiml, res,
                `❌ Unknown grade(s) for: *${invalid.map(c => c.code).join(', ')}*\n` +
                "Valid grades: A, B, C, D, E, F\n\nFormat: GST101 A 3, MTH102 B 4"
            );
        }

        if (!hasValid) {
            return send(twiml, res,
                "❌ Invalid format.\n\n" +
                "Use: CODE GRADE UNIT, CODE GRADE UNIT\n" +
                "Example: GST101 A 3, MTH102 B 4\n\n" +
                "Type HELP for more info."
            );
        }

        // ── Free check gate ───────────────────────────────────────────────────
        if (!paid) {
            if (state.freeCheckUsed) {
                return send(twiml, res, upgradePrompt());
            }
            // Give free result — don't save to semesters
            const result = computeCGPA(valid);
            if (!result)
                return send(twiml, res, "❌ Could not compute CGPA. Check that course units are positive numbers.");

            state.freeCheckUsed = true;
            saveState();

            let suffix = '';
            if (invalid.length > 0)
                suffix = `\n\n⚠️ Skipped unknown grade(s): ${invalid.map(c => c.code).join(', ')}`;

            return send(twiml, res,
                `📊 *Your CGPA: ${result.cgpa}* 🎯${suffix}\n\n` +
                `─────────────────────\n` +
                `🆓 That was your *free check*.\n\n` +
                `To track multiple semesters & get cumulative CGPA, upgrade for *₦1,000/semester*.\n\n` +
                `👉 Send *PAY* to unlock full access.`
            );
        }

        // ── Full paid calculation ─────────────────────────────────────────────
        pruneAttempts(state, now);
        state.recentAttempts.push(now);
        state.attempts     += 1;
        state.lastActivity  = now;

        const tooFast = state.recentAttempts.length >= 3;
        const diffRec = isDifferentRecord(state.lastCourses, valid);
        if (diffRec || tooFast) state.warningCount++;
        state.lastCourses = valid;

        const result = computeCGPA(valid);

        if (!result) {
            send(twiml, res, "❌ Could not compute CGPA. Check that course units are positive numbers.");
        } else if (state.warningCount >= 3) {
            state.lockedUntil = now + LOCK_DURATION_MS;
            send(twiml, res,
                "🔒 Access restricted due to multiple profile usage. " +
                "This account is for one student only. Wait 24 hours."
            );
        } else {
            state.semesters.push({ totalPoints: result.totalPoints, totalUnits: result.totalUnits, timestamp: now });
            const semCount = state.semesters.length;
            const cum      = computeCumulativeCGPA(state.semesters);

            let prefix = '';
            if (state.warningCount === 1 && (diffRec || tooFast))
                prefix = "⚠️ This looks like a different record. This bot is for one student only.\n\n";
            else if (state.warningCount === 2) {
                if (state.remainingCalc <= 0) state.remainingCalc = 1;
                prefix = "⚠️ Multiple records detected. 1 calculation left before access is restricted.\n\n";
                state.remainingCalc--;
            }

            let suffix = '';
            if (invalid.length > 0)
                suffix = `\n\n⚠️ Skipped unknown grade(s): ${invalid.map(c => c.code).join(', ')}`;

            if (semCount === 1) {
                send(twiml, res,
                    `${prefix}📊 Semester CGPA: *${result.cgpa}* 🎯${suffix}\n\n` +
                    "Send another semester to track your cumulative CGPA, or type HELP."
                );
            } else {
                send(twiml, res,
                    `${prefix}📊 Semester CGPA: *${result.cgpa}* 🎯\n` +
                    `📈 Cumulative CGPA: *${cum}* (${semCount} semesters)${suffix}\n\n` +
                    "Type CUMULATIVE to view overall, RESET to clear."
                );
            }
        }

        saveState();
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGTERM', () => {
    console.log('SIGTERM — shutting down gracefully');
    saveState();
    server.close(() => { console.log('Server closed.'); process.exit(0); });
});