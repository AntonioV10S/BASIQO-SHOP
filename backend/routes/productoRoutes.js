const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');

// Configuración segura con variables de entorno
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'BASIQO',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage });

// --- CATALOGO (Rápido y ligero) ---
router.get('/', async (req, res) => {
    try {
        // Solo traemos campos necesarios para que cargue volando
        const productos = await Producto.find().select('nombre precio foto variantes').lean();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CREAR PRODUCTO ---
// --- CREAR PRODUCTO CON BLINDAJE ---
router.post('/', (req, res) => {
    upload.array('foto')(req, res, async (err) => {
        // Si Multer falla (por ejemplo, archivo muy pesado o error de Cloudinary)
        if (err) {
            console.error("❌ Error de Multer/Cloudinary:", err);
            return res.status(500).json({ mensaje: "Error al subir imagen", detalle: err.message });
        }

        try {
            const { nombre, precio, descripcion, variantes } = req.body;

            let variantesParsed = [];
            if (variantes) {
                variantesParsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;
            }

            const nuevoProducto = new Producto({
                nombre,
                precio,
                descripcion,
                variantes: variantesParsed,
                // Verificamos que req.files exista y tenga datos
                foto: req.files ? req.files.map(f => f.path) : []
            });

            await nuevoProducto.save();
            res.status(201).json(nuevoProducto);
            console.log("✅ Producto guardado exitosamente");
        } catch (error) {
            console.error("❌ Error en la lógica de guardado:", error);
            res.status(500).json({ mensaje: "Error interno", error: error.message });
        }
    });
});

// --- CONFIRMAR PEDIDO (Con descuento de stock real) ---
router.post('/confirmar-pedido', async (req, res) => {
    try {
        const { productos, total, direccion } = req.body;

        if (!productos || productos.length === 0) return res.status(400).json({ error: "Carrito vacío" });

        // Procesamos cada item para descontar la variante exacta
        for (const item of productos) {
            const result = await Producto.updateOne(
                {
                    _id: item.id,
                    "variantes.color": item.color,
                    "variantes.talla": item.talla,
                    "variantes.stock": { $gte: item.cantidad } // Solo si hay stock suficiente
                },
                { $inc: { "variantes.$.stock": -item.cantidad } }
            );

            if (result.matchedCount === 0) {
                throw new Error(`Stock insuficiente o no existe la variante: ${item.color} Talla ${item.talla}`);
            }
        }

        const nuevoPedido = new Pedido({ productos, total, direccion, fecha: new Date() });
        await nuevoPedido.save();
        res.status(201).json({ message: "¡Pedido BASIQO registrado!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- ELIMINAR ---
router.delete('/:id', async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', upload.array('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, descripcion, variantes } = req.body;

        let producto = await Producto.findById(id);
        if (!producto) return res.status(404).json({ mensaje: "No existe" });

        // PARSEO SEGURO
        let variantesParsed = [];
        try {
            variantesParsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;
        } catch (e) {
            variantesParsed = producto.variantes; // Si falla, dejamos las que estaban
        }

        const updateData = {
            nombre,
            precio,
            descripcion,
            variantes: variantesParsed
        };

        // Solo actualizar fotos si se subieron nuevas
        if (req.files && req.files.length > 0) {
            updateData.foto = req.files.map(f => f.path);
        }

        const editado = await Producto.findByIdAndUpdate(id, updateData, { new: true });
        res.json(editado);
    } catch (error) {
        console.error("Error en PUT:", error);
        res.status(500).send("Error del servidor: " + error.message);
    }
});

// --- RUTA PARA ESTADÍSTICAS (KPIs) ---
router.get('/reportes', async (req, res) => {
    try {
        const pedidos = await Pedido.find();

        const totalVentas = pedidos.reduce((acc, p) => acc + p.total, 0);
        const totalPedidos = pedidos.length;

        // Cálculo de productos más vendidos (opcional por ahora)
        // Puedes dejarlo como array vacío si no quieres complicarte
        const topProductos = [];

        res.json({
            totalVentas,
            totalPedidos,
            topProductos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTA PARA EL HISTORIAL DE TRANSACCIONES ---
router.get('/historial', async (req, res) => {
    try {
        // Trae los pedidos ordenados del más nuevo al más viejo
        const historial = await Pedido.find().sort({ fecha: -1 });
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;