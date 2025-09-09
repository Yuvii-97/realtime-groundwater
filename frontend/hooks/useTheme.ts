import { useSettings } from '../contexts/SettingsContext';
import { lightColors, darkColors } from '../constants/theme';

export const useTheme = () => {
  const { isDarkMode } = useSettings();

  const theme = {
    colors: isDarkMode ? darkColors : lightColors,
    isDark: isDarkMode,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
    fonts: {
      regular: {
        fontWeight: '400' as const,
      },
      medium: {
        fontWeight: '500' as const,
      },
      semibold: {
        fontWeight: '600' as const,
      },
      bold: {
        fontWeight: '700' as const,
      },
    },
    shadows: {
      small: isDarkMode ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      medium: isDarkMode ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
      large: isDarkMode ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  };

  return theme;
};

export const useUnits = () => {
  const { temperatureUnit, waterLevelUnit } = useSettings();

  const convertTemperature = (celsius: number) => {
    if (temperatureUnit === 'fahrenheit') {
      return (celsius * 9/5) + 32;
    }
    return celsius;
  };

  const convertWaterLevel = (meters: number) => {
    if (waterLevelUnit === 'feet') {
      return meters * 3.28084;
    }
    return meters;
  };

  const getTemperatureSymbol = () => {
    return temperatureUnit === 'fahrenheit' ? '°F' : '°C';
  };

  const getWaterLevelSymbol = () => {
    return waterLevelUnit === 'feet' ? 'ft' : 'm';
  };

  return {
    convertTemperature,
    convertWaterLevel,
    getTemperatureSymbol,
    getWaterLevelSymbol,
    temperatureUnit,
    waterLevelUnit,
  };
};
