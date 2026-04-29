const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.set('trust proxy', 1);

// Raw body MUST come before urlencoded/json for Monnify signature verification
app.use('/monnify-webhook', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Constants ───────────────────────────────────────────────────────────────

const gradeMap = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function scoreToGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'E';
    return 'F';
}

const CONTROL_WINDOW_MS = 2 * 60 * 1000;
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;
const AMOUNT_NGN = 1000;
const STATE_FILE = path.join(__dirname, 'state.json');
const VALID_LEVELS = ['100', '200', '300', '400', '500', '600', '700'];
const MONNIFY_API_KEY      = process.env.MONNIFY_API_KEY      || '';
const MONNIFY_SECRET_KEY   = process.env.MONNIFY_SECRET_KEY   || '';
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || '';
const MONNIFY_BASE_URL     = 'https://api.monnify.com';

// ─── Meta WhatsApp Cloud API Config ──────────────────────────────────────────
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || '';
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || '';

const PHASE = {
    UNREGISTERED: 'unregistered',
    AWAITING_NAME: 'awaiting_name',
    AWAITING_MATRIC: 'awaiting_matric',
    AWAITING_FACULTY: 'awaiting_faculty',
    AWAITING_DEPARTMENT: 'awaiting_department',
    AWAITING_LEVEL: 'awaiting_level',
    AWAITING_EMAIL: 'awaiting_email',
    REGISTERED: 'registered',
    AWAITING_SEM_TYPE: 'awaiting_sem_type',
    AWAITING_SEM_COUNT: 'awaiting_sem_count'
};

// ─── Persistence ─────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserState(phone) {
    if (!userStates.has(phone)) {
        userStates.set(phone, {
            phase: PHASE.UNREGISTERED,
            profile: { name: null, matric: null, faculty: null, department: null, level: null, email: null },
            freeCheckUsed: false,
            isPaid: false,
            paidUntil: 0,
            warningCount: 0,
            attempts: 0,
            recentAttempts: [],
            lastCourses: null,
            lastActivity: 0,
            remainingCalc: 0,
            lockedUntil: 0,
            semesters: [],
            semCtx: { type: null, expectedCount: null }
        });
    }
    const s = userStates.get(phone);
    if (!s.phase) s.phase = PHASE.REGISTERED;
    if (!s.profile) s.profile = { name: null, matric: null, faculty: null, department: null, level: null, email: null };
    if (!s.profile.email) s.profile.email = null;
    if (!s.semesters) s.semesters = [];
    if (!s.semCtx) s.semCtx = { type: null, expectedCount: null };
    if (s.freeCheckUsed === undefined) s.freeCheckUsed = true;
    if (s.isPaid === undefined) s.isPaid = true;
    if (s.paidUntil === undefined) s.paidUntil = 0;
    return s;
}

function isPaidActive(state) {
    return state.isPaid && Date.now() < state.paidUntil;
}

function parseCourses(message) {
    return message.split(',')
        .map(p => p.trim()).filter(Boolean)
        .map(p => {
            const parts = p.trim().split(/\s+/);
            if (parts.length < 3) return null;

            const unit = parseInt(parts[parts.length - 1], 10);
            if (isNaN(unit) || unit <= 0) return null;

            const scoreOrGrade = parts[parts.length - 2].toUpperCase();
            const title = parts.slice(0, parts.length - 2).join(' ').toUpperCase() || scoreOrGrade;

            let grade;
            let score = null;

            if (/^\d+(\.\d+)?$/.test(scoreOrGrade)) {
                score = parseFloat(scoreOrGrade);
                if (score < 0 || score > 100) return { title, grade: null, unit, score, invalid: true };
                grade = scoreToGrade(score);
            } else if (scoreOrGrade in gradeMap) {
                grade = scoreOrGrade;
            } else {
                return { title, grade: scoreOrGrade, unit, score, invalid: true };
            }

            return { title, grade, score, unit, invalid: false };
        }).filter(Boolean);
}

