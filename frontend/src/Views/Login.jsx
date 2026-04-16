import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setAutenticado }) {
  const [clave, setClave] = useState('');
  const navigate = useNavigate();

const entrar = (e) => {
    e.preventDefault();
    if (clave === 'BASIQO2026') { 
      setAutenticado(true); // Esto ahora guarda en localStorage gracias a App.jsx
      navigate('/admin');
    } else {
      alert('CÓDIGO NO AUTORIZADO');
    }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={entrar} className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-black mb-6 text-center">LOGIN BASIQO</h2>
        <input 
          type="password" 
          className="w-full border p-3 rounded-lg mb-4" 
          placeholder="Ingrese clave de acceso"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
        <button className="w-full bg-black text-white py-3 rounded-lg font-bold">
          ENTRAR
        </button>
      </form>
    </div>
  );
}

export default Login;