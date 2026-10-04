const fs = require("fs");
const filePath = process.argv[2];
if (!filePath) throw new Error("Pass the deployed users.js path.");

let source = fs.readFileSync(filePath, "utf8");
const replacements = [
    ["const deliverySucceeded = phoneDelivery.sent && (!emailDelivery || emailDelivery.sent);", "const deliverySucceeded = phoneDelivery.sent || Boolean(emailDelivery && emailDelivery.sent);"],
    ["if (!customer.email_verified || !customer.phone_verified) {", "if (!customer.email_verified && !customer.phone_verified) {"],
    ["if (customer.phone_verified && (!customer.email || customer.email_verified)) {", "if (customer.phone_verified || customer.email_verified) {"],
    ["We sent a 6-digit code to your phone and email. Enter it to continue.", "We sent a 6-digit code to your available phone or email contact. Enter it to continue."],
    ["We sent a 6-digit code to your phone and email. Please verify to continue.", "We sent a 6-digit code to your available phone or email contact. Please verify to continue."]
];

for (const [before, after] of replacements) {
    if (!source.includes(before)) throw new Error(`Expected auth source text was not found: ${before}`);
    source = source.replaceAll(before, after);
}

fs.writeFileSync(filePath, source);
console.log("Customer verification now accepts either an email or SMS code.");
