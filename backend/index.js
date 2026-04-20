require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');

const productoRoutes = require('./routes/productoRoutes');
const app = express();

// Optimizaciones
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/productos', productoRoutes);

// Conexión
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 Base de datos conectada: BASIQO está en línea'))
  .catch(err => console.error('Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));