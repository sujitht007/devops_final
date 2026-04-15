const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- MOCK DATABASE (In-memory for this demo) ---
const products = [
    { id: 1, name: "UltraBook Pro 14", emoji: "💻", price: 85000, category: "Laptops", desc: "M3 Chip, 16GB RAM, 512GB SSD. Midnight Black.", tags: ["Premium", "Work"] },
    { id: 2, name: "iPhone 15 Pro", emoji: "📱", price: 124900, category: "Mobiles", desc: "Titanium design, A17 Pro chip, Pro camera system.", tags: ["New Arrival"] },
    { id: 3, name: "Studio Wireless 3", emoji: "🎧", price: 24500, category: "Audio", desc: "Active Noise Cancelling, 22-hour battery life.", tags: ["Best Seller"] },
    { id: 4, name: "Mechanical Master", emoji: "⌨️", price: 12500, category: "Accessories", desc: "Tactile brown switches, PBT keycaps, Per-key RGB.", tags: ["Gaming"] },
    { id: 5, name: "Curved Pro Display", emoji: "🖥️", price: 42000, category: "Displays", desc: "34-inch Ultrawide, 144Hz, HDR10 support.", tags: ["Editors Choice"] },
    { id: 6, name: "Precision Mouse V2", emoji: "🖱️", price: 6500, category: "Accessories", desc: "8000 DPI sensor, Ergonomic thumb rest.", tags: ["Popular"] }
];

let cart = [];

// --- UTILITIES ---
const fmt = (n) => "₹" + n.toLocaleString("en-IN");

// --- STYLING (Modern Professional Design) ---
const style = `
<style>
    :root {
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --bg: #f8fafc;
        --card: #ffffff;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --accent: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text-main); line-height: 1.5; }

    /* Navigation */
    nav { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 5%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; }
    .logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 8px; }
    .nav-links { display: flex; gap: 2rem; align-items: center; }
    .nav-links a { text-decoration: none; color: var(--text-main); font-weight: 500; font-size: 0.95rem; }
    
    .cart-pill { background: var(--primary); color: white; padding: 8px 16px; border-radius: 50px; display: flex; gap: 8px; font-weight: 600; transition: 0.3s; }
    .cart-pill:hover { background: var(--primary-dark); transform: scale(1.05); }

    /* Hero & Container */
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 20px; }
    .page-header { margin-bottom: 2rem; }
    .page-header h2 { font-size: 1.875rem; font-weight: 700; }

    /* Product Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .product-card { background: var(--card); border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .product-card:hover { transform: translateY(-8px); border-color: var(--primary); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
    .product-image { height: 200px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 4rem; }
    .product-content { padding: 1.5rem; }
    .category-tag { font-size: 0.75rem; font-weight: 600; color: var(--primary); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
    .product-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }
    .product-price { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 1rem 0; }
    
    /* Buttons */
    .btn { display: block; width: 100%; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: 0.2s; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: transparent; border: 1px solid #cbd5e1; color: var(--text-main); }
    .btn-outline:hover { background: #f1f5f9; }

    /* Cart Specifics */
    .cart-table { width: 100%; background: white; border-radius: 12px; border-collapse: collapse; overflow: hidden; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
    .cart-table th { background: #f8fafc; text-align: left; padding: 1rem; font-size: 0.875rem; color: var(--text-muted); }
    .cart-table td { padding: 1.5rem 1rem; border-top: 1px solid #e2e8f0; }
    .checkout-summary { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; position: sticky; top: 100px; }
    
    .badge-tag { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; margin-right: 4px; }

    /* Success Message */
    .alert-success { background: #ecfdf5; color: #065f46; padding: 1rem; border-radius: 8px; border: 1px solid #a7f3d0; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; }
</style>
`;

const getLayout = (content, title = "ShopEase | Modern E-Store") => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    ${style}
</head>
<body>
    <nav>
        <a href="/" class="logo">🛍️ ShopEase</a>
        <div class="nav-links">
            <a href="/">Products</a>
            <a href="/cart" class="cart-pill">
                <i class="fas fa-shopping-cart"></i>
                <span>Cart</span>
                <span style="background:rgba(255,255,255,0.2); padding: 0 6px; border-radius:4px;">${cart.reduce((s, i) => s + i.qty, 0)}</span>
            </a>
        </div>
    </nav>
    <div class="container">${content}</div>
    <footer style="text-align:center; padding: 4rem; color: var(--text-muted); font-size: 0.9rem;">
        &copy;ShopEase E-Commerce Portal.
    </footer>
