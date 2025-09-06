import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { scale } from '@/utils/styling';

export default function LanguageDemo() {
  const theme = useTheme();
  const { t, currentLanguage, supportedLanguages, changeLanguage } = useLanguage();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: scale(20),
    },
    title: {
      fontSize: scale(24),
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: scale(20),
    },
    currentLang: {
      fontSize: scale(18),
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: scale(30),
    },
    sampleText: {
      fontSize: scale(16),
      color: theme.colors.text,
      marginBottom: scale(10),
      padding: scale(10),
      backgroundColor: theme.colors.surface,
      borderRadius: scale(8),
    },
    languageButton: {
      backgroundColor: theme.colors.primary,
      padding: scale(12),
      borderRadius: scale(8),
      marginBottom: scale(10),
      alignItems: 'center',
    },
    languageButtonText: {
      color: '#FFFFFF',
      fontSize: scale(16),
      fontWeight: '600',
    },
    activeLanguage: {
      backgroundColor: theme.colors.primaryLight,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>Language Demo</Text>
      
      <Text style={dynamicStyles.currentLang}>
        Current: {currentLanguage.nativeName} ({currentLanguage.code})
      </Text>

      <View style={{ marginBottom: scale(30) }}>
        <Text style={dynamicStyles.sampleText}>
          {t('appTitle')}: {t('groundWater')} {t('analytics')}
        </Text>
        <Text style={dynamicStyles.sampleText}>
          {t('welcome')}
        </Text>
        <Text style={dynamicStyles.sampleText}>
          {t('subtitle')}
        </Text>
        <Text style={dynamicStyles.sampleText}>
          {t('home')} | {t('dashboard')} | {t('settings')}
        </Text>
        <Text style={dynamicStyles.sampleText}>
          {t('features')}: {t('monitoring')}, {t('analysis')}, {t('alerts')}
        </Text>
      </View>

      <Text style={[dynamicStyles.title, { fontSize: scale(20) }]}>
        Switch Language:
      </Text>

      {supportedLanguages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            dynamicStyles.languageButton,
            currentLanguage.code === language.code && dynamicStyles.activeLanguage,
          ]}
          onPress={() => changeLanguage(language)}
        >
          <Text style={dynamicStyles.languageButtonText}>
            {language.flag} {language.nativeName} ({language.name})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
