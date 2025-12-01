const Cita = require('../../../models/Cita');
const Notificacion = require('../../../models/Notificacion');
const Usuario = require('../../../models/Usuario'); // <-- NUEVO: colección de usuarios
const mongoose = require('mongoose');
const Receta = require('../../../models/Receta'); // ✅ AGREGAR ESTA LÍNEA

// ... otros requires

/* ===============================================================
   OBTENER CITAS POR MÉDICO
================================================================ */
/* =============================================================== 
   OBTENER CITAS POR MÉDICO
================================================================ */
exports.obtenerCitasPorMedico = async (req, res) => {
  try {
    const medicoId = req.query.medicoId;
    if (!medicoId) return res.status(400).json({ message: 'MedicoId es requerido' });

    const citas = await Cita.find({ medicoId })
      .populate('pacienteId', 'nombre apellido email telefono') // ✅ Datos del paciente
      .populate('especialidadId', 'nombre descripcion codigo') // ✅ AGREGAR ESTO - Datos de especialidad
      .select('_id pacienteId especialidadId fecha hora estado motivo monto recetaId')
      .sort({ fecha: 1, hora: 1 }); // Ordenar por fecha y hora

    res.json({ success: true, citas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener citas' });
  }
};
/* ===============================================================
   ACTUALIZAR ESTADO DE UNA CITA
================================================================ */
exports.actualizarEstadoCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nuevaFecha, nuevoHora, motivoCancelacion } = req.body;

    console.log('📝 Datos recibidos:', { id, estado, nuevaFecha, nuevoHora, motivoCancelacion });

    if (!id) return res.status(400).json({ success: false, message: 'Falta el ID de la cita' });

    if (!['completada', 'cancelada', 'reprogramada'].includes(estado))
      return res.status(400).json({ success: false, message: 'Estado inválido' });

    const cita = await Cita.findById(id).populate('pacienteId medicoId');
    if (!cita) return res.status(404).json({ success: false, message: 'Cita no encontrada' });

    if (!cita.pacienteId || !cita.medicoId)
      return res.status(400).json({ success: false, message: 'Paciente o médico no encontrado' });

    // Reprogramación - CORREGIDO ✅
    if (estado === 'reprogramada' && nuevaFecha && nuevoHora) {
      // ✅ Guardar solo la fecha sin hora
      const fechaISO = `${nuevaFecha}T00:00:00.000Z`;
      cita.fecha = new Date(fechaISO);
      cita.hora = nuevoHora; // La hora por separado

      console.log('✅ Reprogramada - Nueva fecha:', cita.fecha);
      console.log('✅ Reprogramada - Nueva hora:', cita.hora);
    }

    // Cancelación
    if (estado === 'cancelada' && motivoCancelacion) {
      cita.motivoCancelacion = motivoCancelacion;
    }

    cita.estado = estado;
    await cita.save({ validateModifiedOnly: true });

    console.log('✅ Cita guardada exitosamente');

    const nombreCompleto = `${cita.pacienteId.nombre} ${cita.pacienteId.apellido}`;

    const mensajePaciente =
      estado === 'cancelada'
        ? `Tu cita del ${cita.fecha.toLocaleDateString('es-MX')} a las ${cita.hora} fue cancelada. Motivo: ${cita.motivoCancelacion || 'No especificado'}`
        : estado === 'reprogramada'
          ? `Tu cita fue reprogramada para el ${cita.fecha.toLocaleDateString('es-MX')} a las ${cita.hora}`
          : `Tu cita del ${cita.fecha.toLocaleDateString('es-MX')} a las ${cita.hora} fue completada`;

    const mensajeMedico =
      estado === 'cancelada'
        ? `El paciente ${nombreCompleto} canceló la cita del ${cita.fecha.toLocaleDateString('es-MX')} a las ${cita.hora}. Motivo: ${cita.motivoCancelacion || 'No especificado'}`
        : estado === 'reprogramada'
          ? `El paciente ${nombreCompleto} reprogramó la cita para el ${cita.fecha.toLocaleDateString('es-MX')} a las ${cita.hora}`
          : `El paciente ${nombreCompleto} completó su cita del ${cita.fecha.toLocaleDateString('es-MX')} a las ${cita.hora}`;

    try {
      await exports.crearNotificacion({
        usuarioId: cita.pacienteId._id,
        tipo: `cita_${estado}`,
        mensaje: mensajePaciente,
        canal: 'email',
        leida: false
      });
    } catch (err) {
      console.error("Error creando notificación paciente:", err);
    }

    try {
      await exports.crearNotificacion({
        usuarioId: cita.medicoId._id,
        tipo: `cita_${estado}`,
        mensaje: mensajeMedico,
        canal: 'email',
        leida: false
      });
    } catch (err) {
      console.error("Error creando notificación médico:", err);
    }

    return res.json({ success: true, cita });
  } catch (error) {
    console.error("❌ Error al actualizar cita:", error);
    return res.status(500).json({ success: false, message: 'Error al actualizar cita', error: error.message });
  }
};

