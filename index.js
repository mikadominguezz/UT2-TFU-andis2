/* ===================== index.js ===================== */

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { authenticateJWT, authorizeRoles } = require('./auth');
const { heavyComputation } = require('./heavy');
const cache = require('./cache');
const users = require('./users');
const products = require('./products');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'cambiame-por-una-secreta';

if (cluster.isMaster) {
  const cpus = process.env.WEB_CONCURRENCY || os.cpus().length;
  console.log(`Master pid=${process.pid} arrancando ${cpus} workers`);
  for (let i = 0; i < cpus; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} murió (${signal || code}). Forking otro...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(bodyParser.json());

  /* ------------------- Health Check ------------------- */
  app.get('/health', (req, res) => res.json({ ok: true, pid: process.pid }));

  /* ------------------- Login ------------------- */
  app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = users.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!users.verifyPassword(user, password)) return res.status(401).json({ error: 'Credenciales inválidas' });

    const payload = { sub: user.id, username: user.username, roles: user.roles };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

  /* ------------------- Endpoint público ------------------- */
  app.get('/public', (req, res) => res.json({ message: 'Recurso público', pid: process.pid }));

  /* ------------------- Endpoint protegido ------------------- */
  app.get('/protected', authenticateJWT(SECRET), (req, res) => {
    res.json({ message: 'Recurso protegido (autenticado)', user: req.user, pid: process.pid });
  });

  /* ------------------- Endpoint admin-only ------------------- */
  app.get('/admin-only', authenticateJWT(SECRET), authorizeRoles('admin'), (req, res) => {
    res.json({ message: 'Solo admins pueden ver esto', user: req.user, pid: process.pid });
  });

  /* ------------------- Productos ------------------- */
  // GET /products → cualquier usuario loggeado
  app.get('/products', authenticateJWT(SECRET), (req, res) => {
    res.json(products.getAll());
  });

  // POST /products → solo admin
  app.post('/products', authenticateJWT(SECRET), authorizeRoles('admin'), (req, res) => {
    const { name, price } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'Faltan datos' });
    const product = products.create({ name, price });
    res.status(201).json(product);
  });

  // PUT /products/:id → solo admin
  app.put('/products/:id', authenticateJWT(SECRET), authorizeRoles('admin'), (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    const updated = products.update(id, { name, price });
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(updated);
  });

  /* ------------------- Cómputo costoso con cache ------------------- */
  app.get('/compute', async (req, res) => {
    const key = 'heavy-result-v1';
    const cached = cache.get(key);
    if (cached) return res.json({ fromCache: true, value: cached, pid: process.pid });

    try {
      const value = await heavyComputation();
      cache.set(key, value);
      res.json({ fromCache: false, value, pid: process.pid });
    } catch (err) {
      res.status(500).json({ error: 'error en cómputo', details: err.message });
    }
  });

  /* ------------------- Admin: invalidar cache ------------------- */
  app.post('/admin/cache/invalidate', authenticateJWT(SECRET), authorizeRoles('admin'), (req, res) => {
    cache.clear();
    res.json({ ok: true });
  });

  /* ------------------- Iniciar servidor ------------------- */
  app.listen(PORT, () => console.log(`Worker pid=${process.pid} escuchando en ${PORT}`));
}
