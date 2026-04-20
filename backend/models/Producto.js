const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: String,
  foto: [String], // Array de URLs de Cloudinary
  variantes: [
    {
      color: String,
      talla: String,
      stock: Number
    }
  ],
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Producto', ProductoSchema);