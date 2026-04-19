import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORES_DISPONIBLES = ['BLANCO', 'NEGRO', 'AZUL NAVY', 'BEIGE', 'VINO', 'VERDE MILITAR'];

const formatPrice = (price) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);

function Admin({ setAutenticado }) {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', precio: '', stock: 0, colores: [], tallas: [] });
  const [imagen, setImagen] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const cerrarSesion = () => {
    setAutenticado(false);
    toast.success('Sesión finalizada');
    navigate('/login');
  };

  const fetchProductos = () => {
    axios.get(`${API_URL}/api/productos?t=${new Date().getTime()}`)
      .then(res => setProductos(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchProductos(); }, []);

  const limpiarFormulario = () => {
    setNuevo({ nombre: '', precio: '', stock: 0, colores: [], tallas: [] });
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
    setNuevo({ nombre: prod.nombre, precio: prod.precio, stock: prod.stock || 0, colores: prod.colores || [], tallas: prod.tallas || [] });
    setModalAbierto(true);
  };

  const API_URL = 'https://basiqo-shop.onrender.com';

  const guardarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData();
    formData.append('nombre', nuevo.nombre);
    formData.append('precio', nuevo.precio);
    formData.append('stock', parseInt(nuevo.stock) || 0);
    formData.append('colores', JSON.stringify(nuevo.colores));
    formData.append('tallas', JSON.stringify(nuevo.tallas));
    if (imagen && imagen.length > 0) {
    for (let i = 0; i < imagen.length; i++) {
      formData.append('foto', imagen[i]); // "fotos" (plural)
    }
  }

    try {
      if (editandoId) await axios.put(`${API_URL}/api/productos/${editandoId}`, formData);
      else await axios.post(`${API_URL}/api/productos`, formData);
      toast.success('Guardado correctamente');
      fetchProductos();
      setModalAbierto(false);
      limpiarFormulario();
    } catch (err) { toast.error('Error al guardar'); } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8 md:p-16 font-sans text-stone-900">
      <Toaster position="top-right" />

      <header className="mb-12 flex flex-col md:flex-row justify-between items-center border-b border-stone-100 pb-8 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-stone-900">
            Basiqo <span className="text-emerald-500 text-sm tracking-widest uppercase ml-2">Admin</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">Panel de Control & Inventario</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reportes')} className="px-6 py-3 bg-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2">
            Ver Reportes
          </button>
          <button onClick={() => { limpiarFormulario(); setModalAbierto(true); }} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all">
            + Agregar Prenda
          </button>
          <button onClick={cerrarSesion} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {productos.map(p => (
          <div key={p._id} className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-900 transition-all shadow-sm hover:shadow-xl">
            <div className="aspect-[3/4] bg-stone-100 relative">
              {p.foto && <img src={p.foto} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
              {p.stock <= 0 && <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center text-white text-[9px] font-bold tracking-widest uppercase">Agotado</div>}
            </div>
            <div className="p-4">
              <h2 className="text-xs font-bold uppercase truncate mb-1">{p.nombre}</h2>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-mono font-bold text-stone-500">{formatPrice(p.precio)}</span>
                <span className={`text-[9px] font-bold ${p.stock <= 3 ? 'text-red-500' : 'text-stone-400'}`}>{p.stock} unid.</span>
              </div>
              <button onClick={() => iniciarEdicion(p)} className="w-full py-2 bg-stone-50 hover:bg-stone-900 hover:text-white text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setModalAbierto(false)}></div>
          <div className="bg-white w-full max-w-lg p-8 rounded-3xl relative z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6">{editandoId ? 'Editar Prenda' : 'Nueva Prenda'}</h2>

            <form onSubmit={guardarProducto} className="flex flex-col gap-4">
              <input
                className="bg-stone-50 p-4 rounded-xl text-sm"
                placeholder="Nombre"
                value={nuevo.nombre}
                onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  className="bg-stone-50 p-4 rounded-xl text-sm"
                  placeholder="Precio"
                  type="number"
                  value={nuevo.precio}
                  onChange={e => setNuevo({ ...nuevo, precio: e.target.value })}
                  required
                />
                <input
                  className="bg-stone-50 p-4 rounded-xl text-sm"
                  placeholder="Stock"
                  type="number"
                  value={nuevo.stock}
                  onChange={e => setNuevo({ ...nuevo, stock: e.target.value })}
                  required
                />
              </div>

              {/* Sección Colores */}
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Colores</p>
                <div className="flex flex-wrap gap-2">
                  {COLORES_DISPONIBLES.map(c => (
                    <label key={c} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer ${nuevo.colores.includes(c) ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>
                      <input type="checkbox" className="hidden" checked={nuevo.colores.includes(c)} onChange={(e) => handleCheckbox(e, 'colores', c)} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sección Tallas */}
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Tallas</p>
                <div className="flex flex-wrap gap-2">
                  {TALLAS_DISPONIBLES.map(t => (
                    <label key={t} className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] font-bold cursor-pointer ${nuevo.tallas.includes(t) ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>
                      <input type="checkbox" className="hidden" checked={nuevo.tallas.includes(t)} onChange={(e) => handleCheckbox(e, 'tallas', t)} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sección Foto (Singular) */}
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Foto Principal</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setImagen(e.target.files)} // Aquí guardamos toda la lista de archivos
                  className="w-full text-sm bg-stone-50 p-3 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-stone-900 file:text-white hover:file:bg-emerald-600 cursor-pointer"
                />
                {imagen && (
                  <p className="text-[9px] text-emerald-600 mt-1 font-bold">
                    Archivo seleccionado: {imagen.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-4 bg-stone-900 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                {cargando ? 'Procesando...' : (editandoId ? 'Guardar Cambios' : 'Publicar Producto')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;