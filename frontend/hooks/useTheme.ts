import { useSettings } from '../contexts/SettingsContext';
import { colors } from '../constants/theme';

export const useTheme = () => {
  const { isDarkMode } = useSettings();

  const theme = {
    colors: {
      background: isDarkMode ? '#1f2937' : '#F0FFFE',
      surface: isDarkMode ? '#374151' : '#FFFFFF',
      primary: '#077A7D',
      primaryLight: '#A8E6E6',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      textSecondary: isDarkMode ? '#D1D5DB' : '#666666',
      border: isDarkMode ? '#4B5563' : '#E5E7EB',
      hero: '#075a7dff',
    },
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
