const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Dummy products
const products = [
  { id: 1, name: "Laptop", price: 50000 },
  { id: 2, name: "Phone", price: 20000 },
  { id: 3, name: "Headphones", price: 2000 }
];

let cart = [];

// Common CSS
const style = `
<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    background: #f5f6fa;
  }

  header {
    background: #2f3640;
    color: white;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  header h1 {
    margin: 0;
  }

  header a {
    color: white;
    text-decoration: none;
    font-weight: bold;
  }

  .container {
    padding: 20px;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .card {
    background: white;
    padding: 15px;
    border-radius: 10px;
    width: 250px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transition: 0.3s;
  }

  .card:hover {
    transform: translateY(-5px);
  }

  .card h3 {
    margin-top: 0;
  }

  .price {
    color: #27ae60;
    font-weight: bold;
  }

  .btn {
    display: inline-block;
    padding: 10px 15px;
    background: #0984e3;
    color: white;
    border: none;
    border-radius: 5px;
    text-decoration: none;
    cursor: pointer;
    margin-top: 10px;
  }

  .btn:hover {
    background: #74b9ff;
  }

  .cart-item {
    background: white;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 8px;
  }

  .total {
    font-size: 20px;
    font-weight: bold;
    margin-top: 20px;
  }
</style>
`;

// Header
const header = `
<header>
  <h1>🛒 My Store</h1>
  <a href="/cart">Cart (${cart.length})</a>
</header>
`;

// Home Page
app.get('/', (req, res) => {
  let productList = products.map(p => `
    <div class="card">
      <h3>${p.name}</h3>
      <p class="price">₹${p.price}</p>
      <a class="btn" href="/product/${p.id}">View Product</a>
    </div>
  `).join('');

  res.send(`
    ${style}
    ${header}
    <div class="container">
      <div class="grid">
        ${productList}
      </div>
    </div>
  `);
});

// Product Page
app.get('/product/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);

  res.send(`
    ${style}
    ${header}
    <div class="container">
      <div class="card">
        <h2>${product.name}</h2>
        <p class="price">₹${product.price}</p>

        <form method="POST" action="/add-to-cart">
          <input type="hidden" name="id" value="${product.id}">
          <button class="btn" type="submit">Add to Cart</button>
        </form>

        <br/><br/>
        <a href="/">⬅ Back</a>
      </div>
    </div>
  `);
});

// Add to Cart
app.post('/add-to-cart', (req, res) => {
  const product = products.find(p => p.id == req.body.id);
  cart.push(product);
  res.redirect('/cart');
});

// Cart Page
app.get('/cart', (req, res) => {
  let cartItems = cart.map(item => `
    <div class="cart-item">
      <h3>${item.name}</h3>
      <p class="price">₹${item.price}</p>
    </div>
  `).join('');

  let total = cart.reduce((sum, item) => sum + item.price, 0);

  res.send(`
    ${style}
    ${header}
    <div class="container">
      <h2>Your Cart</h2>

      ${cartItems || "<p>Cart is empty</p>"}

      <div class="total">Total: ₹${total}</div>

      <br/>
      <a class="btn" href="/">Continue Shopping!</a>
    </div>
  `);
});

// Start server
app.listen(3000, () => {
  console.log("E-commerce app running on http://localhost:3000");
});