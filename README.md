# Mister Gentle Fast Food

## Run locally

```bash
npm install
node server.js
```

Open `http://localhost:3000`.

## Structure

- `server.js` starts Express and serves the app.
- `routes/` contains the public API modules for products, categories, orders, admin auth and customer users.
- `database/database.js` initializes the SQLite database.
- `public/` contains customer pages, admin pages, CSS, JavaScript modules and image assets.

Customer pages: `/`, `/menu.html`, `/cart.html`, `/checkout.html`.
Staff pages: `/admin/`. Customer accounts are available at `/account.html`; registration and login use `/api/users`, while administrator login/logout uses `/api/auth`.
