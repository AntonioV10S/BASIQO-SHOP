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
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Carga inicial: No depende de ninguna sesión, debe ser pública
    axios.get(`${API_URL}/api/productos`) 
      .then(res => setProductos(res.data))
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar los productos. Verifica el servidor.");
      });
      
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const agregarAlCarrito = () => {
    const nuevoProducto = {
      ...productoSeleccionado,
      talla: seleccion.talla,
      color: seleccion.color,
      cantidad: seleccion.cantidad
    };

    setCarrito([...carrito, nuevoProducto]);
    setProductoSeleccionado(null);
    setSeleccion({ talla: '', color: '', cantidad: 1 });
  };

  const confirmarPedidoYEnviar = async () => {
    const subtotal = carrito.reduce((acc, p) => acc + (parseFloat(p.precio) * p.cantidad), 0);
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
          mensaje += `${i + 1}. ${p.nombre} (x${p.cantidad}) (${p.talla}, ${p.color}) - $${(p.precio * p.cantidad).toFixed(2)}%0A`;
        });
        mensaje += `%0A*TOTAL A PAGAR:* $${total.toFixed(2)}`;
        mensaje += `%0A%0A*Dirección:* ${direccionFinal}`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');

        setCarrito([]);
        setDireccionFinal('');
      }
    } catch (err) {
      alert("Error al confirmar el pedido. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-stone-900 font-sans pb-32">
      {/* ... (Tu código de Modal de selección se mantiene igual) ... */}
      
      <header className={`fixed top-0 w-full z-40 bg-[#f3f2ed]/80 backdrop-blur-md transition-all ${scrolled ? 'py-4' : 'py-10'}`}>
        <div className="text-center"><h1 className={`font-black uppercase ${scrolled ? 'text-2xl' : 'text-5xl'}`}>BASIQO</h1></div>
      </header>

      <main className="p-6 md:p-12 max-w-7xl mx-auto mt-32">
        {error && <p className="text-center text-red-500 font-bold">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {productos.map(p => (
            <div key={p._id} className="group flex flex-col bg-white p-3 rounded-3xl border border-stone-100 shadow-sm transition-all hover:shadow-2xl">
              <div className="aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden mb-5 relative">
                {/* CORRECCIÓN: Si p.foto es array, toma el índice 0 */}
                <img 
                  src={Array.isArray(p.foto) ? p.foto[0] : p.foto} 
                  alt={p.nombre} 
                  className={`w-full h-full object-cover ${p.stock <= 0 ? 'grayscale opacity-60' : ''}`} 
                />
                {p.stock <= 0 && <div className="absolute inset-0 flex items-center justify-center font-black uppercase text-xs">Agotado</div>}
              </div>
              <div className="px-2 pb-2">
                <h2 className="text-[15px] font-black uppercase tracking-tight text-stone-900 mb-1">{p.nombre}</h2>
                <p className="text-[13px] font-bold text-stone-500 mb-4 tracking-wider">$ {p.precio}</p>
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
                {/* REPARADO: Botón con "X" */}
                <button
                  onClick={() => setCarrito(carrito.filter((_, i) => i !== index))}
                  className="text-stone-300 hover:text-red-500 font-bold px-2"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          
          {/* ... (Input y botón confirmar siguen igual) ... */}
        </div>
      )}
    </div>
  );
}

export default Catalogo;