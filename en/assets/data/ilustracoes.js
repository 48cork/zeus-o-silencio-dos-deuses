import { illustrations as approved } from '../../../assets/data/ilustracoes.js';
import { translateText } from './translations.js';
export const illustrations = Object.fromEntries(Object.entries(approved).map(([scene, image]) => [scene, {
  ...image,
  src: `../${image.src}`,
  alt: translateText(image.alt),
  description: translateText(image.description)
}]));
