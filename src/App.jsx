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
import Produccion from './pages/Produccion';
import PedidoManual from './pages/PedidoManual';
import Vendedores from './pages/Vendedores';
import ReferidosCanjes from './pages/ReferidosCanjes';
import PanelVendedor from './pages/PanelVendedor';
import RutaVendedor from './context/RutaVendedor';
import Pedir from './pages/Pedir';
import Gracias from './pages/Gracias';
import PagoFallido from './pages/PagoFallido';
import SeguimientoPedido from './pages/SeguimientoPedido';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/adopciones" element={<Adopciones />} />
          <Route path="/pedir" element={<Pedir />} />
          <Route path="/gracias" element={<Gracias />} />
          <Route path="/pago-fallido" element={<PagoFallido />} />
          <Route path="/pedido/:id" element={<SeguimientoPedido />} />
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
          <Route
            path="/admin/produccion"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <Produccion />
                </RutaAdmin>
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/pedido-manual"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <PedidoManual />
                </RutaAdmin>
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/vendedores"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <Vendedores />
                </RutaAdmin>
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/referidos"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <ReferidosCanjes />
                </RutaAdmin>
              </RutaProtegida>
            }
          />
          <Route
            path="/vendedor"
            element={
              <RutaProtegida>
                <RutaVendedor>
                  <PanelVendedor />
                </RutaVendedor>
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;