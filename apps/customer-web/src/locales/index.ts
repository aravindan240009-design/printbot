import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';
import { Language } from '../types';

export const translations = {
  en,
  ta,
  hi,
};

export type TranslationKeys = typeof en;

export function getTranslation(lang: Language): TranslationKeys {
  return translations[lang] || translations.en;
}

export * from './en';