function computeCGPA(courses) {
    const valid = courses.filter(c => !c.invalid);
    const tp = valid.reduce((s, c) => s + gradeMap[c.grade] * c.unit, 0);
    const tu = valid.reduce((s, c) => s + c.unit, 0);
    if (tu === 0) return null;
    const breakdown = valid.map(c =>
        `  ${c.title} — ${c.score !== null && c.score !== undefined ? c.score + '%→' : ''}${c.grade} (${c.unit} units)`
    ).join('\n');
    return { cgpa: (tp / tu).toFixed(2), totalUnits: tu, totalPoints: tp, breakdown };
}

function computeCumulativeCGPA(semesters) {
    const tp = semesters.reduce((s, x) => s + x.totalPoints, 0);
    const tu = semesters.reduce((s, x) => s + x.totalUnits, 0);
    return tu === 0 ? null : (tp / tu).toFixed(2);
}

function isDifferentRecord(previous, current) {
    if (!previous || previous.length === 0 || current.length === 0) return false;
    const prevTitles = new Set(previous.map(c => c.title));
    const currTitles = new Set(current.map(c => c.title));
    const prevMap = Object.fromEntries(previous.map(c => [c.title, c]));
    const added = [...currTitles].filter(x => !prevTitles.has(x)).length;
    const removed = [...prevTitles].filter(x => !currTitles.has(x)).length;
    let changed = 0;
    current.forEach(c => {
        const p = prevMap[c.title];
        if (p && (p.grade !== c.grade || p.unit !== c.unit)) changed++;
    });
    const unitDiff = Math.abs(
        current.reduce((s, c) => s + c.unit, 0) -
        previous.reduce((s, c) => s + c.unit, 0)
    );
    if (added + removed >= 2) return true;
    if (changed >= 2) return true;
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

function sendTwilio(res, text) {
    const twiml = new MessagingResponse();
    twiml.message(text);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
}

async function getMonnifyToken() {
    const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
    const res = await axios.post(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
        headers: { Authorization: `Basic ${credentials}` }
    });
    return res.data.responseBody.accessToken;
}

