const mongoose = require('mongoose');

// Sub-esquema para medicamentos
const medicamentoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del medicamento es requerido'],
  },
  dosis: {
    type: String,
    required: [true, 'La dosis es requerida'],
  },
  frecuencia: {
    type: String,
    required: [true, 'La frecuencia es requerida'],
  },
  duracion: {
    type: String,
    required: [true, 'La duración es requerida'],
  },
}, { _id: false });

const recetaSchema = new mongoose.Schema(
  {
    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      required: [true, 'La referencia a la cita es requerida'],
      description: 'ID de la cita asociada',
    },
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario', // ✅ CAMBIAR DE 'User' A 'Usuario'
      required: [true, 'El ID del médico es requerido'],
      description: 'ID del médico que emite la receta',
    },
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario', // ✅ CAMBIAR DE 'User' A 'Usuario'
      required: [true, 'El ID del paciente es requerido'],
      description: 'ID del paciente que recibe la receta',
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      default: Date.now,
      description: 'Fecha en que se generó la receta',
    },
    medicamentos: {
      type: [medicamentoSchema],
      required: [true, 'Al menos un medicamento es requerido'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'Debe incluir al menos un medicamento',
      },
      description: 'Lista de medicamentos prescritos',
    },
    observaciones: {
      type: String,
      default: null,
      description: 'Notas adicionales del médico',
    },
    pdfUrl: {
      type: String,
      default: null,
      description: 'Ruta o URL del archivo PDF generado',
    },
    qrCode: {
      type: String,
      default: null,
      description: 'Texto base64 o URL del código QR para verificación',
    },
  },
  {
    timestamps: true,
    collection: 'Recetas',
  }
);

module.exports = mongoose.model('Receta', recetaSchema);