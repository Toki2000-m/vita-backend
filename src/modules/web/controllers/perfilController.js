const Usuario = require('../../../models/Usuario');

// Obtener perfil del médico
exports.obtenerPerfil = async (req, res) => {
  try {
    const { userId } = req.params;

    const usuario = await Usuario.findById(userId)
      .populate('medicoInfo.especialidades', 'nombre')
      .select('-password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      usuario
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// Actualizar perfil del médico
exports.actualizarPerfil = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      nombre,
      apellido,
      email,
      telefono,
      cedula,
      especialidades,
      tarifaConsulta,
      descripcion,
      experiencia,
      ubicacion,
      horariosDisponibles
    } = req.body;

    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar datos básicos
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = email;
    if (telefono) usuario.telefono = telefono;

    // Actualizar info de médico
    if (usuario.rol === 'medico') {
      if (!usuario.medicoInfo) {
        usuario.medicoInfo = {};
      }

      if (cedula) usuario.medicoInfo.cedula = cedula;
      if (especialidades) usuario.medicoInfo.especialidades = especialidades;
      if (tarifaConsulta) usuario.medicoInfo.tarifaConsulta = tarifaConsulta;
      if (descripcion) usuario.medicoInfo.descripcion = descripcion;
      if (experiencia) usuario.medicoInfo.experiencia = experiencia;
      if (ubicacion) usuario.medicoInfo.ubicacion = ubicacion;
      if (horariosDisponibles) usuario.medicoInfo.horariosDisponibles = horariosDisponibles;
    }

    await usuario.save();

    const usuarioActualizado = await Usuario.findById(userId)
      .populate('medicoInfo.especialidades', 'nombre')
      .select('-password');

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// Actualizar foto de perfil
exports.actualizarFoto = async (req, res) => {
  try {
    const { userId } = req.params;
    const { foto } = req.body;

    if (!foto) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó una foto'
      });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      { foto },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Foto actualizada correctamente',
      usuario
    });
  } catch (error) {
    console.error('Error actualizando foto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar foto',
      error: error.message
    });
  }
};