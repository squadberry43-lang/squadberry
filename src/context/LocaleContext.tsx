import { createContext, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConsent } from './ConsentContext';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { customerCopy } from '../i18n/customer';
import { accountCopy as clientAccountCopy } from '../i18n/account';
import { internationalServicesCopy } from '../i18n/services';
import { publicUiCopy } from '../i18n/public-ui';
import { adminCopy } from '../i18n/admin';
import { navigationCopy } from '../i18n/navigation';
import { ticketsCopy } from '../i18n/tickets';
import { operationsCopy } from '../i18n/operations';
import { managementCopy } from '../i18n/management';
import { staffUiCopy } from '../i18n/staff-ui';
import { prospectsCopy } from '../i18n/prospects';
import { createUuid } from '../utils/uuid';

export type CountryCode = 'AR' | 'CL' | 'ES' | 'NL' | 'US';
export type LocaleCode = 'es-AR' | 'es-CL' | 'es-ES' | 'nl-NL' | 'en-US';

type Region = { country: CountryCode; locale: LocaleCode; source: 'detected' | 'manual' };
type LocaleContextValue = Region & {
  setCountry: (country: CountryCode, alreadySaved?: boolean) => Promise<void>;
  t: (key: string) => string;
};

const STORAGE_KEY = 'doctor-tech-region';
const VISITOR_KEY = 'doctor-tech-regional-visitor';

const regions: Record<CountryCode, Omit<Region, 'source'>> = {
  AR: { country: 'AR', locale: 'es-AR' },
  CL: { country: 'CL', locale: 'es-CL' },
  ES: { country: 'ES', locale: 'es-ES' },
  NL: { country: 'NL', locale: 'nl-NL' },
  US: { country: 'US', locale: 'en-US' },
};

