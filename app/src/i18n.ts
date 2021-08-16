import {
  getConfig,
} from './utils';
import {
  TLocaleSet,
  TTranslationId,
} from './types';

import en from '../_locales/en';
import ru from '../_locales/ru';
export const LOCALES = {
  en,
  ru,
};

export function i18n(
  messageId: TTranslationId,
  placeholders?: Record<string, string>,
  locale: string = getLocale(),
) : string {
  const localeSet = <any>(<any>LOCALES)[locale];
  const message = <string>localeSet[messageId];

  return message.replace(/\$([\w\d]+)/g, function ($0, $1) {
    return placeholders![$1];
  });
}

export function getShortLocale(input: string) : string {
  return input.slice(0, 2)
}

export function getLocale() : string {
  const chessComLocale = document.documentElement.getAttribute('lang');
  if (chessComLocale) {
    const shortLocale = getShortLocale(chessComLocale);
    const matchedLocaleSet = (<any>LOCALES)[getShortLocale(shortLocale)];
    if (matchedLocaleSet) {
      return shortLocale;
    }
  }

  const userLocale = window.navigator.languages
    .map((browserLocale) => getShortLocale(browserLocale))
    .find((locale) => (<any>LOCALES)[locale]);

  if (userLocale) {
    return userLocale;
  }

  const config = getConfig();
  return config.defaultLocale;
}
