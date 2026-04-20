import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://basiqo-shop.onrender.com';

function Reportes() {
  const [stats, setStats] = useState({ totalVentas: 0, totalPedidos: 0, topProductos: [] });
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resStats, resHistorial] = await Promise.all([
          axios.get(`${API_URL}/api/productos/reportes`),
          axios.get(`${API_URL}/api/productos/historial`)
        ]);
        setStats(resStats.data);
        setPedidos(resHistorial.data);
      } catch (err) {
        console.error("Error cargando reportes:", err);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
      <p className="font-black uppercase tracking-widest animate-pulse">Cargando Datos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] p-6 md:p-12 font-sans text-stone-900">
      <div className="max-w-7xl mx-auto">

        {/* Cabecera */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Basiqo <span className="text-stone-400 not-italic">Analytics</span></h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Panel de Rendimiento y Ventas</p>
          </div>
          <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-700 transition-all">
            Volver a Inventario
          </button>
        </header>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-emerald-500 text-white p-10 rounded-[32px] shadow-xl shadow-emerald-500/20">
            <p className="text-[10px] uppercase font-black mb-2 opacity-80 tracking-widest">Ingresos Totales</p>
            <p className="text-5xl font-black tracking-tighter">
              ${stats.totalVentas ? Number(stats.totalVentas).toLocaleString() : "0"}
            </p>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[32px]">
            <p className="text-[10px] text-stone-400 uppercase font-black mb-2 tracking-widest">Pedidos Exitosos</p>
            <p className="text-5xl font-black text-stone-900 tracking-tighter">
              {stats.totalPedidos || 0}
            </p>
          </div>

          <div className="bg-stone-900 text-white p-10 rounded-[32px]">
            <p className="text-[10px] uppercase font-black mb-2 opacity-60 tracking-widest">Ticket Promedio</p>
            <p className="text-5xl font-black tracking-tighter">
              ${stats.totalPedidos > 0 ? (stats.totalVentas / stats.totalPedidos).toFixed(0) : "0"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Historial Detallado */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-stone-200 shadow-sm">
            <h3 className="font-black mb-8 uppercase text-xs tracking-widest text-stone-400">Historial de Transacciones</h3>

            <div className="space-y-4">
              {pedidos.length > 0 ? (
                pedidos.map(p => (
                  <div key={p._id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-stone-50 rounded-3xl hover:bg-stone-100 transition-all gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-stone-400 uppercase">
                        {new Date(p.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-bold text-stone-600 max-w-[200px] truncate">{p.direccion}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {p.productos?.map((prod, idx) => (
                        <span key={idx} className="bg-white border border-stone-200 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          {prod.cantidad}x {prod.nombre} ({prod.talla})
                        </span>
                      ))}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-stone-900">${p.total?.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em]">Esperando primera venta...</p>
                </div>
              )}
            </div>
          </div>

          {/* Ranking de Productos (Si el backend lo provee) */}
          <div className="bg-white p-10 rounded-[40px] border border-stone-200">
            <h3 className="font-black mb-8 uppercase text-xs tracking-widest text-stone-400">Top Ventas</h3>
            <div className="space-y-6">
              {stats.topProductos?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-stone-300">0{idx + 1}</span>
                    <span className="text-[11px] font-black uppercase">{item.nombre}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                    {item.unidades} vendidos
                  </span>
                </div>
              ))}
              {(!stats.topProductos || stats.topProductos.length === 0) && (
                <p className="text-[10px] font-bold text-stone-300 uppercase italic">Sin datos de ranking aún</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Reportes;