export const copy: Record<LocaleCode, Record<string, string>> = {
  'es-AR': {
    'nav.services': 'Servicios', 'nav.how': 'Cómo funciona', 'nav.login': 'Ingresar', 'nav.request': 'Solicitar atención', 'nav.logout': 'Cerrar sesión', 'nav.menu': 'Menú', 'nav.more': 'Más', 'nav.moreOptions': 'Más opciones', 'nav.country': 'País o región', 'nav.home': 'Inicio',
    'country.AR': 'Argentina', 'country.CL': 'Chile', 'country.ES': 'España', 'country.NL': 'Países Bajos', 'country.US': 'Estados Unidos',
    'home.eyebrow': 'Atención técnica para tus equipos', 'home.title': 'El doctor de tus equipos llega cuando algo se detiene.', 'home.lead': 'Doctor Tech acompaña a personas y negocios con diagnóstico claro, atención humana y seguimiento real.', 'home.request': 'Solicitar atención', 'home.explore': 'Ver cómo te ayudamos',
    'home.different': 'Una atención diferente', 'home.understand': 'Primero entendemos el síntoma.', 'home.explanation': 'No tenés que elegir una reparación ni conocer términos técnicos. Nos contás qué le pasa a tu equipo, revisamos el contexto y te recomendamos una forma concreta de seguir.', 'home.care': 'Qué podemos cuidar', 'home.start': 'Elegí el punto de partida.', 'home.all': 'Ver todas las opciones', 'home.tell': 'Contar mi caso', 'home.process': 'Cómo trabajamos', 'home.final': 'Empezamos por diagnosticar lo que necesitás.', 'home.talk': 'Hablar con Doctor Tech',
    'area.personal.title': 'Dispositivos personales', 'area.personal.text': 'Celulares, tablets y accesorios que usás todos los días.', 'area.personal.incident': 'Mi dispositivo necesita atención', 'area.computers.title': 'Computadoras', 'area.computers.text': 'Equipos de estudio, trabajo y creación que no pueden esperar.', 'area.computers.incident': 'Necesito ayuda con mi computadora', 'area.network.title': 'Conectividad', 'area.network.text': 'Wi-Fi, red y equipos que tienen que funcionar juntos.', 'area.network.incident': 'Tengo un problema de conexión', 'area.business.title': 'Empresas', 'area.business.text': 'Soporte ordenado para personas, equipos y operaciones.', 'area.business.incident': 'Necesito soporte para mi empresa',
    'step.1.title': 'Nos contás qué pasó', 'step.1.text': 'Un relato simple es suficiente para empezar.', 'step.2.title': 'Definimos la atención', 'step.2.text': 'Coordinamos remoto, domicilio o revisión según el caso.', 'step.3.title': 'Seguís cada avance', 'step.3.text': 'La información del trabajo queda disponible en tu ticket.',
    'seo.home.title': 'Doctor Tech | Atención técnica para tus equipos', 'seo.home.description': 'Atención técnica a domicilio y remota para personas y empresas. Contanos qué le pasa a tu equipo y Doctor Tech te guía hasta la solución.', 'seo.services.title': 'Diagnóstico técnico guiado | Doctor Tech', 'seo.services.description': 'No necesitás conocer el diagnóstico. Elegí tu equipo o contanos qué pasó y Doctor Tech te orienta hacia la atención técnica indicada.', 'seo.login.title': 'Ingresar | Doctor Tech', 'seo.login.description': 'Ingresá a tu cuenta de Doctor Tech.', 'seo.register.title': 'Solicitar atención técnica | Doctor Tech', 'seo.register.description': 'Contanos qué le pasa a tu equipo y solicitá orientación técnica de Doctor Tech.',
  },
  'es-CL': {}, 'es-ES': {}, 'nl-NL': {
    'nav.services': 'Diensten', 'nav.how': 'Zo werkt het', 'nav.login': 'Inloggen', 'nav.request': 'Hulp aanvragen', 'nav.logout': 'Uitloggen', 'nav.menu': 'Menu', 'nav.more': 'Meer', 'nav.moreOptions': 'Meer opties', 'nav.country': 'Land of regio', 'nav.home': 'Home', 'country.AR': 'Argentinië', 'country.CL': 'Chili', 'country.ES': 'Spanje', 'country.NL': 'Nederland', 'country.US': 'Verenigde Staten',
    'home.eyebrow': 'Technische zorg voor je apparaten', 'home.title': 'De dokter voor je apparaten komt wanneer iets stopt.', 'home.lead': 'Doctor Tech helpt mensen en bedrijven met heldere diagnose, persoonlijke aandacht en echte opvolging.', 'home.request': 'Hulp aanvragen', 'home.explore': 'Bekijk hoe we helpen', 'home.different': 'Een andere aanpak', 'home.understand': 'Eerst begrijpen we het symptoom.', 'home.explanation': 'Je hoeft geen reparatie te kiezen of technische termen te kennen. Vertel wat er met je apparaat gebeurt; wij bekijken de context en adviseren een concrete volgende stap.', 'home.care': 'Waarmee we kunnen helpen', 'home.start': 'Kies je vertrekpunt.', 'home.all': 'Bekijk alle opties', 'home.tell': 'Vertel wat er is gebeurd', 'home.process': 'Zo werken we', 'home.final': 'We beginnen met vaststellen wat je nodig hebt.', 'home.talk': 'Praat met Doctor Tech',
    'area.personal.title': 'Persoonlijke apparaten', 'area.personal.text': 'Telefoons, tablets en accessoires die je elke dag gebruikt.', 'area.personal.incident': 'Mijn apparaat heeft aandacht nodig', 'area.computers.title': 'Computers', 'area.computers.text': 'Apparatuur voor studie, werk en creatie die niet kan wachten.', 'area.computers.incident': 'Ik heb hulp nodig met mijn computer', 'area.network.title': 'Connectiviteit', 'area.network.text': 'Wifi, netwerk en apparatuur die samen moeten werken.', 'area.network.incident': 'Ik heb een verbindingsprobleem', 'area.business.title': 'Bedrijven', 'area.business.text': 'Georganiseerde ondersteuning voor mensen, apparatuur en bedrijfsvoering.', 'area.business.incident': 'Ik heb ondersteuning nodig voor mijn bedrijf',
    'step.1.title': 'Je vertelt wat er is gebeurd', 'step.1.text': 'Een eenvoudig verhaal is genoeg om te beginnen.', 'step.2.title': 'We bepalen de ondersteuning', 'step.2.text': 'We plannen hulp op afstand, aan huis of een controle, afhankelijk van de situatie.', 'step.3.title': 'Je volgt elke stap', 'step.3.text': 'De voortgang blijft beschikbaar in je ticket.',
    'seo.home.title': 'Doctor Tech | Technische zorg voor je apparaten', 'seo.home.description': 'Technische hulp op afstand en aan huis voor mensen en bedrijven. Vertel wat er met je apparaat gebeurt en Doctor Tech begeleidt je naar de oplossing.', 'seo.services.title': 'Begeleide technische diagnose | Doctor Tech', 'seo.services.description': 'Je hoeft de diagnose niet te kennen. Kies je apparaat of vertel wat er gebeurd is; Doctor Tech wijst je naar de juiste hulp.', 'seo.login.title': 'Inloggen | Doctor Tech', 'seo.login.description': 'Log in op je Doctor Tech-account.', 'seo.register.title': 'Technische hulp aanvragen | Doctor Tech', 'seo.register.description': 'Vertel wat er met je apparaat gebeurt en vraag technische begeleiding aan bij Doctor Tech.',
  },
  'en-US': {
    'nav.services': 'Services', 'nav.how': 'How it works', 'nav.login': 'Sign in', 'nav.request': 'Request help', 'nav.logout': 'Sign out', 'nav.menu': 'Menu', 'nav.more': 'More', 'nav.moreOptions': 'More options', 'nav.country': 'Country or region', 'nav.home': 'Home', 'country.AR': 'Argentina', 'country.CL': 'Chile', 'country.ES': 'Spain', 'country.NL': 'Netherlands', 'country.US': 'United States',
    'home.eyebrow': 'Technical care for your devices', 'home.title': 'The doctor for your devices arrives when something stops.', 'home.lead': 'Doctor Tech supports people and businesses with clear diagnosis, thoughtful care, and real follow-through.', 'home.request': 'Request help', 'home.explore': 'See how we help', 'home.different': 'A different kind of support', 'home.understand': 'First, we understand the symptom.', 'home.explanation': 'You do not need to choose a repair or know technical terms. Tell us what is happening with your device; we review the context and recommend a clear next step.', 'home.care': 'What we can take care of', 'home.start': 'Choose a starting point.', 'home.all': 'See all options', 'home.tell': 'Tell us what happened', 'home.process': 'How we work', 'home.final': 'We start by diagnosing what you need.', 'home.talk': 'Talk to Doctor Tech',
    'area.personal.title': 'Personal devices', 'area.personal.text': 'Phones, tablets, and accessories you use every day.', 'area.personal.incident': 'My device needs attention', 'area.computers.title': 'Computers', 'area.computers.text': 'Study, work, and creative devices that cannot wait.', 'area.computers.incident': 'I need help with my computer', 'area.network.title': 'Connectivity', 'area.network.text': 'Wi-Fi, networks, and devices that need to work together.', 'area.network.incident': 'I have a connection problem', 'area.business.title': 'Businesses', 'area.business.text': 'Organized support for people, devices, and operations.', 'area.business.incident': 'I need support for my business',
    'step.1.title': 'Tell us what happened', 'step.1.text': 'A simple description is enough to get started.', 'step.2.title': 'We define the support', 'step.2.text': 'We arrange remote, on-site, or workshop support based on the situation.', 'step.3.title': 'Follow every update', 'step.3.text': 'Progress stays available in your ticket.',
    'seo.home.title': 'Doctor Tech | Technical care for your devices', 'seo.home.description': 'Remote and on-site technical care for people and businesses. Tell us what is happening with your device and Doctor Tech guides you to the solution.', 'seo.services.title': 'Guided technical diagnosis | Doctor Tech', 'seo.services.description': 'You do not need to know the diagnosis. Choose your device or tell us what happened and Doctor Tech will guide you to the right technical support.', 'seo.login.title': 'Sign in | Doctor Tech', 'seo.login.description': 'Sign in to your Doctor Tech account.', 'seo.register.title': 'Request technical support | Doctor Tech', 'seo.register.description': 'Tell us what is happening with your device and request technical guidance from Doctor Tech.',
  },
};

