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

const { width } = Dimensions.get("window");

export default function Home() {
  const theme = useTheme();
  
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
        <Text style={styles.heroEmoji}>🌊</Text>
        <Text style={styles.heroTitle}>Groundwater Monitoring Made Simple</Text>
        <Text style={styles.heroSubtitle}>
          Real-time insights, AI predictions, and risk alerts to help manage
          water resources responsibly.
        </Text>
        <TouchableOpacity style={styles.getStartedButton}>
          <Text style={styles.getStartedText}>👉 Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Why This App Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>Why This App?</Text>
        <Text style={dynamicStyles.sectionText}>
          Groundwater is the backbone of drinking water, agriculture, and
          industry. With growing demand and climate challenges, monitoring
          groundwater levels is critical. Our app provides real-time data and
          predictive insights to support smarter decisions.
        </Text>
      </View>

      {/* Key Features Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Real-time Data</Text>
            <Text style={dynamicStyles.featureDescription}>
              Track live groundwater levels from DWLR stations.
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>🤖</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>AI Predictions</Text>
            <Text style={dynamicStyles.featureDescription}>
              Forecast future water levels with accuracy.
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>⚠️</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Status & Alerts</Text>
            <Text style={dynamicStyles.featureDescription}>
              Get notified about risks and warnings in your region.
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>🗺️</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Interactive Map</Text>
            <Text style={dynamicStyles.featureDescription}>
              Explore groundwater conditions across stations.
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <Text style={styles.featureIcon}>🌐</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Multilingual Support</Text>
            <Text style={dynamicStyles.featureDescription}>
              Access the app in your preferred language.
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={dynamicStyles.stepItem}>
          <Text style={styles.stepNumber}>1️⃣</Text>
          <Text style={dynamicStyles.stepText}>Select your language & location.</Text>
        </View>

        <View style={dynamicStyles.stepItem}>
          <Text style={styles.stepNumber}>2️⃣</Text>
          <Text style={dynamicStyles.stepText}>
            View current groundwater trends and AI forecasts.
          </Text>
        </View>

        <View style={dynamicStyles.stepItem}>
          <Text style={styles.stepNumber}>3️⃣</Text>
          <Text style={dynamicStyles.stepText}>
            Receive alerts and recommendations to plan ahead.
          </Text>
        </View>
      </View>

      {/* Why Use It Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>Why Use It?</Text>

        <View style={dynamicStyles.benefitItem}>
          <Text style={styles.benefitCheck}>✅</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>For citizens</Text>
            <Text style={dynamicStyles.benefitDescription}>
              Stay informed about water availability.
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.benefitItem}>
          <Text style={styles.benefitCheck}>✅</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>For farmers</Text>
            <Text style={dynamicStyles.benefitDescription}>
              Plan irrigation wisely.
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.benefitItem}>
          <Text style={styles.benefitCheck}>✅</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>For policymakers</Text>
            <Text style={dynamicStyles.benefitDescription}>
              Support sustainable groundwater management.
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>� About</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Credits</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerCredit}>
          Powered by real-time DWLR data & AI technology
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
    paddingTop: 60,
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
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  getStartedText: {
    color: "#075a7dff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Section Styles
  section: {
    padding: 25,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#077A7D",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    textAlign: "center",
  },

  // Feature Item Styles
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
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
    color: "#077A7D",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Step Item Styles
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNumber: {
    fontSize: 24,
    marginRight: 15,
  },
  stepText: {
    fontSize: 16,
    color: "#555",
    flex: 1,
    lineHeight: 22,
  },

  // Benefit Item Styles
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    color: "#077A7D",
    marginBottom: 3,
  },
  benefitDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Footer Styles
  footer: {
    backgroundColor: "#077A7D",
    padding: 25,
    alignItems: "center",
  },
  footerLinks: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerLink: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  footerLinkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  footerCredit: {
    color: "#A8E6E6",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
});
