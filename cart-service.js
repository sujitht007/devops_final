const express = require('express');
const app = express();
const PORT = 3002;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { products, getLayout, fmt, getStars, discount } = require('./shared/layout');
const http = require('http');
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

// ── IN-MEMORY CART STORE ──────────────────────────────────────────────────────
let cart = [];
let orders = [];

// ── CART PAGE ─────────────────────────────────────────────────────────────────
app.get('/cart', (req, res) => {
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const cartContent = cart.length === 0 ? `
  <div style="text-align:center;padding:100px 20px;">
    <div style="font-size:64px;margin-bottom:20px;">🛒</div>
    <h2 style="font-family:'Playfair Display',serif;font-size:28px;margin-bottom:12px;">Your cart is empty</h2>
    <p style="color:var(--ink3);margin-bottom:32px;">Looks like you haven't added anything yet. Explore our collection!</p>
    <a href="/" class="btn btn-gold" style="display:inline-flex;padding:14px 36px;font-size:15px;">Start Shopping</a>
  </div>` : `
  <div style="display:grid;grid-template-columns:1fr 380px;gap:32px;align-items:start;">
    <!-- Cart Items -->
    <div>
      <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:20px 24px;border-bottom:1px solid var(--paper3);display:flex;justify-content:space-between;align-items:center;">
          <h2 style="font-family:'Playfair Display',serif;font-size:20px;">Shopping Cart</h2>
          <span style="font-size:13px;color:var(--ink3);">${cartCount} item${cartCount!==1?'s':''}</span>
        </div>
        ${cart.map(item => {
          const disc = discount(item.originalPrice, item.price);
          return `
        <div style="padding:20px 24px;border-bottom:1px solid var(--paper3);display:grid;grid-template-columns:80px 1fr auto;gap:20px;align-items:center;">
          <div style="background:var(--paper2);border-radius:var(--radius);height:80px;display:flex;align-items:center;justify-content:center;font-size:36px;">${item.emoji}</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--gold);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">${item.category}</div>
            <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:600;margin-bottom:8px;">${item.name}</div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;border:1.5px solid var(--paper3);border-radius:var(--radius);overflow:hidden;">
                <form method="POST" action="/update-qty" style="margin:0;">
                  <input type="hidden" name="id" value="${item.id}">
                  <input type="hidden" name="qty" value="${Math.max(1, item.qty-1)}">
                  <button class="btn" style="width:30px;height:30px;padding:0;border-radius:0;background:var(--paper2);font-size:14px;" type="submit">−</button>
                </form>
                <span style="width:36px;text-align:center;font-size:14px;font-weight:600;">${item.qty}</span>
                <form method="POST" action="/update-qty" style="margin:0;">
                  <input type="hidden" name="id" value="${item.id}">
                  <input type="hidden" name="qty" value="${item.qty+1}">
                  <button class="btn" style="width:30px;height:30px;padding:0;border-radius:0;background:var(--paper2);font-size:14px;" type="submit">+</button>
                </form>
              </div>
              <form method="POST" action="/remove-item" style="margin:0;">
                <input type="hidden" name="id" value="${item.id}">
                <button class="btn" style="padding:5px 10px;background:none;color:var(--red);font-size:12px;font-weight:600;border:1px solid var(--paper3);" type="submit">✕ Remove</button>
              </form>
              <a href="/" style="font-size:12px;color:var(--blue);font-weight:500;text-decoration:none;">Save for later</a>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:700;">${fmt(item.price * item.qty)}</div>
            ${item.qty > 1 ? `<div style="font-size:12px;color:var(--ink3);">${fmt(item.price)} each</div>` : ''}
            ${disc > 0 ? `<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px;">${disc}% off</div>` : ''}
          </div>
        </div>`;
        }).join('')}
        <div style="padding:16px 24px;display:flex;justify-content:space-between;align-items:center;background:var(--paper2);">
          <a href="/" class="btn btn-ghost" style="font-size:13px;">← Continue Shopping</a>
          <form method="POST" action="/clear-cart">
            <button class="btn" style="font-size:13px;color:var(--red);background:none;border:1px solid var(--paper3);" type="submit">Clear Cart</button>
          </form>
        </div>
      </div>

      <!-- Coupons -->
      <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:20px 24px;margin-top:16px;">
        <div style="font-weight:600;margin-bottom:12px;font-size:15px;">Apply Coupon</div>
        <div style="display:flex;gap:10px;">
          <input type="text" placeholder="Enter coupon code" style="flex:1;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-family:inherit;font-size:14px;">
          <button class="btn btn-outline" style="padding:10px 20px;font-size:14px;">Apply</button>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12px;background:var(--paper2);padding:4px 10px;border-radius:20px;color:var(--ink2);cursor:pointer;">SAVE10</span>
          <span style="font-size:12px;background:var(--paper2);padding:4px 10px;border-radius:20px;color:var(--ink2);cursor:pointer;">SHOPEASE20</span>
          <span style="font-size:12px;background:var(--paper2);padding:4px 10px;border-radius:20px;color:var(--ink2);cursor:pointer;">NEWUSER50</span>
        </div>
      </div>
    </div>

    <!-- Order Summary -->
    <div style="position:sticky;top:150px;">
      <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:20px 24px;border-bottom:1px solid var(--paper3);">
          <h3 style="font-family:'Playfair Display',serif;font-size:18px;">Order Summary</h3>
        </div>
        <div style="padding:20px 24px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;">
            <span style="color:var(--ink2);">Subtotal (${cartCount} items)</span><span>${fmt(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;">
            <span style="color:var(--ink2);">Shipping</span>
            <span style="color:${shipping===0?'var(--green)':'var(--ink)'};">${shipping===0?'FREE':fmt(shipping)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;">
            <span style="color:var(--ink2);">GST (18%)</span><span>${fmt(tax)}</span>
          </div>
          ${subtotal < 999 && subtotal > 0 ? `
          <div style="background:#e8f4ff;color:var(--blue);font-size:12px;padding:10px 14px;border-radius:var(--radius);margin-bottom:12px;">
            Add ${fmt(999 - subtotal)} more for <strong>FREE shipping!</strong>
          </div>` : ''}
          <hr class="divider" style="margin:16px 0;">
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-bottom:24px;">
            <span>Total</span><span style="color:var(--gold);">${fmt(total)}</span>
          </div>
          ${subtotal > 0 && discount(subtotal + tax + 99, total) > 0 ? `
          <div style="background:#e8f5ee;color:var(--green);font-size:13px;font-weight:600;padding:10px 14px;border-radius:var(--radius);margin-bottom:16px;text-align:center;">
            🎉 You're saving ${fmt((subtotal > 999 ? 99 : 0) + (cart.reduce((s,x)=>s+(x.originalPrice-x.price)*x.qty,0)))} on this order!
          </div>` : ''}
          <form method="POST" action="/checkout">
            <button class="btn btn-gold" style="width:100%;padding:15px;font-size:15px;" type="submit">🔒 Proceed to Checkout</button>
          </form>
          <div style="text-align:center;margin-top:14px;">
            <div style="font-size:12px;color:var(--ink3);margin-bottom:8px;">Secured by</div>
            <div style="display:flex;justify-content:center;gap:8px;">
              <span class="payment-icon">VISA</span>
              <span class="payment-icon">MC</span>
              <span class="payment-icon">UPI</span>
              <span class="payment-icon">EMI</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Delivery Info -->
      <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:16px 20px;margin-top:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:20px;">📍</span>
          <div>
            <div style="font-size:13px;font-weight:600;">Deliver to</div>
            <div style="font-size:12px;color:var(--ink3);">Mumbai, Maharashtra - 400001</div>
          </div>
          <a href="#" style="margin-left:auto;font-size:12px;color:var(--blue);">Change</a>
        </div>
        <div style="font-size:12px;color:var(--green);font-weight:600;">✓ Estimated delivery: 2-3 business days</div>
      </div>
    </div>
  </div>`;

  const content = `
  <div class="container">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><span style="color:var(--ink)">Cart</span></nav>
    ${req.query.added ? `<div class="alert alert-success">✓ Item added to your cart successfully!</div>` : ''}
    <div class="page-section">${cartContent}</div>
  </div>`;

  res.send(getLayout(content, 'Your Cart — ShopEase', cartCount));
});

