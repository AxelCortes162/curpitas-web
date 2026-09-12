import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './context/RutaProtegida';
import PerfilMascota from './pages/PerfilMascota';
import Registro from './pages/Registro';
import IniciarSesion from './pages/IniciarSesion';
import MiCuenta from './pages/MiCuenta';
import Inicio from './pages/Inicio';
import RutaAdmin from './context/RutaAdmin';
import Admin from './pages/Admin';
import AvisoPrivacidad from './pages/AvisoPrivacidad';
import Mapa from './pages/Mapa';
import RutaRescatista from './context/RutaRescatista';
import MisPerros from './pages/MisPerros';
import Adopciones from './pages/Adopciones';
import OlvideContrasena from './pages/OlvideContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import AdminCalculadora from './pages/AdminCalculadora';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/adopciones" element={<Adopciones />} />
          <Route
            path="/mis-perros"
            element={
              <RutaProtegida>
                <RutaRescatista>
                  <MisPerros />
                </RutaRescatista>
              </RutaProtegida>
            }
          />
          {/* La búsqueda pública se quitó — el acceso normal es vía QR/NFC */}
          <Route path="/mascota/:curpita" element={<PerfilMascota />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/iniciar-sesion" element={<IniciarSesion />} />
          <Route path="/olvide-mi-contrasena" element={<OlvideContrasena />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
          <Route
            path="/mi-cuenta"
            element={
              <RutaProtegida>
                <MiCuenta />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <Admin />
                </RutaAdmin>
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/calculadora"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <AdminCalculadora />
                </RutaAdmin>
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;