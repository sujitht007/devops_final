// Shared in-memory store (imported by product and cart services)
const products = [
  { id: 1, name: "UltraBook Pro 14", emoji: "💻", price: 85000, originalPrice: 95000, category: "Laptops", desc: "Apple M3 chip, 16GB unified memory, 512GB SSD. Midnight Black anodized aluminium chassis with MagSafe charging.", tags: ["Premium", "Work"], rating: 4.8, reviews: 2341, stock: 12 },
  { id: 2, name: "iPhone 15 Pro Max", emoji: "📱", price: 159900, originalPrice: 159900, category: "Mobiles", desc: "Titanium design, A17 Pro chip, 48MP ProRes camera, USB-C. Natural Titanium finish with Ceramic Shield front.", tags: ["New Arrival", "Hot"], rating: 4.9, reviews: 5821, stock: 5 },
  { id: 3, name: "Studio Wireless 4", emoji: "🎧", price: 24500, originalPrice: 29999, category: "Audio", desc: "Active Noise Cancellation, 30-hour battery, Spatial Audio with head tracking. Premium leather ear cushions.", tags: ["Best Seller"], rating: 4.7, reviews: 8923, stock: 34 },
  { id: 4, name: "Mechanical Master TKL", emoji: "⌨️", price: 12500, originalPrice: 14999, category: "Accessories", desc: "Gateron Yellow switches, CNC aluminium frame, PBT doubleshot keycaps, per-key RGB. Tenkeyless layout.", tags: ["Gaming"], rating: 4.6, reviews: 1204, stock: 20 },
  { id: 5, name: "Curved Pro 34\"", emoji: "🖥️", price: 52000, originalPrice: 62000, category: "Displays", desc: "34-inch IPS Ultrawide 3440x1440, 144Hz, HDR10, 1ms response. KVM switch, 3x USB-A, Thunderbolt 4.", tags: ["Editor's Choice"], rating: 4.8, reviews: 672, stock: 8 },
  { id: 6, name: "Precision Mouse Pro", emoji: "🖱️", price: 7500, originalPrice: 8999, category: "Accessories", desc: "Hero 25K sensor, 8000 DPI, 95-hour battery, ergonomic design with 11 programmable buttons.", tags: ["Popular"], rating: 4.5, reviews: 3341, stock: 45 },
  { id: 7, name: "iPad Pro M4 13\"", emoji: "📟", price: 108900, originalPrice: 108900, category: "Tablets", desc: "Ultra Retina XDR OLED, M4 chip, Apple Pencil Pro support, 5G. Thinnest Apple product ever made.", tags: ["New Arrival"], rating: 4.9, reviews: 934, stock: 15 },
  { id: 8, name: "AirPods Pro 3", emoji: "🎵", price: 26900, originalPrice: 26900, category: "Audio", desc: "H2 chip, Adaptive Audio, Conversation Awareness, USB-C. Up to 30 hours battery with case.", tags: ["Best Seller", "Hot"], rating: 4.8, reviews: 12043, stock: 60 },
];

module.exports = { products };

const getStars = (r) => {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
};

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

const discount = (orig, price) => orig > price ? Math.round((1 - price / orig) * 100) : 0;