// ── ADD TO CART ───────────────────────────────────────────────────────────────
app.post('/add-to-cart', (req, res) => {
  const p = products.find(x => x.id == req.body.id);
  const qty = Math.max(1, parseInt(req.body.qty) || 1);
  if (!p) return res.redirect('/');

  const existing = cart.find(x => x.id == p.id);
  if (existing) existing.qty += qty;
  else cart.push({ ...p, qty });

  res.redirect('/cart?added=1');
});

// ── BUY NOW ───────────────────────────────────────────────────────────────────
app.post('/buy-now', (req, res) => {
  const p = products.find(x => x.id == req.body.id);
  const qty = Math.max(1, parseInt(req.body.qty) || 1);
  if (!p) return res.redirect('/');

  const existing = cart.find(x => x.id == p.id);
  if (existing) existing.qty += qty;
  else cart.push({ ...p, qty });

  res.redirect('/checkout-page');
});

// ── UPDATE QTY ────────────────────────────────────────────────────────────────
app.post('/update-qty', (req, res) => {
  const item = cart.find(x => x.id == req.body.id);
  if (item) item.qty = Math.max(1, parseInt(req.body.qty) || 1);
  res.redirect('/cart');
});

// ── REMOVE ITEM ───────────────────────────────────────────────────────────────
app.post('/remove-item', (req, res) => {
  cart = cart.filter(x => x.id != req.body.id);
  res.redirect('/cart');
});

