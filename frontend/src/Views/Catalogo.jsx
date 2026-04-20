import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const WHATSAPP_NUMBER = '593979274459';
const API_URL = 'https://basiqo-shop.onrender.com';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [seleccion, setSeleccion] = useState({ talla: '', color: '', cantidad: 1, fotoIndex: 0 });
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

  const getStockDisponible = () => {
    if (!productoSeleccionado || !seleccion.color || !seleccion.talla) return 0;
    const variante = productoSeleccionado.variantes.find(
      v => v.color === seleccion.color && v.talla === seleccion.talla
    );
    return variante ? variante.stock : 0;
  };

  const agregarAlCarrito = () => {
    const stockMax = getStockDisponible();
    if (seleccion.cantidad > stockMax) return toast.error(`Solo quedan ${stockMax} unidades.`);

    const itemNuevo = {
      id: productoSeleccionado._id,
      nombre: productoSeleccionado.nombre,
      precio: productoSeleccionado.precio,
      talla: seleccion.talla,
      color: seleccion.color,
      cantidad: seleccion.cantidad
    };

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
    setSeleccion({ talla: '', color: '', cantidad: 1, fotoIndex: 0 });
    toast.success('Agregado al carrito');
  };

  const confirmarPedidoYEnviar = async () => {
    const subtotal = carrito.reduce((acc, p) => acc + (parseFloat(p.precio) * p.cantidad), 0);
    const costoEnvio = direccionFinal.toLowerCase().includes('calceta') ? 0 : 5.00;
    const total = subtotal + costoEnvio;

    try {
      await axios.post(`${API_URL}/api/productos/confirmar-pedido`, {
        productos: carrito,
        total,
        direccion: direccionFinal
      });

      let mensaje = `*NUEVO PEDIDO - BASIQO*%0A%0A`;
      carrito.forEach(p => {
        mensaje += `• ${p.nombre} [${p.color} / ${p.talla}] x${p.cantidad} - $${(p.precio * p.cantidad).toFixed(2)}%0A`;
      });
      mensaje += `%0A*Subtotal:* $${subtotal.toFixed(2)}%0A*Envío:* $${costoEnvio.toFixed(2)}%0A*TOTAL:* $${total.toFixed(2)}%0A%0A*Dirección:* ${direccionFinal}`;

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
      setCarrito([]);
      setDireccionFinal('');
    } catch (err) {
      toast.error("Error al procesar pedido.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans pb-32">
      <Toaster position="top-center" />

      {/* MODAL DE SELECCIÓN CON CARRUSEL */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-md" onClick={() => setProductoSeleccionado(null)}></div>
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row border border-stone-100">

            {/* Visualizador de Fotos Izquierda */}
            <div className="w-full md:w-1/2 bg-stone-100 relative group">
              <img
                src={productoSeleccionado.foto[seleccion.fotoIndex] || productoSeleccionado.foto[0]}
                className="w-full h-full object-cover aspect-[3/4]"
                alt="Vista previa"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                {productoSeleccionado.foto.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSeleccion({ ...seleccion, fotoIndex: idx })}
                    className={`h-1.5 rounded-full transition-all ${seleccion.fotoIndex === idx ? 'w-8 bg-stone-900' : 'w-2 bg-stone-300'}`}
                  />
                ))}
              </div>
            </div>

            {/* Configuración Derecha */}
            <div className="w-full md:w-1/2 p-10 overflow-y-auto">
              <h3 className="font-black italic uppercase text-2xl mb-2 tracking-tighter">{productoSeleccionado.nombre}</h3>
              <p className="text-xl font-bold text-emerald-600 mb-8">$ {parseFloat(productoSeleccionado.precio).toFixed(2)}</p>

              <div className="space-y-8">
                {/* Colores */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Color Disponible</p>
                  <div className="flex flex-wrap gap-3">
                    {[...new Set(productoSeleccionado.variantes.map(v => v.color))].map(c => (
                      <button key={c} onClick={() => setSeleccion({ ...seleccion, color: c, talla: '' })}
                        className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase transition-all ${seleccion.color === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200'}`}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Tallas */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Talla</p>
                  <div className="flex flex-wrap gap-3">
                    {productoSeleccionado.variantes
                      .filter(v => v.color === seleccion.color)
                      .map(v => (
                        <button key={v.talla} disabled={v.stock <= 0} onClick={() => setSeleccion({ ...seleccion, talla: v.talla })}
                          className={`w-12 h-12 rounded-2xl border text-[11px] font-black transition-all ${v.stock <= 0 ? 'opacity-10 cursor-not-allowed' : ''} ${seleccion.talla === v.talla ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200'}`}>
                          {v.talla}
                        </button>
                      ))}
                  </div>
                  {!seleccion.color && <p className="text-[9px] italic text-stone-400 mt-3">* Selecciona un color para ver tallas</p>}
                </div>

                {/* Cantidad */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Cantidad</p>
                  <div className="flex items-center w-32 bg-stone-100 rounded-2xl p-1">
                    <button onClick={() => setSeleccion(s => ({ ...s, cantidad: Math.max(1, s.cantidad - 1) }))} className="w-10 h-10 font-black">-</button>
                    <span className="flex-1 text-center font-black">{seleccion.cantidad}</span>
                    <button onClick={() => setSeleccion(s => ({ ...s, cantidad: Math.min(getStockDisponible() || 10, s.cantidad + 1) }))} className="w-10 h-10 font-black">+</button>
                  </div>
                </div>
              </div>

              <button onClick={agregarAlCarrito} disabled={!seleccion.talla || !seleccion.color}
                className="w-full mt-10 py-5 bg-stone-900 text-white rounded-[24px] uppercase text-[11px] font-black tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-20">
                Añadir a la bolsa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 bg-[#F9F9F7]/80 backdrop-blur-xl transition-all duration-500 border-b border-stone-100 ${scrolled ? 'py-4' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <h1 className={`font-black italic tracking-tighter uppercase transition-all ${scrolled ? 'text-xl' : 'text-4xl'}`}>BASIQO</h1>
          <div className="flex gap-6 items-center">
            <span className="text-[10px] font-black uppercase tracking-tighter bg-stone-900 text-white px-3 py-1 rounded-full">Ecuador</span>
          </div>
        </div>
      </header>

      {/* GRID PRODUCTOS */}
      <main className="p-8 md:p-16 max-w-7xl mx-auto mt-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
          {productos.map(p => {
            const totalStock = (p.variantes || []).reduce((acc, v) => acc + (v.stock || 0), 0);
            return (
              <div key={p._id} className="group" onClick={() => totalStock > 0 && setProductoSeleccionado(p)}>
                <div className="aspect-[3/4] bg-stone-200 rounded-[40px] overflow-hidden mb-6 relative shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  <img src={p.foto[0]} alt={p.nombre} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${totalStock <= 0 ? 'grayscale opacity-40' : ''}`} />

                  {/* Badge de fotos múltiples */}
                  {p.foto?.length > 1 && (
                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                      +{p.foto.length - 1} Vistas
                    </div>
                  )}

                  {totalStock <= 0 && <div className="absolute inset-0 flex items-center justify-center font-black uppercase text-xs bg-stone-900/40 backdrop-blur-sm text-white italic tracking-tighter">Agotado</div>}
                </div>
                <div className="px-2">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-lg font-black uppercase tracking-tighter text-stone-900">{p.nombre}</h2>
                    <p className="font-bold text-stone-400 italic text-sm">$ {parseFloat(p.precio).toFixed(2)}</p>
                  </div>
                  <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Lo que nunca falla</p>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* CARRITO FLOTANTE */}
      {carrito.length > 0 && (
        <div className="fixed bottom-10 right-10 z-50 w-full max-w-[380px] bg-white p-10 rounded-[40px] shadow-2xl border border-stone-100">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-black text-xs uppercase tracking-[0.2em] italic">Bolsa de Compra</h4>
            <span className="bg-stone-100 px-3 py-1 rounded-full text-[10px] font-black">{carrito.length}</span>
          </div>

          <div className="space-y-5 mb-10 max-h-[30vh] overflow-y-auto pr-2">
            {carrito.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center font-black text-[10px]">{item.cantidad}x</div>
                  <div>
                    <p className="font-black uppercase text-[11px] text-stone-900 leading-tight">{item.nombre}</p>
                    <p className="text-[9px] text-stone-400 font-bold uppercase">{item.color} · {item.talla}</p>
                  </div>
                </div>
                <button onClick={() => setCarrito(carrito.filter((_, i) => i !== index))} className="text-stone-300 hover:text-red-500 transition-colors text-xs">✕</button>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <input
              type="text"
              placeholder="Dirección de envío (Ecuador)..."
              className="w-full p-5 bg-stone-50 rounded-[20px] text-[11px] font-bold border border-stone-100 focus:border-stone-900 transition-all outline-none"
              value={direccionFinal}
              onChange={(e) => setDireccionFinal(e.target.value)}
            />
            <button
              disabled={!direccionFinal}
              onClick={confirmarPedidoYEnviar}
              className="w-full py-6 bg-stone-900 text-white rounded-[24px] uppercase text-[10px] font-black tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-20"
            >
              Confirmar Pedido · $ {carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0).toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalogo;