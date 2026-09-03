const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const db = require("./database/database");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MISTER GENTLE FAST FOOD
// MAIN SERVER
// ========================================

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ========================================
// SESSION
// ========================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || "mister-gentle-development-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ========================================
// STATIC FILES
// ========================================

app.use("/admin", (req, res, next) => {
    if (req.path === "/login.html" || req.session.admin) return next();
    res.redirect("/admin/login.html");
});
app.use(express.static(path.join(__dirname, "public")));

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);
// ========================================
// API ROUTES
// ========================================

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ========================================
// BASIC SERVER TEST
// ========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Mister Gentle Fast Food API is running.",
        database: "connected",
        timestamp: new Date().toISOString()
    });
});

// ========================================
// DATABASE TEST
// ========================================

app.get("/api/database-test", (req, res) => {
    try {
        const result = db
            .prepare("SELECT 1 AS connected")
            .get();

        res.json({
            success: true,
            database: result.connected === 1
                ? "connected"
                : "not connected"
        });

    } catch (error) {
        console.error("Database test error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
});

// ========================================
// HOME PAGE
// ========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// ========================================
// ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log("");
    console.log("========================================");
    console.log("     MISTER GENTLE FAST FOOD");
    console.log("========================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API:    http://localhost:${PORT}/api/health`);
    console.log("Database: Connected");
    console.log("========================================");
    console.log("");
});