const path = require("path");

const appDirectory = path.resolve(process.argv[2] || __dirname);
const databaseModule = path.join(appDirectory, "database", "database.js");
const db = require(databaseModule);

const categories = [
    ["Sauce", "Fresh house sauces and rich comfort flavours", 1],
    ["Main Course", "Hearty rice dishes, comfort plates and signature meals", 2],
    ["Salad", "Fresh, crisp and vibrant sides for lighter eating", 3],
    ["Noodles", "Stir-fried noodles with bold, savoury taste", 4],
    ["Pizza", "Loaded pizza favourites for sharing and cravings", 5],
    ["Shawarma", "Freshly wrapped shawarma made to order", 6]
];

const products = [
    ["Vegetable Sauce", "Sauce", "Fresh mixed vegetables in our house sauce", 40],
    ["Beef Sauce", "Sauce", "Tender beef with a rich, savoury sauce", 40],
    ["Chicken Sauce", "Sauce", "Seasoned chicken in our signature house sauce", 40],
    ["Fried Rice with Chicken", "Main Course", "Choose your serving price and chicken style", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Jollof Rice with Chicken", "Main Course", "Choose your serving price and chicken style", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Assorted Fried Rice", "Main Course", "A generous serving of assorted fried rice", 50],
    ["Assorted Jollof", "Main Course", "A generous serving of assorted jollof", 50],
    ["Vegetable Fried Rice", "Main Course", "Colourful vegetables tossed with fried rice", 40],
    ["Plain Rice with Sauce", "Main Course", "Steamed rice served with your choice of sauce", 70],
    ["Sausage Fried Rice", "Main Course", "Choose your serving price", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Beef Fried Rice", "Main Course", "Choose your serving price", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Chicken Fried Rice", "Main Course", "Choose your serving price", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Tuna Salad", "Salad", "Fresh salad with delicious tuna", 30],
    ["Chicken Salad", "Salad", "Crisp greens with tender chicken", 30],
    ["Ghana Mix Salad", "Salad", "A fresh local favourite", 30],
    ["Beef Noodles", "Noodles", "Stir-fried noodles with seasoned beef", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Noodles with Chicken", "Noodles", "Stir-fried noodles with tender chicken", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Chicken Noodles", "Noodles", "A generous plate of chicken noodles", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Assorted Noodles", "Noodles", "Noodles loaded with assorted toppings", 40, [["GH₵40", 40], ["GH₵50", 50]]],
    ["Margarita", "Pizza", "Classic cheese and tomato pizza", 80, [["Small", 80], ["Medium", 105], ["Large", 115]]],
    ["All Seasoning", "Pizza", "Our fully loaded pizza", 95, [["Small", 95], ["Medium", 125], ["Large", 150]]],
    ["Beef", "Pizza", "Pizza topped with seasoned beef", 85, [["Small", 85], ["Medium", 110], ["Large", 120]]],
    ["Chicken", "Pizza", "Pizza topped with seasoned chicken", 85, [["Small", 85], ["Medium", 110], ["Large", 120]]],
    ["Beef and Chicken", "Pizza", "The best of both toppings", 90, [["Small", 90], ["Medium", 115], ["Large", 125]]],
    ["Beef and Sausage", "Pizza", "Beef and sausage with melted cheese", 90, [["Small", 90], ["Medium", 115], ["Large", 125]]],
    ["Vegetables", "Pizza", "Fresh vegetables and cheese", 80, [["Small", 80], ["Medium", 105], ["Large", 115]]],
    ["Mister Gentle Special", "Pizza", "Our signature loaded special pizza", 100, [["Small", 100], ["Medium", 130], ["Large", 160]]],
    ["Chicken Shawarma", "Shawarma", "Seasoned chicken, fresh vegetables and our signature sauce", 45],
    ["Beef Shawarma", "Shawarma", "Tender beef, fresh vegetables and our signature sauce", 50],
    ["Mixed Shawarma", "Shawarma", "Chicken and beef with fresh vegetables and sauce", 55]
];

const seed = db.transaction(() => {
    const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (name, description, sort_order)
        VALUES (?, ?, ?)
    `);
    for (const category of categories) insertCategory.run(...category);

    const findCategory = db.prepare("SELECT id FROM categories WHERE name = ?");
    const findProduct = db.prepare("SELECT id FROM products WHERE category_id = ? AND name = ?");
    const insertProduct = db.prepare(`
        INSERT INTO products (category_id, name, description, price, is_available)
        VALUES (?, ?, ?, ?, 1)
    `);
    const findVariant = db.prepare("SELECT id FROM product_variants WHERE product_id = ? AND name = ?");
    const insertVariant = db.prepare(`
        INSERT INTO product_variants (product_id, name, price, sort_order)
        VALUES (?, ?, ?, ?)
    `);

    for (const [name, categoryName, description, price, variants] of products) {
        const category = findCategory.get(categoryName);
        let product = findProduct.get(category.id, name);
        if (!product) {
            const result = insertProduct.run(category.id, name, description, price);
            product = { id: result.lastInsertRowid };
        }
        for (const [index, [variantName, variantPrice]] of (variants || []).entries()) {
            if (!findVariant.get(product.id, variantName)) {
                insertVariant.run(product.id, variantName, variantPrice, index);
            }
        }
    }
});

seed();
console.log(`Catalog initialized: ${categories.length} categories, ${products.length} products.`);
