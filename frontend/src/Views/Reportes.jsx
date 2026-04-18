import { useEffect, useState } from 'react';
import axios from 'axios';

function Reportes() {
  const API_URL = 'https://basiqo-shop.onrender.com';
  const [stats, setStats] = useState({ totalVentas: 0, totalPedidos: 0 });
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // 1. Corregido: Usamos backticks (``) para que la URL se interpole correctamente
    axios.get(`${API_URL}/api/productos/reportes`)
      .then(res => setStats(res.data))
      .catch(err => console.error("Error en reportes:", err));

    axios.get(`${API_URL}/api/productos/historial`)
      .then(res => setPedidos(res.data))
      .catch(err => console.error("Error en historial:", err));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-black uppercase mb-8 tracking-tight">Reporte de Ventas</h2>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-lg">
          <p className="text-xs opacity-80 uppercase font-black mb-1">Total Vendido</p>
          <p className="text-5xl font-black tracking-tighter">
            ${stats.totalVentas ? Number(stats.totalVentas).toFixed(2) : "0.00"}
          </p>
        </div>
        <div className="bg-white border border-stone-200 p-8 rounded-3xl shadow-sm">
          <p className="text-xs text-stone-400 uppercase font-black mb-1">Pedidos Recibidos</p>
          <p className="text-5xl font-black text-stone-900 tracking-tighter">
            {stats.totalPedidos || 0}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm min-h-[400px]">
        <h3 className="font-black mb-6 uppercase text-sm tracking-widest text-stone-400">Historial de Transacciones</h3>

        <div className="grid grid-cols-4 gap-4 pb-4 border-b border-stone-100 mb-2 text-[10px] font-black text-stone-400 uppercase">
          <span>Fecha</span>
          <span>Total</span>
          <span>Dirección</span>
          <span>Productos</span>
        </div>

        <div className="space-y-2">
          {/* Si está vacío, mostramos un mensaje */}
          {Array.isArray(pedidos) && pedidos.length > 0 ? (
            pedidos.map(p => (
              <div key={p._id} className="grid grid-cols-4 gap-4 py-5 border-b border-stone-50 text-[13px] hover:bg-stone-50 transition-colors px-2 rounded-xl">
                <span className="font-bold text-stone-600">{new Date(p.fecha).toLocaleDateString()}</span>
                <span className="font-black text-emerald-600">${p.total ? p.total.toFixed(2) : '0.00'}</span>
                <span className="text-stone-500 truncate">{p.direccion || 'N/A'}</span>
                <span className="text-stone-400 truncate">{p.productos?.length || 0} items</span>
              </div>
            ))
          ) : (
            <p className="text-center text-stone-400 py-10 font-bold uppercase text-[10px]">No hay pedidos registrados aún</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reportes;