</body>
</html>`;

// --- ROUTES ---

// 1. Home Page (Product Listing)
app.get('/', (req, res) => {
    const productGrid = products.map(p => `
        <div class="product-card">
            <div class="product-image">${p.emoji}</div>
            <div class="product-content">
                <span class="category-tag">${p.category}</span>
                <h3 class="product-title">${p.name}</h3>
                <div style="margin-bottom: 1rem;">
                    ${p.tags.map(t => `<span class="badge-tag">${t}</span>`).join('')}
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; height: 40px; overflow: hidden;">${p.desc}</p>
                <div class="product-price">${fmt(p.price)}</div>
                <a href="/product/${p.id}" class="btn btn-outline">View Details</a>
            </div>
        </div>
    `).join('');

    const content = `
        <header class="page-header">
            <h2>Explore Our Collection</h2>
            <p style="color: var(--text-muted)">High-quality tech curated for your needs.</p>
        </header>
        <div class="grid">${productGrid}</div>
    `;
    res.send(getLayout(content));
});

// 2. Product Detail Page
app.get('/product/:id', (req, res) => {
    const p = products.find(x => x.id == req.params.id);
    if (!p) return res.redirect('/');

    const content = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start;">
            <div style="background: white; border-radius: 20px; padding: 4rem; text-align: center; font-size: 8rem; border: 1px solid #e2e8f0;">
                ${p.emoji}
            </div>
            <div>
                <a href="/" style="text-decoration:none; color: var(--primary); font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 1rem;">
                    <i class="fas fa-arrow-left"></i> Back to Products
                </a>
                <span class="category-tag" style="font-size: 1rem;">${p.category}</span>
                <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">${p.name}</h1>
                <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2rem;">${p.desc}</p>
                <div style="font-size: 2rem; font-weight: 800; margin-bottom: 2rem;">${fmt(p.price)}</div>
                
                <form action="/add-to-cart" method="POST" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <input type="hidden" name="id" value="${p.id}">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display:block; font-weight:700; margin-bottom: 0.5rem;">Select Quantity</label>
                        <input type="number" name="qty" value="1" min="1" max="10" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 1rem;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="font-size: 1.1rem;">
                        <i class="fas fa-cart-plus"></i> Add to Shopping Bag
                    </button>
                </form>
            </div>
        </div>
    `;
    res.send(getLayout(content, `${p.name} | ShopEase`));
});

// 3. Cart Management Logic
app.post('/add-to-cart', (req, res) => {
    const id = parseInt(req.body.id);
    const qty = parseInt(req.body.qty);
    const product = products.find(p => p.id === id);
    
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }
    res.redirect('/cart');
});

app.post('/remove-item', (req, res) => {
    cart = cart.filter(item => item.id != req.body.id);
    res.redirect('/cart');
});

// 4. Shopping Cart Page
app.get('/cart', (req, res) => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    let cartContent;
    if (cart.length === 0) {
        cartContent = `
            <div style="text-align:center; padding: 5rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
                <h2>Your cart is currently empty</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Looks like you haven't added anything yet.</p>
                <a href="/" class="btn btn-primary" style="display:inline-block; width: auto; padding: 12px 32px;">Start Shopping</a>
            </div>
        `;
    } else {
        const rows = cart.map(item => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap: 15px;">
                        <span style="font-size: 2rem;">${item.emoji}</span>
                        <div>
                            <div style="font-weight: 700;">${item.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${item.category}</div>
                        </div>
                    </div>
                </td>
                <td>${fmt(item.price)}</td>
                <td>${item.qty}</td>
                <td style="font-weight: 700;">${fmt(item.price * item.qty)}</td>
                <td>
                    <form action="/remove-item" method="POST">
                        <input type="hidden" name="id" value="${item.id}">
                        <button style="background:none; border:none; color: #ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </form>
                </td>
            </tr>
        `).join('');

        cartContent = `
            ${req.query.success ? `<div class="alert-success"><i class="fas fa-check-circle"></i> Order placed successfully! Check your email for details.</div>` : ''}
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div>
                    <h2 style="margin-bottom: 1.5rem;">Shopping Cart (${cart.length} items)</h2>
                    <table class="cart-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div class="checkout-summary">
                    <h3 style="margin-bottom: 1.5rem;">Order Summary</h3>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 1rem;">
                        <span style="color: var(--text-muted);">Subtotal</span>
                        <span>${fmt(subtotal)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 1rem;">
                        <span style="color: var(--text-muted);">GST (18%)</span>
                        <span>${fmt(tax)}</span>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1rem 0;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2rem; font-size: 1.25rem; font-weight: 800;">
                        <span>Total</span>
                        <span style="color: var(--primary);">${fmt(total)}</span>
                    </div>
                    <form action="/checkout" method="POST">
                        <button type="submit" class="btn btn-primary">Proceed to Secure Checkout</button>
                    </form>
                </div>
            </div>
        `;
    }
    res.send(getLayout(cartContent, "Your Cart | ShopEase"));
});

// 5. Checkout
app.post('/checkout', (req, res) => {
    cart = []; // Clear cart
    res.redirect('/cart?success=true');
});

app.listen(PORT, () => {
    console.log(`
    🚀 ShopEase Professional E-Commerce is Live!
    🌍 URL: http://localhost:${PORT}
    
    `);
});