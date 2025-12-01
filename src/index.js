require('dotenv').config(); // Carga las variables del .env

const express = require('express');
const http = require('http');           // Para crear el servidor
const socketIO = require('socket.io');  // Para WebSockets
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const config = require('./config/env');

// Importar rutas
const webRoutes = require('./modules/web/routes'); // tu router web
const mobileRoutes = require('./modules/mobile/routes');

const app = express();

// Conectar a la base de datos
connectDB();

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',           // Front local
  'http://localhost:3001',           // Otro puerto de pruebas
  'https://tu-front-en-produccion.com' // Reemplaza con tu dominio live
];

// Middlewares globales
app.use(cors({
  origin: function(origin, callback){
    if(!origin || allowedOrigins.indexOf(origin) !== -1){
      callback(null, true);
    } else {
      callback(new Error('CORS policy: este origen no está permitido'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger solo en desarrollo
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'VITA Backend API',
    version: '1.0.0',
    endpoints: {
      web: '/api/web',
      mobile: '/api/mobile'
    }
  });
});

// Rutas principales
app.use('/api/web', webRoutes);
app.use('/api/mobile', mobileRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// ⚡ Integrar Socket.IO sin cambiar tu lógica
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: allowedOrigins } });
app.set('io', io); // para usarlo desde controllers

io.on('connection', (socket) => {
  console.log('Usuario conectado a Socket.IO:', socket.id);

  socket.on('join', (usuarioId) => {
    socket.join(usuarioId); // cada usuario tiene su sala
    console.log(`Usuario ${usuarioId} se unió a su sala`);
  });
});

// Iniciar servidor
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT} en modo ${config.nodeEnv}`);
});

module.exports = app;
