const nodemailer = require("nodemailer");
const twilio = require("twilio");

function getEmailTransport() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT || 587) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

function formatPhoneForSms(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
    if (digits.startsWith("233")) return `+${digits}`;
    return `+${digits}`;
}

async function sendEmail(to, subject, text) {
    const transport = getEmailTransport();
    const sender = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!to) {
        return { sent: false, reason: "missing-recipient" };
    }

    if (!transport) {
        console.log(`[EMAIL DEV MODE] To: ${to}\nSubject: ${subject}\n${text}`);
        return { sent: false, reason: "smtp-not-configured" };
    }

    try {
        await transport.sendMail({
            from: sender,
            to,
            subject,
            text
        });
        console.log(`[EMAIL SENT] ${to}`);
        return { sent: true };
    } catch (error) {
        console.error("[EMAIL SEND FAILED]", error.message);
        return { sent: false, reason: error.message };
    }
}

async function sendSms(to, body) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const formattedTo = formatPhoneForSms(to);

    if (!formattedTo) {
        return { sent: false, reason: "missing-recipient" };
    }

    if (!accountSid || !authToken || !fromNumber) {
        console.log(`[SMS DEV MODE] To: ${formattedTo}\n${body}`);
        return { sent: false, reason: "twilio-not-configured" };
    }

    try {
        const client = twilio(accountSid, authToken);
        const message = await client.messages.create({
            body,
            from: fromNumber,
            to: formattedTo
        });
        console.log(`[SMS SENT] ${formattedTo} -> ${message.sid}`);
        return { sent: true, sid: message.sid };
    } catch (error) {
        console.error("[SMS SEND FAILED]", error.message);
        return { sent: false, reason: error.message };
    }
}

async function sendCodeMessage({ channel, email, phone, code, purpose = "verification" }) {
    const actionName = purpose === "reset" ? "reset" : "verification";

    if (channel === "email" && email) {
        return sendEmail(
            email,
            `Mister Gentle ${actionName} code`,
            `Your Mister Gentle ${actionName} code is ${code}. This code is valid for 10 minutes.`
        );
    }

    if (channel === "phone" && phone) {
        return sendSms(
            phone,
            `Mister Gentle: your ${actionName} code is ${code}. This code is valid for 10 minutes.`
        );
    }

    if (channel === "reset") {
        if (email) {
            return sendEmail(
                email,
                "Mister Gentle password reset code",
                `Your password reset code is ${code}. This code is valid for 10 minutes.`
            );
        }

        if (phone) {
            return sendSms(
                phone,
                `Mister Gentle: your password reset code is ${code}. This code is valid for 10 minutes.`
            );
        }
    }

    return { sent: false, reason: "no-delivery-target" };
}

module.exports = {
    sendEmail,
    sendSms,
    sendCodeMessage
};