async function initializeMonnifyPayment(email, phone, name) {
    const token     = await getMonnifyToken();
    // Encode phone in reference so we can recover it in the webhook
    const reference = `cgpa_${phone.replace(/\D/g, '')}_${Date.now()}`;
    const response  = await axios.post(
        `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
        {
            amount:             AMOUNT_NGN,
            customerName:       name || 'Student',
            customerEmail:      email,
            paymentReference:   reference,
            paymentDescription: 'UI CGPA Bot — Semester Access',
            currencyCode:       'NGN',
            contractCode:       MONNIFY_CONTRACT_CODE,
            paymentMethods:     ['ACCOUNT_TRANSFER', 'CARD']
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return { url: response.data.responseBody.checkoutUrl, reference };
}

// ─── Meta WhatsApp Cloud API Helpers ─────────────────────────────────────────

async function sendMetaMessage(to, text) {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
        console.error('Meta credentials not configured');
        return false;
    }
    try {
        const url = `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`;
        await axios.post(url, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { body: text }
        }, {
            headers: {
                'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        return true;
    } catch (err) {
        console.error('Meta send error:', err.response?.data || err.message);
        return false;
    }
}

// ─── Bot Logic (shared between Twilio and Meta) ──────────────────────────────

async function handleBotMessage(from, msg) {
    const upper = msg.toUpperCase().trim();
    const now = Date.now();
    const state = getUserState(from);
    const paid = isPaidActive(state);

    // ── Locked ──────────────────────────────────────────────────────────
    if (state.lockedUntil > now) {
        return (
            "🔒 Access temporarily restricted due to multiple profile usage. " +
            "This account is for one student only. Wait 24 hours."
        );
    }

    if (!msg) return '';

    if (now - state.lastActivity > LOCK_DURATION_MS) resetAbuse(state);

    // ── REGISTRATION FLOW ───────────────────────────────────────────────

    if (state.phase === PHASE.UNREGISTERED || upper === 'REGISTER') {
        state.phase = PHASE.AWAITING_NAME;
        saveState();
        return (
            "🎓 *Welcome to the UI CGPA Calculator!*\n\n" +
            "Let's set up your profile — takes less than a minute.\n\n" +
            "📛 Enter your *Full Name*:"
        );
    }

    if (state.phase === PHASE.AWAITING_NAME) {
        const nameRegex = /^[a-zA-Z\s''-]{2,}$/;
        const wordCount = msg.trim().split(/\s+/).length;
        if (!nameRegex.test(msg))
            return (
                "❌ Name should contain *letters only* (no numbers or symbols).\n\nEnter your *Full Name*:"
            );
        if (wordCount < 2)
            return (
                "❌ Please enter your *full name* (first and last name):\n_e.g. John Adebayo_"
            );
        state.profile.name = msg.trim();
        state.phase = PHASE.AWAITING_MATRIC;
        saveState();
        return (
            `✅ Got it, *${msg.trim()}*!\n\n` +
            "🎓 Enter your *Matric Number*:\n_(e.g. 23/0001 or 2023/12345)_"
        );
    }

    if (state.phase === PHASE.AWAITING_MATRIC) {
        const matricRegex = /^[A-Za-z0-9\/\-\_\.]{3,20}$/;
        const hasDigit = /\d/.test(msg);
        const hasSlash = /[\/\-]/.test(msg);
        if (!matricRegex.test(msg) || !hasDigit)
            return (
                "❌ That doesn't look like a valid matric number.\n" +
                "It should contain numbers, e.g. *23/0001* or *2023/12345*\n\nTry again:"
            );
        if (!hasSlash)
            return (
                "❌ Matric number should include a slash, e.g. *23/0001*\n\nTry again:"
            );
        state.profile.matric = msg.toUpperCase();
        state.phase = PHASE.AWAITING_FACULTY;
        saveState();
        return (
            "✅ Noted!\n\n🏗️ Enter your *Faculty*:\n_(e.g. Science, Arts, Social Sciences, Education, Law)_"
        );
    }

    if (state.phase === PHASE.AWAITING_FACULTY) {
        const lettersOnly = /^[a-zA-Z\s]{2,}$/;
        if (!lettersOnly.test(msg))
            return (
                "❌ Faculty name should contain *letters only* (no numbers).\n" +
                "e.g. *Science*, *Arts*, *Social Sciences*\n\nEnter your *Faculty*:"
            );
        state.profile.faculty = msg.trim();
        state.phase = PHASE.AWAITING_DEPARTMENT;
        saveState();
        return (
            "✅ Got it!\n\n📚 Enter your *Department*:\n_(e.g. Computer Science, Mathematics, English)_"
        );
    }

    if (state.phase === PHASE.AWAITING_DEPARTMENT) {
        const lettersOnly = /^[a-zA-Z\s]{2,}$/;
        if (!lettersOnly.test(msg))
            return (
                "❌ Department name should contain *letters only* (no numbers).\n" +
                "e.g. *Computer Science*, *Mathematics*\n\nEnter your *Department*:"
            );
        state.profile.department = msg.trim();
        state.phase = PHASE.AWAITING_LEVEL;
        saveState();
        return (
            "✅ Almost done!\n\n📊 What *Level* are you?\nReply with: *100, 200, 300, 400, 500, 600, or 700*"
        );
    }

    if (state.phase === PHASE.AWAITING_LEVEL) {
        const lvl = msg.replace(/[lL]/g, '').trim();
        if (!VALID_LEVELS.includes(lvl))
            return (
                "❌ Invalid. Reply with: *100, 200, 300, 400, 500, 600, or 700*"
            );
        state.profile.level = lvl;
        state.phase = PHASE.AWAITING_EMAIL;
        saveState();
        return (
            "✅ Great!\n\n📧 Finally, enter your *Email Address*:\n_(Used for your payment receipt)_"
        );
    }

    if (state.phase === PHASE.AWAITING_EMAIL) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(msg))
            return (
                "❌ That doesn't look like a valid email address.\n" +
                "e.g. *johndoe@gmail.com*\n\nEnter your *Email Address*:"
            );
        state.profile.email = msg.toLowerCase().trim();
        state.phase = PHASE.REGISTERED;
        saveState();
        return (
            `🎉 *Registration Complete!*\n\n` +
            `Welcome, *${state.profile.name}*! 🎓\n\n` +
            `${profileText(state.profile, false, 0)}\n\n` +
            `─────────────────────\n` +
            `🆓 You have *1 free CGPA calculation*.\n\n` +
            `📌 Send your courses to try it:\n` +
            `*GST101 72 3, MTH102 55 4*\n\n` +
            `Type *HELP* to see all commands.`
        );
    }

    // ── From here: REGISTERED user ─────────────────────────────────────

    // ── HELP ────────────────────────────────────────────────────────────
    if (upper === 'HELP') {
        const paidCmds = paid
            ? "• CUMULATIVE — overall CGPA across all semesters\n• PROFILE — view your details & subscription\n• RESET — clear semester records\n"
            : "• PAY / UPGRADE — unlock full access (₦1,000/semester)\n• PROFILE — view your registration details\n";
        return (
            "📚 *CGPA Bot Help*\n\n" +
            "*Format:* COURSE TITLE SCORE UNIT\n" +
            "*Example:* Introduction to Programming 72 3\n" +
            "_(Separate multiple courses with a comma)_\n\n" +
            "*Multi-course example:*\n" +
            "GST 111 68 3, MTH 101 55 4, ENG 101 47 2\n\n" +
            "*Commands:*\n" +
            paidCmds +
            "• STATUS — check subscription status\n" +
            "• REGISTER — update registration info\n" +
            "• HELP — show this message\n\n" +
            "*UI Grading Scale:*\n" +
            "70-100=A(5.0)  60-69=B(4.0)  50-59=C(3.0)\n" +
            "45-49=D(2.0)  40-44=E(1.0)  0-39=F(0.0)"
        );
    }

    // ── STATUS ──────────────────────────────────────────────────────────
    if (upper === 'STATUS') {
        if (paid) {
            const days = Math.ceil((state.paidUntil - now) / (1000 * 60 * 60 * 24));
            return (
                `💳 *Subscription Status*\n\n` +
                `✅ Active — expires ${new Date(state.paidUntil).toDateString()}\n` +
                `⏳ ${days} day(s) remaining\n\n` +
                `Send *PAY* to renew when it expires.`
            );
        }
        return (
            `💳 *Subscription Status*\n\n` +
            `🔒 Free tier${state.freeCheckUsed ? ' (free check used)' : ' (1 free check remaining)'}\n\n` +
            `Send *PAY* to unlock full access for ₦1,000/semester.`
        );
    }

    // ── PAY / UPGRADE ───────────────────────────────────────────────────
    if (upper === 'PAY' || upper === 'UPGRADE') {
        if (!MONNIFY_API_KEY || !MONNIFY_CONTRACT_CODE) {
            return (
                "⚙️ *Payment not yet active.*\n\n" +
                "The payment system is being set up. Check back soon!"
            );
        }
        if (paid) {
            const days = Math.ceil((state.paidUntil - now) / (1000 * 60 * 60 * 24));
            return (
                `✅ You already have an active subscription!\n` +
                `Expires: ${new Date(state.paidUntil).toDateString()} (${days} days left)\n\n` +
                `Send *PAY* again close to expiry to renew.`
            );
        }
        try {
            const email = state.profile.email || `${state.profile.matric || 'student'}@ui.edu.ng`;
            const { url } = await initializeMonnifyPayment(email, from, state.profile.name);
            return (
                `💳 *Pay ₦1,000 for Semester Access*\n\n` +
                `You can pay by *bank transfer or card* — no POS needed!\n\n` +
                `👉 Click to proceed:\n${url}\n\n` +
                `✅ Your access unlocks automatically once payment is confirmed.\n\n` +
                `_(Link expires in 1 hour)_`
            );
        } catch (err) {
            console.error('Monnify error:', err.response?.data || err.message);
            return (
                "❌ Could not generate payment link. Please try again in a moment."
            );
        }
    }

    // ── PROFILE (paid or free) ──────────────────────────────────────────
    if (upper === 'PROFILE') {
        return profileText(state.profile, paid, state.paidUntil);
    }

    // ── PAID-ONLY COMMANDS ──────────────────────────────────────────────
    if (upper === 'RESET' || upper === 'CLEAR') {
        if (!paid) return upgradePrompt();
        state.semesters = [];
        resetAbuse(state);
        saveState();
        return (
            "🔄 Semester records cleared. Send your courses to start fresh.\n\nFormat: GST101 A 3, MTH102 B 4"
        );
    }

    if (upper === 'CUMULATIVE' || upper === 'TOTAL' || upper === 'CGPA') {
        if (!paid) return upgradePrompt();
        if (state.semesters.length === 0)
            return (
                "📭 No semesters recorded yet.\n\nSend *NEW* to start your first semester entry."
            );
        const cum = computeCumulativeCGPA(state.semesters);
        const semLines = state.semesters.map((s, i) =>
            `  ${i + 1}. ${s.semType || 'Semester'} — CGPA: ${(s.totalPoints / s.totalUnits).toFixed(2)} (${s.registeredCount || s.totalUnits} courses)`
        ).join('\n');
        return (
            `📈 *Cumulative CGPA: ${cum}* 🎓\n\n` +
            `*Semester Breakdown:*\n${semLines}\n\n` +
            "Send *NEW* for a new semester, or RESET to clear all."
        );
    }

    // ── NEW SEMESTER trigger ────────────────────────────────────────────
    if (upper === 'NEW' || upper === 'NEW SEMESTER') {
        if (!paid) return upgradePrompt();
        state.semCtx = { type: null, expectedCount: null };
        state.phase = PHASE.AWAITING_SEM_TYPE;
        saveState();
        return (
            `📅 *New Semester Entry*\n\n` +
            `Which semester is this?\n\nReply with:\n*First* or *Second*`
        );
    }

    // ── Semester setup phases ───────────────────────────────────────────
    if (state.phase === PHASE.AWAITING_SEM_TYPE) {
        const t = upper.replace(/\s+/g, '');
        if (!['FIRST', '1', 'SECOND', '2', '1ST', '2ND'].includes(t))
            return "❌ Please reply with *First* or *Second*:";
        state.semCtx.type = (t === 'FIRST' || t === '1' || t === '1ST') ? 'First Semester' : 'Second Semester';
        state.phase = PHASE.AWAITING_SEM_COUNT;
        saveState();
        return (
            `✅ *${state.semCtx.type}*\n\n` +
            `How many courses did you *register* for this semester?\n_(Enter a number, e.g. 6)_`
        );
    }

    if (state.phase === PHASE.AWAITING_SEM_COUNT) {
        const count = parseInt(msg, 10);
        if (isNaN(count) || count < 1 || count > 25)
            return "❌ Enter a valid number of courses (1–25):";
        state.semCtx.expectedCount = count;
        state.phase = PHASE.REGISTERED;
        saveState();
        return (
            `✅ Got it — *${count} courses* registered for *${state.semCtx.type}*.\n\n` +
            `Now send all ${count} courses (comma-separated):\n\n` +
            `_Introduction to Programming 72 3, General Studies 65 2, ..._\n\n` +
            `*Format:* COURSE NAME SCORE UNIT`
        );
    }

    // ── Parse courses ───────────────────────────────────────────────────
    console.log(`[${from}] said: ${msg}`);
    const parsed = parseCourses(msg);
    const invalid = parsed.filter(c => c.invalid);
    const valid = parsed.filter(c => !c.invalid);
    const hasValid = valid.length > 0;

    if (!hasValid && invalid.length > 0) {
        return (
            `❌ Could not read score/grade for: *${invalid.map(c => c.title).join(', ')}*\n\n` +
            "Make sure each course ends with a *score (0-100)* and *unit*:\n" +
            "_Introduction to Programming 72 3_\n" +
            "_GST 111 68 3, MTH 101 55 4_"
        );
    }

    if (!hasValid) {
        return (
            "❌ Invalid format.\n\n" +
            "Use: *COURSE TITLE SCORE UNIT*\n" +
            "Example: Introduction to Programming 72 3\n\n" +
            "Multiple: GST 111 68 3, MTH 101 55 4\n\n" +
            "Send *NEW* to start a semester entry, or HELP for info."
        );
    }

    // ── Paid users: require semester context before accepting courses ───
    if (paid && !state.semCtx.expectedCount) {
        state.semCtx = { type: null, expectedCount: null };
        state.phase = PHASE.AWAITING_SEM_TYPE;
        saveState();
        return (
            `📅 Let's log this semester properly first!\n\n` +
            `Which semester is this?\n\nReply with *First* or *Second*`
        );
    }

    // ── Free check gate ─────────────────────────────────────────────────
    if (!paid) {
        if (state.freeCheckUsed) {
            return upgradePrompt();
        }
        const result = computeCGPA(valid);
        if (!result)
            return "❌ Could not compute CGPA. Check that course units are positive numbers.";

        state.freeCheckUsed = true;
        saveState();

        let suffix = '';
        if (invalid.length > 0)
            suffix = `\n\n⚠️ Skipped: ${invalid.map(c => c.title).join(', ')}`;

        return (
            `📊 *Your CGPA: ${result.cgpa}* 🎯\n\n` +
            `*Breakdown:*\n${result.breakdown}${suffix}\n\n` +
            `─────────────────────\n` +
            `🆓 That was your *free check*.\n\n` +
            `To track multiple semesters & cumulative CGPA, upgrade for *₦1,000/semester*.\n\n` +
            `👉 Send *PAY* to unlock full access.`
        );
    }

    // ── Full paid calculation ───────────────────────────────────────────
    pruneAttempts(state, now);
    state.recentAttempts.push(now);
    state.attempts += 1;
    state.lastActivity = now;

    const tooFast = state.recentAttempts.length >= 3;
    const diffRec = isDifferentRecord(state.lastCourses, valid);
    if (diffRec || tooFast) state.warningCount++;
    state.lastCourses = valid;

    const result = computeCGPA(valid);

    if (!result) {
        return "❌ Could not compute CGPA. Check that course units are positive numbers.";
    } else if (state.warningCount >= 3) {
        state.lockedUntil = now + LOCK_DURATION_MS;
        return (
            "🔒 Access restricted due to multiple profile usage. " +
            "This account is for one student only. Wait 24 hours."
        );
    } else {
        // Check course count vs declared (warn if mismatch)
        const declared = state.semCtx.expectedCount;
        const submitted = valid.length;
        let countNote = '';
        if (declared && submitted !== declared)
            countNote = `⚠️ You declared *${declared} courses* but submitted *${submitted}*. Calculating with ${submitted}.\n\n`;

        const semLabel = state.semCtx.type || 'Semester';
        state.semesters.push({
            totalPoints:     result.totalPoints,
            totalUnits:      result.totalUnits,
            timestamp:       now,
            semType:         semLabel,
            registeredCount: declared || submitted
        });

        // Clear semester context after saving
        state.semCtx = { type: null, expectedCount: null };

        const semCount = state.semesters.length;
        const cum      = computeCumulativeCGPA(state.semesters);

        let prefix = countNote;
        if (state.warningCount === 1 && (diffRec || tooFast))
            prefix += "⚠️ This looks like a different record. This bot is for one student only.\n\n";
        else if (state.warningCount === 2) {
            if (state.remainingCalc <= 0) state.remainingCalc = 1;
            prefix += "⚠️ Multiple records detected. 1 calculation left before access is restricted.\n\n";
            state.remainingCalc--;
        }

        let suffix = '';
        if (invalid.length > 0)
            suffix = `\n\n⚠️ Skipped: ${invalid.map(c => c.title).join(', ')}`;

        saveState();

        if (semCount === 1) {
            return (
                `${prefix}📊 *${semLabel} CGPA: ${result.cgpa}* 🎯\n\n` +
                `*Breakdown:*\n${result.breakdown}${suffix}\n\n` +
                "Send *NEW* to log another semester, or CUMULATIVE to see overall."
            );
        } else {
            return (
                `${prefix}📊 *${semLabel} CGPA: ${result.cgpa}* 🎯\n` +
                `📈 *Cumulative CGPA: ${cum}* (${semCount} semesters)\n\n` +
                `*Breakdown:*\n${result.breakdown}${suffix}\n\n` +
                "Send *NEW* for next semester, CUMULATIVE to view all, RESET to clear."
            );
        }
    }
}

