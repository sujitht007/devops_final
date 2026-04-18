const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const http = require('http');

const app = express();
const PORT = 3000;
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const cartServiceUrl = process.env.CART_SERVICE_URL || 'http://localhost:3002';
const metricsServiceUrl = process.env.METRICS_SERVICE_URL || 'http://localhost:3003';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logEvent = (data) => {
  try {
    const body = JSON.stringify(data);
    const metricsEventUrl = new URL(`${metricsServiceUrl}/event`);
    const req = http.request({
      hostname: metricsEventUrl.hostname,
      port: metricsEventUrl.port,
      path: metricsEventUrl.pathname,
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

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logEvent({
      type: 'request',
      service: 'gateway',
      method: req.method,
      route: req.path,
      status: res.statusCode,
      responseTimeMs: Date.now() - start
    });
  });
  next();
});

const cartRoutes = ['/cart', '/add-to-cart', '/remove-item', '/update-qty', '/buy-now', '/clear-cart', '/checkout', '/checkout-page', '/orders', '/api/cart'];
const metricsRoutes = ['/metrics', '/event'];

const proxyOpts = (target) => ({
  target,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
    error: (err, req, res) => {
      console.error(`[Gateway] Proxy error -> ${target}: ${err.message}`);
      res.status(502).send('<!DOCTYPE html><html><head><title>Service Unavailable</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#faf9f7}div{text-align:center}.emoji{font-size:64px;margin-bottom:20px}.title{font-size:24px;font-weight:700;margin-bottom:8px}.sub{color:#7a7570;margin-bottom:24px}a{background:#c8963e;color:#0f0e0d;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:600;}</style></head><body><div><div class="emoji">Service Down</div><div class="title">Service Temporarily Unavailable</div><div class="sub">We\'re working on it. Please try again shortly.</div><a href="/">Go Home</a></div></body></html>');
    }
  }
});

const metricsProxy = createProxyMiddleware(proxyOpts(metricsServiceUrl));
const cartProxy = createProxyMiddleware(proxyOpts(cartServiceUrl));
const productProxy = createProxyMiddleware(proxyOpts(productServiceUrl));

app.use((req, res, next) => {
  if (metricsRoutes.some((route) => req.path === route)) {
    return metricsProxy(req, res, next);
  }
  if (cartRoutes.some((route) => req.path.startsWith(route))) {
    return cartProxy(req, res, next);
  }
  return productProxy(req, res, next);
});

app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'gateway',
  port: PORT,
  routes: {
    '/': '-> product-service:3001',
    '/product/:id': '-> product-service:3001',
    '/cart': '-> cart-service:3002',
    '/checkout': '-> cart-service:3002',
    '/metrics': '-> metrics-service:3003'
  }
}));

app.listen(PORT, () => {
  console.log(`\nAPI Gateway running on http://localhost:${PORT}`);
  console.log('   Routes:');
  console.log('   /                -> product-service:3001');
  console.log('   /product/:id     -> product-service:3001');
  console.log('   /cart            -> cart-service:3002');
  console.log('   /checkout        -> cart-service:3002');
  console.log('   /metrics         -> metrics-service:3003\n');
});
