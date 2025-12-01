const Usuario = require('../../../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../../../config/env');

// Función para generar token JWT
const generarToken = (user) => {
  return jwt.sign(
    { id: user._id, rol: user.rol, platform: user.platform },
    config.jwtSecret,
    { expiresIn: config.jwtExpires } // 👈 corregido: usa jwtExpires
  );
};

// @desc    Login de usuario web
// @route   POST /api/web/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña',
      });
    }

    // Buscar usuario con password
    const user = await Usuario.findOne({ email, platform: 'web' }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Verificar password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Crear token
    const token = generarToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        platform: user.platform
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Registro de usuario web
// @route   POST /api/web/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password, rol = 'paciente' } = req.body;

    const userExists = await Usuario.findOne({ email, platform: 'web' });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    const user = await Usuario.create({
      nombre,
      apellido,
      email,
      telefono,
      password,
      rol,
      platform: 'web',
    });

    const token = generarToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        platform: user.platform
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/web/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autorizado para acceder a esta ruta' });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
        email: req.user.email,
        telefono: req.user.telefono,
        rol: req.user.rol,
        platform: req.user.platform
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};
