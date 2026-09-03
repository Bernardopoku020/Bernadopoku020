const Database = require("better-sqlite3");
const path = require("path");

// ========================================
// MISTER GENTLE FAST FOOD DATABASE
// ========================================

const dbPath = path.join(__dirname, "mister-gentle.db");

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// ========================================
// DATABASE TABLES
// ========================================

db.exec(`

    -- ====================================
    -- ADMINS
    -- ====================================

    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ====================================
    -- CUSTOMERS
    -- ====================================

    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ====================================
    -- CUSTOMER ADDRESSES
    -- ====================================

    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        address_name TEXT,
        address_line TEXT NOT NULL,
        area TEXT NOT NULL,
        city TEXT NOT NULL DEFAULT 'Kumasi',
        digital_address TEXT,
        latitude REAL,
        longitude REAL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id)
            REFERENCES customers(id)
            ON DELETE CASCADE
    );

    -- ====================================
    -- FOOD CATEGORIES
    -- ====================================

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ====================================
    -- FOOD PRODUCTS
    -- ====================================

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image TEXT,
        preparation_time INTEGER DEFAULT 15,
        is_available INTEGER NOT NULL DEFAULT 1,
        is_featured INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (category_id)
            REFERENCES categories(id)
            ON DELETE RESTRICT
    );

    -- ====================================
    -- PRODUCT OPTIONS / ADD-ONS
    -- ====================================

    CREATE TABLE IF NOT EXISTS addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        image TEXT,
        is_available INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ====================================
    -- PRODUCT ↔ ADD-ON
    -- ====================================

    CREATE TABLE IF NOT EXISTS product_addons (
        product_id INTEGER NOT NULL,
        addon_id INTEGER NOT NULL,

        PRIMARY KEY (product_id, addon_id),

        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE CASCADE,

        FOREIGN KEY (addon_id)
            REFERENCES addons(id)
            ON DELETE CASCADE
    );

    -- ====================================
    -- ORDERS
    -- ====================================

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER,
        order_type TEXT NOT NULL DEFAULT 'delivery',
        status TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        delivery_fee REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        delivery_address TEXT,
        delivery_area TEXT,
        delivery_digital_address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id)
            REFERENCES customers(id)
            ON DELETE SET NULL
    );

    -- ====================================
    -- ORDER ITEMS
    -- ====================================

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        notes TEXT,

        FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE CASCADE,

        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE SET NULL
    );

    -- ====================================
    -- ORDER ITEM ADD-ONS
    -- ====================================

    CREATE TABLE IF NOT EXISTS order_item_addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_item_id INTEGER NOT NULL,
        addon_id INTEGER,
        addon_name TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0,

        FOREIGN KEY (order_item_id)
            REFERENCES order_items(id)
            ON DELETE CASCADE,

        FOREIGN KEY (addon_id)
            REFERENCES addons(id)
            ON DELETE SET NULL
    );

    -- ====================================
    -- PAYMENTS
    -- ====================================

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        transaction_reference TEXT UNIQUE,
        provider TEXT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'GHS',
        status TEXT NOT NULL DEFAULT 'pending',
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE CASCADE
    );

    -- ====================================
    -- DELIVERIES
    -- ====================================

    CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL UNIQUE,
        driver_name TEXT,
        driver_phone TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        assigned_at DATETIME,
        picked_up_at DATETIME,
        delivered_at DATETIME,
        notes TEXT,

        FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE CASCADE
    );

    -- ====================================
    -- REVIEWS
    -- ====================================

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        product_id INTEGER,
        order_id INTEGER,
        rating INTEGER NOT NULL,
        comment TEXT,
        is_approved INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id)
            REFERENCES customers(id)
            ON DELETE SET NULL,

        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE CASCADE,

        FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE SET NULL
    );

    -- ====================================
    -- FAVOURITES
    -- ====================================

    CREATE TABLE IF NOT EXISTS favourites (
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (customer_id, product_id),

        FOREIGN KEY (customer_id)
            REFERENCES customers(id)
            ON DELETE CASCADE,

        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE CASCADE
    );

    -- ====================================
    -- PROMOTIONS
    -- ====================================

    CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value REAL NOT NULL DEFAULT 0,
        minimum_order REAL DEFAULT 0,
        maximum_discount REAL,
        start_date DATETIME,
        end_date DATETIME,
        usage_limit INTEGER,
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ====================================
    -- LOYALTY POINTS
    -- ====================================

    CREATE TABLE IF NOT EXISTS loyalty_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        order_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id)
            REFERENCES customers(id)
            ON DELETE CASCADE,

        FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE SET NULL
    );

    -- ====================================
    -- RESTAURANT SETTINGS
    -- ====================================

    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT NOT NULL UNIQUE,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

`);

try { db.exec("ALTER TABLE customers ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0"); } catch (error) { if (!String(error.message).includes("duplicate column")) throw error; }
try { db.exec("ALTER TABLE customers ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0"); } catch (error) { if (!String(error.message).includes("duplicate column")) throw error; }
db.exec(`CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, channel TEXT NOT NULL,
    code_hash TEXT NOT NULL, expires_at DATETIME NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);`);

// ========================================
// DEFAULT RESTAURANT SETTINGS
// ========================================

const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings
    (setting_key, setting_value)
    VALUES (?, ?)
`);

insertSetting.run("restaurant_name", "Mister Gentle Fast Food");
insertSetting.run("currency", "GHS");
insertSetting.run("currency_symbol", "GH₵");
insertSetting.run("default_city", "Kumasi");
insertSetting.run("delivery_enabled", "true");
insertSetting.run("pickup_enabled", "true");

const shawarmaCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, description, sort_order)
    VALUES ('Shawarma', 'Freshly wrapped shawarma made to order', 6)
`);
shawarmaCategory.run();

// ========================================
// PRODUCT VARIANTS
// ========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    sku TEXT UNIQUE,
    is_available INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_product_variants_product
  ON product_variants(product_id);
`);

// ========================================
// DATABASE READY
// ========================================

console.log("Mister Gentle database is ready.");

module.exports = db;
