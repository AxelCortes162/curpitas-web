import React, { forwardRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

// El sitekey es público: viaja en el bundle de todos modos. El secret NUNCA
// va aquí — ese solo vive en la configuración de Auth de Supabase.
const SITEKEY =
  import.meta.env.VITE_HCAPTCHA_SITEKEY || 'e13e0584-e842-42ca-a724-399e177af49c';

/**
 * Casilla de captcha para registro e inicio de sesión.
 *
 * Supabase rechaza cualquier signUp / signInWithPassword / resend que no
 * traiga un token válido, así que el token que produce este componente hay
 * que pasarlo en las opciones de esas llamadas.
 *
 * El token se consume en cada intento: después de llamar a Supabase hay que
 * resetear el captcha con la ref, o el segundo intento falla.
 */
export const CaptchaBox = forwardRef(({ onToken }, ref) => (
  <div className="flex justify-center">
    <HCaptcha
      ref={ref}
      sitekey={SITEKEY}
      onVerify={(token) => onToken(token)}
      onExpire={() => onToken('')}
      onError={() => onToken('')}
    />
  </div>
));

CaptchaBox.displayName = 'CaptchaBox';

export default CaptchaBox;
