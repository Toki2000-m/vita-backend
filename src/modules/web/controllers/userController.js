const Usuario = require('../../../models/Usuario');
const bcrypt = require('bcryptjs');

// @desc    Crear nuevo usuario
// @route   POST /api/web/users
// @access  Público o protegido según tu preferencia
exports.createUser = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password, rol = 'medico', platform = 'web' } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, apellido, email, telefono'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
      });
    }

    // Encriptar contraseña
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Crear nuevo usuario
    const newUser = new Usuario({
      nombre,
      apellido,
      email,
      telefono,
      password: hashedPassword,
      rol,
      platform
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser._id,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        telefono: newUser.telefono,
        rol: newUser.rol,
        platform: newUser.platform
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message,
    });
  }
};

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/web/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Usuario.find({ platform: 'web' });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
    });
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/web/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await Usuario.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message,
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/web/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const user = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message,
    });
  }
};

// @desc    Eliminar usuario
// @route   DELETE /api/web/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await Usuario.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message,
    });
  }
};