/* ===============================================================
   CREAR CITA
================================================================ */
/* ===============================================================
   CREAR CITA - CORREGIDO ✅
================================================================ */
exports.crearCita = async (req, res) => {
  try {
    const {
      pacienteId,
      medicoId,
      especialidadId,
      fecha,
      hora,
      motivo,
      modoPago,
      monto
    } = req.body;

    // Validar que venga especialidadId
    if (!especialidadId) {
      return res.status(400).json({
        success: false,
        message: 'La especialidad es requerida'
      });
    }

    // ✅ SOLUCIÓN: Construir la fecha SIN conversión de zona horaria
    // fecha viene como "2025-11-30" y hora como "10:00"
    const fechaISO = `${fecha}T00:00:00.000Z`; // Guardar solo la fecha
    const fechaObj = new Date(fechaISO);

    console.log('📅 Fecha recibida:', fecha);
    console.log('⏰ Hora recibida:', hora);
    console.log('📆 Fecha a guardar:', fechaObj);

    // Verificar duplicados
    const existe = await Cita.findOne({
      medicoId,
      fecha: fechaObj,
      hora,
      estado: 'pendiente'
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita en esa fecha y hora'
      });
    }

    const ahora = new Date();

    const citaData = {
      pacienteId: new mongoose.Types.ObjectId(pacienteId),
      medicoId: new mongoose.Types.ObjectId(medicoId),
      especialidadId: new mongoose.Types.ObjectId(especialidadId),
      fecha: fechaObj, // ✅ Solo la fecha, sin hora
      hora, // ✅ La hora por separado como string
      estado: 'pendiente',
      motivo,
      modoPago,
      pagado: false,
      monto: Number(monto),
      recetaId: null,
      calificacion: null,
      comentarios: null,
      creadoEn: ahora,
      actualizadoEn: ahora
    };

    console.log('📋 Documento a guardar:', citaData);

    const nuevaCita = await Cita.create(citaData);

    // Notificación al médico
    try {
      await exports.crearNotificacion({
        usuarioId: medicoId,
        tipo: 'cita_nueva',
        mensaje: `Tienes una nueva cita el ${fecha} a las ${hora}. Motivo: ${motivo}, Costo: ${monto}`,
        canal: 'email',
        leida: false
      });
    } catch (err) {
      console.error("Error creando notificación para el médico:", err);
    }

    return res.status(201).json({ success: true, cita: nuevaCita });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear cita',
      detalle: error.message
    });
  }
};
// NOTIFICACIONES
//================================================================ */
exports.crearNotificacion = async ({ usuarioId, tipo, mensaje, canal, leida = false }) => {
  try {
    const noti = new Notificacion({
      usuarioId,
      tipo,
      mensaje,
      canal,
      enviado: false,
      leida
    });
    await noti.save();
    return noti;
  } catch (error) {
    console.error("Error creando notificación:", error);
    throw error;
  }
};

exports.obtenerNotificaciones = async (usuarioId) => {
  return await Notificacion.find({ usuarioId }).sort({ createdAt: -1 });
};

