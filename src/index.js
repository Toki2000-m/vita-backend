require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const config = require('./config/env');

const webRoutes = require('./modules/web/routes');
const mobileRoutes = require('./modules/mobile/routes');

const app = express();

// Conectar a la base de datos
connectDB();

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://smartflow-web.vercel.app'
];

// 🔧 CORS mejorado
app.use(cors({
  origin: function(origin, callback){
    // Permitir requests sin origin (mobile apps, Postman, etc)
    if(!origin) return callback(null, true);
    
    if(allowedOrigins.indexOf(origin) !== -1){
      callback(null, true);
    } else {
      callback(new Error('CORS policy: este origen no está permitido'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ Agregado PATCH
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // ✅ Más headers
  credentials: true,
  optionsSuccessStatus: 200 // ✅ Para navegadores viejos
}));

// ✅ Manejo explícito de preflight para todas las rutas
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Socket.IO con CORS mejorado
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // ✅ Agregado PATCH
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Usuario conectado a Socket.IO:', socket.id);

  socket.on('join', (usuarioId) => {
    socket.join(usuarioId);
    console.log(`Usuario ${usuarioId} se unió a su sala`);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = config.port || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT} en modo ${config.nodeEnv}`);
});

module.exports = app;