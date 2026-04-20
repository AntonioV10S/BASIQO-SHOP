const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String, default: "Camiseta de polialgodón BASIQO" },
  foto: { type: [String], default: [] }, // Aquí irá el link de la imagen
  tallas: {
    type: [String],
    enum: ['S', 'M', 'L', 'XL'], // Solo permite estas opciones
    default: ['S', 'M', 'L', 'XL']
  },
  colores: {
    type: [String],
    enum: ['BLANCO', 'NEGRO', 'AZUL NAVY', 'BEIGE', 'VINO', 'VERDE MILITAR'],
    required: true
  },
  stock: [
  {
    color: {
      type: String,
      enum: ['BLANCO', 'NEGRO', 'AZUL NAVY', 'BEIGE', 'VINO', 'VERDE MILITAR']
    },
    tallas: [
      {
        talla: {
          type: String,
          enum: ['S', 'M', 'L', 'XL']
        },
        cantidad: {
          type: Number,
          default: 0
        }
      }
    ]
  }
]
});

module.exports = mongoose.model('Producto', productoSchema);