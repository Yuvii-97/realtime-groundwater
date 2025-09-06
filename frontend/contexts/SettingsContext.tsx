import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  // Theme settings
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  
  // Language settings
  language: string;
  setLanguage: (value: string) => void;
  
  // Notification settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  alertsEnabled: boolean;
  setAlertsEnabled: (value: boolean) => void;
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  
  // Data settings
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (value: number) => void;
  
  // Privacy settings
  dataCollection: boolean;
  setDataCollection: (value: boolean) => void;
  locationAccess: boolean;
  setLocationAccess: (value: boolean) => void;
  
  // Units settings
  temperatureUnit: 'celsius' | 'fahrenheit';
  setTemperatureUnit: (value: 'celsius' | 'fahrenheit') => void;
  waterLevelUnit: 'meters' | 'feet';
  setWaterLevelUnit: (value: 'meters' | 'feet') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DARK_MODE: 'settings_dark_mode',
  LANGUAGE: 'settings_language',
  NOTIFICATIONS: 'settings_notifications',
  ALERTS: 'settings_alerts',
  EMAIL_NOTIFICATIONS: 'settings_email_notifications',
  AUTO_REFRESH: 'settings_auto_refresh',
  REFRESH_INTERVAL: 'settings_refresh_interval',
  DATA_COLLECTION: 'settings_data_collection',
  LOCATION_ACCESS: 'settings_location_access',
  TEMPERATURE_UNIT: 'settings_temperature_unit',
  WATER_LEVEL_UNIT: 'settings_water_level_unit',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Theme settings
  const [isDarkMode, setIsDarkModeState] = useState(false);
  
  // Language settings
  const [language, setLanguageState] = useState('en');
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [alertsEnabled, setAlertsEnabledState] = useState(true);
  const [emailNotifications, setEmailNotificationsState] = useState(false);
  
  // Data settings
  const [autoRefresh, setAutoRefreshState] = useState(true);
  const [refreshInterval, setRefreshIntervalState] = useState(30); // minutes
  
  // Privacy settings
  const [dataCollection, setDataCollectionState] = useState(true);
  const [locationAccess, setLocationAccessState] = useState(true);
  
  // Units settings
  const [temperatureUnit, setTemperatureUnitState] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [waterLevelUnit, setWaterLevelUnitState] = useState<'meters' | 'feet'>('meters');

  // Load settings from storage on app start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
      
      settings.forEach(([key, value]: [string, string | null]) => {
        if (value !== null) {
          switch (key) {
            case STORAGE_KEYS.DARK_MODE:
              setIsDarkModeState(JSON.parse(value));
              break;
            case STORAGE_KEYS.LANGUAGE:
              setLanguageState(value);
              break;
            case STORAGE_KEYS.NOTIFICATIONS:
              setNotificationsEnabledState(JSON.parse(value));
              break;
            case STORAGE_KEYS.ALERTS:
              setAlertsEnabledState(JSON.parse(value));
              break;
            case STORAGE_KEYS.EMAIL_NOTIFICATIONS:
              setEmailNotificationsState(JSON.parse(value));
              break;
            case STORAGE_KEYS.AUTO_REFRESH:
              setAutoRefreshState(JSON.parse(value));
              break;
            case STORAGE_KEYS.REFRESH_INTERVAL:
              setRefreshIntervalState(parseInt(value));
              break;
            case STORAGE_KEYS.DATA_COLLECTION:
              setDataCollectionState(JSON.parse(value));
              break;
            case STORAGE_KEYS.LOCATION_ACCESS:
              setLocationAccessState(JSON.parse(value));
              break;
            case STORAGE_KEYS.TEMPERATURE_UNIT:
              setTemperatureUnitState(value as 'celsius' | 'fahrenheit');
              break;
            case STORAGE_KEYS.WATER_LEVEL_UNIT:
              setWaterLevelUnitState(value as 'meters' | 'feet');
              break;
          }
        }
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveToStorage = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  // Wrapper functions that save to storage
  const setIsDarkMode = (value: boolean) => {
    setIsDarkModeState(value);
    saveToStorage(STORAGE_KEYS.DARK_MODE, value);
  };

  const setLanguage = (value: string) => {
    setLanguageState(value);
    saveToStorage(STORAGE_KEYS.LANGUAGE, value);
  };

  const setNotificationsEnabled = (value: boolean) => {
    setNotificationsEnabledState(value);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, value);
  };

  const setAlertsEnabled = (value: boolean) => {
    setAlertsEnabledState(value);
    saveToStorage(STORAGE_KEYS.ALERTS, value);
  };

  const setEmailNotifications = (value: boolean) => {
    setEmailNotificationsState(value);
    saveToStorage(STORAGE_KEYS.EMAIL_NOTIFICATIONS, value);
  };

  const setAutoRefresh = (value: boolean) => {
    setAutoRefreshState(value);
    saveToStorage(STORAGE_KEYS.AUTO_REFRESH, value);
  };

  const setRefreshInterval = (value: number) => {
    setRefreshIntervalState(value);
    saveToStorage(STORAGE_KEYS.REFRESH_INTERVAL, value);
  };

  const setDataCollection = (value: boolean) => {
    setDataCollectionState(value);
    saveToStorage(STORAGE_KEYS.DATA_COLLECTION, value);
  };

  const setLocationAccess = (value: boolean) => {
    setLocationAccessState(value);
    saveToStorage(STORAGE_KEYS.LOCATION_ACCESS, value);
  };

  const setTemperatureUnit = (value: 'celsius' | 'fahrenheit') => {
    setTemperatureUnitState(value);
    saveToStorage(STORAGE_KEYS.TEMPERATURE_UNIT, value);
  };

  const setWaterLevelUnit = (value: 'meters' | 'feet') => {
    setWaterLevelUnitState(value);
    saveToStorage(STORAGE_KEYS.WATER_LEVEL_UNIT, value);
  };

  const value: SettingsContextType = {
    isDarkMode,
    setIsDarkMode,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    alertsEnabled,
    setAlertsEnabled,
    emailNotifications,
    setEmailNotifications,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    dataCollection,
    setDataCollection,
    locationAccess,
    setLocationAccess,
    temperatureUnit,
    setTemperatureUnit,
    waterLevelUnit,
    setWaterLevelUnit,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