copy['es-CL'] = {
  ...copy['es-AR'],
  'home.explanation': 'No tienes que elegir una reparación ni conocer términos técnicos. Cuéntanos qué le pasa a tu equipo, revisamos el contexto y te recomendamos una forma concreta de seguir.',
  'home.start': 'Elige el punto de partida.',
  'home.tell': 'Cuéntanos tu caso',
  'area.personal.text': 'Celulares, tablets y accesorios que usas todos los días.',
  'area.personal.incident': 'Mi dispositivo necesita atención',
  'area.computers.text': 'Equipos de estudio, trabajo y creación que no pueden esperar.',
  'area.computers.incident': 'Necesito ayuda con mi computador',
  'area.network.text': 'Wi-Fi, red y equipos que tienen que funcionar juntos.',
  'area.network.incident': 'Tengo un problema de conexión',
  'step.1.title': 'Nos cuentas qué pasó',
  'step.2.text': 'Coordinamos atención remota, a domicilio o revisión según el caso.',
};

copy['es-ES'] = {
  ...copy['es-AR'],
  'home.explanation': 'No tienes que elegir una reparación ni conocer términos técnicos. Cuéntanos qué le ocurre a tu equipo, revisamos el contexto y te recomendamos una forma concreta de seguir.',
  'home.start': 'Elige el punto de partida.',
  'home.tell': 'Cuéntanos tu caso',
  'area.personal.text': 'Móviles, tabletas y accesorios que utilizas cada día.',
  'area.personal.incident': 'Mi dispositivo necesita atención',
  'area.computers.title': 'Ordenadores',
  'area.computers.text': 'Equipos para estudiar, trabajar y crear que no pueden esperar.',
  'area.computers.incident': 'Necesito ayuda con mi ordenador',
  'area.network.title': 'Conectividad',
  'area.network.text': 'Wi-Fi, red y equipos que tienen que funcionar juntos.',
  'area.network.incident': 'Tengo un problema de conexión',
  'area.business.text': 'Soporte organizado para personas, equipos y operaciones.',
  'step.1.title': 'Nos cuentas qué ha ocurrido',
  'step.2.text': 'Coordinamos atención remota, a domicilio o revisión según el caso.',
};

