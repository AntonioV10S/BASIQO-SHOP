import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'https://basiqo-shop.onrender.com';

function Reportes() {
  const [stats, setStats] = useState({});
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargarDatos = () => {
    axios.get(`${API_URL}/api/productos/reportes`, {
      params: { desde, hasta }
    })
      .then(res => setStats(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">

      <h2 className="text-3xl font-black mb-8">Dashboard BASIQO</h2>

      {/* FILTRO FECHAS */}
      <div className="flex gap-4 mb-8">
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="border p-2" />
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="border p-2" />
        <button onClick={cargarDatos} className="bg-black text-white px-4">Filtrar</button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-10">

        <div className="bg-black text-white p-6 rounded-xl">
          <p className="text-xs">Ventas Totales</p>
          <h3 className="text-3xl font-bold">${stats.totalVentas?.toFixed(2) || '0.00'}</h3>
        </div>

        <div className="bg-white border p-6 rounded-xl">
          <p className="text-xs text-gray-400">Pedidos</p>
          <h3 className="text-3xl font-bold">{stats.totalPedidos || 0}</h3>
        </div>

        <div className="bg-white border p-6 rounded-xl">
          <p className="text-xs text-gray-400">Ticket Promedio</p>
          <h3 className="text-3xl font-bold">${stats.ticketPromedio?.toFixed(2) || '0.00'}</h3>
        </div>

      </div>

      {/* TOP PRODUCTOS */}
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold mb-4">Productos más vendidos</h3>

        {stats.topProductos?.length > 0 ? (
          stats.topProductos.map((p, i) => (
            <div key={i} className="flex justify-between border-b py-2 text-sm">
              <span>{p.nombre}</span>
              <span>{p.cantidad} ventas</span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">Sin datos</p>
        )}

      </div>

    </div>
  );
}

export default Reportes;