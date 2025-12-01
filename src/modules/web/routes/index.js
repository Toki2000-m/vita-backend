const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const citaRoutes = require('./citaRoutes');


// Obtener perfil
router.get('/perfil/:userId', perfilController.obtenerPerfil);

// Actualizar perfil
router.put('/perfil/:userId', perfilController.actualizarPerfil);

// Actualizar foto
router.patch('/perfil/:userId/foto', perfilController.actualizarFoto);

// Rutas de autenticación
router.use('/auth', authRoutes);

router.use('/notificaciones', require('./notificacionRoutes'));


// Rutas de citas
router.use('/appointments', citaRoutes);

// Rutas de usuarios
router.use('/users', userRoutes);

// Ruta de prueba
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Web funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
