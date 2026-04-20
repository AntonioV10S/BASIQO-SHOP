const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'BASIQO',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find()
            .select('nombre precio foto stock tallas colores')
            .lean();

        const productosOptimizados = productos.map(p => ({
            ...p,
            foto: p.foto && p.foto.length > 0
                ? p.foto[0].replace('/upload/', '/upload/w_500,q_auto,f_auto/')
                : null
        }));

        res.json(productosOptimizados);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener productos: " + error.message });
    }
});

// --- POST: CREAR ---
router.post('/', upload.array('foto', 5), async (req, res) => {
    try {
        const { nombre, precio, stock } = req.body;
        const rutasFotos = req.files ? req.files.map(file => file.path) : [];

        // Validación de seguridad para JSON.parse
        const parseData = (data) => (typeof data === 'string' ? JSON.parse(data) : data);

const producto = new Producto({
  nombre,
  precio,
  stock: parseData(stock),
  foto: rutasFotos
});

        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        res.status(400).json({ error: "Error al crear producto: " + error.message });
    }
});

// --- PUT: ACTUALIZAR ---
router.put('/:id', upload.array('foto', 5), async (req, res) => {
    try {
        const { nombre, precio, stock, colores, tallas } = req.body;
        const productoExistente = await Producto.findById(req.params.id);

        if (!productoExistente) return res.status(404).json({ error: "Producto no encontrado" });

        const nuevasFotos = req.files && req.files.length > 0
            ? req.files.map(f => f.path)
            : productoExistente.foto;

        const parseData = (data) => (typeof data === 'string' ? JSON.parse(data) : data);

        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            { 
                $set: {
                    nombre,
                    precio,
                    stock: Number(stock),
                    colores: parseData(colores),
                    tallas: parseData(tallas),
                    foto: nuevasFotos
                }
            },
            { new: true }
        );

        res.json(productoActualizado);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar: " + error.message });
    }
});

// --- OTRAS RUTAS (Pedidos, etc) ---
router.get('/historial', async (req, res) => {
    try {
        const historial = await Pedido.find().sort({ fecha: -1 });
        res.json(historial);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/confirmar-pedido', async (req, res) => {
    try {
        const { productos, total, direccion } = req.body;
        // Validación simplificada
        if (!productos || !total) return res.status(400).json({ error: "Datos incompletos" });
        
        // Descontar stock
        for (const item of productos) {
            await Producto.findByIdAndUpdate(item._id, { $inc: { stock: -1 } });
        }

        const nuevoPedido = new Pedido({ productos, total, direccion, fecha: new Date() });
        await nuevoPedido.save();
        res.status(201).json({ message: "Pedido registrado" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- REPORTES PRO ---
router.get('/reportes', async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    let filtroFecha = {};

    if (desde && hasta) {
      filtroFecha = {
        fecha: {
          $gte: new Date(desde),
          $lte: new Date(hasta)
        }
      };
    }

    const pedidos = await Pedido.find(filtroFecha).lean();

    // 📊 Métricas
    const totalVentas = pedidos.reduce((acc, p) => acc + p.total, 0);
    const totalPedidos = pedidos.length;
    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    // 🔥 Productos más vendidos
    const contador = {};

    pedidos.forEach(p => {
      p.productos.forEach(prod => {
        const nombre = prod.nombre;
        contador[nombre] = (contador[nombre] || 0) + 1;
      });
    });

    const topProductos = Object.entries(contador)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    res.json({
      totalVentas,
      totalPedidos,
      ticketPromedio,
      topProductos
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;