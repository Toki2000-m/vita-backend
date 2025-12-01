const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del usuario es requerido'],
      description: 'Usuario destinatario de la notificación',
    },
    tipo: {
      type: String,
      enum: ['recordatorio', 'pago', 'cita_cancelada', 'cita_confirmada', 'receta_generada'],
      required: [true, 'El tipo de notificación es requerido'],
      description: 'Tipo de evento que disparó la notificación',
    },
    mensaje: {
      type: String,
      required: [true, 'El mensaje es requerido'],
      description: 'Contenido del mensaje enviado',
    },
    enviado: {
      type: Boolean,
      required: true,
      default: false,
      description: 'Indica si la notificación ya fue enviada',
    },
    canal: {
      type: String,
      enum: ['email', 'whatsapp', 'web'],
      required: [true, 'El canal es requerido'],
      description: 'Canal utilizado para enviar la notificación',
    },
    fechaEnvio: {
      type: Date,
      required: [true, 'La fecha de envío es requerida'],
      default: Date.now,
      description: 'Fecha en que se generó/enviará la notificación',
    },
    leida: {
      type: Boolean,
      default: false,
      description: 'Indica si la notificación ya fue leída',
    },
  },
  {
    timestamps: true,
    collection: 'Notificaciones',
  }
);

module.exports = mongoose.model('Notificacion', notificacionSchema);