// ─── Monnify Webhook ──────────────────────────────────────────────────────────

app.post('/monnify-webhook', async (req, res) => {
    // Verify signature: HMAC-SHA512 of raw body using secret key
    const sig  = req.headers['monnify-signature'];
    const hash = crypto.createHmac('sha512', MONNIFY_SECRET_KEY).update(req.body).digest('hex');
    if (sig && hash !== sig) return res.sendStatus(400);

    let event;
    try { event = JSON.parse(req.body.toString()); } catch { return res.sendStatus(400); }

    if (event.eventType === 'SUCCESSFUL_TRANSACTION') {
        // Recover phone from paymentReference: "cgpa_<phone>_<timestamp>"
        const ref   = event.eventData?.paymentReference || '';
        const parts = ref.split('_');
        const phone = parts.length >= 2 ? parts[1] : null;

        if (phone) {
            const state = getUserState(phone);
            state.isPaid    = true;
            state.paidUntil = Date.now() + 120 * 24 * 60 * 60 * 1000; // 120 days (~1 semester)
            saveState();
            console.log(`✅ Monnify payment confirmed for ${phone}`);
            if (META_ACCESS_TOKEN && META_PHONE_NUMBER_ID) {
                await sendMetaMessage(phone,
                    `✅ *Payment Confirmed!*\n\nAccess active until *${new Date(state.paidUntil).toDateString()}*.\n\nSend *NEW* to start your first semester. 🎓`
                );
            }
        }
    }
    res.sendStatus(200);
});

