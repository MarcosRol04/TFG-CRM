const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

router.use(authMiddleware);

// Cualquier usuario autenticado puede ver
router.get('/', userController.getAll);
router.get('/:id', userController.getOne);

// Solo admin y manager pueden crear, editar y eliminar
router.post('/',     checkRole('admin', 'manager'), userController.create);
router.put('/:id',   checkRole('admin', 'manager'), userController.update);
router.delete('/:id', checkRole('admin', 'manager'), userController.remove);

module.exports = router;