import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Admin from './Views/Admin';
import Catalogo from './Views/Catalogo';
import Login from './Views/Login';
import Reportes from './Views/Reportes';

function App() {
  // Inicializamos leyendo el localStorage. 
  // Esto evita que la sesión se cierre sola al recargar la página.
  const [autenticado, setAutenticado] = useState(() => {
    return localStorage.getItem('estaAutenticado') === 'true';
  });

  // Función para manejar el cambio de estado y sincronizar con localStorage
  const manejarAutenticacion = (estado) => {
    setAutenticado(estado);
    localStorage.setItem('estaAutenticado', estado);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA: Catálogo */}
        <Route path="/" element={<Catalogo />} />

        {/* RUTA PÚBLICA: Login */}
        <Route
          path="/login"
          element={<Login setAutenticado={manejarAutenticacion} />}
        />

        {/* RUTA PROTEGIDA (GUARD): Admin */}
        <Route
          path="/admin"
          element={
            autenticado ? (
              <Admin setAutenticado={manejarAutenticacion} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* REDIRECCIÓN: Si alguien pone una URL inventada, lo lleva al catálogo */}
        <Route path="*" element={<Navigate to="/" replace />} />

        
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;