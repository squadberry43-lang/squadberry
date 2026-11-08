const messages = {
  'en-US': {
    400: 'Check the information and try again.',
    401: 'Sign in again to continue.',
    403: 'You do not have access to this information.',
    404: 'This item could not be found.',
    409: 'This information conflicts with an existing record.',
    429: 'Too many attempts. Please try again later.',
    default: 'Something went wrong. Please try again.',
  },
  'nl-NL': {
    400: 'Controleer de gegevens en probeer het opnieuw.',
    401: 'Log opnieuw in om verder te gaan.',
    403: 'Je hebt geen toegang tot deze informatie.',
    404: 'Dit item is niet gevonden.',
    409: 'Deze gegevens komen overeen met een bestaand record.',
    429: 'Te veel pogingen. Probeer het later opnieuw.',
    default: 'Er is iets misgegaan. Probeer het opnieuw.',
  },
} as const;

export function localizeApiError(status: number, serverMessage: string): string {
  const locale = document.documentElement.lang;
  if (locale !== 'en-US' && locale !== 'nl-NL') return serverMessage;
  const localized = messages[locale];
  return localized[status as keyof typeof localized] || localized.default;
}
