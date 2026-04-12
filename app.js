const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: true
}));

// ================= IN-MEMORY DATA =================
const users = [
  { id: 1, username: 'admin', password: 'admin123' },
  { id: 2, username: 'user', password: 'user123' }
];

const products = [
  { id: 1, name: 'Laptop Pro', price: 75000, category: 'Electronics', image: '💻', description: 'High performance laptop with 16GB RAM and 512GB SSD.' },
  { id: 2, name: 'Smartphone X', price: 35000, category: 'Electronics', image: '📱', description: 'Latest smartphone with 5G and 108MP camera.' },
  { id: 3, name: 'Wireless Headphones', price: 4999, category: 'Accessories', image: '🎧', description: 'Noise cancelling wireless headphones with 30hr battery.' },
  { id: 4, name: 'Mechanical Keyboard', price: 6500, category: 'Accessories', image: '⌨️', description: 'RGB mechanical keyboard with tactile switches.' },
  { id: 5, name: 'Smart Watch', price: 12999, category: 'Wearables', image: '⌚', description: 'Fitness tracking smartwatch with heart rate monitor.' },
  { id: 6, name: 'Webcam HD', price: 3500, category: 'Accessories', image: '📷', description: 'Full HD 1080p webcam for video conferencing.' }
];

// ================= COMMON CSS =================
const css = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; color: #333; }

  nav {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: white;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }
  nav .logo { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
  nav .logo span { color: #e94560; }
  nav .nav-links a {
    color: white;
    text-decoration: none;
    margin-left: 20px;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 20px;
    transition: 0.3s;
  }
  nav .nav-links a:hover { background: rgba(255,255,255,0.15); }
  nav .nav-links .cart-btn { background: #e94560; }
  nav .nav-links .cart-btn:hover { background: #c73652; }

  .hero {
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    color: white;
    text-align: center;
    padding: 60px 20px;
  }
  .hero h1 { font-size: 42px; margin-bottom: 10px; }
  .hero h1 span { color: #e94560; }
  .hero p { font-size: 16px; color: #aaa; margin-bottom: 25px; }
  .hero .search-bar { display: flex; max-width: 500px; margin: 0 auto; }
  .hero .search-bar input {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 25px 0 0 25px;
    font-size: 15px;
    outline: none;
  }
  .hero .search-bar button {
    padding: 12px 24px;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 0 25px 25px 0;
    cursor: pointer;
    font-size: 15px;
  }

  .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }

  .filter-bar { display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; }
  .filter-bar a {
    padding: 8px 20px;
    border-radius: 20px;
    text-decoration: none;
    font-size: 14px;
    background: white;
    color: #555;
    border: 1px solid #ddd;
    transition: 0.3s;
  }
  .filter-bar a:hover, .filter-bar a.active { background: #e94560; color: white; border-color: #e94560; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 25px; }
  .card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    transition: 0.3s;
  }
  .card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .card .img-box { background: linear-gradient(135deg, #f8f9fa, #e9ecef); text-align: center; padding: 30px; font-size: 60px; }
  .card .info { padding: 18px; }
  .card .info .category { font-size: 11px; text-transform: uppercase; color: #e94560; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px; }
  .card .info h3 { font-size: 17px; margin-bottom: 8px; }
  .card .info .desc { font-size: 13px; color: #777; margin-bottom: 12px; line-height: 1.5; }
  .card .info .price { font-size: 22px; font-weight: bold; color: #1a1a2e; margin-bottom: 15px; }
  .card .info .price span { font-size: 13px; color: #27ae60; margin-left: 5px; }
  .card .info .btn {
    display: block;
    text-align: center;
    padding: 10px;
    background: #1a1a2e;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 14px;
    transition: 0.3s;
  }
  .card .info .btn:hover { background: #e94560; }

  .detail-box {
    background: white;
    border-radius: 15px;
    padding: 40px;
    max-width: 700px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .detail-box .big-img { font-size: 100px; text-align: center; margin-bottom: 20px; }
  .detail-box h2 { font-size: 28px; margin-bottom: 10px; }
  .detail-box .cat-tag {
    display: inline-block;
    background: #fff0f3;
    color: #e94560;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 15px;
  }
  .detail-box .desc { font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 20px; }
  .detail-box .price { font-size: 32px; font-weight: bold; color: #1a1a2e; margin-bottom: 25px; }
  .detail-box form button {
    padding: 14px 40px;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    cursor: pointer;
    transition: 0.3s;
  }
  .detail-box form button:hover { background: #c73652; }
  .back-link { display: inline-block; margin-top: 20px; color: #555; text-decoration: none; font-size: 14px; }
  .back-link:hover { color: #e94560; }

  .cart-box { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
  .cart-box h2 { margin-bottom: 20px; font-size: 24px; }
  .cart-item { display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
  .cart-item .item-img { font-size: 36px; }
  .cart-item .item-info { flex: 1; }
  .cart-item .item-info h4 { font-size: 16px; margin-bottom: 4px; }
  .cart-item .item-info p { font-size: 13px; color: #888; }
  .cart-item .item-price { font-size: 18px; font-weight: bold; color: #e94560; }
  .cart-summary { margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: right; }
  .cart-summary .total { font-size: 24px; font-weight: bold; margin-bottom: 15px; }
  .cart-summary .checkout-btn {
    display: inline-block;
    padding: 14px 40px;
    background: #27ae60;
    color: white;
    border-radius: 10px;
    text-decoration: none;
    font-size: 16px;
    transition: 0.3s;
  }
  .cart-summary .checkout-btn:hover { background: #219a52; }
  .empty-cart { text-align: center; padding: 60px; color: #aaa; }
  .empty-cart .icon { font-size: 60px; margin-bottom: 15px; }

  .auth-wrapper { min-height: 80vh; display: flex; align-items: center; justify-content: center; }
  .auth-box {
    background: white;
    border-radius: 15px;
    padding: 40px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .auth-box h2 { font-size: 26px; margin-bottom: 5px; }
  .auth-box p { color: #888; font-size: 14px; margin-bottom: 25px; }
  .form-group { margin-bottom: 18px; }
  .form-group label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #555; }
  .form-group input {
    width: 100%;
    padding: 12px 15px;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    transition: 0.3s;
  }
  .form-group input:focus { border-color: #e94560; }
  .auth-btn {
    width: 100%;
    padding: 13px;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: 0.3s;
    margin-top: 5px;
  }
  .auth-btn:hover { background: #c73652; }
  .auth-link { text-align: center; margin-top: 18px; font-size: 14px; color: #888; }
  .auth-link a { color: #e94560; text-decoration: none; font-weight: bold; }
  .error-msg {
    background: #fff0f3;
    color: #e94560;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 15px;
    border-left: 3px solid #e94560;
  }

  .success-box { text-align: center; padding: 60px 30px; }
  .success-box .icon { font-size: 70px; margin-bottom: 20px; }
  .success-box h2 { font-size: 28px; margin-bottom: 10px; color: #27ae60; }
  .success-box p { color: #777; margin-bottom: 25px; }
  .success-box a {
    display: inline-block;
    padding: 12px 30px;
    background: #1a1a2e;
    color: white;
    border-radius: 8px;
    text-decoration: none;
    transition: 0.3s;
  }
  .success-box a:hover { background: #e94560; }

  footer {
    background: #1a1a2e;
    color: #aaa;
    text-align: center;
    padding: 20px;
    margin-top: 50px;
    font-size: 14px;
  }
  footer span { color: #e94560; }
</style>
`;

// ================= HELPERS =================
const nav = (cartCount = 0, user = null) => `
<nav>
  <div class="logo">SHOP<span>ZONE</span></div>
  <div class="nav-links">
    <a href="/">Home</a>
    ${user ? `<a href="/cart" class="cart-btn">Cart (${cartCount})</a>` : ''}
    ${user ? `<a href="/logout">Logout (${user.username})</a>` : `<a href="/login">Login</a>`}
  </div>
</nav>`;

const footer = () => `
<footer>
  <p>Built with <span>♥</span> | ShopZone E-Commerce &copy; 2025 | Final Year Project</p>
</footer>`;

// ================= ROUTES =================

// LOGIN
app.get('/login', (req, res) => {
  const error = req.session.error || '';
  req.session.error = null;
  res.send(`${css}
    ${nav()}
    <div class="container">
      <div class="auth-wrapper">
        <div class="auth-box">
          <h2>Welcome Back</h2>
          <p>Login to continue shopping</p>
          ${error ? `<div class="error-msg">${error}</div>` : ''}
          <form method="POST" action="/login">
            <div class="form-group">
              <label>Username</label>
              <input name="username" placeholder="Enter username" required />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input name="password" type="password" placeholder="Enter password" required />
            </div>
            <button class="auth-btn" type="submit">Login</button>
          </form>
          <div class="auth-link">Don't have an account? <a href="/register">Register</a></div>
          <div class="auth-link" style="margin-top:10px; font-size:12px; color:#bbb;">Demo: admin / admin123</div>
        </div>
      </div>
    </div>
    ${footer()}`);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user;
    req.session.cart = [];
    res.redirect('/');
  } else {
    req.session.error = 'Invalid username or password. Please try again.';
    res.redirect('/login');
  }
});

// REGISTER
app.get('/register', (req, res) => {
  const error = req.session.error || '';
  req.session.error = null;
  res.send(`${css}
    ${nav()}
    <div class="container">
      <div class="auth-wrapper">
        <div class="auth-box">
          <h2>Create Account</h2>
          <p>Join ShopZone today</p>
          ${error ? `<div class="error-msg">${error}</div>` : ''}
          <form method="POST" action="/register">
            <div class="form-group">
              <label>Username</label>
              <input name="username" placeholder="Choose a username" required />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input name="password" type="password" placeholder="Choose a password" required />
            </div>
            <button class="auth-btn" type="submit">Register</button>
          </form>
          <div class="auth-link">Already have an account? <a href="/login">Login</a></div>
        </div>
      </div>
    </div>
    ${footer()}`);
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const exists = users.find(u => u.username === username);
  if (exists) {
    req.session.error = 'Username already taken. Please choose another.';
    return res.redirect('/register');
  }
  const newUser = { id: users.length + 1, username, password };
  users.push(newUser);
  req.session.user = newUser;
  req.session.cart = [];
  res.redirect('/');
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// HOME
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const cart = req.session.cart || [];
  const category = req.query.category || 'All';
  const search = req.query.search || '';

  let filtered = products;
  if (category !== 'All') filtered = filtered.filter(p => p.category === category);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filterLinks = categories.map(c => `
    <a href="/?category=${c}" class="${category === c ? 'active' : ''}">${c}</a>
  `).join('');

  const productCards = filtered.map(p => `
    <div class="card">
      <div class="img-box">${p.image}</div>
      <div class="info">
        <div class="category">${p.category}</div>
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
        <div class="price">Rs.${p.price.toLocaleString()} <span>In Stock</span></div>
        <a class="btn" href="/product/${p.id}">View Product</a>
      </div>
    </div>
  `).join('');

  res.send(`${css}
    ${nav(cart.length, req.session.user)}
    <div class="hero">
      <h1>Welcome to <span>ShopZone</span></h1>
      <p>Discover the best products at unbeatable prices</p>
      <form class="search-bar" method="GET" action="/">
        <input name="search" placeholder="Search products..." value="${search}" />
        <button type="submit">Search</button>
      </form>
    </div>
    <div class="container">
      <div class="filter-bar">${filterLinks}</div>
      <div class="grid">
        ${productCards.length ? productCards : '<p style="color:#888; padding:20px;">No products found.</p>'}
      </div>
    </div>
    ${footer()}`);
});

// PRODUCT DETAIL
app.get('/product/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const cart = req.session.cart || [];
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.redirect('/');

  res.send(`${css}
    ${nav(cart.length, req.session.user)}
    <div class="container" style="margin-top:40px;">
      <div class="detail-box">
        <div class="big-img">${product.image}</div>
        <span class="cat-tag">${product.category}</span>
        <h2>${product.name}</h2>
        <p class="desc">${product.description}</p>
        <div class="price">Rs.${product.price.toLocaleString()}</div>
        <form method="POST" action="/add-to-cart">
          <input type="hidden" name="id" value="${product.id}" />
          <button type="submit">Add to Cart</button>
        </form>
        <a class="back-link" href="/">Back to Products</a>
      </div>
    </div>
    ${footer()}`);
});

// ADD TO CART
app.post('/add-to-cart', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const product = products.find(p => p.id == req.body.id);
  if (product) {
    req.session.cart = req.session.cart || [];
    req.session.cart.push(product);
  }
  res.redirect('/cart');
});

// CART
app.get('/cart', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const cartItems = cart.map(item => `
    <div class="cart-item">
      <div class="item-img">${item.image}</div>
      <div class="item-info">
        <h4>${item.name}</h4>
        <p>${item.category}</p>
      </div>
      <div class="item-price">Rs.${item.price.toLocaleString()}</div>
    </div>
  `).join('');

  res.send(`${css}
    ${nav(cart.length, req.session.user)}
    <div class="container" style="margin-top:40px;">
      <div class="cart-box">
        <h2>Your Shopping Cart</h2>
        ${cart.length ? `
          ${cartItems}
          <div class="cart-summary">
            <div class="total">Total: Rs.${total.toLocaleString()}</div>
            <a class="checkout-btn" href="/checkout">Proceed to Checkout</a>
          </div>
        ` : `
          <div class="empty-cart">
            <div class="icon">🛒</div>
            <p>Your cart is empty</p>
            <a href="/" style="color:#e94560; text-decoration:none; font-weight:bold;">Continue Shopping</a>
          </div>
        `}
      </div>
    </div>
    ${footer()}`);
});

// CHECKOUT
app.get('/checkout', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  req.session.cart = [];
  res.send(`${css}
    ${nav(0, req.session.user)}
    <div class="container">
      <div class="auth-wrapper">
        <div class="success-box">
          <div class="icon">✅</div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for shopping with ShopZone. Your order is confirmed!</p>
          <a href="/">Continue Shopping</a>
        </div>
      </div>
    </div>
    ${footer()}`);
});

// ================= SERVER =================
app.listen(3000, () => {
  console.log('ShopZone running on http://localhost:3000');
});