// ── CLEAR CART ────────────────────────────────────────────────────────────────
app.post('/clear-cart', (req, res) => {
  cart = [];
  res.redirect('/cart');
});

// ── CHECKOUT PAGE ─────────────────────────────────────────────────────────────
app.get('/checkout-page', (req, res) => {
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  if (cart.length === 0) return res.redirect('/');
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const content = `
  <div class="container">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/cart">Cart</a><span>/</span><span style="color:var(--ink)">Checkout</span></nav>
    <div class="page-section" style="display:grid;grid-template-columns:1fr 360px;gap:32px;">
      <div>
        <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:28px;margin-bottom:20px;">
          <h3 style="font-family:'Playfair Display',serif;font-size:18px;margin-bottom:20px;">Delivery Address</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">First Name</label><input type="text" placeholder="Rahul" style="width:100%;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-size:14px;font-family:inherit;"></div>
            <div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Last Name</label><input type="text" placeholder="Sharma" style="width:100%;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-size:14px;font-family:inherit;"></div>
            <div style="grid-column:1/-1;"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Email</label><input type="email" placeholder="rahul@email.com" style="width:100%;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-size:14px;font-family:inherit;"></div>
            <div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Phone</label><input type="tel" placeholder="+91 98765 43210" style="width:100%;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-size:14px;font-family:inherit;"></div>
            <div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">PIN Code</label><input type="text" placeholder="400001" style="width:100%;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-size:14px;font-family:inherit;"></div>
            <div style="grid-column:1/-1;"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Address</label><textarea placeholder="Flat / House No, Street, Area" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid var(--paper3);border-radius:var(--radius);font-size:14px;font-family:inherit;resize:none;"></textarea></div>
          </div>
        </div>
        <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:28px;">
          <h3 style="font-family:'Playfair Display',serif;font-size:18px;margin-bottom:20px;">Payment Method</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${[['💳','Credit / Debit Card','Visa, Mastercard, RuPay'],['📱','UPI','GPay, PhonePe, Paytm'],['🏦','Net Banking','All major banks'],['💵','Cash on Delivery','Pay when you receive']].map(([icon,title,sub],i) => `
            <label style="display:flex;align-items:center;gap:14px;padding:14px 18px;border:1.5px solid ${i===0?'var(--gold)':'var(--paper3)'};border-radius:var(--radius);cursor:pointer;background:${i===0?'#fdf7ee':'white'};">
              <input type="radio" name="payment" ${i===0?'checked':''} style="accent-color:var(--gold);">
              <span style="font-size:20px;">${icon}</span>
              <div>
                <div style="font-size:14px;font-weight:600;">${title}</div>
                <div style="font-size:12px;color:var(--ink3);">${sub}</div>
              </div>
            </label>`).join('')}
          </div>
        </div>
      </div>
      <div style="position:sticky;top:150px;">
        <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:24px;">
          <h3 style="font-family:'Playfair Display',serif;font-size:18px;margin-bottom:16px;">Order Summary</h3>
          ${cart.map(item => `
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--paper3);">
            <span style="font-size:24px;">${item.emoji}</span>
            <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${item.name}</div><div style="font-size:12px;color:var(--ink3);">Qty: ${item.qty}</div></div>
            <div style="font-size:14px;font-weight:700;">${fmt(item.price*item.qty)}</div>
          </div>`).join('')}
          <div style="margin-top:8px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:var(--ink2);">Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:var(--ink2);">Shipping</span><span style="color:${shipping===0?'var(--green)':'var(--ink)'};">${shipping===0?'FREE':fmt(shipping)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:16px;"><span style="color:var(--ink2);">GST</span><span>${fmt(tax)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;padding-top:12px;border-top:1px solid var(--paper3);"><span>Total</span><span style="color:var(--gold);">${fmt(total)}</span></div>
          </div>
          <form method="POST" action="/checkout" style="margin-top:20px;">
            <button class="btn btn-gold" style="width:100%;padding:15px;font-size:15px;">Place Order →</button>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  res.send(getLayout(content, 'Checkout — ShopEase', cartCount));
});

// ── CHECKOUT (place order) ────────────────────────────────────────────────────
app.post('/checkout', (req, res) => {
  const orderId = 'SE' + Date.now().toString().slice(-8);
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  orders.push({ id: orderId, items: [...cart], total, date: new Date().toLocaleDateString('en-IN') });
  logEvent({ type: 'order_placed', service: 'cart-service', orderId, total });
  cart = [];

  const content = `
  <div class="container" style="text-align:center;padding:80px 20px;">
    <div style="font-size:72px;margin-bottom:24px;">✅</div>
    <div class="section-label" style="text-align:center;">Order Confirmed</div>
    <h1 style="font-family:'Playfair Display',serif;font-size:36px;margin-bottom:12px;">Thank you for your order!</h1>
    <p style="font-size:16px;color:var(--ink3);margin-bottom:8px;">Order ID: <strong style="color:var(--ink);">#${orderId}</strong></p>
    <p style="font-size:15px;color:var(--ink3);margin-bottom:32px;">Order Total: <strong style="color:var(--gold);">${fmt(total)}</strong></p>
    <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);max-width:480px;margin:0 auto 32px;padding:24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;">
        <div><div style="font-size:24px;margin-bottom:6px;">📦</div><div style="font-size:12px;font-weight:600;">Confirmed</div></div>
        <div style="opacity:0.35;"><div style="font-size:24px;margin-bottom:6px;">🚚</div><div style="font-size:12px;font-weight:600;">Shipped</div></div>
        <div style="opacity:0.35;"><div style="font-size:24px;margin-bottom:6px;">🏠</div><div style="font-size:12px;font-weight:600;">Delivered</div></div>
      </div>
      <div style="margin-top:16px;font-size:13px;color:var(--ink3);">Estimated delivery: <strong>2-3 business days</strong></div>
    </div>
    <div style="display:flex;gap:12px;justify-content:center;">
      <a href="/" class="btn btn-gold" style="padding:13px 28px;">Continue Shopping</a>
      <a href="/orders" class="btn btn-outline" style="padding:13px 28px;">View Orders</a>
    </div>
  </div>`;
  res.send(getLayout(content, 'Order Confirmed — ShopEase', 0));
});

// ── ORDERS PAGE ───────────────────────────────────────────────────────────────
app.get('/orders', (req, res) => {
  const content = `
  <div class="container page-section">
    <h2 style="font-family:'Playfair Display',serif;font-size:28px;margin-bottom:24px;">My Orders</h2>
    ${orders.length === 0 ? `
    <div style="text-align:center;padding:60px;color:var(--ink3);">
      <div style="font-size:48px;margin-bottom:16px;">📦</div>
      <h3 style="font-family:'Playfair Display',serif;color:var(--ink);margin-bottom:8px;">No orders yet</h3>
      <p>Your order history will appear here.</p>
      <a href="/" class="btn btn-gold" style="margin-top:20px;display:inline-flex;">Start Shopping</a>
    </div>` :
    orders.slice().reverse().map(order => `
    <div style="background:white;border:1px solid var(--paper3);border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-size:12px;color:var(--ink3);">ORDER ID</div>
          <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:600;">#${order.id}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--ink3);">${order.date}</div>
          <div style="font-size:16px;font-weight:700;color:var(--gold);">${fmt(order.total)}</div>
        </div>
        <span style="background:#e8f5ee;color:var(--green);font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">Confirmed</span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${order.items.map(i => `
        <div style="display:flex;align-items:center;gap:8px;background:var(--paper2);padding:8px 12px;border-radius:var(--radius);">
          <span style="font-size:20px;">${i.emoji}</span>
          <span style="font-size:13px;font-weight:500;">${i.name}</span>
          <span style="font-size:12px;color:var(--ink3);">×${i.qty}</span>
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>`;
  res.send(getLayout(content, 'My Orders — ShopEase', cart.reduce((s,x)=>s+x.qty,0)));
});

// ── API ENDPOINTS ─────────────────────────────────────────────────────────────
app.get('/api/cart', (req, res) => res.json(cart));
app.get('/api/cart-count', (req, res) => res.json({ count: cart.reduce((s, x) => s + x.qty, 0) }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'cart-service', port: PORT, cartItems: cart.length }));

app.listen(PORT, () => console.log(`🛒  Cart Service running on http://localhost:${PORT}`));