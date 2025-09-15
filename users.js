// users hardcodeados

const bcrypt = require('bcryptjs');

// contraseñas: en producción obvio nunca se guarda en texto plano
const _users = [
  { id: 'u1', username: 'alice', passwordHash: bcrypt.hashSync('alicepass', 10), roles: ['user'] },
  { id: 'u2', username: 'bob', passwordHash: bcrypt.hashSync('bobpass', 10), roles: ['admin', 'user'] },
];

function findByUsername(username) {
  return _users.find(u => u.username === username);
}

function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.passwordHash);
}

module.exports = { findByUsername, verifyPassword };
