import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5 
} from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

// Hero Carousel Component
const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<ScrollView>(null);
  const { t } = useTranslation();
  const router = useRouter();

  const heroSlides = [
    {
      id: 1,
      title: t('home.slide1.title') || 'Real-Time Groundwater Monitoring',
      subtitle: t('home.slide1.subtitle') || 'Access live data from monitoring stations across India',
      image: require('@/assets/images/file_2025-09-10_15.53.45[1].png'),
      gradient: ['#075a7dff', '#0891b2']
    },
      {
        id: 2,
        title: t('home.slide2.title') || 'Water Conservation',
        subtitle: t('home.slide2.subtitle') || '',
        image: require('@/assets/images/download.jpg'),
        gradient: ['#0891b2', '#06b6d4']
      },
    {
      id: 3,
      title: t('home.slide3.title') || 'Digital Water Level Record',
      subtitle: t('home.slide3.subtitle') || 'Advanced digital monitoring and analytics',
      image: require('@/assets/images/dwlr.jpeg'),
      gradient: ['#06b6d4', '#075a7dff']
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % heroSlides.length;
        // Auto-scroll to next slide with smooth animation
        if (slideRef.current) {
          slideRef.current.scrollTo({
            x: nextIndex * width,
            y: 0,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [width, heroSlides.length]);

  return (
    <View style={styles.heroContainer}>
      <ScrollView
        ref={slideRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const currentSlide = Math.round(offsetX / width);
          setCurrentIndex(currentSlide);
        }}
      >
        {heroSlides.map((slide, index) => (
          <View key={slide.id} style={[styles.heroSlide, { width }]}>
            <Image source={slide.image} style={styles.heroBackgroundImage} />
            <View style={styles.heroButtonOverlay}>
              <TouchableOpacity 
                style={styles.getStartedButton}
                onPress={() => router.push('/(drawer)/dashboard')}
              >
                <Text style={styles.getStartedText}>{t("home.getStarted")}</Text>
                <Ionicons name="arrow-forward" size={14} color="#075a7dff" style={styles.buttonIcon} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

    </View>
  );
};

export default function Home() {
  const theme = useTheme();
  const { t } = useTranslation();

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
      ...theme.shadows.small,
    },
    featureDescription: {
      ...styles.featureDescription,
      color: theme.colors.textSecondary,
    },
    stepItem: {
      ...styles.stepItem,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.small,
    },
    stepText: {
      ...styles.stepText,
      color: theme.colors.textSecondary,
    },
    benefitItem: {
      ...styles.benefitItem,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.small,
    },
    benefitDescription: {
      ...styles.benefitDescription,
      color: theme.colors.textSecondary,
    },
    heroSection: {
      ...styles.heroSection,
      backgroundColor: theme.colors.hero,
    },
    footer: {
      ...styles.footer,
      backgroundColor: theme.colors.hero,
    },
  });

  return (
    <ScrollView
      style={dynamicStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <HeroCarousel />

      {/* Why This App Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t("home.whyThisApp")}</Text>
        <Text style={dynamicStyles.sectionText}>
          {t("home.whyThisAppDesc")}
        </Text>
      </View>

      {/* Key Features Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t("home.keyFeatures")}</Text>

        <View style={dynamicStyles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="analytics" size={24} color="#075a7dff" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t("home.realTimeData")}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t("home.realTimeDataDesc")}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <View style={styles.featureIconContainer}>
            <MaterialCommunityIcons name="robot" size={24} color="#075a7dff" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t("home.aiPredictions")}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t("home.aiPredictionsDesc")}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="warning" size={24} color="#075a7dff" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t("home.statusAlerts")}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t("home.statusAlertsDesc")}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="map" size={24} color="#075a7dff" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t("home.interactiveMap")}</Text>
            <Text style={dynamicStyles.featureDescription}>
              {t("home.interactiveMapDesc")}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="globe" size={24} color="#075a7dff" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              {t("home.multilingualSupport")}
            </Text>
            <Text style={dynamicStyles.featureDescription}>
              {t("home.multilingualSupportDesc")}
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t("home.howItWorks")}</Text>

        <View style={dynamicStyles.stepItem}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={dynamicStyles.stepText}>{t("home.step1")}</Text>
        </View>

        <View style={dynamicStyles.stepItem}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={dynamicStyles.stepText}>{t("home.step2")}</Text>
        </View>

        <View style={dynamicStyles.stepItem}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={dynamicStyles.stepText}>{t("home.step3")}</Text>
        </View>
      </View>

      {/* Why Use It Section */}
      <View style={dynamicStyles.section}>
        <Text style={styles.sectionTitle}>{t("home.whyUseIt")}</Text>

        <View style={dynamicStyles.benefitItem}>
          <View style={styles.benefitIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t("home.forCitizens")}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t("home.forCitizensDesc")}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.benefitItem}>
          <View style={styles.benefitIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t("home.forFarmers")}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t("home.forFarmersDesc")}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.benefitItem}>
          <View style={styles.benefitIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t("home.forPolicymakers")}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t("home.forPolicymakersDesc")}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={dynamicStyles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>{t("home.about")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>{t("home.contact")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>{t("home.credits")}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerCredit}>{t("home.footerCredit")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },

  // Hero Carousel Styles
  heroContainer: {
    height: 350,
    backgroundColor: "#075a7dff",
  },
  heroSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroButtonOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroImage: {
    width: 120,
    height: 80,
    marginBottom: 20,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  heroTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  getStartedButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#075a7dff',
  },
  getStartedText: {
    color: "#075a7dff",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },

  // Legacy Hero Section Styles (kept for compatibility)
  heroSection: {
    backgroundColor: "#075a7dff",
    padding: 30,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
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
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#075a7dff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  benefitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
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
