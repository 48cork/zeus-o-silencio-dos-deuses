// Both languages use the same rules and command identifiers.
import * as engine from '../../../assets/js/engine.js';
import { translateText } from '../data/translations.js';
export const initialState = engine.initialState;
export const replay = engine.replay;
export const rewind = engine.rewind;
export function dispatch(state, command) {
  try { return engine.dispatch(state, command); }
  catch (error) { throw new Error(translateText(error.message)); }
}
export const resourceSummary = state => engine.resourceSummary(state).map(translateText);
