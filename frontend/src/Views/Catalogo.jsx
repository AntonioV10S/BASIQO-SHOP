import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const WHATSAPP_NUMBER = '593979274459';
const API_URL = 'https://basiqo-shop.onrender.com';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [seleccion, setSeleccion] = useState({ talla: '', color: '', cantidad: 1 });
  const [carrito, setCarrito] = useState([]);
  const [direccionFinal, setDireccionFinal] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    axios.get(`${API_URL}/api/productos`)
      .then(res => setProductos(res.data))
      .catch(err => console.error("Error al cargar productos:", err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Obtener stock máximo de la variante seleccionada
  const getStockDisponible = () => {
    if (!productoSeleccionado || !seleccion.color || !seleccion.talla) return 0;
    const variante = productoSeleccionado.variantes.find(
      v => v.color === seleccion.color && v.talla === seleccion.talla
    );
    return variante ? variante.stock : 0;
  };

  const agregarAlCarrito = () => {
    const stockMax = getStockDisponible();
    if (seleccion.cantidad > stockMax) {
      return toast.error(`Solo quedan ${stockMax} unidades de esta combinación.`);
    }

    const itemNuevo = {
      id: productoSeleccionado._id,
      nombre: productoSeleccionado.nombre,
      precio: productoSeleccionado.precio,
      talla: seleccion.talla,
      color: seleccion.color,
      cantidad: seleccion.cantidad
    };

    // Si ya existe la misma prenda con misma talla/color, sumamos cantidad
    const existeIdx = carrito.findIndex(item =>
      item.id === itemNuevo.id && item.talla === itemNuevo.talla && item.color === itemNuevo.color
    );

    if (existeIdx > -1) {
      const nuevoCarrito = [...carrito];
      nuevoCarrito[existeIdx].cantidad += itemNuevo.cantidad;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, itemNuevo]);
    }

    setProductoSeleccionado(null);
    setSeleccion({ talla: '', color: '', cantidad: 1 });
    toast.success('Agregado al carrito');
  };

  const confirmarPedidoYEnviar = async () => {
    const subtotal = carrito.reduce((acc, p) => acc + (parseFloat(p.precio) * p.cantidad), 0);
    const costoEnvio = direccionFinal.toLowerCase().includes('calceta') ? 0 : 5.00; // Ajustado a valor estándar
    const total = subtotal + costoEnvio;

    try {
      const res = await axios.post(`${API_URL}/api/productos/confirmar-pedido`, {
        productos: carrito,
        total: total,
        direccion: direccionFinal
      });

      if (res.status === 200 || res.status === 201) {
        let mensaje = `*NUEVO PEDIDO - BASIQO*%0A%0A`;
        carrito.forEach((p, i) => {
          mensaje += `• ${p.nombre} [${p.color} / ${p.talla}] x${p.cantidad} - $${(p.precio * p.cantidad).toFixed(2)}%0A`;
        });
        mensaje += `%0A*Subtotal:* $${subtotal.toFixed(2)}`;
        mensaje += `%0A*Envío:* $${costoEnvio.toFixed(2)}`;
        mensaje += `%0A*TOTAL:* $${total.toFixed(2)}`;
        mensaje += `%0A%0A*Dirección:* ${direccionFinal}`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
        setCarrito([]);
        setDireccionFinal('');
      }
    } catch (err) {
      toast.error("Stock agotado o error en el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans pb-32">
      <Toaster position="top-center" />

      {/* MODAL DE SELECCIÓN */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setProductoSeleccionado(null)}></div>
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl relative z-10 border border-stone-100">
            <h3 className="font-black italic uppercase text-lg mb-2">{productoSeleccionado.nombre}</h3>
            <p className="text-[10px] font-bold text-stone-400 mb-6 uppercase tracking-widest">Selecciona tus preferencias</p>

            <div className="space-y-6 mb-8">
              {/* Selector de Color */}
              <div>
                <p className="text-[9px] font-black text-stone-900 mb-3 uppercase">Color</p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(productoSeleccionado.variantes.map(v => v.color))].map(c => (
                    <button key={c} onClick={() => setSeleccion({ ...seleccion, color: c, talla: '' })}
                      className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${seleccion.color === c ? 'bg-stone-900 text-white' : 'bg-stone-50 border-stone-200'}`}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Selector de Talla (Filtrado por Color) */}
              <div>
                <p className="text-[9px] font-black text-stone-900 mb-3 uppercase">Talla {seleccion.color && `en ${seleccion.color}`}</p>
                <div className="flex flex-wrap gap-2">
                  {productoSeleccionado.variantes
                    .filter(v => v.color === seleccion.color)
                    .map(v => (
                      <button
                        key={v.talla}
                        disabled={v.stock <= 0}
                        onClick={() => setSeleccion({ ...seleccion, talla: v.talla })}
                        className={`w-10 h-10 rounded-xl border text-[10px] font-black transition-all ${v.stock <= 0 ? 'opacity-20 cursor-not-allowed' : ''} ${seleccion.talla === v.talla ? 'bg-stone-900 text-white' : 'bg-stone-50 border-stone-200'}`}>
                        {v.talla}
                      </button>
                    ))}
                </div>
                {!seleccion.color && <p className="text-[8px] italic text-stone-400 mt-2">* Elige un color primero</p>}
              </div>

              {/* Cantidad */}
              <div>
                <p className="text-[9px] font-black text-stone-900 mb-3 uppercase">Cantidad</p>
                <div className="flex items-center gap-4 bg-stone-100 p-2 rounded-2xl">
                  <button onClick={() => setSeleccion(s => ({ ...s, cantidad: Math.max(1, s.cantidad - 1) }))} className="w-8 h-8 font-black">-</button>
                  <span className="flex-1 text-center font-black text-sm">{seleccion.cantidad}</span>
                  <button onClick={() => setSeleccion(s => ({ ...s, cantidad: Math.min(getStockDisponible(), s.cantidad + 1) }))} className="w-8 h-8 font-black">+</button>
                </div>
              </div>
            </div>

            <button onClick={agregarAlCarrito} disabled={!seleccion.talla || !seleccion.color} className="w-full py-4 bg-stone-900 text-white rounded-2xl uppercase text-[11px] font-black shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-20">
              Agregar al carrito
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 bg-[#F9F9F7]/80 backdrop-blur-xl transition-all duration-500 border-b border-stone-100 ${scrolled ? 'py-4' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <h1 className={`font-black italic tracking-tighter uppercase transition-all ${scrolled ? 'text-xl' : 'text-3xl'}`}>BASIQO</h1>
          <nav className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest">
            <a href="#" className="hover:text-emerald-600">Esenciales</a>
            <a href="#" className="hover:text-emerald-600">Colecciones</a>
          </nav>
        </div>
      </header>

      {/* GRID PRODUCTOS */}
      <main className="p-6 md:p-12 max-w-7xl mx-auto mt-32">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {productos.map(p => {
            const totalStock = (p.variantes || []).reduce((acc, v) => acc + (v.stock || 0), 0);
            return (
              <div key={p._id} className="group cursor-pointer" onClick={() => totalStock > 0 && setProductoSeleccionado(p)}>
                <div className="aspect-[3/4] bg-stone-200 rounded-[32px] overflow-hidden mb-4 relative shadow-sm transition-transform duration-700 hover:scale-[1.02]">
                  <img src={p.foto[0]} alt={p.nombre} className={`w-full h-full object-cover ${totalStock <= 0 ? 'grayscale opacity-40' : ''}`} />
                  {totalStock <= 0 && <div className="absolute inset-0 flex items-center justify-center font-black uppercase text-[10px] bg-stone-900/20 backdrop-blur-sm text-white">Sold Out</div>}
                </div>
                <div className="px-1">
                  <h2 className="text-[12px] font-black uppercase tracking-tight text-stone-900 mb-1">{p.nombre}</h2>
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-stone-400 italic">$ {parseFloat(p.precio).toLocaleString()}</p>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Novedad</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* CARRITO FLOTANTE */}
      {carrito.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 w-full max-w-[340px] bg-white p-8 rounded-[32px] shadow-2xl border border-stone-100 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-[11px] uppercase tracking-widest italic">Tu Selección ({carrito.reduce((a, b) => a + b.cantidad, 0)})</h4>
            <button onClick={() => setCarrito([])} className="text-[9px] text-stone-300 hover:text-red-500 font-bold uppercase transition-colors">Vaciar</button>
          </div>

          <div className="space-y-4 mb-8 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
            {carrito.map((item, index) => (
              <div key={index} className="flex justify-between items-start text-[10px] group">
                <div className="flex gap-3">
                  <span className="font-black text-emerald-600">{item.cantidad}x</span>
                  <div>
                    <p className="font-black uppercase text-stone-900">{item.nombre}</p>
                    <p className="text-stone-400 font-bold">{item.color} / {item.talla}</p>
                  </div>
                </div>
                <button onClick={() => setCarrito(carrito.filter((_, i) => i !== index))} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 font-bold px-2 transition-all">✕</button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Dirección exacta en Ecuador..."
              className="w-full p-4 bg-stone-100 rounded-2xl text-[11px] font-bold border-none focus:ring-2 focus:ring-stone-900"
              value={direccionFinal}
              onChange={(e) => setDireccionFinal(e.target.value)}
            />
            <button
              disabled={!direccionFinal}
              onClick={confirmarPedidoYEnviar}
              className="w-full py-5 bg-stone-900 text-white rounded-[20px] uppercase text-[10px] font-black tracking-widest shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-20"
            >
              Confirmar Pedido ($ {carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0).toLocaleString()})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalogo;