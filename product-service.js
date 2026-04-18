const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { products } = require('./shared/layout');
const { getLayout, fmt, getStars, discount } = require('./shared/layout');

// ── GET CART COUNT FROM CART SERVICE ──────────────────────────────────────────
const http = require('http');
const cartServiceBaseUrl = process.env.CART_SERVICE_URL || 'http://localhost:3002';
const metricsServiceUrl = process.env.METRICS_SERVICE_URL || 'http://localhost:3003';

const logEvent = (data) => {
  try {
    const body = JSON.stringify(data);
    const eventUrl = new URL(`${metricsServiceUrl}/event`);
    const req = http.request({
      hostname: eventUrl.hostname,
      port: eventUrl.port,
      path: eventUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    });
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch {}
};

const getCartCount = () => new Promise((resolve) => {
  const req = http.get(`${cartServiceBaseUrl}/api/cart-count`, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try { resolve(JSON.parse(data).count || 0); } catch { resolve(0); }
    });
  });
  req.on('error', () => resolve(0));
  req.setTimeout(300, () => { req.abort(); resolve(0); });
});

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
app.get('/', async (req, res) => {
  const { cat, q } = req.query;
  const cartCount = await getCartCount();

  let filtered = [...products];
  if (cat) filtered = filtered.filter(p => p.category === cat);
  if (q) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.desc.toLowerCase().includes(q.toLowerCase()) ||
    p.category.toLowerCase().includes(q.toLowerCase())
  );

  const categories = [...new Set(products.map(p => p.category))];

  const heroSection = !cat && !q ? `
  <div style="background: linear-gradient(135deg, #0f0e0d 0%, #1a1612 60%, #2d2318 100%); color: white; padding: 64px 5%; margin-bottom: 0; position:relative; overflow:hidden;">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 80% 20%, rgba(200,150,62,0.14), transparent 38%), radial-gradient(circle at 20% 80%, rgba(200,150,62,0.1), transparent 30%);"></div>
    <div style="position:relative;max-width:640px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:var(--gold);margin-bottom:16px;">New Arrivals 2026</div>
      <h1 style="font-family:'Playfair Display',serif;font-size:clamp(32px,5vw,52px);font-weight:700;line-height:1.1;margin-bottom:20px;">Premium Tech,<br><span style="color:var(--gold)">Curated for You.</span></h1>
      <p style="font-size:16px;opacity:0.7;margin-bottom:32px;line-height:1.7;max-width:480px;">Discover India's finest selection of electronics. From M3 MacBooks to 8K displays — we carry only what's worth owning.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="/?cat=Laptops" class="btn btn-gold" style="padding:13px 28px;">Shop Laptops</a>
        <a href="/?cat=Mobiles" class="btn btn-outline" style="padding:13px 28px;border-color:rgba(255,255,255,0.4);color:white;">View Mobiles</a>
      </div>
      <div style="display:flex;gap:32px;margin-top:40px;">
        <div><div style="font-size:22px;font-weight:700;color:var(--gold);">50K+</div><div style="font-size:12px;opacity:0.6;margin-top:2px;">Happy Customers</div></div>
        <div><div style="font-size:22px;font-weight:700;color:var(--gold);">100%</div><div style="font-size:12px;opacity:0.6;margin-top:2px;">Genuine Products</div></div>
        <div><div style="font-size:22px;font-weight:700;color:var(--gold);">4.8★</div><div style="font-size:12px;opacity:0.6;margin-top:2px;">Average Rating</div></div>
      </div>
    </div>
  </div>
  <div style="background:var(--paper2);border-bottom:1px solid var(--paper3);padding:0 5%;display:flex;gap:0;overflow-x:auto;">
    ${categories.map(c => `<a href="/?cat=${c}" style="white-space:nowrap;padding:14px 20px;font-size:13px;font-weight:500;color:var(--ink2);text-decoration:none;border-bottom:2px solid transparent;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.borderColor='var(--gold)'" onmouseout="this.style.color='var(--ink2)';this.style.borderColor='transparent'">${c}</a>`).join('')}
  </div>` : '';

  const filterBar = (cat || q) ? `
  <div style="background:var(--paper2);border-bottom:1px solid var(--paper3);padding:12px 5%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--ink3);">${filtered.length} results ${cat ? `in <strong>${cat}</strong>` : ''} ${q ? `for "<strong>${q}</strong>"` : ''}</span>
      ${cat || q ? `<a href="/" style="font-size:12px;color:var(--red);text-decoration:none;font-weight:600;">✕ Clear filters</a>` : ''}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${categories.map(c => `<a href="/?cat=${c}" style="font-size:12px;padding:5px 12px;border-radius:20px;background:${c===cat?'var(--ink)':'white'};color:${c===cat?'white':'var(--ink2)'};text-decoration:none;border:1px solid ${c===cat?'var(--ink)':'var(--paper3)'};font-weight:500;">${c}</a>`).join('')}
    </div>
  </div>` : '';

  const productCards = filtered.length > 0 ? filtered.map(p => {
    const disc = discount(p.originalPrice, p.price);
    const tagClass = p.tags.includes('Hot') ? 'hot' : p.tags.includes('New Arrival') ? 'new' : '';
    return `
    <a href="/product/${p.id}" class="product-card">
      ${disc > 0 ? `<span class="card-badge">${disc}% OFF</span>` : ''}
      ${p.tags.includes('Best Seller') ? `<span class="card-badge gold" style="top:${disc>0?'40px':'12px'}">Best Seller</span>` : ''}
      <div class="card-image">
        <span>${p.emoji}</span>
        <button class="card-wishlist" onclick="event.preventDefault()">♡</button>
      </div>
      <div class="card-body">
        <div class="card-category">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-rating">
          <span class="stars">${getStars(p.rating)}</span>
          <span>${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="card-pricing">
          <span class="card-price">${fmt(p.price)}</span>
          ${p.originalPrice > p.price ? `<span class="card-original">${fmt(p.originalPrice)}</span>` : ''}
          ${disc > 0 ? `<span class="card-discount">${disc}% off</span>` : ''}
        </div>
        <div class="card-tags">
          ${p.tags.map(t => `<span class="tag ${tagClass}">${t}</span>`).join('')}
        </div>
        <div class="card-stock ${p.stock > 10 ? 'ok' : ''}">
          ${p.stock <= 5 ? `⚠ Only ${p.stock} left` : p.stock <= 10 ? `Hurry! ${p.stock} left` : '✓ In Stock'}
        </div>
        <button class="btn btn-primary">View Details</button>
      </div>
    </a>`;
  }).join('') : `
  <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--ink3);">
    <div style="font-size:48px;margin-bottom:16px;">🔍</div>
    <h3 style="font-family:'Playfair Display',serif;font-size:22px;color:var(--ink);margin-bottom:8px;">No products found</h3>
    <p>Try a different search or browse our categories.</p>
    <a href="/" class="btn btn-ghost" style="margin-top:20px;display:inline-flex;">Browse All</a>
  </div>`;

  const content = `
  ${heroSection}
  ${filterBar}
  <div class="container page-section">
    ${!cat && !q ? `<div style="margin-bottom:24px;"><div class="section-label">Featured Collection</div><h2 class="section-title">Top Picks for You</h2><p class="section-sub">Handpicked by our tech experts for the best value and performance.</p></div>` : ''}
    <div class="product-grid">${productCards}</div>
  </div>
  <div style="background:var(--paper2);border-top:1px solid var(--paper3);border-bottom:1px solid var(--paper3);padding:40px 5%;">
    <div style="max-width:1280px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;text-align:center;">
      <div><div style="font-size:28px;margin-bottom:8px;">🚚</div><div style="font-weight:600;margin-bottom:4px;">Free Delivery</div><div style="font-size:13px;color:var(--ink3);">On all orders above ₹999</div></div>
      <div><div style="font-size:28px;margin-bottom:8px;">🔄</div><div style="font-weight:600;margin-bottom:4px;">10-Day Returns</div><div style="font-size:13px;color:var(--ink3);">Hassle-free return policy</div></div>
      <div><div style="font-size:28px;margin-bottom:8px;">🔒</div><div style="font-weight:600;margin-bottom:4px;">Secure Payments</div><div style="font-size:13px;color:var(--ink3);">100% safe & encrypted</div></div>
      <div><div style="font-size:28px;margin-bottom:8px;">🎁</div><div style="font-weight:600;margin-bottom:4px;">Genuine Products</div><div style="font-size:13px;color:var(--ink3);">Official brand warranty</div></div>
    </div>
  </div>`;

  res.send(getLayout(content, cat ? `${cat} — ShopEase` : 'ShopEase — Premium Electronics', cartCount));
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
app.get('/search', (req, res) => res.redirect(`/?q=${req.query.q || ''}`));

// ── PRODUCT DETAIL ────────────────────────────────────────────────────────────
app.get('/product/:id', async (req, res) => {
  const p = products.find(x => x.id == req.params.id);
  if (!p) return res.redirect('/');
  const cartCount = await getCartCount();
  const disc = discount(p.originalPrice, p.price);
  const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);

  logEvent({ type: 'product_view', service: 'product-service', productId: p.id, productName: p.name });

  const content = `
  <div class="container">
    <nav class="breadcrumb">
      <a href="/">Home</a><span>/</span>
      <a href="/?cat=${p.category}">${p.category}</a><span>/</span>
      <span style="color:var(--ink)">${p.name}</span>
    </nav>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;margin-bottom:56px;">
      <!-- LEFT: Image Gallery -->
      <div>
        <div style="background:linear-gradient(135deg,var(--paper2),var(--paper3));border-radius:var(--radius-lg);height:420px;display:flex;align-items:center;justify-content:center;font-size:120px;margin-bottom:12px;border:1px solid var(--paper3);">
          ${p.emoji}
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
          ${[p.emoji,p.emoji,p.emoji,p.emoji].map((e,i) => `
          <div style="background:var(--paper2);border:2px solid ${i===0?'var(--gold)':'var(--paper3)'};border-radius:var(--radius);height:72px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;">${e}</div>`).join('')}
        </div>
      </div>

      <!-- RIGHT: Product Info -->
      <div>
        <div class="card-category" style="font-size:12px;margin-bottom:8px;">${p.category}</div>
        <h1 style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;line-height:1.2;margin-bottom:12px;">${p.name}</h1>

        <div class="card-rating" style="margin-bottom:20px;">
          <span class="stars" style="font-size:16px;">${getStars(p.rating)}</span>
          <span style="font-weight:600;">${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()} ratings)</span>
          <span style="color:var(--blue);font-size:13px;margin-left:8px;">See all reviews</span>
        </div>

        <hr class="divider" style="margin:0 0 20px;">

        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px;">
          <span style="font-size:32px;font-weight:700;">${fmt(p.price)}</span>
          ${p.originalPrice > p.price ? `<span style="font-size:18px;color:var(--ink3);text-decoration:line-through;">${fmt(p.originalPrice)}</span>` : ''}
          ${disc > 0 ? `<span style="background:#e8f5ee;color:var(--green);font-size:14px;font-weight:700;padding:4px 10px;border-radius:2px;">${disc}% OFF</span>` : ''}
        </div>
        ${disc > 0 ? `<p style="font-size:13px;color:var(--green);margin-bottom:20px;">You save ${fmt(p.originalPrice - p.price)}!</p>` : '<div style="margin-bottom:20px;"></div>'}

        <div style="background:var(--paper2);border-radius:var(--radius);padding:16px;margin-bottom:24px;">
          <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px;">Available Offers</div>
          <div style="font-size:13px;color:var(--ink2);display:flex;flex-direction:column;gap:6px;">
            <div>🏦 10% off on HDFC Bank Credit Cards. T&C apply</div>
            <div>💳 No-cost EMI from ₹${Math.round(p.price/12/100)*100}/month</div>
            <div>🔄 10-day replacement guarantee</div>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Description</div>
          <p style="font-size:14px;color:var(--ink2);line-height:1.7;">${p.desc}</p>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${p.stock>0?'var(--green)':'var(--red)'};"></div>
          <span style="font-size:13px;font-weight:600;color:${p.stock>0?'var(--green)':'var(--red)'};">
            ${p.stock > 10 ? 'In Stock' : p.stock > 0 ? `Only ${p.stock} left in stock` : 'Out of Stock'}
          </span>
        </div>

        <form action="/add-to-cart" method="POST" style="margin-bottom:16px;">
          <input type="hidden" name="id" value="${p.id}">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <label style="font-size:13px;font-weight:600;">Qty:</label>
            <div style="display:flex;align-items:center;border:1.5px solid var(--paper3);border-radius:var(--radius);overflow:hidden;">
              <button type="button" onclick="let q=document.getElementById('qty');q.value=Math.max(1,+q.value-1)" style="width:36px;height:36px;border:none;background:var(--paper2);cursor:pointer;font-size:16px;">−</button>
              <input id="qty" name="qty" type="number" value="1" min="1" max="${p.stock}" style="width:48px;height:36px;border:none;text-align:center;font-size:14px;font-weight:600;font-family:inherit;background:white;">
              <button type="button" onclick="let q=document.getElementById('qty');q.value=Math.min(${p.stock},+q.value+1)" style="width:36px;height:36px;border:none;background:var(--paper2);cursor:pointer;font-size:16px;">+</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <button type="submit" class="btn btn-gold" style="padding:14px;">🛒 Add to Cart</button>
            <button type="submit" formaction="/buy-now" class="btn btn-primary" style="padding:14px;">⚡ Buy Now</button>
          </div>
        </form>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;">
          <div style="text-align:center;padding:12px;background:var(--paper2);border-radius:var(--radius);">
            <div style="font-size:20px;margin-bottom:4px;">🔒</div>
            <div style="font-size:11px;font-weight:600;">Secure</div>
            <div style="font-size:11px;color:var(--ink3);">Payment</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--paper2);border-radius:var(--radius);">
            <div style="font-size:20px;margin-bottom:4px;">🚚</div>
            <div style="font-size:11px;font-weight:600;">Fast</div>
            <div style="font-size:11px;color:var(--ink3);">Delivery</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--paper2);border-radius:var(--radius);">
            <div style="font-size:20px;margin-bottom:4px;">🔄</div>
            <div style="font-size:11px;font-weight:600;">10-Day</div>
            <div style="font-size:11px;color:var(--ink3);">Returns</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Specs Table -->
    <div style="margin-bottom:56px;">
      <div class="section-label">Technical</div>
      <h2 class="section-title" style="font-size:22px;margin-bottom:20px;">Specifications</h2>
      <table style="width:100%;border-collapse:collapse;background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);overflow:hidden;">
        ${[['Category', p.category],['Brand','ShopEase Certified'],['Model',p.name],['Rating',`${p.rating}/5 (${p.reviews.toLocaleString()} reviews)`],['Stock',`${p.stock} units available`],['Warranty','1 Year Brand Warranty']].map(([k,v],i) => `
        <tr style="background:${i%2===0?'white':'var(--paper2)'};">
          <td style="padding:14px 20px;font-size:13px;font-weight:600;color:var(--ink2);width:200px;border-bottom:1px solid var(--paper3);">${k}</td>
          <td style="padding:14px 20px;font-size:14px;color:var(--ink);border-bottom:1px solid var(--paper3);">${v}</td>
        </tr>`).join('')}
      </table>
    </div>

    <!-- Related Products -->
    ${related.length > 0 ? `
    <div style="margin-bottom:40px;">
      <div class="section-label">More in ${p.category}</div>
      <h2 class="section-title" style="font-size:22px;margin-bottom:20px;">Related Products</h2>
      <div class="product-grid">
        ${related.map(rp => {
          const rdisc = discount(rp.originalPrice, rp.price);
          return `
          <a href="/product/${rp.id}" class="product-card">
            ${rdisc > 0 ? `<span class="card-badge">${rdisc}% OFF</span>` : ''}
            <div class="card-image"><span>${rp.emoji}</span></div>
            <div class="card-body">
              <div class="card-category">${rp.category}</div>
              <div class="card-name">${rp.name}</div>
              <div class="card-rating"><span class="stars">${getStars(rp.rating)}</span><span>${rp.rating}</span></div>
              <div class="card-pricing">
                <span class="card-price">${fmt(rp.price)}</span>
                ${rp.originalPrice > rp.price ? `<span class="card-original">${fmt(rp.originalPrice)}</span>` : ''}
              </div>
              <button class="btn btn-primary">View Details</button>
            </div>
          </a>`;
        }).join('')}
      </div>
    </div>` : ''}
  </div>`;

  res.send(getLayout(content, `${p.name} — ShopEase`, cartCount));
});

