import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL'];
const COLORES_DISPONIBLES = ['BLANCO', 'NEGRO', 'AZUL NAVY', 'BEIGE', 'VINO', 'VERDE MILITAR'];

function Admin({ setAutenticado }) {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    precio: '',
    stock: [] // 🔥 nuevo formato
  });

  const [imagen, setImagen] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = 'https://basiqo-shop.onrender.com';

  const cerrarSesion = () => {
    setAutenticado(false);
    navigate('/login');
  };

  const fetchProductos = () => {
    axios.get(`${API_URL}/api/productos?t=${Date.now()}`)
      .then(res => setProductos(res.data));
  };

  useEffect(() => { fetchProductos(); }, []);

  const limpiarFormulario = () => {
    setNuevo({ nombre: '', precio: '', stock: [] });
    setImagen(null);
    setEditandoId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 🔥 GENERAR STOCK AUTOMÁTICO
  const generarStock = () => {
    const stockGenerado = COLORES_DISPONIBLES.map(color => ({
      color,
      tallas: TALLAS_DISPONIBLES.map(talla => ({
        talla,
        cantidad: 0
      }))
    }));

    setNuevo(prev => ({ ...prev, stock: stockGenerado }));
  };

  // 🔥 ACTUALIZAR CANTIDAD
  const actualizarCantidad = (colorIndex, tallaIndex, valor) => {
    const nuevoStock = [...nuevo.stock];
    nuevoStock[colorIndex].tallas[tallaIndex].cantidad = parseInt(valor) || 0;
    setNuevo({ ...nuevo, stock: nuevoStock });
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData();
    formData.append('nombre', nuevo.nombre);
    formData.append('precio', nuevo.precio);
    formData.append('stock', JSON.stringify(nuevo.stock));

    if (imagen) {
      for (let i = 0; i < imagen.length; i++) {
        formData.append('foto', imagen[i]);
      }
    }

    try {
      if (editandoId) {
        await axios.put(`${API_URL}/api/productos/${editandoId}`, formData);
      } else {
        await axios.post(`${API_URL}/api/productos`, formData);
      }

      toast.success('Producto guardado');
      fetchProductos();
      setModalAbierto(false);
      limpiarFormulario();

    } catch {
      toast.error('Error al guardar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-10">
      <Toaster />

      <button onClick={() => { limpiarFormulario(); setModalAbierto(true); }}>
        + Agregar Producto
      </button>

      {/* LISTADO */}
      <div className="grid grid-cols-4 gap-4 mt-10">
        {productos.map(p => (
          <div key={p._id} className="border p-4">
            <h2>{p.nombre}</h2>
            <p>${p.precio}</p>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <form onSubmit={guardarProducto} className="bg-white p-6 w-[600px] rounded-xl overflow-y-auto max-h-[90vh]">

            <input
              placeholder="Nombre"
              value={nuevo.nombre}
              onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
            />

            <input
              type="number"
              placeholder="Precio"
              value={nuevo.precio}
              onChange={e => setNuevo({ ...nuevo, precio: e.target.value })}
            />

            {/* 🔥 BOTÓN GENERAR */}
            <button type="button" onClick={generarStock} className="bg-black text-white px-3 py-2 mt-4">
              Generar Stock
            </button>

            {/* 🔥 STOCK POR TALLA Y COLOR */}
            {nuevo.stock.map((colorObj, cIndex) => (
              <div key={cIndex} className="mt-4 border p-3">
                <h3>{colorObj.color}</h3>

                {colorObj.tallas.map((t, tIndex) => (
                  <div key={tIndex} className="flex gap-2 items-center">
                    <span>{t.talla}</span>
                    <input
                      type="number"
                      value={t.cantidad}
                      onChange={(e) => actualizarCantidad(cIndex, tIndex, e.target.value)}
                      className="border w-20"
                    />
                  </div>
                ))}
              </div>
            ))}

            <input type="file" multiple onChange={e => setImagen(e.target.files)} />

            <button type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>

          </form>
        </div>
      )}
    </div>
  );
}

export default Admin;