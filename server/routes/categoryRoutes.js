const express = require("express");
const db = require("../../database/database");
const router = express.Router();

router.get("/", (req, res) => {
  try {
    const categories = db.prepare("SELECT id, name, description, image, sort_order, is_active, created_at FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC").all();
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, message: "Failed to load categories." });
  }
});

router.get("/:id", (req, res) => {
  try {
    const category = db.prepare("SELECT id, name, description, image, sort_order, is_active, created_at FROM categories WHERE id = ?").get(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.json({ success: true, category });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ success: false, message: "Failed to load category." });
  }
});

module.exports = router;