exports.marcarNotificacionesComoLeidas = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    await Notificacion.updateMany(
      { usuarioId, leida: false },
      { $set: { leida: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    res.status(500).json({ success: false, message: 'Error al marcar notificaciones' });
  }
};

/* ===============================================================
   HISTORIAL DE CITAS POR MÉDICO
================================================================ */
/* ===============================================================
   HISTORIAL DE CITAS POR MÉDICO
================================================================ */
exports.obtenerHistorialPorMedico = async (req, res) => {
  try {
    const { medicoId } = req.params;

    const citas = await Cita.find({ medicoId, estado: 'completada' })
      .populate('pacienteId', 'nombre apellido email telefono')
      .populate('especialidadId', 'nombre descripcion') // ✅ Si quieres mostrar especialidad
      .sort({ fecha: -1, hora: -1 }); // ✅ AGREGAR ESTO - Ordenar por fecha descendente (más reciente primero)

    res.json({ success: true, historial: citas });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ success: false, message: 'Error al obtener historial' });
  }
};
/* ===============================================================
   RESUMEN DE CITAS PARA DASHBOARD
================================================================ */
exports.obtenerResumenPorMedico = async (req, res) => {
  try {
    const { medicoId } = req.query;
    if (!medicoId) return res.status(400).json({ success: false, message: 'Falta medicoId' });

    const ahora = new Date();

    const citasProximas = await Cita.countDocuments({
      medicoId,
      estado: 'pendiente',
      $expr: {
        $gt: [
          { $add: ['$fecha', { $multiply: [{ $hour: '$fecha' }, 3600000] }, { $multiply: [{ $minute: '$fecha' }, 60000] }] },
          ahora
        ]
      }
    });

    const citasAtrasadas = await Cita.countDocuments({
      medicoId,
      estado: 'pendiente',
      $expr: {
        $lte: [
          { $add: ['$fecha', { $multiply: [{ $hour: '$fecha' }, 3600000] }, { $multiply: [{ $minute: '$fecha' }, 60000] }] },
          ahora
        ]
      }
    });

    const citasCompletadas = await Cita.countDocuments({
      medicoId,
      estado: 'completada'
    });

    res.json({ success: true, resumen: { citasProximas, citasAtrasadas, citasCompletadas } });
  } catch (error) {
    console.error("Error al obtener resumen de citas:", error);
    res.status(500).json({ success: false, message: 'Error al obtener resumen' });
  }
};

/* ===============================================================
   NUEVO ENDPOINT: BUSCAR PACIENTES (AUTOCOMPLETE)
================================================================ */
/* ===============================================================
   NUEVO ENDPOINT: BUSCAR PACIENTES ACTIVOS (AUTOCOMPLETE)
================================================================ */
exports.buscarPacientes = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) return res.json({ success: true, usuarios: [] });

    const regex = new RegExp(query, 'i');

    const pacientes = await Usuario.find({
      rol: 'paciente',        // ✅ CAMBIAR "role" por "rol"
      activo: true,           // ✅ CAMBIAR "status: 'activo'" por "activo: true"
      $or: [
        { nombre: regex },
        { apellido: regex }
      ]
    })
      .select('_id nombre apellido')
      .limit(10);

    res.json({ success: true, usuarios: pacientes });
  } catch (error) {
    console.error("Error buscando pacientes:", error);
    res.status(500).json({ success: false, message: 'Error al buscar pacientes' });
  }
};

/* ===============================================================
   OBTENER TODAS LAS ESPECIALIDADES (PARA DROPDOWN)
================================================================ */
exports.obtenerEspecialidades = async (req, res) => {
  try {
    const Especialidad = require('../../../models/Especialidad');

    // ✅ Primero sin filtro para ver TODAS las especialidades
    const especialidades = await Especialidad.find({})
      .select('_id nombre descripcion activo')
      .sort({ nombre: 1 });

    console.log('📋 Total especialidades encontradas:', especialidades.length);
    console.log('📋 Especialidades:', especialidades);

    res.json({ success: true, especialidades });
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    res.status(500).json({ success: false, message: 'Error al obtener especialidades' });
  }
};

/* ===============================================================
   GUARDAR NOTAS Y COMPLETAR CONSULTA
================================================================ */
exports.guardarNotasConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;

    // ✅ Usar findByIdAndUpdate para actualizar solo los campos específicos
    const cita = await Cita.findByIdAndUpdate(
      id,
      {
        comentarios,
        estado: 'completada',
        actualizadoEn: new Date()
      },
      {
        new: true,
        runValidators: false // ✅ No validar campos que no estamos modificando
      }
    );

    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    res.json({ success: true, cita });
  } catch (error) {
    console.error("Error al guardar notas:", error);
    res.status(500).json({ success: false, message: 'Error al guardar notas' });
  }
};
/* ===============================================================
   CREAR RECETA
================================================================ */
exports.crearReceta = async (req, res) => {
  try {
    const { citaId, medicamentos, observaciones } = req.body;
    const Receta = require('../../../models/Receta');

    // Obtener la cita para sacar medicoId y pacienteId
    const cita = await Cita.findById(citaId);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Crear la receta
    const nuevaReceta = await Receta.create({
      citaId: cita._id,
      medicoId: cita.medicoId,
      pacienteId: cita.pacienteId,
      fecha: new Date(),
      medicamentos,
      observaciones,
      pdfUrl: null,
      qrCode: null
    });

    // Actualizar la cita con el recetaId
    cita.recetaId = nuevaReceta._id;
    await cita.save();

    res.json({ success: true, receta: nuevaReceta });
  } catch (error) {
    console.error("Error al crear receta:", error);
    res.status(500).json({ success: false, message: 'Error al crear receta', error: error.message });
  }
};

