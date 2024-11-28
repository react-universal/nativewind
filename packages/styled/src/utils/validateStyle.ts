import validRNStyles from './validRNStyles.js';

export const isValidReactNativeStyle = (style: string) => {
  return validRNStyles.some((item) => item === style);
};
