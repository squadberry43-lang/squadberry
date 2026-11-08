import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { legalCopy } from '../i18n/legal';

const contact = '+56 9 11 3240 4239';

type Section = { heading: string; paragraphs: string[] };

const privacy: Section[] = [
  { heading: 'Quién trata los datos', paragraphs: ['Doctor Tech, bajo la marca Drtech.world, gestiona esta plataforma. La identidad legal completa del titular y el correo específico de privacidad están pendientes de confirmación. Mientras tanto, podés escribirnos por WhatsApp al número indicado al final. No consideres este borrador una política definitiva para contratar un servicio.'] },
  { heading: 'Qué información usamos', paragraphs: ['Al crear una cuenta podemos recibir nombre, correo, teléfono, documento y datos de contacto o facturación de una empresa. Al pedir atención guardamos lo que nos contás del equipo, el incidente, mensajes y seguimiento del ticket. No nos envíes contraseñas ni datos sensibles dentro de la descripción del problema.', 'La web guarda la región elegida y datos necesarios para mantener la sesión. Al visitarnos podemos estimar el país a partir de datos de red; siempre podés corregirlo. La medición interna de visitas por región y de instalaciones de la aplicación usa identificadores del navegador y solo se envía si aceptás la analítica opcional. El buscador interno de negocios reúne datos comerciales publicados en fuentes abiertas y sitios de los propios negocios; no se muestra a clientes.'] },
  { heading: 'Para qué los usamos', paragraphs: ['Usamos los datos de cuenta y servicio para identificarte, responder tu solicitud, coordinar una visita o soporte remoto, mantener el historial de atención y cumplir obligaciones administrativas. La región elegida adapta idioma y contenido. No usamos el relato de tu incidente para anuncios de terceros.', 'El tratamiento de estadísticas opcionales busca entender el uso de la web. No cargamos Google Analytics por ahora. Si se incorpora, actualizaremos este aviso y la elección de privacidad antes de activarlo.'] },
  { heading: 'Con quién se comparten', paragraphs: ['El personal autorizado accede solo según su función. Podemos necesitar proveedores de alojamiento, infraestructura o mensajería para operar el servicio. No vendemos datos personales. Antes de una publicación comercial se debe confirmar la lista de proveedores, los países de almacenamiento y las transferencias internacionales.'] },
  { heading: 'Conservación y seguridad', paragraphs: ['Las contraseñas se almacenan como verificadores criptográficos, no como texto visible en la aplicación. Limitamos el acceso a la información según el perfil y usamos medidas técnicas de seguridad. El plazo exacto de conservación de cuentas, tickets, registros y prospectos aún debe definirse según cada país; no afirmamos aquí un plazo que todavía no podemos cumplir.'] },
  { heading: 'Tus opciones y derechos', paragraphs: ['Podés pedir acceso, corrección o eliminación cuando corresponda, y retirar tu elección de analítica desde el enlace de privacidad del pie de página. Para ejercer derechos o pedir que revisemos un dato comercial, escribinos por WhatsApp e indicá cómo podemos localizar el registro. La respuesta y las excepciones legales dependen del país aplicable.'] },
];

const terms: Section[] = [
  { heading: 'Qué ofrece la plataforma', paragraphs: ['Doctor Tech permite describir un problema técnico, solicitar orientación y seguir la atención acordada. La información de la web no reemplaza un diagnóstico. Enviar una solicitud no confirma por sí solo una visita, reparación, precio ni plazo de entrega.'] },
  { heading: 'Cómo se acuerda el servicio', paragraphs: ['Primero revisamos el caso y te indicamos la modalidad disponible: remota, a domicilio o, para empresas, presencial o híbrida. Alcance, disponibilidad, presupuesto, eventuales repuestos y condiciones de pago se conversan y confirman antes de realizar el trabajo. No se cobra una intervención que no hayas aceptado.'] },
  { heading: 'Tu equipo y tus datos', paragraphs: ['Describí el problema con información veraz y evitá compartir claves de acceso en formularios o tickets. Antes de una intervención que pueda afectar archivos, acordaremos contigo las medidas razonables de respaldo y el alcance técnico. Si la atención requiere acceso remoto, debe autorizarse en cada caso.'] },
  { heading: 'Cuenta y uso de la web', paragraphs: ['Mantené tus credenciales en privado y avisá si detectás un acceso no autorizado. No uses la plataforma para enviar contenido ilícito, automatizar solicitudes abusivas o intentar acceder a información de otras personas. Podemos restringir usos que afecten la seguridad del sistema, sin quitar derechos que te correspondan por ley.'] },
  { heading: 'Garantías y derechos del consumidor', paragraphs: ['La garantía y las opciones de cancelación o reclamo de cada servicio se informarán en el presupuesto o acuerdo correspondiente y respetarán la ley aplicable en tu país. Este texto no limita garantías legales ni derechos irrenunciables de consumidores.'] },
  { heading: 'Cambios y contacto', paragraphs: ['Podemos actualizar estas condiciones al cambiar la plataforma o la operación. Indicaremos la fecha de la nueva versión. Para consultas sobre un servicio o este documento, contactanos por WhatsApp. La identidad legal del titular, domicilio y correo comercial todavía deben completarse antes de usar estos términos como versión definitiva.'] },
];

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { locale } = useLocale();
  const international = locale === 'nl-NL' || locale === 'en-US' ? legalCopy[locale] : null;
  const isPrivacy = kind === 'privacy';
  return (
    <div className="bg-[#fbfbfc] text-[#202124]">
      <header className="border-b border-black/10 bg-white px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium text-[#6e6e73]">Doctor Tech · Drtech.world</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{international ? (isPrivacy ? international.privacyTitle : international.termsTitle) : (isPrivacy ? 'Privacidad' : 'Términos de uso')}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f6368]">{international?.notice || 'Borrador para pruebas internas, actualizado el 29 de septiembre de 2026. Pendiente de completar datos del titular y revisión jurídica antes de su uso comercial definitivo.'}</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-14">
        {(international ? (isPrivacy ? international.privacy : international.terms) : (isPrivacy ? privacy : terms)).map((section) => (
          <section key={section.heading} className="border-b border-black/10 py-7 first:pt-0">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 leading-7 text-[#5f6368]">{paragraph}</p>)}
          </section>
        ))}
        <div className="pt-8 text-sm leading-7 text-[#5f6368]">
          <p>{international?.contact || 'Contacto provisional'}: <a className="text-[#0066cc] underline underline-offset-2" href="https://wa.me/5691132404239">WhatsApp {contact}</a></p>
          <p className="mt-3">{international ? <Link className="text-[#0066cc] underline underline-offset-2" to={isPrivacy ? '/terms' : '/privacy'}>{isPrivacy ? international.crossTerms : international.crossPrivacy}</Link> : (isPrivacy ? <>También podés consultar los <Link className="text-[#0066cc] underline underline-offset-2" to="/terms">términos de uso</Link>.</> : <>Consultá cómo tratamos tus datos en <Link className="text-[#0066cc] underline underline-offset-2" to="/privacy">privacidad</Link>.</>)}</p>
        </div>
      </div>
    </div>
  );
}