exports.obtenerRecetaPorCita = async (req, res) => {
  try {
    const { citaId } = req.params;

    const receta = await Receta.findOne({ citaId })
      .populate('medicoId', 'nombre apellido especialidad')
      .populate('pacienteId', 'nombre apellido');

    if (!receta) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró receta para esta cita'
      });
    }

    res.json({
      success: true,
      receta
    });
  } catch (error) {
    console.error('Error al obtener receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la receta'
    });
  }
}; // ✅ CERRAR AQUÍ la función obtenerRecetaPorCita

/* ===============================================================
   MÉTRICAS
================================================================ */
// Ingresos mensuales (últimos 6 meses)
exports.obtenerIngresosMensuales = async (req, res) => {
  try {
    const { medicoId } = req.query;

    if (!medicoId) {
      return res.status(400).json({ error: 'medicoId es requerido' });
    }

    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const ingresos = await Cita.aggregate([
      {
        $match: {
          medicoId: new mongoose.Types.ObjectId(medicoId), // ✅ CAMBIO AQUÍ
          estado: 'completada',
          fecha: { $gte: seisMesesAtras }
        }
      },
      {
        $group: {
          _id: {
            mes: { $month: '$fecha' },
            año: { $year: '$fecha' }
          },
          total: { $sum: '$monto' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { '_id.año': 1, '_id.mes': 1 } }
    ]);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ingresosFormateados = ingresos.map(item => ({
      mes: meses[item._id.mes - 1],
      año: item._id.año,
      total: item.total,
      cantidad: item.cantidad
    }));

    res.json(ingresosFormateados);
  } catch (error) {
    console.error('Error en obtenerIngresosMensuales:', error);
    res.status(500).json({ error: 'Error al obtener ingresos mensuales' });
  }
};

// Ingresos semanales (últimas 8 semanas)
exports.obtenerIngresosSemanales = async (req, res) => {
  try {
    const { medicoId } = req.query;

    if (!medicoId) {
      return res.status(400).json({ error: 'medicoId es requerido' });
    }

    const ochoSemanasAtras = new Date();
    ochoSemanasAtras.setDate(ochoSemanasAtras.getDate() - 56); // 8 semanas = 56 días

    const ingresos = await Cita.aggregate([
      {
        $match: {
          medicoId: new mongoose.Types.ObjectId(medicoId),
          estado: 'completada',
          fecha: { $gte: ochoSemanasAtras }
        }
      },
      {
        $group: {
          _id: {
            semana: { $week: '$fecha' },
            año: { $year: '$fecha' }
          },
          total: { $sum: '$monto' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { '_id.año': 1, '_id.semana': 1 } }
    ]);

    const ingresosFormateados = ingresos.map((item, index) => ({
      semana: `Sem ${index + 1}`,
      total: item.total,
      cantidad: item.cantidad
    }));

    res.json(ingresosFormateados);
  } catch (error) {
    console.error('Error en obtenerIngresosSemanales:', error);
    res.status(500).json({ error: 'Error al obtener ingresos semanales' });
  }
};

// Citas por estado (este mes)
exports.obtenerCitasPorEstado = async (req, res) => {
  try {
    const { medicoId } = req.query;

    if (!medicoId) {
      return res.status(400).json({ error: 'medicoId es requerido' });
    }

    const inicioDeMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const citas = await Cita.aggregate([
      {
        $match: {
          medicoId: new mongoose.Types.ObjectId(medicoId), // ✅ CAMBIO AQUÍ
          fecha: { $gte: inicioDeMes }
        }
      },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    const estadosPosibles = ['programada', 'completada', 'cancelada'];
    const citasFormateadas = estadosPosibles.map(estado => {
      const encontrado = citas.find(c => c._id === estado);
      return {
        estado: estado,
        cantidad: encontrado ? encontrado.cantidad : 0
      };
    });

    res.json(citasFormateadas);
  } catch (error) {
    console.error('Error en obtenerCitasPorEstado:', error);
    res.status(500).json({ error: 'Error al obtener citas por estado' });
  }
};

// Pacientes nuevos vs recurrentes
exports.obtenerPacientesPorTipo = async (req, res) => {
  try {
    const { medicoId } = req.query;

    if (!medicoId) {
      return res.status(400).json({ error: 'medicoId es requerido' });
    }

    const pacientes = await Cita.aggregate([
      {
        $match: {
          medicoId: new mongoose.Types.ObjectId(medicoId), // ✅ CAMBIO AQUÍ
          estado: 'completada'
        }
      },
      {
        $group: {
          _id: '$pacienteId',
          totalCitas: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$totalCitas', 1] }, 'Nuevos', 'Recurrentes'] },
          cantidad: { $sum: 1 }
        }
      }
    ]);

    res.json(pacientes);
  } catch (error) {
    console.error('Error en obtenerPacientesPorTipo:', error);
    res.status(500).json({ error: 'Error al obtener pacientes por tipo' });
  }
};

// Horarios más demandados
exports.obtenerHorariosDemanda = async (req, res) => {
  try {
    const { medicoId } = req.query;

    if (!medicoId) {
      return res.status(400).json({ error: 'medicoId es requerido' });
    }

    const horarios = await Cita.aggregate([
      {
        $match: {
          medicoId: new mongoose.Types.ObjectId(medicoId), // ✅ CAMBIO AQUÍ
          estado: { $in: ['completada', 'programada'] }
        }
      },
      {
        $project: {
          diaSemana: { $dayOfWeek: '$fecha' },
          hora: { $hour: '$fecha' }
        }
      },
      {
        $group: {
          _id: { dia: '$diaSemana', hora: '$hora' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { '_id.dia': 1, '_id.hora': 1 } }
    ]);

    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const horariosFormateados = horarios.map(item => ({
      dia: dias[item._id.dia - 1],
      hora: `${item._id.hora}:00`,
      cantidad: item.cantidad
    }));

    res.json(horariosFormateados);
  } catch (error) {
    console.error('Error en obtenerHorariosDemanda:', error);
    res.status(500).json({ error: 'Error al obtener horarios de demanda' });
  }
};
// Resumen del dashboard (tarjetas principales)
// Reemplaza la función obtenerResumenDashboard en citaController.js

exports.obtenerResumenDashboard = async (req, res) => {
  try {
    const { medicoId } = req.query;

    if (!medicoId) {
      return res.status(400).json({
        message: 'medicoId es requerido'
      });
    }

    // Obtener todas las citas pendientes y reprogramadas
    const citasPendientes = await Cita.find({
      medicoId: new mongoose.Types.ObjectId(medicoId),
      estado: { $in: ['pendiente', 'reprogramada'] }
    }).select('fecha hora');

    // Separar en programadas y atrasadas
    const ahora = new Date();
    let citasProgramadas = 0;
    let citasAtrasadas = 0;

    citasPendientes.forEach(cita => {
      // Parsear la hora
      const [horas, minutos] = cita.hora.split(':');

      // Crear fecha completa
      const fechaHoraCita = new Date(cita.fecha);

      // ✅ IMPORTANTE: Si la fecha YA tiene hora (bug viejo), úsala tal cual
      // Si no, usa la hora del campo separado
      if (fechaHoraCita.getUTCHours() === 0 && fechaHoraCita.getUTCMinutes() === 0) {
        fechaHoraCita.setUTCHours(parseInt(horas), parseInt(minutos), 0, 0);
      }

      if (fechaHoraCita < ahora) {
        citasAtrasadas++;
      } else {
        citasProgramadas++;
      }
    });

    // Citas completadas este mes
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    const citasCompletadas = await Cita.countDocuments({
      medicoId: new mongoose.Types.ObjectId(medicoId),
      estado: 'completada'
    });


    // Calcular Satisfacción
    const totalCitasMes = await Cita.countDocuments({
      medicoId: new mongoose.Types.ObjectId(medicoId),
      estado: { $in: ['completada', 'cancelada'] },
      fecha: { $gte: inicioMes, $lte: finMes }
    });

    const canceladasMes = await Cita.countDocuments({
      medicoId: new mongoose.Types.ObjectId(medicoId),
      estado: 'cancelada',
      fecha: { $gte: inicioMes, $lte: finMes }
    });

    const satisfaccion = totalCitasMes > 0
      ? Math.round(((totalCitasMes - canceladasMes) / totalCitasMes) * 100)
      : 0;

    console.log('📊 Resumen Dashboard:', {
      citasProgramadas,
      citasAtrasadas,
      citasCompletadas,
      satisfaccion
    });

    res.json({
      citasProgramadas,
      citasAtrasadas,
      citasCompletadas,
      satisfaccion
    });
  } catch (error) {
    console.error('❌ Error en obtenerResumenDashboard:', error);
    res.status(500).json({
      message: 'Error al obtener resumen del dashboard',
      error: error.message
    });
  }
};