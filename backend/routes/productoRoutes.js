const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');

// Configuración de Cloudinary
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

// Obtener historial completo para mostrar en la tabla
router.get('/historial', async (req, res) => {
    try {
        const historial = await Pedido.find().sort({ fecha: -1 });
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RUTA UNIFICADA: Descuenta stock Y guarda el pedido
router.post('/confirmar-pedido', async (req, res) => {
    // 1. Log para verificar qué llega desde el Frontend
    console.log("Cuerpo recibido desde el frontend:", req.body); 

    try {
        // 2. Extraer TODAS las variables del body. SI NO ESTÁN AQUÍ, NO EXISTEN.
        const { productos, total, direccion } = req.body;

        // 3. Validación de seguridad
        if (total === undefined || direccion === undefined) {
            return res.status(400).json({ error: "Faltan datos obligatorios: total o dirección" });
        }

        // --- Lógica de Stock ---
        const conteo = {};
        productos.forEach(p => conteo[p._id] = (conteo[p._id] || 0) + 1);

        for (const [id, cantidad] of Object.entries(conteo)) {
            const prod = await Producto.findById(id);
            if (!prod || prod.stock < cantidad) {
                return res.status(400).json({ error: `No hay suficiente stock de ${prod.nombre}.` });
            }
        }

        // --- Descontar stock ---
        for (const item of productos) {
            await Producto.findByIdAndUpdate(item._id, { $inc: { stock: -1 } });
        }

        // --- Guardar Pedido ---
        const nuevoPedido = new Pedido({
            productos,
            total: Number(total), 
            direccion: direccion,
            fecha: new Date()
        });
        await nuevoPedido.save();

        res.status(201).json({ message: "Pedido registrado correctamente" });

    } catch (error) {
        console.error("Error en servidor:", error);
        res.status(500).json({ error: error.message });
    }
});
// Guardar pedido (se llama desde el botón Finalizar del frontend)
// Ruta para registrar el pedido y descontar stock
router.post('/pedido', async (req, res) => {
    try {
        const { productos } = req.body; // 'productos' es el array que viene del carrito

        for (const item of productos) {
            // Buscamos el producto en la base de datos
            const prod = await Producto.findById(item._id);
            
            if (!prod || prod.stock < 1) {
                return res.status(400).json({ error: `El producto ${item.nombre} ya no tiene stock.` });
            }

            // Descontamos 1 unidad del stock
            prod.stock -= 1;
            await prod.save();
        }

        // Aquí guardas el pedido en la colección 'Pedido' (como vimos antes)
        // const nuevoPedido = new Pedido(req.body);
        // await nuevoPedido.save();

        res.status(201).json({ message: "Pedido registrado y stock actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ver reportes (totales de venta)
router.get('/reportes', async (req, res) => {
    try {
        const stats = await Pedido.aggregate([
            { $group: { _id: null, totalVentas: { $sum: "$total" }, totalPedidos: { $sum: 1 } } }
        ]);
        res.json(stats[0] || { totalVentas: 0, totalPedidos: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// 1. RUTA GET (Listar productos)
router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. RUTA POST (Crear producto)
router.post('/', upload.single('foto'), async (req, res) => {
    try {
        const { nombre, precio, stock, colores, tallas } = req.body;

        const coloresArray = typeof colores === 'string' ? JSON.parse(colores) : colores;
        const tallasArray = typeof tallas === 'string' ? JSON.parse(tallas) : tallas;

        const producto = new Producto({
            nombre,
            precio,
            stock: Number(stock),
            colores: coloresArray.map(c => c.toUpperCase()),
            tallas: tallasArray.map(t => t.toUpperCase()),
            foto: req.file ? req.file.path : null
        });

        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 3. RUTA PUT (Actualizar producto - Corregida y ÚNICA)
router.put('/:id', upload.single('foto'), async (req, res) => {
    try {
        const { nombre, precio, stock, colores, tallas } = req.body;
        const productoExistente = await Producto.findById(req.params.id);

        if (!productoExistente) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const datosActualizados = {
            nombre,
            precio,
            // Si el stock viene en el body, lo convertimos a número, sino mantenemos el anterior
            stock: stock !== undefined ? Number(stock) : productoExistente.stock,
            colores: typeof colores === 'string' ? JSON.parse(colores) : colores,
            tallas: typeof tallas === 'string' ? JSON.parse(tallas) : tallas,
            foto: req.file ? req.file.path : productoExistente.foto
        };

        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            { $set: datosActualizados },
            { returnDocument: 'after' } // Eliminamos el warning de Mongoose
        );

        res.json(productoActualizado);
    } catch (error) {
        console.error("Error en PUT:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. RUTA DELETE
router.delete('/:id', async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;