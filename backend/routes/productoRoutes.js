const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');

cloudinary.config({
    cloud_name: 'dmzmhugvd',
    api_key: '962417948158365',
    api_secret: '7fMzOw_p3cjJCTFOCcxv_Wcby_g'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'BASIQO',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage });

// --- RUTA PRINCIPAL (LISTAR) ---
router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener productos: " + error.message });
    }
});

// --- POST: CREAR ---
router.post('/confirmar-pedido', async (req, res) => {
    try {
        const { productos, total, direccion } = req.body;
        
        if (!productos || productos.length === 0) 
            return res.status(400).json({ error: "Carrito vacío" });

        // 1. Verificación y actualización atómica
        // Usamos un bucle para procesar cada producto uno por uno
        for (const item of productos) {
            // El truco está en buscar el producto Y verificar que su stock sea >= cantidad requerida
            const resultado = await Producto.findOneAndUpdate(
                { 
                    _id: item._id, 
                    [`stock.${item.talla}`]: { $gte: item.cantidad } // Solo encuentra si hay stock
                },
                { 
                    $inc: { [`stock.${item.talla}`]: -item.cantidad } // Resta la cantidad
                }
            );

            // Si resultado es null, significa que no encontró el producto con stock suficiente
            if (!resultado) {
                return res.status(400).json({ 
                    error: `Stock insuficiente para ${item.nombre} en talla ${item.talla}` 
                });
            }
        }

        // 2. Si todo salió bien, guardamos el pedido
        const nuevoPedido = new Pedido({ 
            productos, 
            total, 
            direccion, 
            fecha: new Date() 
        });
        
        await nuevoPedido.save();
        res.status(201).json({ message: "Pedido confirmado correctamente" });

    } catch (error) { 
        res.status(500).json({ error: "Error en el servidor: " + error.message }); 
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

module.exports = router;