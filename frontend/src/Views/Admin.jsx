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
  const [nuevo, setNuevo] = useState({ 
    nombre: '', 
    precio: '', 
    stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 
    colores: [], 
    tallas: [] 
  });
  const [imagen, setImagen] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchProductos = () => {
    axios.get(`${API_URL}/api/productos?t=${new Date().getTime()}`)
      .then(res => setProductos(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchProductos(); }, []);

  const limpiarFormulario = () => {
    setNuevo({ nombre: '', precio: '', stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, colores: [], tallas: [] });
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

  const handleStockChange = (talla, valor) => {
    setNuevo(prev => ({
      ...prev,
      stock: { ...prev.stock, [talla]: parseInt(valor) || 0 }
    }));
  };

  const iniciarEdicion = (prod) => {
    setEditandoId(prod._id);
    setNuevo({ 
        nombre: prod.nombre, 
        precio: prod.precio, 
        stock: prod.stock || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 
        colores: prod.colores || [], 
        tallas: prod.tallas || [] 
    });
    setModalAbierto(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData();
    formData.append('nombre', nuevo.nombre);
    formData.append('precio', nuevo.precio);
    formData.append('stock', JSON.stringify(nuevo.stock)); 
    formData.append('colores', JSON.stringify(nuevo.colores));
    formData.append('tallas', JSON.stringify(nuevo.tallas));
    
    if (imagen) {
        for (let i = 0; i < imagen.length; i++) {
            formData.append('foto', imagen[i]);
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
      <header className="mb-12 flex justify-between items-center border-b border-stone-100 pb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Basiqo <span className="text-emerald-500 text-sm tracking-widest uppercase ml-2">Admin</span></h1>
        <button onClick={() => { limpiarFormulario(); setModalAbierto(true); }} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600">
            + Agregar Prenda
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {productos.map(p => (
          <div key={p._id} className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="aspect-[3/4] bg-stone-100 relative">
               {p.foto && p.foto.length > 0 && <img src={p.foto[0]} alt={p.nombre} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <h2 className="text-xs font-bold uppercase truncate mb-1">{p.nombre}</h2>
              <p className="text-[9px] text-stone-400 mb-2">Total Stock: {Object.values(p.stock || {}).reduce((a, b) => a + b, 0)}</p>
              <button onClick={() => iniciarEdicion(p)} className="w-full py-2 bg-stone-900 text-white text-[9px] font-bold uppercase rounded-lg">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg p-8 rounded-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-black uppercase mb-6">{editandoId ? 'Editar Prenda' : 'Nueva Prenda'}</h2>
            <form onSubmit={guardarProducto} className="flex flex-col gap-4">
              <input className="bg-stone-50 p-4 rounded-xl text-sm" placeholder="Nombre" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} required />
              <input className="bg-stone-50 p-4 rounded-xl text-sm" placeholder="Precio" type="number" value={nuevo.precio} onChange={e => setNuevo({ ...nuevo, precio: e.target.value })} required />
              
              {/* STOCK */}
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Inventario por Talla</p>
                <div className="grid grid-cols-3 gap-2">
                    {TALLAS_DISPONIBLES.map(t => (
                        <div key={t}>
                            <label className="text-[9px] font-bold text-stone-500">{t}</label>
                            <input type="number" min="0" value={nuevo.stock[t] || 0} onChange={(e) => handleStockChange(t, e.target.value)} className="w-full bg-stone-50 p-2 rounded-lg text-xs" />
                        </div>
                    ))}
                </div>
              </div>

              {/* COLORES */}
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Colores</p>
                <div className="flex flex-wrap gap-2">
                    {COLORES_DISPONIBLES.map(c => (
                        <label key={c} className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer border ${nuevo.colores.includes(c) ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>
                            <input type="checkbox" className="hidden" checked={nuevo.colores.includes(c)} onChange={(e) => handleCheckbox(e, 'colores', c)} />
                            {c}
                        </label>
                    ))}
                </div>
              </div>

              {/* TALLAS (Selección visual) */}
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Tallas Disponibles</p>
                <div className="flex flex-wrap gap-2">
                    {TALLAS_DISPONIBLES.map(t => (
                        <label key={t} className={`w-8 h-8 flex items-center justify-center rounded border text-[10px] font-bold cursor-pointer ${nuevo.tallas.includes(t) ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>
                            <input type="checkbox" className="hidden" checked={nuevo.tallas.includes(t)} onChange={(e) => handleCheckbox(e, 'tallas', t)} />
                            {t}
                        </label>
                    ))}
                </div>
              </div>

              {/* FOTO */}
              <input type="file" multiple accept="image/*" onChange={e => setImagen(e.target.files)} className="text-xs" />

              <button type="submit" disabled={cargando} className="w-full py-4 bg-stone-900 text-white rounded-xl uppercase font-bold text-[10px]">
                {cargando ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;