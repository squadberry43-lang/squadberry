import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

export function NotFoundPage() {
  const { country, locale } = useLocale();
  const copy = locale === 'nl-NL'
    ? { title: 'Pagina niet gevonden', text: 'Deze pagina bestaat niet of is verplaatst.', home: 'Home', services: 'Diensten' }
    : locale === 'en-US'
      ? { title: 'Page not found', text: 'This page does not exist or has moved.', home: 'Home', services: 'Services' }
      : { title: 'Página no encontrada', text: 'Esta página no existe o cambió de dirección.', home: 'Inicio', services: 'Servicios' };
  const home = `/${country.toLowerCase()}`;
  return (
    <div className="flex min-h-[60vh] items-center bg-[#fbfbfc] px-6 py-16 text-[#202124] sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium text-[#6e6e73]">404</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-lg leading-7 text-[#5f6368]">{copy.text}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to={home} className="inline-flex min-h-11 items-center rounded-lg bg-[#202124] px-5 text-sm font-medium text-white hover:bg-[#3c4043]">{copy.home}</Link>
          <Link to={`${home}/services`} className="inline-flex min-h-11 items-center rounded-lg border border-[#202124] px-5 text-sm font-medium text-[#202124] hover:bg-zinc-100">{copy.services}</Link>
        </div>
      </div>
    </div>
  );
}
