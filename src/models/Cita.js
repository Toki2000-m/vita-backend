const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'ID del paciente es requerido'],
    },
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'ID del médico es requerido'],
    },
    especialidadId: {  // Para el móvil - MANTENER REQUERIDO
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Especialidad',
      required: [true, 'La especialidad es requerida'],
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha de la cita es requerida'],
    },
    hora: {
      type: String,
      required: [true, 'La hora es requerida'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'],
    },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmada', 'completada', 'cancelada','reprogramada'],
      default: 'pendiente',
      required: true,
    },
    motivo: {
      type: String,
      required: [true, 'El motivo de la consulta es requerido'],
    },
    modoPago: {
      type: String,
      enum: ['online', 'efectivo'],
      required: [true, 'El modo de pago es requerido'],
    },
    pagado: {
      type: Boolean,
      default: false,
      required: true,
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
    },
    recetaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receta',
      default: null,
    },
    calificacion: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comentarios: {
      type: String,
      default: null,
    },
    creadoEn: {
      type: Date,
      default: Date.now,
      required: true,
    },
    actualizadoEn: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'Citas',
  }
);

citaSchema.pre('save', function (next) {
  this.actualizadoEn = new Date();
  next();
});

citaSchema.pre('findOneAndUpdate', function (next) {
  this.set({ actualizadoEn: new Date() });
  this.setOptions({ runValidators: true });
  next();
});

module.exports = mongoose.model('Cita', citaSchema);