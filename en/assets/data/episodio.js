// Translate presentation only. All branching and conditions come from the
// approved episode; command IDs and save compatibility stay intact.
import * as episode from '../../../assets/data/episodio.js';
import { translateText } from './translations.js';
import { readingOrder } from './editorial.js';
function display(value) {
  if (typeof value === 'string') return translateText(value);
  if (Array.isArray(value)) return value.map(display);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, display(item)]));
  }
  return value;
}
export const CONTENT_VERSION = episode.CONTENT_VERSION;
export const oracle = translateText(episode.oracle);
export const sceneNames = display(episode.sceneNames);
export const readings = display(episode.readings);
export const view = state => readingOrder(state, display(episode.view(state)), historicalNotes);
export const positionSpeech = state => translateText(episode.positionSpeech(state));
export const epilogue = state => display(episode.epilogue(state));
export const questions = display(episode.questions);
export const activity = translateText(episode.activity);
export const historicalNotes = display(episode.historicalNotes);
export const references = episode.references.map(([title, url, caveat]) => [translateText(title), url, translateText(caveat)]);
