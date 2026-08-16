/**
 * Registriert den Aufloesungs-Hook. Wird den Pruefskripten per --import
 * vorangestellt.
 */
import { register } from 'node:module';

register('./ts-resolve-hook.mjs', import.meta.url);
