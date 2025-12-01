const Notificacion = require('../../../models/Notificacion');

// Obtener notificaciones de un usuario
exports.obtenerNotificaciones = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (!usuarioId) return res.status(400).json({ success: false, message: 'Falta usuarioId' });

    const notis = await Notificacion.find({ usuarioId })
      .sort({ createdAt: -1 });

    return res.json({ success: true, notificaciones: notis });
  } catch (err) {
    console.error('Error al obtener notificaciones:', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// Crear notificación
exports.crearNotificacion = async ({ usuarioId, tipo, mensaje, canal }) => {
  try {
    const noti = new Notificacion({
      usuarioId,
      tipo,
      mensaje,
      canal,
      enviado: false
    });
    await noti.save();
    return noti;
  } catch (error) {
    console.error("Error creando notificación:", error);
    throw error;
  }
};

// Marcar notificaciones como leídas
exports.marcarNotificacionesLeidas = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (!usuarioId) return res.status(400).json({ success: false, message: 'Falta usuarioId' });

    await Notificacion.updateMany(
      { usuarioId, leida: false },
      { $set: { leida: true } }
    );

    return res.json({ success: true, message: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    console.error('Error marcando notificaciones como leídas:', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};
