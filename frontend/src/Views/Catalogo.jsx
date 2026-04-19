import { useEffect, useState } from 'react';
import axios from 'axios';

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

  const agregarAlCarrito = () => {
    const productosParaAgregar = Array.from({ length: seleccion.cantidad }, () => ({
      ...productoSeleccionado,
      talla: seleccion.talla,
      color: seleccion.color
    }));

    setCarrito([...carrito, ...productosParaAgregar]);
    setProductoSeleccionado(null);
    setSeleccion({ talla: '', color: '', cantidad: 1 });
  };

  const confirmarPedidoYEnviar = async () => {
    const subtotal = carrito.reduce((acc, p) => acc + parseFloat(p.precio), 0);
    const costoEnvio = direccionFinal.toLowerCase().includes('calceta') ? 0 : 6.00;
    const total = subtotal + costoEnvio;

    try {
      const res = await axios.post(`${API_URL}/api/productos/confirmar-pedido`, {
        productos: carrito,
        total: total,
        direccion: direccionFinal
      });

      if (res.status === 200 || res.status === 201) {
        let mensaje = `*PEDIDO CONFIRMADO - BASIQO*%0A%0A`;
        carrito.forEach((p, i) => {
          mensaje += `${i + 1}. ${p.nombre} (${p.talla}, ${p.color}) - $${p.precio}%0A`;
        });
        mensaje += `%0A*TOTAL A PAGAR:* $${total.toFixed(2)}`;
        mensaje += `%0A%0A*Dirección:* ${direccionFinal}`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');

        setCarrito([]);
        setDireccionFinal('');
        window.location.reload();
      }
    } catch (err) {
      alert("Lo sentimos, uno de los productos ya no está disponible.");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-stone-900 font-sans pb-32">

      {/* MODAL DE SELECCIÓN */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setProductoSeleccionado(null)}></div>
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10">
            <h3 className="font-black uppercase text-sm mb-6">{productoSeleccionado.nombre}</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[9px] font-bold text-stone-400 mb-2 uppercase">Talla</p>
                <div className="flex flex-wrap gap-1">
                  {productoSeleccionado.tallas?.map(t => (
                    <button key={t} onClick={() => setSeleccion({ ...seleccion, talla: t })} className={`w-8 h-8 border text-[10px] font-black ${seleccion.talla === t ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-stone-400 mb-2 uppercase">Color</p>
                <div className="flex flex-wrap gap-1">
                  {productoSeleccionado.colores?.map(c => (
                    <button key={c} onClick={() => setSeleccion({ ...seleccion, color: c })} className={`px-2 h-8 border text-[9px] font-black uppercase ${seleccion.color === c ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-[9px] font-bold text-stone-400 mb-2 uppercase">Cantidad</p>
              <input
                type="number"
                min="1"
                max={productoSeleccionado.stock}
                value={seleccion.cantidad}
                onChange={(e) => setSeleccion({ ...seleccion, cantidad: parseInt(e.target.value) || 1 })}
                className="w-full p-3 bg-stone-50 rounded-xl text-center font-black"
              />
            </div>
            <button onClick={agregarAlCarrito} disabled={!seleccion.talla || !seleccion.color} className="w-full py-4 bg-stone-900 text-white rounded-xl uppercase text-[10px] font-bold disabled:opacity-30">Agregar al carrito</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 bg-[#f3f2ed]/80 backdrop-blur-md transition-all ${scrolled ? 'py-4' : 'py-10'}`}>
        <div className="text-center"><h1 className={`font-black uppercase ${scrolled ? 'text-2xl' : 'text-5xl'}`}>BASIQO</h1></div>
      </header>

      {/* GRID PRODUCTOS */}
      <main className="p-6 md:p-12 max-w-7xl mx-auto mt-32">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {productos.map(p => (
            <div key={p._id} className="group flex flex-col bg-white p-3 rounded-3xl border border-stone-100 shadow-sm transition-all hover:shadow-2xl">
              <div className="aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden mb-5 relative">
                <img src={p.foto} alt={p.nombre} className={`w-full h-full object-cover ${p.stock <= 0 ? 'grayscale opacity-60' : ''}`} />
                {p.stock <= 0 && <div className="absolute inset-0 flex items-center justify-center font-black uppercase text-xs">Agotado</div>}
              </div>
              <div className="px-2 pb-2">
                <h2 className="text-[15px] font-black uppercase tracking-tight text-stone-900 mb-1">{p.nombre}</h2>
                <p className="text-[13px] font-bold text-stone-500 mb-4 tracking-wider">$ {p.precio}</p>

                <div className="flex flex-col gap-2 mb-4">
                  {p.tallas && (
                    <div className="flex gap-1 flex-wrap">
                      {p.tallas.map(talla => <span key={talla} className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-black text-stone-500 uppercase">{talla}</span>)}
                      {p.colores.map(color => <span key={color} className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-black text-stone-500 uppercase">{color}</span>)}
                    </div>
                  )}
                  <div className="mt-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${p.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {p.stock > 0 ? `${p.stock} unidades disponibles` : 'Producto agotado'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setProductoSeleccionado(p)} disabled={p.stock <= 0} className="w-full py-4 bg-stone-900 text-white text-[11px] font-black uppercase rounded-2xl hover:bg-emerald-600 transition-all">Seleccionar</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CARRITO FLOTANTE */}
      {carrito.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white p-6 rounded-3xl shadow-2xl border border-stone-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-xs uppercase">Tu pedido ({carrito.length})</h4>
            <button onClick={() => setCarrito([])} className="text-[9px] text-red-500 font-bold uppercase">Limpiar todo</button>
          </div>

          <div className="space-y-3 mb-6 max-h-40 overflow-y-auto pr-2">
            {carrito.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-[10px] border-b border-stone-50 pb-2">
                <div>
                  <p className="font-black uppercase">{item.nombre}</p>
                  <p className="text-stone-400">{item.talla} / {item.color}</p>
                </div>
                <button
                  onClick={() => setCarrito(carrito.filter((_, i) => i !== index))}
                  className="text-stone-300 hover:text-red-500 font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Dirección de entrega..."
            className="w-full p-3 mb-4 bg-stone-50 rounded-xl text-[10px]"
            value={direccionFinal}
            onChange={(e) => setDireccionFinal(e.target.value)}
          />

          <button
            disabled={!direccionFinal}
            onClick={confirmarPedidoYEnviar}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl uppercase text-[10px] font-bold disabled:opacity-30"
          >
            Confirmar y Enviar Pedido
          </button>
        </div>
      )}
    </div>
  );
}

export default Catalogo;