const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/citaController'); // usando funciones del citaController

// Obtener notificaciones por usuario
router.get('/:usuarioId', async (req, res) => {
  try {
    const notificaciones = await notificacionController.obtenerNotificaciones(req.params.usuarioId);
    res.json({ success: true, notificaciones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Marcar notificaciones como leídas
router.patch('/marcar-leidas/:usuarioId', async (req, res) => {
  try {
    await notificacionController.marcarNotificacionesComoLeidas(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