const accountCopy: Record<'es-AR' | 'nl-NL' | 'en-US', Record<string, string>> = {
  'es-AR': {
    'auth.welcome': 'Bienvenido de vuelta', 'auth.loginLead': 'Iniciá sesión para acceder a tu panel Doctor Tech', 'auth.email': 'Correo electrónico', 'auth.password': 'Contraseña', 'auth.signIn': 'Iniciar sesión', 'auth.noAccount': '¿No tenés cuenta?', 'auth.registerLink': 'Registrate aquí', 'auth.loginError': 'No se pudo iniciar sesión. Revisá tus datos.', 'auth.connectionError': 'Error de conexión.',
    'auth.create': 'Crear tu cuenta', 'auth.registerLead': 'Contanos qué le pasa a tu equipo y empezá con Doctor Tech', 'auth.personal': 'Particular', 'auth.personalUse': 'Uso personal', 'auth.business': 'Empresa', 'auth.businessUse': 'Para negocios', 'auth.fullName': 'Nombre completo', 'auth.documentType': 'Tipo de documento', 'auth.documentNumber': 'Número de documento', 'auth.phone': 'Teléfono', 'auth.businessDetails': 'Datos de la empresa', 'auth.legalName': 'Nombre corporativo', 'auth.tradeName': 'Nombre comercial', 'auth.contactName': 'Nombre del contacto', 'auth.contactEmail': 'Correo del contacto', 'auth.contactPhone': 'Teléfono del contacto', 'auth.billingEmail': 'Correo de facturación', 'auth.address': 'Dirección', 'auth.fullAddress': 'Dirección completa', 'auth.city': 'Ciudad', 'auth.province': 'Provincia o región', 'auth.postalCode': 'Código postal', 'auth.confirmPassword': 'Confirmar contraseña', 'auth.minPassword': 'Mínimo 8 caracteres', 'auth.repeatPassword': 'Repetir contraseña', 'auth.createButton': 'Crear cuenta', 'auth.agreePrefix': 'Al registrarte aceptás los', 'auth.terms': 'Términos de uso', 'auth.agreeMiddle': 'y conocés nuestra', 'auth.privacy': 'Política de privacidad', 'auth.hasAccount': '¿Ya tenés cuenta? Iniciá sesión', 'auth.passwordMismatch': 'Las contraseñas no coinciden', 'auth.businessRequired': 'El nombre corporativo es obligatorio para empresas', 'auth.registerError': 'No se pudo crear la cuenta.', 'auth.registerSuccess': 'Cuenta creada. Iniciá sesión para continuar.', 'auth.country': 'País donde recibirás atención',
    'footer.privacy': 'Privacidad', 'footer.terms': 'Términos', 'app.loading': 'Cargando…',
  },
  'nl-NL': {
    'auth.welcome': 'Welkom terug', 'auth.loginLead': 'Log in om je Doctor Tech-account te openen', 'auth.email': 'E-mailadres', 'auth.password': 'Wachtwoord', 'auth.signIn': 'Inloggen', 'auth.noAccount': 'Nog geen account?', 'auth.registerLink': 'Registreer je hier', 'auth.loginError': 'Inloggen is niet gelukt. Controleer je gegevens.', 'auth.connectionError': 'Verbindingsfout.',
    'auth.create': 'Maak je account aan', 'auth.registerLead': 'Vertel wat er met je apparaat gebeurt en begin met Doctor Tech', 'auth.personal': 'Particulier', 'auth.personalUse': 'Voor persoonlijk gebruik', 'auth.business': 'Bedrijf', 'auth.businessUse': 'Voor bedrijven', 'auth.fullName': 'Volledige naam', 'auth.documentType': 'Soort identiteitsbewijs', 'auth.documentNumber': 'Documentnummer', 'auth.phone': 'Telefoonnummer', 'auth.businessDetails': 'Bedrijfsgegevens', 'auth.legalName': 'Officiële bedrijfsnaam', 'auth.tradeName': 'Handelsnaam', 'auth.contactName': 'Naam contactpersoon', 'auth.contactEmail': 'E-mail contactpersoon', 'auth.contactPhone': 'Telefoon contactpersoon', 'auth.billingEmail': 'E-mail voor facturen', 'auth.address': 'Adres', 'auth.fullAddress': 'Volledig adres', 'auth.city': 'Plaats', 'auth.province': 'Provincie', 'auth.postalCode': 'Postcode', 'auth.confirmPassword': 'Bevestig wachtwoord', 'auth.minPassword': 'Minimaal 8 tekens', 'auth.repeatPassword': 'Herhaal wachtwoord', 'auth.createButton': 'Account aanmaken', 'auth.agreePrefix': 'Door je te registreren ga je akkoord met de', 'auth.terms': 'Gebruiksvoorwaarden', 'auth.agreeMiddle': 'en lees je ons', 'auth.privacy': 'Privacybeleid', 'auth.hasAccount': 'Heb je al een account? Log in', 'auth.passwordMismatch': 'De wachtwoorden komen niet overeen', 'auth.businessRequired': 'De officiële bedrijfsnaam is verplicht', 'auth.registerError': 'Je account kon niet worden aangemaakt.', 'auth.registerSuccess': 'Account aangemaakt. Log in om verder te gaan.', 'auth.country': 'Land waar je hulp nodig hebt',
    'footer.privacy': 'Privacy', 'footer.terms': 'Voorwaarden', 'app.loading': 'Laden…',
  },
  'en-US': {
    'auth.welcome': 'Welcome back', 'auth.loginLead': 'Sign in to access your Doctor Tech account', 'auth.email': 'Email address', 'auth.password': 'Password', 'auth.signIn': 'Sign in', 'auth.noAccount': 'No account yet?', 'auth.registerLink': 'Register here', 'auth.loginError': 'Could not sign in. Check your details.', 'auth.connectionError': 'Connection error.',
    'auth.create': 'Create your account', 'auth.registerLead': 'Tell us what happened to your device and get started with Doctor Tech', 'auth.personal': 'Individual', 'auth.personalUse': 'Personal use', 'auth.business': 'Business', 'auth.businessUse': 'For businesses', 'auth.fullName': 'Full name', 'auth.documentType': 'Document type', 'auth.documentNumber': 'Document number', 'auth.phone': 'Phone number', 'auth.businessDetails': 'Business details', 'auth.legalName': 'Legal business name', 'auth.tradeName': 'Trading name', 'auth.contactName': 'Contact name', 'auth.contactEmail': 'Contact email', 'auth.contactPhone': 'Contact phone', 'auth.billingEmail': 'Billing email', 'auth.address': 'Address', 'auth.fullAddress': 'Full address', 'auth.city': 'City', 'auth.province': 'State or region', 'auth.postalCode': 'ZIP code', 'auth.confirmPassword': 'Confirm password', 'auth.minPassword': 'At least 8 characters', 'auth.repeatPassword': 'Repeat password', 'auth.createButton': 'Create account', 'auth.agreePrefix': 'By registering, you accept the', 'auth.terms': 'Terms of use', 'auth.agreeMiddle': 'and acknowledge our', 'auth.privacy': 'Privacy policy', 'auth.hasAccount': 'Already have an account? Sign in', 'auth.passwordMismatch': 'Passwords do not match', 'auth.businessRequired': 'Legal business name is required', 'auth.registerError': 'Could not create your account.', 'auth.registerSuccess': 'Account created. Sign in to continue.', 'auth.country': 'Country where you need service',
    'footer.privacy': 'Privacy', 'footer.terms': 'Terms', 'app.loading': 'Loading…',
  },
};
Object.assign(copy['es-AR'], accountCopy['es-AR']);
Object.assign(copy['es-CL'], accountCopy['es-AR']);
Object.assign(copy['es-ES'], accountCopy['es-AR']);
Object.assign(copy['nl-NL'], accountCopy['nl-NL']);
Object.assign(copy['en-US'], accountCopy['en-US']);

