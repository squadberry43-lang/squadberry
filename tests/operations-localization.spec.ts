import { expect, test } from '@playwright/test';
import { operationsCopy } from '../src/i18n/operations';

test('operational copy has the same complete keys in every supported locale', () => {
  const locales = ['es-AR', 'es-CL', 'es-ES', 'nl-NL', 'en-US'] as const;
  const sourceKeys = Object.keys(operationsCopy['es-AR']).sort();

  for (const locale of locales) {
    expect(Object.keys(operationsCopy[locale]).sort()).toEqual(sourceKeys);
    for (const key of sourceKeys) {
      expect(operationsCopy[locale][key]?.trim(), `${locale}: ${key}`).not.toBe('');
    }
  }

  expect(operationsCopy['en-US']['visit.title']).toBe('Visits');
  expect(operationsCopy['nl-NL']['inventory.title']).toBe('Voorraad');
  expect(operationsCopy['es-ES']['repair.desktop']).toBe('Ordenador de sobremesa');
});
