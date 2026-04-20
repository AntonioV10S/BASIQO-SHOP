const mongoose = require('mongoose');

const varianteSchema = new mongoose.Schema({
  color: { type: String, required: true },
  talla: { type: String, required: true },
  stock: { type: Number, default: 0 }
});

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String, default: "Camiseta de polialgodón BASIQO" },
  foto: { type: [String], default: [] },
  variantes: [varianteSchema] // Array de objetos con stock individual
}, { timestamps: true });

// Índice para búsqueda rápida
productoSchema.index({ nombre: 'text' });

module.exports = mongoose.model('Producto', productoSchema);