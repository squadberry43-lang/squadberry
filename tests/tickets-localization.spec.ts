import { expect, test } from '@playwright/test';
import { ticketsCopy } from '../src/i18n/tickets';

const locales = ['es-AR', 'es-CL', 'es-ES', 'nl-NL', 'en-US'] as const;
const keys = Object.keys(ticketsCopy['es-AR']);

test('ticket copy covers all five service locales with no empty translations', () => {
  for (const locale of locales) {
    expect(Object.keys(ticketsCopy[locale]).sort()).toEqual([...keys].sort());
    for (const key of keys) expect(ticketsCopy[locale][key], `${locale}: ${key}`).toBeTruthy();
  }
  expect(ticketsCopy['es-CL']['ticket.newTitle']).not.toEqual(ticketsCopy['es-AR']['ticket.newTitle']);
  expect(ticketsCopy['es-ES']['ticket.computers']).toBe('Ordenador');
  expect(ticketsCopy['nl-NL']['tickets.create']).toBe('Ticket aanmaken');
  expect(ticketsCopy['en-US']['tickets.pending_client']).toBe('Waiting for customer');
});