const experienceCopy: Record<'es-AR' | 'nl-NL' | 'en-US', Record<string, string>> = {
  'es-AR': { 'experience.eyebrow': 'Empezá por tu equipo', 'experience.title': 'Lo importante es volver a usarlo.', 'experience.lead': 'Elegí qué necesita atención. No tenés que saber cuál es la reparación: contanos qué pasa y buscamos el siguiente paso.', 'experience.personal': 'Celular o tablet', 'experience.computers': 'Computadora', 'experience.network': 'Conexión', 'experience.business': 'Empresa', 'experience.cta': 'Contar qué pasó' },
  'nl-NL': { 'experience.eyebrow': 'Begin bij je apparaat', 'experience.title': 'Het belangrijkste is dat je weer verder kunt.', 'experience.lead': 'Kies wat aandacht nodig heeft. Je hoeft niet te weten welke reparatie nodig is: vertel ons wat er gebeurt.', 'experience.personal': 'Telefoon of tablet', 'experience.computers': 'Computer', 'experience.network': 'Verbinding', 'experience.business': 'Bedrijf', 'experience.cta': 'Vertel wat er gebeurd is' },
  'en-US': { 'experience.eyebrow': 'Start with your device', 'experience.title': 'What matters is getting back to it.', 'experience.lead': 'Choose what needs attention. You do not need to know the repair: tell us what happened and we will guide the next step.', 'experience.personal': 'Phone or tablet', 'experience.computers': 'Computer', 'experience.network': 'Connection', 'experience.business': 'Business', 'experience.cta': 'Tell us what happened' },
};
Object.assign(copy['es-AR'], experienceCopy['es-AR']);
Object.assign(copy['es-CL'], experienceCopy['es-AR']);
Object.assign(copy['es-ES'], experienceCopy['es-AR']);
Object.assign(copy['nl-NL'], experienceCopy['nl-NL']);
Object.assign(copy['en-US'], experienceCopy['en-US']);
Object.assign(copy['es-AR'], customerCopy['es-AR']);
Object.assign(copy['es-CL'], customerCopy['es-AR']);
Object.assign(copy['es-ES'], customerCopy['es-AR']);
Object.assign(copy['nl-NL'], customerCopy['nl-NL']);
Object.assign(copy['en-US'], customerCopy['en-US']);
Object.assign(copy['es-AR'], clientAccountCopy['es-AR']);
Object.assign(copy['es-CL'], clientAccountCopy['es-AR']);
Object.assign(copy['es-ES'], clientAccountCopy['es-AR']);
Object.assign(copy['nl-NL'], clientAccountCopy['nl-NL']);
Object.assign(copy['en-US'], clientAccountCopy['en-US']);

