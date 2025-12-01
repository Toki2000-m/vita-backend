const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const { protect } = require('../../../middlewares/auth');

// 1️⃣ Rutas estáticas (sin parámetros)
router.get('/especialidades', citaController.obtenerEspecialidades);
router.get('/pacientes/buscar', citaController.buscarPacientes);
router.get('/resumen', citaController.obtenerResumenPorMedico);
router.get('/dashboard/resumen', citaController.obtenerResumenDashboard);

// 🆕 RUTAS DE MÉTRICAS (sin /api)
router.get('/metrics/ingresos-mensuales', citaController.obtenerIngresosMensuales);
router.get('/metrics/ingresos-semanales', citaController.obtenerIngresosSemanales);
router.get('/metrics/citas-estado', citaController.obtenerCitasPorEstado);
router.get('/metrics/pacientes-tipo', citaController.obtenerPacientesPorTipo);
router.get('/metrics/horarios-demanda', citaController.obtenerHorariosDemanda);

// 2️⃣ Rutas con múltiples segmentos específicos
router.get('/:citaId/receta', protect, citaController.obtenerRecetaPorCita);
router.patch('/:id/notas', citaController.guardarNotasConsulta);
router.get('/historial/:medicoId', citaController.obtenerHistorialPorMedico);

// 3️⃣ Rutas generales con root
router.get('/', citaController.obtenerCitasPorMedico);
router.post('/', citaController.crearCita);
router.post('/receta', protect, citaController.crearReceta);

// 4️⃣ Rutas genéricas con un solo parámetro AL FINAL
router.patch('/:id', citaController.actualizarEstadoCita);

module.exports = router;