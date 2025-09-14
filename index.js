const cluster = require('cluster');
const os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { authenticateJWT, authorizeRoles } = require('./auth');
const { heavyComputation } = require('./heavy');
const cache = require('./cache');
const users = require('./users');

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

  // Health check
  app.get('/health', (req, res) => res.json({ ok: true, pid: process.pid }));

  // Login: devuelve JWT
  app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = users.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!users.verifyPassword(user, password)) return res.status(401).json({ error: 'Credenciales inválidas' });

    const payload = { sub: user.id, username: user.username, roles: user.roles };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

  // Endpoint público
  app.get('/public', (req, res) => res.json({ message: 'Recurso público', pid: process.pid }));

  // Endpoint protegido: autenticación requerida
  app.get('/protected', authenticateJWT(SECRET), (req, res) => {
    res.json({ message: 'Recurso protegido (autenticado)', user: req.user, pid: process.pid });
  });

  // Endpoint con autorización por roles
  app.get('/admin-only', authenticateJWT(SECRET), authorizeRoles('admin'), (req, res) => {
    res.json({ message: 'Solo admins pueden ver esto', user: req.user, pid: process.pid });
  });

  // Endpoint que hace cómputo costoso: usar cache + workers (replicas ayudan rendimiento)
  app.get('/compute', async (req, res) => {
    const key = 'heavy-result-v1';
    const cached = cache.get(key);
    if (cached) return res.json({ fromCache: true, value: cached, pid: process.pid });

    // si no está en cache, calcular y almacenar
    try {
      const value = await heavyComputation();
      cache.set(key, value);
      res.json({ fromCache: false, value, pid: process.pid });
    } catch (err) {
      res.status(500).json({ error: 'error en cómputo', details: err.message });
    }
  });

  // Endpoint admin para invalidar cache (ej: después de actualización)
  app.post('/admin/cache/invalidate', authenticateJWT(SECRET), authorizeRoles('admin'), (req, res) => {
    cache.clear();
    res.json({ ok: true });
  });

  app.listen(PORT, () => console.log(`Worker pid=${process.pid} escuchando en ${PORT}`));
}