const locationFormCopy: Record<LocaleCode, Record<string, string>> = {
  'es-AR': {
    'auth.countryHint': 'País sugerido según tu conexión. Podés cambiarlo.', 'auth.location': 'Ubicación',
    'auth.selectProvince': 'Seleccioná una provincia o región', 'auth.findCity': 'Buscar ciudad en la lista',
    'auth.findCityPlaceholder': 'Escribí para filtrar las opciones', 'auth.selectCity': 'Seleccioná una ciudad',
    'auth.selectZone': 'Seleccioná una zona (opcional)', 'auth.noZones': 'Sin zonas precargadas (opcional)',
    'auth.otherLocation': 'No aparece en la lista; escribir manualmente', 'auth.zone': 'Zona o barrio (opcional)',
    'auth.addressOptional': 'Dirección completa (opcional)', 'auth.postalCodeOptional': 'Código postal (opcional)',
  },
  'es-CL': {
    'auth.countryHint': 'País sugerido según tu conexión. Puedes cambiarlo.', 'auth.location': 'Ubicación',
    'auth.selectProvince': 'Selecciona una provincia o región', 'auth.findCity': 'Buscar ciudad en la lista',
    'auth.findCityPlaceholder': 'Escribe para filtrar las opciones', 'auth.selectCity': 'Selecciona una ciudad',
    'auth.selectZone': 'Selecciona una zona (opcional)', 'auth.noZones': 'Sin zonas precargadas (opcional)',
    'auth.otherLocation': 'No aparece en la lista; escribir manualmente', 'auth.zone': 'Zona o barrio (opcional)',
    'auth.addressOptional': 'Dirección completa (opcional)', 'auth.postalCodeOptional': 'Código postal (opcional)',
  },
  'es-ES': {
    'auth.countryHint': 'País sugerido según tu conexión. Puedes cambiarlo.', 'auth.location': 'Ubicación',
    'auth.selectProvince': 'Selecciona una provincia o región', 'auth.findCity': 'Buscar ciudad en la lista',
    'auth.findCityPlaceholder': 'Escribe para filtrar las opciones', 'auth.selectCity': 'Selecciona una ciudad',
    'auth.selectZone': 'Selecciona una zona (opcional)', 'auth.noZones': 'Sin zonas precargadas (opcional)',
    'auth.otherLocation': 'No aparece en la lista; escribir manualmente', 'auth.zone': 'Zona o barrio (opcional)',
    'auth.addressOptional': 'Dirección completa (opcional)', 'auth.postalCodeOptional': 'Código postal (opcional)',
  },
  'nl-NL': {
    'auth.countryHint': 'Voorgesteld op basis van je verbinding. Je kunt dit wijzigen.', 'auth.location': 'Locatie',
    'auth.selectProvince': 'Kies een provincie of regio', 'auth.findCity': 'Plaats zoeken in de lijst',
    'auth.findCityPlaceholder': 'Typ om de opties te filteren', 'auth.selectCity': 'Kies een plaats',
    'auth.selectZone': 'Kies een wijk (optioneel)', 'auth.noZones': 'Geen wijken vooraf geladen (optioneel)',
    'auth.otherLocation': 'Niet in de lijst; handmatig invullen', 'auth.zone': 'Wijk of buurt (optioneel)',
    'auth.addressOptional': 'Volledig adres (optioneel)', 'auth.postalCodeOptional': 'Postcode (optioneel)',
  },
  'en-US': {
    'auth.countryHint': 'Suggested from your connection. You can change it.', 'auth.location': 'Location',
    'auth.selectProvince': 'Select a state or region', 'auth.findCity': 'Find a city in the list',
    'auth.findCityPlaceholder': 'Type to filter options', 'auth.selectCity': 'Select a city',
    'auth.selectZone': 'Select an area (optional)', 'auth.noZones': 'No areas preloaded (optional)',
    'auth.otherLocation': 'Not listed; enter manually', 'auth.zone': 'Area or neighborhood (optional)',
    'auth.addressOptional': 'Full address (optional)', 'auth.postalCodeOptional': 'ZIP code (optional)',
  },
};
for (const locale of Object.keys(locationFormCopy) as LocaleCode[]) Object.assign(copy[locale], locationFormCopy[locale]);
Object.assign(copy['nl-NL'], internationalServicesCopy['nl-NL']);
Object.assign(copy['en-US'], internationalServicesCopy['en-US']);
Object.assign(copy['es-AR'], publicUiCopy['es-AR']);
Object.assign(copy['es-CL'], publicUiCopy['es-AR']);
Object.assign(copy['es-ES'], publicUiCopy['es-AR']);
Object.assign(copy['nl-NL'], publicUiCopy['nl-NL']);
Object.assign(copy['en-US'], publicUiCopy['en-US']);
for (const locale of Object.keys(adminCopy) as LocaleCode[]) Object.assign(copy[locale], adminCopy[locale]);
for (const locale of Object.keys(navigationCopy) as LocaleCode[]) Object.assign(copy[locale], navigationCopy[locale]);
for (const locale of Object.keys(ticketsCopy) as LocaleCode[]) Object.assign(copy[locale], ticketsCopy[locale]);
for (const locale of Object.keys(operationsCopy) as LocaleCode[]) Object.assign(copy[locale], operationsCopy[locale]);
for (const locale of Object.keys(managementCopy) as LocaleCode[]) Object.assign(copy[locale], managementCopy[locale]);
for (const locale of Object.keys(staffUiCopy) as LocaleCode[]) Object.assign(copy[locale], staffUiCopy[locale]);
for (const locale of Object.keys(prospectsCopy) as LocaleCode[]) Object.assign(copy[locale], prospectsCopy[locale]);

