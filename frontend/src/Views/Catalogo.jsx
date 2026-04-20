import { useEffect, useState } from 'react';
import axios from 'axios';

const WHATSAPP_NUMBER = '593979274459';
const API_URL = 'https://basiqo-shop.onrender.com';

const TALLAS = ['S', 'M', 'L', 'XL'];
const COLORES = ['BLANCO', 'NEGRO', 'AZUL NAVY', 'BEIGE', 'VINO', 'VERDE MILITAR'];

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTalla, setFiltroTalla] = useState('');
  const [filtroColor, setFiltroColor] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [seleccion, setSeleccion] = useState({ talla: '', color: '', cantidad: 1 });
  const [carrito, setCarrito] = useState([]);
  const [direccionFinal, setDireccionFinal] = useState('');

  useEffect(() => {
    const cache = localStorage.getItem('productos');

    if (cache) {
      setProductos(JSON.parse(cache));
      setLoading(false);
    }

    axios.get(`${API_URL}/api/productos`)
      .then(res => {
        setProductos(res.data);
        localStorage.setItem('productos', JSON.stringify(res.data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 🎯 FILTROS
  const productosFiltrados = productos.filter(p => {
    return (
      (!filtroTalla || p.tallas?.includes(filtroTalla)) &&
      (!filtroColor || p.colores?.includes(filtroColor))
    );
  });

  // 🛒 CARRITO
  const agregarAlCarrito = () => {
    const items = Array.from({ length: seleccion.cantidad }, () => ({
      ...productoSeleccionado,
      talla: seleccion.talla,
      color: seleccion.color
    }));

    setCarrito([...carrito, ...items]);
    setProductoSeleccionado(null);
    setSeleccion({ talla: '', color: '', cantidad: 1 });
  };

  const confirmarPedidoYEnviar = async () => {
    const subtotal = carrito.reduce((acc, p) => acc + parseFloat(p.precio), 0);
    const envio = direccionFinal.toLowerCase().includes('calceta') ? 0 : 6;
    const total = subtotal + envio;

    await axios.post(`${API_URL}/api/productos/confirmar-pedido`, {
      productos: carrito,
      total,
      direccion: direccionFinal
    });

    let mensaje = `*PEDIDO BASIQO*%0A%0A`;
    carrito.forEach((p, i) => {
      mensaje += `${i + 1}. ${p.nombre} (${p.talla}, ${p.color}) - $${p.precio}%0A`;
    });
    mensaje += `%0ATotal: $${total}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`);
    setCarrito([]);
    setDireccionFinal('');
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-32">

      {/* HEADER */}
      <div className="text-center py-10">
        <h1 className="text-4xl font-black tracking-tight">BASIQO</h1>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {TALLAS.map(t => (
          <button key={t} onClick={() => setFiltroTalla(t === filtroTalla ? '' : t)}
            className={`px-3 py-1 text-xs border ${filtroTalla === t ? 'bg-black text-white' : ''}`}>
            {t}
          </button>
        ))}

        {COLORES.map(c => (
          <button key={c} onClick={() => setFiltroColor(c === filtroColor ? '' : c)}
            className={`px-3 py-1 text-xs border ${filtroColor === c ? 'bg-black text-white' : ''}`}>
            {c}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 max-w-7xl mx-auto">

        {/* SKELETON */}
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-3"></div>
              <div className="h-3 bg-gray-200 mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 w-1/2"></div>
            </div>
          ))
        }

        {!loading && productosFiltrados.map(p => (
          <div key={p._id} className="group cursor-pointer">

            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
              <img
                src={p.foto || 'https://via.placeholder.com/500'}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>

            <div className="mt-3">
              <h2 className="text-sm font-semibold">{p.nombre}</h2>
              <p className="text-xs text-gray-500">${p.precio}</p>
            </div>

            <button
              onClick={() => setProductoSeleccionado(p)}
              className="mt-2 w-full text-xs border py-2 hover:bg-black hover:text-white transition">
              Seleccionar
            </button>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-bold mb-4">{productoSeleccionado.nombre}</h3>

            <div className="flex gap-2 mb-3">
              {productoSeleccionado.tallas.map(t => (
                <button key={t} onClick={() => setSeleccion({ ...seleccion, talla: t })}
                  className={`border px-2 ${seleccion.talla === t ? 'bg-black text-white' : ''}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              {productoSeleccionado.colores.map(c => (
                <button key={c} onClick={() => setSeleccion({ ...seleccion, color: c })}
                  className={`border px-2 ${seleccion.color === c ? 'bg-black text-white' : ''}`}>
                  {c}
                </button>
              ))}
            </div>

            <button onClick={agregarAlCarrito}
              className="w-full bg-black text-white py-2 mt-3">
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* CARRITO */}
      {carrito.length > 0 && (
        <div className="fixed bottom-5 right-5 bg-white p-4 shadow-xl w-72">
          <p className="text-sm font-bold mb-2">Carrito ({carrito.length})</p>

          <input
            placeholder="Dirección..."
            className="w-full border p-2 mb-2 text-xs"
            value={direccionFinal}
            onChange={e => setDireccionFinal(e.target.value)}
          />

          <button
            onClick={confirmarPedidoYEnviar}
            className="w-full bg-green-600 text-white py-2 text-xs">
            Confirmar
          </button>
        </div>
      )}

    </div>
  );
}

export default Catalogo;