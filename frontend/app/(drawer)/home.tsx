import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";

const { width } = Dimensions.get("window");

export default function Home() {
  const theme = useTheme();
  const { t } = useLanguage();
  
  const dynamicStyles = StyleSheet.create({
    container: {
      ...styles.container,
      backgroundColor: theme.colors.background,
    },
    section: {
      ...styles.section,
      backgroundColor: theme.colors.background,
    },
    sectionText: {
      ...styles.sectionText,
      color: theme.colors.textSecondary,
    },
    featureItem: {
      ...styles.featureItem,
      backgroundColor: theme.colors.surface,
    },
    featureDescription: {
      ...styles.featureDescription,
      color: theme.colors.textSecondary,
    },
    stepItem: {
      ...styles.stepItem,
      backgroundColor: theme.colors.surface,
    },
    stepText: {
      ...styles.stepText,
      color: theme.colors.textSecondary,
    },
    benefitItem: {
      ...styles.benefitItem,
      backgroundColor: theme.colors.surface,
    },
    benefitDescription: {
      ...styles.benefitDescription,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>{t('heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>
          {t('heroSubtitle')}
        </Text>
        <TouchableOpacity style={styles.getStartedButton}>
          <Text style={styles.getStartedText}>{t('getStarted')}</Text>
        </TouchableOpacity>
      </View>

      {/* Why This App Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t('whyThisApp')}</Text>
        <Text style={dynamicStyles.sectionText}>
          {t('whyThisAppDesc')}
        </Text>
      </View>

      {/* Key Features Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t('keyFeatures')}</Text>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('realTimeData')}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t('realTimeDataDesc')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>🤖</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('aiPredictions')}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t('aiPredictionsDesc')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>⚠️</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('statusAlerts')}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t('statusAlertsDesc')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>🗺️</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('interactiveMap')}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t('interactiveMapDesc')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>🌐</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('multilingualSupport')}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t('multilingualSupportDesc')}
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t('howItWorks')}</Text>

        <View style={dynamicStyles.stepItem}>
          <Text style={styles.stepNumber}>1️⃣</Text>
          <Text style={dynamicStyles.stepText}>{t('step1')}</Text>
        </View>

        <View style={dynamicStyles.stepItem}>
          <Text style={styles.stepNumber}>2️⃣</Text>
          <Text style={dynamicStyles.stepText}>
            {t('step2')}
          </Text>
        </View>

        <View style={dynamicStyles.stepItem}>
          <Text style={styles.stepNumber}>3️⃣</Text>
          <Text style={dynamicStyles.stepText}>
            {t('step3')}
          </Text>
        </View>
      </View>

      {/* Why Use It Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t('whyUseIt')}</Text>

        <View style={dynamicStyles.benefitItem}>
          <Text style={styles.benefitCheck}>✅</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t('forCitizens')}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t('forCitizensDesc')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.benefitItem}>
          <Text style={styles.benefitCheck}>✅</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t('forFarmers')}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t('forFarmersDesc')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.benefitItem}>
          <Text style={styles.benefitCheck}>✅</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t('forPolicymakers')}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t('forPolicymakersDesc')}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>📖 {t('about')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>{t('contact')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>{t('credits')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerCredit}>
          {t('footerCredit')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },

  // Hero Section Styles
  heroSection: {
    backgroundColor: "#075a7dff",
    padding: 30,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#A8E6E6",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  getStartedButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  getStartedText: {
    color: "#075a7dff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Section Styles
  section: {
    padding: 25,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#075a7dff",
    marginBottom: 15,
    textAlign: "center",
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },

  // Feature Items
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#075a7dff",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Step Items
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  stepNumber: {
    fontSize: 20,
    marginRight: 15,
  },
  stepText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // Benefit Items
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  benefitCheck: {
    fontSize: 20,
    marginRight: 15,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075a7dff",
    marginBottom: 3,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Footer
  footer: {
    backgroundColor: "#075a7dff",
    padding: 30,
    alignItems: "center",
    marginTop: 20,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  footerLink: {
    padding: 10,
  },
  footerLinkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  footerCredit: {
    color: "#A8E6E6",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