// ─── Twilio Webhook ───────────────────────────────────────────────────────────

app.post('/twilio-webhook', async (req, res) => {
    try {
        const from  = (req.body.From || '').replace('whatsapp:', '');
        const msg   = (req.body.Body || '').trim();
        const reply = await handleBotMessage(from, msg);
        sendTwilio(res, reply || '');
    } catch (err) {
        console.error('Twilio webhook error:', err);
        res.sendStatus(500);
    }
});

// ─── Meta Webhook ─────────────────────────────────────────────────────────────

app.get('/meta-webhook', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        console.log('Meta webhook verified.');
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

app.post('/meta-webhook', async (req, res) => {
    res.sendStatus(200);
    try {
        const msgObj = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!msgObj || msgObj.type !== 'text') return;
        const from  = msgObj.from;
        const msg   = msgObj.text?.body?.trim() || '';
        console.log(`[Meta] from=${from} msg=${msg}`);
        const reply = await handleBotMessage(from, msg);
        if (reply) await sendMetaMessage(from, reply);
    } catch (err) {
        console.error('Meta webhook error:', err);
    }
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.send('UI CGPA Bot is running ✅'));

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGTERM', () => {
    console.log('SIGTERM — shutting down gracefully');
    saveState();
    server.close(() => { console.log('Server closed.'); process.exit(0); });
});