const baseStyle = `
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #0f0e0d;
    --ink2: #3d3a36;
    --ink3: #7a7570;
    --paper: #faf9f7;
    --paper2: #f2f0ec;
    --paper3: #e8e4de;
    --gold: #c8963e;
    --gold2: #e8b460;
    --red: #c0392b;
    --green: #1a7a4a;
    --blue: #1a4fa0;
    --card: #ffffff;
    --shadow: 0 2px 12px rgba(15,14,13,0.08);
    --shadow-lg: 0 8px 40px rgba(15,14,13,0.12);
    --radius: 4px;
    --radius-lg: 8px;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--paper);
    color: var(--ink);
    line-height: 1.6;
    min-height: 100vh;
  }

  /* ── HEADER ── */
  .site-header {
    background: var(--ink);
    color: white;
    position: sticky;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .header-top {
    background: var(--gold);
    text-align: center;
    padding: 7px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--ink);
  }
  .header-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5%;
    height: 64px;
    gap: 20px;
  }
  .logo {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: white;
    text-decoration: none;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .logo span { color: var(--gold); }
  .nav-search {
    flex: 1;
    max-width: 520px;
    display: flex;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .nav-search input {
    flex: 1;
    background: none;
    border: none;
    padding: 10px 16px;
    color: white;
    font-size: 14px;
    font-family: inherit;
    outline: none;
  }
  .nav-search input::placeholder { color: rgba(255,255,255,0.45); }
  .nav-search button {
    background: var(--gold);
    border: none;
    padding: 0 18px;
    color: var(--ink);
    cursor: pointer;
    font-size: 16px;
    transition: background 0.2s;
  }
  .nav-search button:hover { background: var(--gold2); }
  .nav-actions { display: flex; gap: 6px; align-items: center; }
  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 14px;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.03em;
    border-radius: var(--radius);
    transition: all 0.2s;
    border: none;
    background: none;
    cursor: pointer;
    position: relative;
  }
  .nav-btn:hover { color: white; background: rgba(255,255,255,0.1); }
  .nav-btn .icon { font-size: 20px; line-height: 1; }
  .nav-cart { background: var(--gold) !important; color: var(--ink) !important; }
  .nav-cart:hover { background: var(--gold2) !important; }
  .cart-badge {
    position: absolute;
    top: 4px; right: 8px;
    background: var(--red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }
  .header-nav {
    background: rgba(255,255,255,0.05);
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex;
    padding: 0 5%;
    gap: 0;
  }
  .header-nav a {
    color: rgba(255,255,255,0.75);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 16px;
    transition: all 0.2s;
    letter-spacing: 0.02em;
    border-bottom: 2px solid transparent;
  }
  .header-nav a:hover { color: white; border-bottom-color: var(--gold); }

  /* ── LAYOUT ── */
  .container { max-width: 1280px; margin: 0 auto; padding: 0 5%; }
  .page-section { padding: 40px 0; }

  /* ── BREADCRUMB ── */
  .breadcrumb {
    padding: 14px 0;
    font-size: 13px;
    color: var(--ink3);
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .breadcrumb a { color: var(--ink3); text-decoration: none; }
  .breadcrumb a:hover { color: var(--gold); }
  .breadcrumb span { color: var(--ink3); }

  /* ── PRODUCT CARD ── */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
  .product-card {
    background: var(--card);
    border: 1px solid var(--paper3);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.25s;
    position: relative;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .product-card:hover {
    border-color: var(--gold);
    box-shadow: var(--shadow-lg);
    transform: translateY(-3px);
  }
  .card-badge {
    position: absolute;
    top: 12px; left: 12px;
    background: var(--red);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 2px;
    letter-spacing: 0.04em;
    z-index: 2;
  }
  .card-badge.gold { background: var(--gold); color: var(--ink); }
  .card-image {
    height: 200px;
    background: linear-gradient(135deg, var(--paper2) 0%, var(--paper3) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64px;
    position: relative;
  }
  .card-wishlist {
    position: absolute;
    top: 10px; right: 10px;
    width: 32px; height: 32px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: var(--shadow);
    cursor: pointer;
    border: none;
    transition: transform 0.2s;
  }
  .card-wishlist:hover { transform: scale(1.15); }
  .card-body { padding: 16px; }
  .card-category {
    font-size: 11px;
    font-weight: 600;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  .card-name {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 8px;
    color: var(--ink);
  }
  .card-rating {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 12px;
  }
  .stars { color: var(--gold); font-size: 13px; letter-spacing: -1px; }
  .rating-count { color: var(--ink3); }
  .card-pricing { display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px; }
  .card-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
  }
  .card-original {
    font-size: 13px;
    color: var(--ink3);
    text-decoration: line-through;
  }
  .card-discount {
    font-size: 12px;
    font-weight: 700;
    color: var(--green);
    background: #e8f5ee;
    padding: 2px 6px;
    border-radius: 2px;
  }
  .card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .tag {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 2px;
    font-weight: 500;
    background: var(--paper2);
    color: var(--ink2);
    border: 1px solid var(--paper3);
  }
  .tag.hot { background: #fef3e2; color: #b85c00; border-color: #fdd9a0; }
  .tag.new { background: #e8f4ff; color: #1a4fa0; border-color: #b3d4f5; }
  .card-stock { font-size: 12px; color: var(--red); font-weight: 500; margin-bottom: 12px; }
  .card-stock.ok { color: var(--green); }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    text-decoration: none;
    letter-spacing: 0.02em;
  }
  .btn-primary { background: var(--ink); color: white; width: 100%; }
  .btn-primary:hover { background: var(--ink2); }
  .btn-gold { background: var(--gold); color: var(--ink); }
  .btn-gold:hover { background: var(--gold2); }
  .btn-outline { background: transparent; border: 1.5px solid var(--ink); color: var(--ink); }
  .btn-outline:hover { background: var(--ink); color: white; }
  .btn-ghost { background: var(--paper2); color: var(--ink); }
  .btn-ghost:hover { background: var(--paper3); }
  .btn-danger { background: var(--red); color: white; }
  .btn-danger:hover { opacity: 0.9; }

  /* ── SECTION TITLES ── */
  .section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 6px;
    line-height: 1.2;
  }
  .section-sub {
    font-size: 15px;
    color: var(--ink3);
    margin-bottom: 28px;
  }

  /* ── ALERTS ── */
  .alert {
    padding: 14px 20px;
    border-radius: var(--radius);
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
  }
  .alert-success { background: #e8f5ee; color: var(--green); border: 1px solid #a8dbbe; }
  .alert-info { background: #e8f0ff; color: var(--blue); border: 1px solid #b3c8f5; }

  /* ── FOOTER ── */
  footer {
    background: var(--ink);
    color: rgba(255,255,255,0.6);
    margin-top: 80px;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 48px;
    padding: 56px 5%;
  }
  .footer-brand .logo { font-size: 26px; display: block; margin-bottom: 16px; }
  .footer-brand p { font-size: 14px; line-height: 1.7; max-width: 260px; }
  .footer-col h4 {
    color: white;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .footer-col a {
    display: block;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    font-size: 13px;
    padding: 4px 0;
    transition: color 0.2s;
  }
  .footer-col a:hover { color: var(--gold); }
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 20px 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }
  .payment-icons { display: flex; gap: 8px; }
  .payment-icon {
    background: rgba(255,255,255,0.1);
    padding: 4px 10px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.7);
  }

  /* ── MISC ── */
  .divider { border: none; border-top: 1px solid var(--paper3); margin: 32px 0; }
  .text-muted { color: var(--ink3); }
  .text-gold { color: var(--gold); }
  .text-green { color: var(--green); }
  .text-red { color: var(--red); }
  .fw-bold { font-weight: 700; }
  .mt-4 { margin-top: 32px; }
  .mb-4 { margin-bottom: 32px; }
</style>
`;

