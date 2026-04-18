const express = require('express');
const client = require('prom-client');
const http = require('http');
const app = express();
const PORT = 3003;
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const cartServiceUrl = process.env.CART_SERVICE_URL || 'http://localhost:3002';
const gatewayServiceUrl = process.env.GATEWAY_SERVICE_URL || 'http://localhost:3000';

app.use(express.json());

// ── PROMETHEUS SETUP ──────────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: 'shopease_http_requests_total',
  help: 'Total HTTP requests across all services',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register],
});

const cartSize = new client.Gauge({
  name: 'shopease_cart_items_total',
  help: 'Number of items currently in all carts',
  registers: [register],
});

const productViews = new client.Counter({
  name: 'shopease_product_views_total',
  help: 'Total product page views',
  labelNames: ['product_id', 'product_name'],
  registers: [register],
});

const orderTotal = new client.Counter({
  name: 'shopease_orders_total',
  help: 'Total number of orders placed',
  registers: [register],
});

const responseTime = new client.Histogram({
  name: 'shopease_response_time_ms',
  help: 'Response time in milliseconds',
  labelNames: ['service', 'route'],
  buckets: [10, 50, 100, 200, 500, 1000],
  registers: [register],
});

const serviceHealth = new client.Gauge({
  name: 'shopease_service_health',
  help: 'Health status of each microservice (1=up, 0=down)',
  labelNames: ['service'],
  registers: [register],
});

// ── POLL SERVICE HEALTH ───────────────────────────────────────────────────────
const services = [
  { name: 'product-service', url: productServiceUrl },
  { name: 'cart-service', url: cartServiceUrl },
  { name: 'gateway', url: gatewayServiceUrl },
];

const checkHealth = () => {
  services.forEach(({ name, url }) => {
    const req = http.get(`${url}/health`, (res) => {
      serviceHealth.set({ service: name }, res.statusCode === 200 ? 1 : 0);
    });
    req.on('error', () => serviceHealth.set({ service: name }, 0));
    req.setTimeout(1000, () => { req.abort(); serviceHealth.set({ service: name }, 0); });
  });
};

// ── POLL CART COUNT ───────────────────────────────────────────────────────────
const syncCartMetrics = () => {
  const req = http.get(`${cartServiceUrl}/api/cart-count`, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try { cartSize.set(JSON.parse(data).count || 0); } catch {}
    });
  });
  req.on('error', () => {});
  req.setTimeout(500, () => req.abort());
};

setInterval(checkHealth, 15000);
setInterval(syncCartMetrics, 5000);
checkHealth();
syncCartMetrics();

// ── EVENT RECEIVER (services post events here) ────────────────────────────────
app.post('/event', (req, res) => {
  const { type, service, method, route, status, productId, productName, responseTimeMs } = req.body;

  if (type === 'request') {
    httpRequests.inc({ method, route, status: String(status), service });
    if (responseTimeMs) responseTime.observe({ service, route }, responseTimeMs);
  }
  if (type === 'product_view' && productId) {
    productViews.inc({ product_id: String(productId), product_name: productName || 'unknown' });
  }
  if (type === 'order_placed') {
    orderTotal.inc();
  }

  res.json({ ok: true });
});

// ── METRICS ENDPOINT ──────────────────────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'metrics-service', port: PORT }));

app.listen(PORT, () => console.log(`📊  Metrics Service running on http://localhost:${PORT}`));
