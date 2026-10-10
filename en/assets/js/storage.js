// Progress contains commands rather than translated prose. Both languages share it.
import * as storage from '../../../assets/js/storage.js';
import { translateText } from '../data/translations.js';
export const createStore = storage.createStore;
export const MAX_BYTES = storage.MAX_BYTES;
export function parseRecord(text) {
  try { return storage.parseRecord(text); }
  catch (error) { throw new Error(translateText(error.message)); }
}