const getHeader = (cartCount = 0) => `
${baseStyle}
<header class="site-header">
  <div class="header-top">
    🚚 Free Delivery on orders above ₹999 &nbsp;|&nbsp; 10-day easy returns &nbsp;|&nbsp; 24/7 Customer Support
  </div>
  <div class="header-main">
    <a href="/" class="logo">Shop<span>Ease</span></a>
    <form class="nav-search" action="/search" method="GET">
      <input type="text" name="q" placeholder="Search for products, brands and more...">
      <button type="submit">🔍</button>
    </form>
    <div class="nav-actions">
      <a href="/account" class="nav-btn">
        <span class="icon">👤</span>
        <span>Account</span>
      </a>
      <a href="/wishlist" class="nav-btn">
        <span class="icon">♡</span>
        <span>Wishlist</span>
      </a>
      <a href="/cart" class="nav-btn nav-cart">
        <span class="icon">🛒</span>
        <span>Cart</span>
        ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
      </a>
    </div>
  </div>
  <nav class="header-nav">
    <a href="/">Home</a>
    <a href="/?cat=Laptops">Laptops</a>
    <a href="/?cat=Mobiles">Mobiles</a>
    <a href="/?cat=Audio">Audio</a>
    <a href="/?cat=Displays">Displays</a>
    <a href="/?cat=Accessories">Accessories</a>
    <a href="/?cat=Tablets">Tablets</a>
    <a href="/deals" style="color:var(--gold)">🏷 Deals</a>
  </nav>
</header>
`;

const getFooter = () => `
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <a href="/" class="logo">Shop<span style="color:var(--gold)">Ease</span></a>
      <p>India's most trusted destination for premium electronics and tech accessories. Curated for those who demand the best.</p>
    </div>
    <div class="footer-col">
      <h4>Shop</h4>
      <a href="/?cat=Laptops">Laptops</a>
      <a href="/?cat=Mobiles">Smartphones</a>
      <a href="/?cat=Audio">Audio</a>
      <a href="/?cat=Displays">Displays</a>
      <a href="/?cat=Accessories">Accessories</a>
    </div>
    <div class="footer-col">
      <h4>Help</h4>
      <a href="#">Track Order</a>
      <a href="#">Returns</a>
      <a href="#">Warranty</a>
      <a href="#">Contact Us</a>
      <a href="#">FAQ</a>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="#">About Us</a>
      <a href="#">Careers</a>
      <a href="#">Press</a>
      <a href="#">Privacy Policy</a>
      <a href="#">Terms</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; 2026 ShopEase. All rights reserved.</span>
    <div class="payment-icons">
      <span class="payment-icon">VISA</span>
      <span class="payment-icon">MC</span>
      <span class="payment-icon">UPI</span>
      <span class="payment-icon">EMI</span>
      <span class="payment-icon">COD</span>
    </div>
  </div>
</footer>
`;

const getLayout = (content, title = "ShopEase — Premium Electronics", cartCount = 0) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  ${getHeader(cartCount)}
  ${content}
  ${getFooter()}
</body>
</html>`;

module.exports = { getLayout, fmt, getStars, discount, products };
