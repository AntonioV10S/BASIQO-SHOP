import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORES_DISPONIBLES = ['BLANCO', 'NEGRO', 'AZUL NAVY', 'BEIGE', 'VINO', 'VERDE MILITAR'];
const API_URL = 'https://basiqo-shop.onrender.com';

const formatPrice = (price) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);

function Admin({ setAutenticado }) {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', precio: '', descripcion: '', colores: [], tallas: [] });
  const [variantes, setVariantes] = useState([]); // Nuevo estado para stock detallado
  const [imagen, setImagen] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchProductos = () => {
    axios.get(`${API_URL}/api/productos`)
      .then(res => setProductos(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchProductos(); }, []);

  // Generar variantes automáticamente cuando cambian colores o tallas
  useEffect(() => {
    if (!editandoId) { // Solo auto-generar si es producto nuevo
      const nuevasVariantes = [];
      nuevo.colores.forEach(c => {
        nuevo.tallas.forEach(t => {
          nuevasVariantes.push({ color: c, talla: t, stock: 0 });
        });
      });
      setVariantes(nuevasVariantes);
    }
  }, [nuevo.colores, nuevo.tallas, editandoId]);

  const handleStockChange = (color, talla, valor) => {
    setVariantes(prev => prev.map(v =>
      (v.color === color && v.talla === talla) ? { ...v, stock: parseInt(valor) || 0 } : v
    ));
  };

  const limpiarFormulario = () => {
    setNuevo({ nombre: '', precio: '', descripcion: '', colores: [], tallas: [] });
    setVariantes([]);
    setImagen(null);
    setEditandoId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCheckbox = (e, campo, valor) => {
    const { checked } = e.target;
    setNuevo(prev => ({
      ...prev,
      [campo]: checked ? [...prev[campo], valor] : prev[campo].filter(i => i !== valor)
    }));
  };

  const iniciarEdicion = (prod) => {
    setEditandoId(prod._id);
    setNuevo({
      nombre: prod.nombre,
      precio: prod.precio,
      descripcion: prod.descripcion,
      colores: [...new Set(prod.variantes.map(v => v.color))],
      tallas: [...new Set(prod.variantes.map(v => v.talla))]
    });
    setVariantes(prod.variantes);
    setModalAbierto(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const formData = new FormData();
      formData.append('nombre', nuevo.nombre);
      formData.append('precio', nuevo.precio);
      formData.append('descripcion', nuevo.descripcion || '');

      const variantesParaEnviar = variantes && variantes.length > 0 ? variantes : [];
      formData.append('variantes', JSON.stringify(variantesParaEnviar));

      if (imagen && imagen.length > 0) {
        for (let i = 0; i < imagen.length; i++) {
          formData.append('foto', imagen[i]);
        }
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (editandoId) {
        // LLAMADA PUT
        const res = await axios.put(`${API_URL}/api/productos/${editandoId}`, formData, config);
        console.log("Respuesta servidor:", res.data);
        toast.success('Cambios guardados');
      } else {
        // LLAMADA POST
        await axios.post(`${API_URL}/api/productos`, formData, config);
        toast.success('Producto creado');
      }

      fetchProductos();
      setModalAbierto(false);
      limpiarFormulario();
    } catch (err) {

      console.error("Detalle del error:", err.response?.data || err.message);
      toast.error('Error interno del servidor (500)');
    } finally {
      setCargando(false);
    }
  };

  const calcularTotalStock = (vars) => vars.reduce((acc, v) => acc + (v.stock || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-12 font-sans text-stone-900">
      <Toaster position="bottom-center" />

      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end border-b border-stone-200 pb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Basiqo <span className="text-stone-400 not-italic font-light">Inventory</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mt-2">Gestión de Stock por Variantes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { limpiarFormulario(); setModalAbierto(true); }} className="px-8 py-4 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg">
            + Nuevo Ingreso
          </button>
        </div>
      </header>

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {productos.map(p => {
          const totalStock = calcularTotalStock(p.variantes);
          return (
            <div key={p._id} className="group bg-white rounded-3xl overflow-hidden border border-transparent hover:border-stone-200 transition-all">
              <div className="aspect-[3/4] bg-stone-200 relative overflow-hidden">
                <img src={p.foto[0]} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                {totalStock <= 0 && <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-black uppercase italic">Sold Out</div>}
              </div>
              <div className="p-5 text-center">
                <h2 className="text-[11px] font-black uppercase mb-1 truncate">{p.nombre}</h2>
                <p className="text-[10px] font-bold text-stone-400 mb-3">{formatPrice(p.precio)}</p>
                <div className="flex justify-center gap-1 mb-4">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${totalStock < 5 ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                    {totalStock} DISPONIBLES
                  </span>
                </div>
                <button onClick={() => iniciarEdicion(p)} className="w-full py-3 border border-stone-200 rounded-xl text-[9px] font-bold uppercase hover:bg-stone-900 hover:text-white transition-all">Gestionar</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Moderno */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setModalAbierto(false)}></div>
          <div className="bg-white w-full max-w-2xl p-10 rounded-[40px] relative z-10 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black uppercase italic italic tracking-tighter">{editandoId ? 'Actualizar Stock' : 'Ingresar Prenda'}</h2>
              <button onClick={() => setModalAbierto(false)} className="text-stone-300 hover:text-stone-900">✕</button>
            </div>

            <form onSubmit={guardarProducto} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input className="w-full bg-stone-100 p-4 rounded-2xl text-sm font-bold" placeholder="Nombre de la prenda" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} required />
                  <input className="w-full bg-stone-100 p-4 rounded-2xl text-sm font-bold" placeholder="Precio (COP)" type="number" value={nuevo.precio} onChange={e => setNuevo({ ...nuevo, precio: e.target.value })} required />
                </div>
                <textarea className="w-full bg-stone-100 p-4 rounded-2xl text-sm font-bold h-full" placeholder="Descripción corta..." value={nuevo.descripcion} onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })} />
              </div>

              {/* Selectores de Atributos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-stone-100">
                <div>
                  <p className="text-[10px] font-black uppercase mb-4 text-stone-400">1. Selecciona Colores</p>
                  <div className="flex flex-wrap gap-2">
                    {COLORES_DISPONIBLES.map(c => (
                      <label key={c} className={`px-4 py-2 rounded-xl border text-[9px] font-black cursor-pointer transition-all ${nuevo.colores.includes(c) ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-white text-stone-400 border-stone-200'}`}>
                        <input type="checkbox" className="hidden" checked={nuevo.colores.includes(c)} onChange={(e) => handleCheckbox(e, 'colores', c)} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase mb-4 text-stone-400">2. Selecciona Tallas</p>
                  <div className="flex flex-wrap gap-2">
                    {TALLAS_DISPONIBLES.map(t => (
                      <label key={t} className={`w-10 h-10 flex items-center justify-center rounded-xl border text-[10px] font-black cursor-pointer transition-all ${nuevo.tallas.includes(t) ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white text-stone-400 border-stone-200'}`}>
                        <input type="checkbox" className="hidden" checked={nuevo.tallas.includes(t)} onChange={(e) => handleCheckbox(e, 'tallas', t)} />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* LISTADO DE STOCK DETALLADO */}
              {variantes.length > 0 && (
                <div className="bg-stone-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black uppercase mb-6 text-stone-900 italic">3. Define Stock por combinación</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {variantes.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
                        <span className="text-[10px] font-black uppercase">{v.color} / {v.talla}</span>
                        <input
                          type="number"
                          min="0"
                          className="w-16 text-center text-sm font-black bg-stone-100 rounded-lg p-1"
                          value={v.stock}
                          onChange={(e) => handleStockChange(v.color, v.talla, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-stone-400">4. Galería de Imágenes</p>
                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={e => setImagen(e.target.files)} className="w-full text-[10px] font-bold bg-stone-100 p-4 rounded-2xl cursor-pointer" />
              </div>

              <button type="submit" disabled={cargando} className="w-full py-5 bg-stone-900 text-white text-[11px] font-black uppercase rounded-2xl hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50">
                {cargando ? 'Sincronizando...' : (editandoId ? 'Guardar Cambios en Inventario' : 'Lanzar al Catálogo')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;