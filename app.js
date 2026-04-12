const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true
}));

// ================= DB CONNECTION =================
mongoose.connect('mongodb://127.0.0.1:27017/ecommerceDB')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ================= MODELS =================
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// ================= INIT PRODUCTS =================
async function seedProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      { name: "Laptop", price: 50000 },
      { name: "Phone", price: 20000 },
      { name: "Headphones", price: 2000 }
    ]);
    console.log("Products Added");
  }
}
seedProducts();

// ================= AUTH =================

// Register
app.get('/register', (req, res) => {
  res.send(`
    <h2>Register</h2>
    <form method="POST">
      <input name="username" placeholder="Username" required/>
      <input name="password" type="password" placeholder="Password" required/>
      <button>Register</button>
    </form>
  `);
});

app.post('/register', async (req, res) => {
  await User.create(req.body);
  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
  res.send(`
    <h2>Login</h2>
    <form method="POST">
      <input name="username" required/>
      <input name="password" type="password" required/>
      <button>Login</button>
    </form>
  `);
});

app.post('/login', async (req, res) => {
  const user = await User.findOne(req.body);
  if (user) {
    req.session.user = user;
    req.session.cart = [];
    res.redirect('/');
  } else {
    res.send("Invalid Login");
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ================= HOME =================
app.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const products = await Product.find();

  let list = products.map(p => `
    <div>
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>
      <a href="/product/${p._id}">View</a>
    </div>
  `).join('');

  res.send(`
    <h1>Welcome ${req.session.user.username}</h1>
    <a href="/cart">Cart (${req.session.cart.length})</a> |
    <a href="/logout">Logout</a>
    <hr/>
    ${list}
  `);
});

// ================= PRODUCT =================
app.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);

  res.send(`
    <h2>${product.name}</h2>
    <p>₹${product.price}</p>

    <form method="POST" action="/add-to-cart">
      <input type="hidden" name="id" value="${product._id}">
      <button>Add to Cart</button>
    </form>

    <a href="/">Back</a>
  `);
});

// ================= ADD TO CART =================
app.post('/add-to-cart', async (req, res) => {
  const product = await Product.findById(req.body.id);
  req.session.cart.push(product);
  res.redirect('/cart');
});

// ================= CART =================
app.get('/cart', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const cart = req.session.cart || [];

  let items = cart.map(item => `
    <div>
      <h3>${item.name}</h3>
      <p>₹${item.price}</p>
    </div>
  `).join('');

  let total = cart.reduce((sum, item) => sum + item.price, 0);

  res.send(`
    <h2>Your Cart</h2>
    ${items || "Cart Empty"}
    <h3>Total: ₹${total}</h3>
    <a href="/">Continue Shopping</a>
  `);
});

// ================= SERVER =================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});