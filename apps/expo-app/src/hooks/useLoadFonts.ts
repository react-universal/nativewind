import * as Fonts from 'expo-font';

export const useLoadFonts = () => {
  const checkFontLoaded = async (fontFamily: string, resourceURI: string) => {
    if (Fonts.isLoaded(fontFamily)) {
      return;
    }
      
    return Fonts.loadAsync({
      [fontFamily]: resourceURI,
    }).catch();
  }; 
  const bootFonts = async () => {
    try { 
      const inter = checkFontLoaded('Inter', require('../../assets/fonts/Inter-Regular.ttf'));
      const interRegular = checkFontLoaded(
        'Inter-Regular', 
        require('../../assets/fonts/Inter-Regular.ttf'),
      );
      const interMedium = checkFontLoaded(
        'Inter-Medium',
        require('../../assets/fonts/Inter-Medium.ttf'),
      ); 
      const interBold = checkFontLoaded(
        'Inter-Bold',
        require('../../assets/fonts/Inter-Bold.ttf'),
      );
      const interBlack = checkFontLoaded(
        'Inter-Black',
        require('../../assets/fonts/Inter-Black.ttf'),
      );
      return Promise.all([inter, interRegular, interBold, interMedium, interBlack]);
    } catch (error) {
      return error;
    }
  };

  return {
    bootFonts,
  };
};
