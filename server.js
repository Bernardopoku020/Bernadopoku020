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
app.use((req, res, next) => {
            const isCustomerPage = req.path === "/" || req.path.endsWith(".html");
            const isPublicPage = req.path === "/account.html" || req.path.startsWith("/admin/");
            if (isCustomerPage && !isPublicPage && !req.session.customer && !req.session.admin) {
                                    const nextPath = `${req.path}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
                                    return res.redirect(`/account.html?next=${encodeURIComponent(nextPath || "/")}`);
            }
            next();
});

// SESSION
// ========================================




app.use(
            session({
