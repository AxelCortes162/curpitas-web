import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './context/RutaProtegida';
import PerfilMascota from './pages/PerfilMascota';
import Registro from './pages/Registro';
import IniciarSesion from './pages/IniciarSesion';
import MiCuenta from './pages/MiCuenta';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* La búsqueda pública se quitó — el acceso normal es vía QR/NFC */}
          <Route path="/mascota/:curpita" element={<PerfilMascota />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/iniciar-sesion" element={<IniciarSesion />} />
          <Route
            path="/mi-cuenta"
            element={
              <RutaProtegida>
                <MiCuenta />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;