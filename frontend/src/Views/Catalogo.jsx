import { useEffect, useState } from 'react';
import axios from 'axios';

const WHATSAPP_NUMBER = '593979274459';
const API_URL = 'https://basiqo-shop.onrender.com';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [seleccion, setSeleccion] = useState({ talla: '', color: '', cantidad: 1 });
  const [carrito, setCarrito] = useState([]);
  const [direccionFinal, setDireccionFinal] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/productos`)
      .then(res => setProductos(res.data))
      .finally(() => setLoading(false));
  }, []);

  // 🔥 OBTENER COLORES DISPONIBLES
  const getColoresDisponibles = (producto) => {
    return producto.stock?.filter(c =>
      c.tallas.some(t => t.cantidad > 0)
    );
  };

  // 🔥 OBTENER TALLAS DISPONIBLES SEGÚN COLOR
  const getTallasDisponibles = (producto, color) => {
    const colorObj = producto.stock?.find(c => c.color === color);
    return colorObj?.tallas || [];
  };

  // 🔥 STOCK DISPONIBLE
  const getStock = (producto, color, talla) => {
    const colorObj = producto.stock?.find(c => c.color === color);
    const tallaObj = colorObj?.tallas.find(t => t.talla === talla);
    return tallaObj?.cantidad || 0;
  };

  // 🛒 AGREGAR
  const agregarAlCarrito = () => {
    const stockDisponible = getStock(
      productoSeleccionado,
      seleccion.color,
      seleccion.talla
    );

    if (stockDisponible <= 0) {
      alert("Sin stock");
      return;
    }

    const items = Array.from({ length: seleccion.cantidad }, () => ({
      ...productoSeleccionado,
      talla: seleccion.talla,
      color: seleccion.color
    }));

    setCarrito([...carrito, ...items]);
    setProductoSeleccionado(null);
    setSeleccion({ talla: '', color: '', cantidad: 1 });
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-32">

      <div className="text-center py-10">
        <h1 className="text-4xl font-black">BASIQO</h1>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 max-w-7xl mx-auto">

        {loading && <p>Cargando...</p>}

        {!loading && productos.map(p => (
          <div key={p._id} className="group">

            <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
              <img src={p.foto} className="w-full h-full object-cover" />
            </div>

            <h2 className="mt-2 text-sm font-bold">{p.nombre}</h2>
            <p className="text-xs text-gray-500">${p.precio}</p>

            <button
              onClick={() => setProductoSeleccionado(p)}
              className="w-full border mt-2 py-2 text-xs hover:bg-black hover:text-white">
              Seleccionar
            </button>
          </div>
        ))}
      </div>

      {/* MODAL PRO */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 w-80 rounded-xl">

            <h3 className="font-bold mb-4">{productoSeleccionado.nombre}</h3>

            {/* 🔥 COLORES */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {getColoresDisponibles(productoSeleccionado).map(c => (
                <button
                  key={c.color}
                  onClick={() => setSeleccion({ ...seleccion, color: c.color, talla: '' })}
                  className={`px-3 py-1 border text-xs ${
                    seleccion.color === c.color ? 'bg-black text-white' : ''
                  }`}
                >
                  {c.color}
                </button>
              ))}
            </div>

            {/* 🔥 TALLAS DINÁMICAS */}
            {seleccion.color && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {getTallasDisponibles(productoSeleccionado, seleccion.color).map(t => (
                  <button
                    key={t.talla}
                    disabled={t.cantidad <= 0}
                    onClick={() => setSeleccion({ ...seleccion, talla: t.talla })}
                    className={`px-3 py-1 border text-xs ${
                      seleccion.talla === t.talla ? 'bg-black text-white' : ''
                    } ${t.cantidad <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {t.talla} ({t.cantidad})
                  </button>
                ))}
              </div>
            )}

            <button
              disabled={!seleccion.talla || !seleccion.color}
              onClick={agregarAlCarrito}
              className="w-full bg-black text-white py-2 text-sm disabled:opacity-30"
            >
              Agregar al carrito
            </button>

          </div>
        </div>
      )}

      {/* CARRITO */}
      {carrito.length > 0 && (
        <div className="fixed bottom-5 right-5 bg-white p-4 shadow-xl w-72">
          <p className="text-sm font-bold">Carrito ({carrito.length})</p>

          <input
            placeholder="Dirección..."
            className="w-full border p-2 mt-2 text-xs"
            value={direccionFinal}
            onChange={e => setDireccionFinal(e.target.value)}
          />

          <button className="w-full bg-green-600 text-white py-2 mt-2 text-xs">
            Confirmar pedido
          </button>
        </div>
      )}

    </div>
  );
}

export default Catalogo;