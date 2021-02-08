import { IVideoPlayerIMA } from "../types/ima";

export const isIMAStream = (url: string): boolean => {
  return url.startsWith('https://dai.google.com');
}

export const getIMAConfig = (url: string): IVideoPlayerIMA => {
  const isVod = url.indexOf('https://dai.google.com/ondemand') !== -1;
  const regex = isVod ? /content\/([^\/]+)\/vid\/([^\/]+)\/master\.m3u8\?auth-token=([^\/]+)/ : /event\/([^\/]+)/;

  const config: IVideoPlayerIMA = {};
  
  const matches = url.match(regex);

  if (matches) {
    if (isVod && matches[1] && matches[2] && matches[3]) {
      config.contentSourceId = matches[1];
      config.videoId = matches[2];
      config.authToken = matches[3].replace(/%3D/g, '=').replace(/%7E/g, '~');
    } else if (!isVod && matches[1]) {
      config.assetKey = matches[1];
    }
  }

  return config;
}

interface INormaliseStringOption {
  /**
   * Lowercase the string.
   * 
   * @default true
   */
  toLowerCase: boolean;

  /**
   * Remove characters that are not part of the English alphabet.
   * 
   * @default true
   */
  removeNonEnglishChars: boolean;

  /**
   * Remove empty characters.
   * 
   * @default false
   */
  removeEmptyChars: boolean;

  /**
   * Remove underscores from the string.
   * 
   * @default false
   */
  removeUnderscores: boolean;

  /**
   * Remove dashes from the string.
   * 
   * @default false
   */
  removeDashes: boolean;
}

const NORMALISE_STRING_OPTION: INormaliseStringOption = {
  toLowerCase: true,
  removeNonEnglishChars: true,
  removeEmptyChars: false,
  removeUnderscores: false,
  removeDashes: false
}

export const normalizeString = (value: string, option: INormaliseStringOption = NORMALISE_STRING_OPTION): string => {
  if (typeof value !== 'string') {
    return value;
  }

  let formattedString = value;

  if (option.toLowerCase) {
    formattedString = formattedString.toLowerCase();
  }

  formattedString = formattedString
    // Normalizing to NFD Unicode normal form decomposes combined graphemes
    // into the combination of simple ones. For example: The è of Crème ends up expressed as e +  ̀.
    .normalize('NFD')
    // Using a regex character class to match the U+0300 → U+036F range, to globally get rid of the diacritics,
    // which the Unicode standard conveniently groups as the Combining Diacritical Marks Unicode block.
    .replace(/[\u0300-\u036f]/g, '');

  if (option.removeEmptyChars) {
    formattedString = formattedString.replace(/ /g, '');
  }

  if (option.removeNonEnglishChars) {
    // Remove characters that are not part of the English alphabet.
    formattedString = formattedString.replace(/[^a-z]/g, '');
  }

  if (option.removeUnderscores) {
    // Remove underscores from string
    formattedString = formattedString.replace(/[_]/g, '');
  }

  if (option.removeDashes) {
    // Remove dashes from string
    formattedString = formattedString.replace(/[-]/g, '');
  }

  return formattedString;
};

const NORMALISE_AD_TAG_PARAMS_OPTION: INormaliseStringOption = {
  toLowerCase: true,
  removeNonEnglishChars: false,
  removeEmptyChars: true,
  removeUnderscores: false,
  removeDashes: false
}

const NORMALIISE_IU_AND_CUST_PARAMS_OPTION: INormaliseStringOption = {
  toLowerCase: true,
  removeNonEnglishChars: false,
  removeEmptyChars: true,
  removeUnderscores: true,
  removeDashes: true
}

export const sanitiseAdTagParams = (customParams: Record<string, any>): Record<string, any> => {
  const customParameters: Record<string, any> = {};

  for (const key in customParams) {
    const value = customParams[key];

    if (typeof value === 'string') {
      if (key === 'iu' || key === 'cust_params') {
        customParameters[key] = normalizeString(value, NORMALIISE_IU_AND_CUST_PARAMS_OPTION);
      } else {
        customParameters[key] = normalizeString(value, NORMALISE_AD_TAG_PARAMS_OPTION);
      }
    } else if (typeof value === 'object') {
      customParameters[key] = sanitiseAdTagParams(value);
    } else {
      customParameters[key] = value;
    }
  }

  return customParameters;
}
