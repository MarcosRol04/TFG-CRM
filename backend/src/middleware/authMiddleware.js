// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: usar req.usuario para coincidir con checkRole
    req.usuario = decoded;
    req.user = decoded; // mantenemos los dos por compatibilidad con pollsController
    next();

  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};