const express = require("express");
const db = require("../../database/database");
const router = express.Router();

function withVariants(product) {
  const variants = db.prepare("SELECT id, name, price, sku, is_available, sort_order FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC, id ASC").all(product.id);
  return { ...product, price: Number(product.price), variants: variants.map(item => ({ ...item, price: Number(item.price) })) };
}

router.get("/", (req, res) => {
  try {
    let sql = "SELECT p.id, p.category_id, c.name AS category_name, p.name, p.description, p.price, p.image, p.preparation_time, p.is_available, p.is_featured, p.created_at, p.updated_at FROM products p INNER JOIN categories c ON c.id = p.category_id WHERE p.is_available = 1";
    const params = [];
    if (req.query.category_id) { sql += " AND p.category_id = ?"; params.push(Number(req.query.category_id)); }
    sql += " ORDER BY c.sort_order ASC, p.name ASC";
    const products = db.prepare(sql).all(...params).map(withVariants);
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ success: false, message: "Failed to load products." });
  }
});

router.get("/:id", (req, res) => {
  try {
    const product = db.prepare("SELECT p.id, p.category_id, c.name AS category_name, p.name, p.description, p.price, p.image, p.preparation_time, p.is_available, p.is_featured, p.created_at, p.updated_at FROM products p INNER JOIN categories c ON c.id = p.category_id WHERE p.id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, product: withVariants(product) });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ success: false, message: "Failed to load product." });
  }
});

module.exports = router;