function detectRegion(): Region {
  const language = navigator.language.toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (language.startsWith('nl') || timeZone === 'Europe/Amsterdam') return { ...regions.NL, source: 'detected' };
  if (language === 'es-es' || timeZone === 'Europe/Madrid') return { ...regions.ES, source: 'detected' };
  if (language === 'es-cl' || timeZone === 'America/Santiago') return { ...regions.CL, source: 'detected' };
  if (language.startsWith('en')) return { ...regions.US, source: 'detected' };
  if (language.startsWith('es') || timeZone === 'America/Buenos_Aires' || timeZone.startsWith('America/Argentina/')) return { ...regions.AR, source: 'detected' };
  return { ...regions.AR, source: 'detected' };
}

function readRegion(): Region {
  const pathCode = window.location.pathname.split('/')[1]?.toUpperCase() as CountryCode;
  if (regions[pathCode]) return { ...regions[pathCode], source: 'manual' };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
    if (stored && regions[stored.country as CountryCode] && stored.locale === regions[stored.country as CountryCode].locale) return stored;
  } catch { /* Fall back to local browser signals. */ }
  return detectRegion();
}

function visitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = createUuid();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { choice } = useConsent();
  const { user, loading, setUserRegion } = useAuth();
  const [region, setRegion] = useState<Region>(readRegion);
  const location = useLocation();
  const navigate = useNavigate();
  const setCountry = useCallback(async (country: CountryCode, alreadySaved = false) => {
    if (user && !alreadySaved) {
      const settings = await api.getSettings();
      await api.updateSettings({ country, locale: regions[country].locale, email_notifications: settings.email_notifications });
    }
    setRegion({ ...regions[country], source: 'manual' });
    if (user) setUserRegion(country, regions[country].locale);
    if (/^\/(ar|cl|es|nl|us)?(?:\/services)?\/?$/.test(location.pathname)) {
      navigate(`/${country.toLowerCase()}${location.pathname.endsWith('/services') ? '/services' : ''}`);
    }
  }, [location.pathname, navigate, setUserRegion, user]);

  useLayoutEffect(() => {
    if (user?.country && regions[user.country] && user.country !== region.country) {
      setRegion({ ...regions[user.country], source: 'manual' });
    }
  }, [user?.country, region.country]);

  useEffect(() => {
    const pathCode = location.pathname.split('/')[1]?.toUpperCase() as CountryCode;
    if (!user && regions[pathCode] && pathCode !== region.country) {
      setRegion({ ...regions[pathCode], source: 'manual' });
    }
  }, [location.pathname, region.country, user]);

  useEffect(() => {
    if (loading || user || region.source !== 'detected') return;
    let active = true;
    fetch('/api/public/region').then((response) => response.json()).then((data) => {
      const country = data.country as CountryCode;
      if (active && regions[country]) setRegion({ ...regions[country], source: 'detected' });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [loading, user, region.source]);

  useEffect(() => {
    document.documentElement.lang = region.locale;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(region));
    if (choice !== 'accepted') return;
    fetch('/api/public/region-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: visitorId(), countryCode: region.country, locale: region.locale, source: region.source, pagePath: window.location.pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, [choice, location.pathname, region]);

  const value = useMemo<LocaleContextValue>(() => ({
    ...region,
    setCountry,
    t: (key) => copy[region.locale][key] || (region.locale.startsWith('es') ? copy['es-AR'][key] : undefined) || key,
  }), [region, setCountry]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
