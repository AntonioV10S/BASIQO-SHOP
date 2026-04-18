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


router.get('/historial', async (req, res) => {
    try {
        const historial = await Pedido.find().sort({ fecha: -1 });
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/confirmar-pedido', async (req, res) => {
    console.log("Cuerpo recibido desde el frontend:", req.body);

    try {
        const { productos, total, direccion } = req.body;

        if (total === undefined || direccion === undefined) {
            return res.status(400).json({ error: "Faltan datos obligatorios: total o dirección" });
        }

        const conteo = {};
        productos.forEach(p => conteo[p._id] = (conteo[p._id] || 0) + 1);

        for (const [id, cantidad] of Object.entries(conteo)) {
            const prod = await Producto.findById(id);
            if (!prod || prod.stock < cantidad) {
                return res.status(400).json({ error: `No hay suficiente stock de ${prod.nombre}.` });
            }
        }

        for (const item of productos) {
            await Producto.findByIdAndUpdate(item._id, { $inc: { stock: -1 } });
        }

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


router.post('/pedido', async (req, res) => {
    try {
        const { productos } = req.body;

        for (const item of productos) {
            const prod = await Producto.findById(item._id);

            if (!prod || prod.stock < 1) {
                return res.status(400).json({ error: `El producto ${item.nombre} ya no tiene stock.` });
            }
            prod.stock -= 1;
            await prod.save();
        }

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
// POST: Crear producto
router.post('/', upload.array('foto', 5), async (req, res) => {
    try {
        const { nombre, precio, stock, colores, tallas } = req.body;

        // Convertimos archivos a un array de rutas
        const rutasFotos = req.files ? req.files.map(file => file.path) : [];

        const producto = new Producto({
            nombre,
            precio,
            stock: Number(stock),
            colores: JSON.parse(colores),
            tallas: JSON.parse(tallas),
            foto: rutasFotos // Aquí guardamos el arreglo de rutas en la variable 'foto'
        });

        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT: Actualizar producto
router.put('/:id', upload.array('foto', 5), async (req, res) => {
    try {
        const { nombre, precio, stock, colores, tallas } = req.body;
        const productoExistente = await Producto.findById(req.params.id);

        // Si se subieron fotos nuevas, usamos esas. Si no, mantenemos las existentes.
        const nuevasFotos = req.files && req.files.length > 0
            ? req.files.map(f => f.path)
            : productoExistente.foto;

        const datosActualizados = {
            nombre,
            precio,
            stock: Number(stock),
            colores: typeof colores === 'string' ? JSON.parse(colores) : colores,
            tallas: typeof tallas === 'string' ? JSON.parse(tallas) : tallas,
            foto: nuevasFotos
        };

        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            { $set: datosActualizados },
            { new: true }
        );

        res.json(productoActualizado);
    } catch (error) {
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
router.use((err, req, res, next) => {
    if (err) {
        console.error("¡ERROR DE MULTER!: ", err.message);
        return res.status(500).json({ error: "Error en el middleware de archivos: " + err.message });
    }
    next();
});
module.exports = router;