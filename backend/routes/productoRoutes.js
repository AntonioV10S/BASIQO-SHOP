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
router.post('/', upload.array('foto', 5), async (req, res) => {
    try {
        const { nombre, precio, descripcion, variantes } = req.body;
        const rutasFotos = req.files ? req.files.map(file => file.path) : [];

        // Convertimos el string de variantes (del FormData) a un Objeto JS
        const variantesParsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;

        const nuevoProducto = new Producto({
            nombre,
            precio,
            descripcion,
            foto: rutasFotos,
            variantes: variantesParsed
        });

        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(400).json({ error: "Error al crear: " + error.message });
    }
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
                    _id: item.productoId,
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

        // 1. Buscamos el producto actual
        let producto = await Producto.findById(id);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        // 2. Preparamos los datos básicos
        const datosActualizados = {
            nombre,
            precio,
            descripcion,
            // Parseamos las variantes ya que vienen como string desde FormData
            variantes: typeof variantes === 'string' ? JSON.parse(variantes) : variantes
        };

        // 3. Si el usuario subió fotos nuevas, las actualizamos
        if (req.files && req.files.length > 0) {
            const nuevasFotos = req.files.map(file => file.path);
            datosActualizados.foto = nuevasFotos;
        }

        // 4. Ejecutamos la actualización en la BD
        const productoEditado = await Producto.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true } // Para que retorne el producto ya editado
        );

        res.json(productoEditado);
        console.log(`✅ Producto ${nombre} actualizado correctamente`);

    } catch (error) {
        console.error("❌ Error al editar producto:", error);
        res.status(500).json({ mensaje: "Error interno del servidor", error: error.message });
    }
});

module.exports = router;