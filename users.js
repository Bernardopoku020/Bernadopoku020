const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../database/database");
const { sendCodeMessage } = require("../services/notifications");
const router = express.Router();

function requireAdmin(req, res, next) {
    if (!req.session.admin) return res.status(401).json({ success: false, message: "Staff login required." });
    next();
}

function publicCustomer(customer) {
    return { id: customer.id, first_name: customer.first_name, last_name: customer.last_name, email: customer.email, phone: customer.phone };
}
async function issueCode(customerId, channel) {
    const code = String(require("crypto").randomInt(100000, 1000000));
    const hash = require("crypto").createHash("sha256").update(code).digest("hex");
    const customer = db.prepare("SELECT email, phone FROM customers WHERE id = ?").get(customerId);
    const deliveryChannel = channel === "reset" ? (customer && customer.email ? "email" : customer && customer.phone ? "phone" : "email") : channel;

    db.prepare("DELETE FROM verification_codes WHERE customer_id = ? AND channel = ?").run(customerId, channel);
    db.prepare("INSERT INTO verification_codes (customer_id, channel, code_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+10 minutes'))").run(customerId, channel, hash);
    let delivery = { sent: false, reason: "customer-not-found" };
    if (customer) {
        const deliver = selectedChannel => sendCodeMessage({
            channel: selectedChannel,
            email: customer.email,
            phone: customer.phone,
            code,
            purpose: channel === "reset" ? "reset" : "verification"
        }).catch(error => {
            console.error("Code delivery failed:", error.message);
            return { sent: false, reason: "provider-error" };
        });

        if (channel === "reset") {
            if (customer.email) delivery = await deliver("email");
            if (!delivery.sent && customer.phone) delivery = await deliver("phone");
        } else {
            delivery = await deliver(deliveryChannel);
        }
    }

    return { sent: Boolean(delivery && delivery.sent), channel: deliveryChannel, reason: delivery && delivery.reason };
}

function requireCustomer(req, res, next) {
    if (!req.session.customer) return res.status(401).json({ success: false, message: "Customer login required." });
    next();
}

router.post("/register", async (req, res) => {
    const { first_name, last_name, email, phone, password } = req.body;
    if (!first_name || !last_name || !phone || !password) return res.status(400).json({ success: false, message: "First name, last name, phone and password are required." });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    try {
        const normalizedEmail = email ? email.trim().toLowerCase() : null;
        if (db.prepare("SELECT id FROM customers WHERE phone = ? OR (email IS NOT NULL AND email = ?)").get(phone.trim(), normalizedEmail || "")) {
            return res.status(409).json({ success: false, message: "An account with that phone or email already exists." });
        }
        const hash = await bcrypt.hash(password, 12);
        const result = db.prepare("INSERT INTO customers (first_name, last_name, email, phone, password, email_verified, phone_verified) VALUES (?, ?, ?, ?, ?, 1, 1)").run(first_name.trim(), last_name.trim(), normalizedEmail, phone.trim(), hash);
        const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid);
        req.session.customer = publicCustomer(customer);
        delete req.session.pendingCustomer;
        res.status(201).json({ success: true, user: req.session.customer, message: "Your account is ready." });
    } catch (error) {
        console.error("Customer registration error:", error);
        res.status(500).json({ success: false, message: "Could not create your account." });
    }
});

router.post("/login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: "Email or phone and password are required." });
    try {
        const customer = db.prepare("SELECT * FROM customers WHERE email = ? OR phone = ?").get(identifier.trim().toLowerCase(), identifier.trim());
        if (!customer || !(await bcrypt.compare(password, customer.password))) return res.status(401).json({ success: false, message: "Those login details are not correct." });
        db.prepare("UPDATE customers SET email_verified = 1, phone_verified = 1 WHERE id = ?").run(customer.id);
        delete req.session.pendingCustomer;
        req.session.customer = publicCustomer(customer);
        res.json({ success: true, user: req.session.customer });
    } catch (error) {
        console.error("Customer login error:", error);
        res.status(500).json({ success: false, message: "Could not log you in." });
    }
});

router.get("/me", (req, res) => {
    res.json({ success: true, user: req.session.customer || null });
});

router.get("/admin-list", requireAdmin, (req, res) => {
    const customers = db.prepare(`
        SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.email_verified,
               c.phone_verified, c.created_at,
               COUNT(DISTINCT o.id) AS order_count,
               COALESCE(SUM(lp.points), 0) AS loyalty_points
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        LEFT JOIN loyalty_points lp ON lp.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC, c.id DESC
    `).all();
    res.json({ success: true, customers });
});

router.post("/verify", (req, res) => {
    res.status(410).json({ success: false, message: "Account verification codes are disabled. Log in with your email or phone and password." });
});

router.post("/forgot-password", async (req, res) => {
    const identifier = String(req.body.identifier || "").trim();
    const customer = db.prepare("SELECT id FROM customers WHERE email = ? OR phone = ?").get(identifier.toLowerCase(), identifier);
    if (customer) {
        await issueCode(customer.id, "reset");
        req.session.pendingReset = { id: customer.id };
    }
    res.json({ success: true, message: "If an account matches, a 6-digit reset code was sent to the saved contact method." });
});

router.post("/reset-password", async (req, res) => {
    const customerId = req.session.pendingReset && req.session.pendingReset.id;
    const { code, password } = req.body;
    if (!customerId || !/^\d{6}$/.test(String(code || "")) || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ success: false, message: "Enter the six-digit code and a password of at least 8 characters." });
    }
    const record = db.prepare("SELECT * FROM verification_codes WHERE customer_id = ? AND channel = 'reset' AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1").get(customerId);
    const hash = require("crypto").createHash("sha256").update(String(code)).digest("hex");
    if (!record || record.code_hash !== hash) return res.status(400).json({ success: false, message: "That reset code is invalid or expired." });
    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare("UPDATE customers SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(passwordHash, customerId);
    db.prepare("DELETE FROM verification_codes WHERE id = ?").run(record.id);
    delete req.session.pendingReset;
    res.json({ success: true, message: "Password changed. You can now log in." });
});

router.get("/loyalty", requireCustomer, (req, res) => {
    const customerId = req.session.customer.id;
    const balance = db.prepare("SELECT COALESCE(SUM(points), 0) AS points FROM loyalty_points WHERE customer_id = ?").get(customerId).points;
    const history = db.prepare(`
        SELECT points, transaction_type, description, created_at
        FROM loyalty_points
        WHERE customer_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 10
    `).all(customerId);
    res.json({ success: true, points: balance, history });
});

module.exports = router;
