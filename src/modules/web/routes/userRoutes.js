const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser
} = require('../controllers/userController');
const { protect, authorize } = require('../../../middlewares/auth');

// Crear usuario (puedes protegerlo si quieres)
router.post('/', createUser);

// Rutas protegidas
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
console.log('📦 userRoutes cargado');
