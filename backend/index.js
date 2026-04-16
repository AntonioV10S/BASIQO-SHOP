require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importar rutas
const productoRoutes = require('./routes/productoRoutes');

const app = express();

// Middlewares globales
app.use(cors()); // CORS habilitado para todos los orígenes
app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear datos de formularios


//  Usar rutas
app.use('/api/productos', productoRoutes); 

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('¡Conectado a la base de datos de BASIQO!'))
  .catch(err => console.error('Error de conexión:', err));

const PORT = process.env.PORT || 3000;
// Diagnóstico de rutas
app.use((req, res, next) => {
    console.log(`Intento de acceso a: ${req.method} ${req.url}`);
    next();
});
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