// ── API ───────────────────────────────────────────────────────────────────────

app.get('/account', async (req, res) => {
  const cartCount = await getCartCount();
  const content = `
  <div class="container page-section">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><span style="color:var(--ink)">Account</span></nav>
    <div style="display:grid;grid-template-columns:minmax(260px,320px) 1fr;gap:28px;align-items:start;">
      <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:24px;box-shadow:var(--shadow);">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--ink);margin-bottom:16px;">ST</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:28px;margin-bottom:6px;">Sujith T</h2>
        <p style="font-size:14px;color:var(--ink3);margin-bottom:18px;">sujith@email.com</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
          <span class="tag new">ShopEase Gold</span>
          <span class="tag">Member since 2024</span>
        </div>
        <div style="font-size:13px;color:var(--ink2);line-height:1.8;">
          <div>Phone: +91 98765 43210</div>
          <div>Primary Address: Tamil Nadu</div>
        </div>
      </div>
      <div style="display:grid;gap:18px;">
        <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:24px;">
          <div class="section-label">Overview</div>
          <h3 style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:18px;">Your ShopEase Snapshot</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">
            <div style="background:var(--paper2);border-radius:var(--radius);padding:16px;"><div style="font-size:13px;color:var(--ink3);margin-bottom:6px;">Orders</div><div style="font-size:24px;font-weight:700;">3</div></div>
            <div style="background:var(--paper2);border-radius:var(--radius);padding:16px;"><div style="font-size:13px;color:var(--ink3);margin-bottom:6px;">Wishlist Items</div><div style="font-size:24px;font-weight:700;">6</div></div>
            <div style="background:var(--paper2);border-radius:var(--radius);padding:16px;"><div style="font-size:13px;color:var(--ink3);margin-bottom:6px;">Reward Points</div><div style="font-size:24px;font-weight:700;">1280</div></div>
          </div>
        </div>
        <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:24px;">
          <div class="section-label">Saved Addresses</div>
          <h3 style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:18px;">Delivery Details</h3>
          <div style="display:grid;gap:12px;">
            <div style="border:1px solid var(--paper3);border-radius:var(--radius);padding:16px;">
              <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Home</div>
              <div style="font-size:13px;color:var(--ink2);">12, Perundurai Road, Erode - 638011, Tamil Nadu</div>
            </div>
            <div style="border:1px solid var(--paper3);border-radius:var(--radius);padding:16px;">
              <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Work</div>
              <div style="font-size:13px;color:var(--ink2);">45, Brough Road, Erode - 638001, Tamil Nadu</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  res.send(getLayout(content, 'My Account - ShopEase', cartCount));
});

app.get('/wishlist', async (req, res) => {
  const cartCount = await getCartCount();
  const wishlistItems = products.slice(0, 4);
  const content = `
  <div class="container page-section">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><span style="color:var(--ink)">Wishlist</span></nav>
    <div style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap;margin-bottom:24px;">
      <div>
        <div class="section-label">Saved For Later</div>
        <h2 class="section-title">Your Wishlist</h2>
        <p class="section-sub" style="margin-bottom:0;">A quick shortlist of pieces worth coming back for.</p>
      </div>
      <a href="/" class="btn btn-outline">Browse More</a>
    </div>
    <div class="product-grid">
      ${wishlistItems.map(item => {
        const disc = discount(item.originalPrice, item.price);
        return `
        <div class="product-card">
          ${disc > 0 ? `<span class="card-badge">${disc}% OFF</span>` : ''}
          <div class="card-image"><span>${item.emoji}</span></div>
          <div class="card-body">
            <div class="card-category">${item.category}</div>
            <div class="card-name">${item.name}</div>
            <div class="card-pricing">
              <span class="card-price">${fmt(item.price)}</span>
              ${item.originalPrice > item.price ? `<span class="card-original">${fmt(item.originalPrice)}</span>` : ''}
            </div>
            <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;">
              <a href="/product/${item.id}" class="btn btn-primary">View</a>
              <form action="/add-to-cart" method="POST">
                <input type="hidden" name="id" value="${item.id}">
                <input type="hidden" name="qty" value="1">
                <button type="submit" class="btn btn-gold" style="padding:11px 14px;">Add</button>
              </form>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
  res.send(getLayout(content, 'Wishlist - ShopEase', cartCount));
});

app.get('/api/products', (req, res) => res.json(products));
app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id == req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service', port: PORT }));

app.listen(PORT, () => console.log(`🛍  Product Service running on http://localhost:${PORT}`));
