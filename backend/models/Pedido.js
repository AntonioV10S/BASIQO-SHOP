const mongoose = require('mongoose');
const PedidoSchema = new mongoose.Schema({
    productos: Array,
    total: Number,
    direccion: String,
    fecha: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Pedido', PedidoSchema);