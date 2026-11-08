const configuredUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');

export const site = {
  name: 'Doctor Tech',
  defaultDescription: 'Atención técnica a domicilio y remota para personas y empresas. Contanos qué le pasa a tu equipo y Doctor Tech te guía hasta la solución.',
  get url() {
    return configuredUrl || window.location.origin;
  },
};
