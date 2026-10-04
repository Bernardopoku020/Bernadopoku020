const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) throw new Error("Pass the deployed database.js path.");

let source = fs.readFileSync(filePath, "utf8");
const original = 'const dbPath = path.join(__dirname, "mister-gentle.db");';
const replacement = 'const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "mister-gentle.db");';

if (source.includes(replacement)) {
    console.log("Database already supports DATABASE_PATH.");
} else if (source.includes(original)) {
    source = source.replace(original, replacement);
    fs.writeFileSync(filePath, source);
    console.log("Database now supports DATABASE_PATH.");
} else {
    throw new Error("Could not find the expected SQLite path declaration.");
}
