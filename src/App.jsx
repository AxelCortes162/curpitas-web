import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './context/RutaProtegida';
import PerfilMascota from './pages/PerfilMascota';
const Registro = lazy(() => import('./pages/Registro'));
const IniciarSesion = lazy(() => import('./pages/IniciarSesion'));
const MiCuenta = lazy(() => import('./pages/MiCuenta'));
import Inicio from './pages/Inicio';
import RutaAdmin from './context/RutaAdmin';
const Admin = lazy(() => import('./pages/Admin'));
const AvisoPrivacidad = lazy(() => import('./pages/AvisoPrivacidad'));
const TerminosCondiciones = lazy(() => import('./pages/TerminosCondiciones'));
const Mapa = lazy(() => import('./pages/Mapa'));
import RutaRescatista from './context/RutaRescatista';
const MisPerros = lazy(() => import('./pages/MisPerros'));
const Adopciones = lazy(() => import('./pages/Adopciones'));
const OlvideContrasena = lazy(() => import('./pages/OlvideContrasena'));
const RestablecerContrasena = lazy(() => import('./pages/RestablecerContrasena'));
const AdminCalculadora = lazy(() => import('./pages/AdminCalculadora'));
const Produccion = lazy(() => import('./pages/Produccion'));
const PedidoManual = lazy(() => import('./pages/PedidoManual'));
const Vendedores = lazy(() => import('./pages/Vendedores'));
const Prospectos = lazy(() => import('./pages/Prospectos'));
const ReferidosCanjes = lazy(() => import('./pages/ReferidosCanjes'));
const PanelVendedor = lazy(() => import('./pages/PanelVendedor'));
import RutaVendedor from './context/RutaVendedor';
const Pedir = lazy(() => import('./pages/Pedir'));
const Gracias = lazy(() => import('./pages/Gracias'));
const PagoFallido = lazy(() => import('./pages/PagoFallido'));
const SeguimientoPedido = lazy(() => import('./pages/SeguimientoPedido'));
import NoEncontrada from './pages/NoEncontrada';

// Al cambiar de página, empezar arriba. Con "atrás" no, para que el
// navegador regrese a donde estaba.
function SubirAlCambiarPagina() {
  const { pathname } = useLocation();
  const tipo = useNavigationType();
  React.useEffect(() => {
    if (tipo !== 'POP') window.scrollTo(0, 0);
  }, [pathname, tipo]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SubirAlCambiarPagina />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
          <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
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
            path="/admin/prospectos"
            element={
              <RutaProtegida>
                <RutaAdmin>
                  <Prospectos />
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
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;