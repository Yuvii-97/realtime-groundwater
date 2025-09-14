import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { scale, verticalScale } from "@/utils/styling";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// Hero Carousel Component
const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start at 1 instead of 0
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<ScrollView>(null);
  const { t } = useTranslation();
  const router = useRouter();

  // Removed title and subtitle from slides
  const heroSlides = [
    {
      id: 1,
      image: require("@/assets/images/dwlr.jpeg"),
      gradient: ["#06b6d4", "#075a7dff"],
    },
    {
      id: 2,
      image: require("@/assets/images/file_2025-09-10_15.53.45[1].png"),
      gradient: ["#075a7dff", "#0891b2"],
    },
    {
      id: 3,
      image: require("@/assets/images/india.jpeg"),
      gradient: ["#0369a1", "#075985"],
    },
    {
      id: 4,
      image: require("@/assets/images/farmer.webp"), // Replace with your actual image name
      gradient: ["#075985", "#0c4a6e"],
    },
    {
      id: 5,
      image: require("@/assets/images/realtime.webp"), // Replace with your actual image name
      gradient: ["#0c4a6e", "#164e63"],
    },
    {
      id: 6,
      image: require("@/assets/images/security.webp"), // Replace with your actual image name
      gradient: ["#164e63", "#155e75"],
    },
  ];

  // Create infinite slides by adding duplicate slides
  const infiniteSlides = [
    { ...heroSlides[heroSlides.length - 1], key: 'last-duplicate' }, // Last slide at the beginning
    ...heroSlides.map((slide, index) => ({ ...slide, key: `original-${index}` })),
    { ...heroSlides[0], key: 'first-duplicate' }, // First slide at the end
  ];

  useEffect(() => {
    // Set initial position to first real slide
    if (slideRef.current) {
      slideRef.current.scrollTo({
        x: currentIndex * width,
        y: 0,
        animated: false,
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        
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
  }, [width]);

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentSlide = Math.round(offsetX / width);
    
    // Handle infinite loop
    if (currentSlide === 0) {
      // If we're at the duplicate last slide (position 0), jump to real last slide
      setCurrentIndex(heroSlides.length);
      if (slideRef.current) {
        setTimeout(() => {
          slideRef.current?.scrollTo({
            x: heroSlides.length * width,
            y: 0,
            animated: false,
          });
        }, 50);
      }
    } else if (currentSlide === heroSlides.length + 1) {
      // If we're at the duplicate first slide (last position), jump to real first slide
      setCurrentIndex(1);
      if (slideRef.current) {
        setTimeout(() => {
          slideRef.current?.scrollTo({
            x: 1 * width,
            y: 0,
            animated: false,
          });
        }, 50);
      }
    } else {
      setCurrentIndex(currentSlide);
    }
  };

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
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {infiniteSlides.map((slide, index) => (
          <View key={slide.key} style={[styles.heroSlide, { width }]}>
            <Image 
              source={slide.image} 
              style={styles.heroBackgroundImage} 
            />
            <View style={styles.heroButtonOverlay}>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={() => router.push("/(drawer)/dashboard")}
              >
                <Text style={styles.getStartedText}>
                  {t("home.getStarted")}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={scale(14)}
                  color="#075a7dff"
                  style={styles.buttonIcon}
                />
              </TouchableOpacity>
              
              {/* Dot indicators */}
              <View style={styles.dotContainer}>
                {heroSlides.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: 
                          (currentIndex === index + 1 || 
                           (currentIndex === 0 && index === heroSlides.length - 1) ||
                           (currentIndex === heroSlides.length + 1 && index === 0))
                            ? "#FFFFFF" // Solid white for active dot
                            : "#888888" // Solid grey for inactive dots
                      }
                    ]}
                  />
                ))}
              </View>
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
            <Ionicons name="analytics" size={scale(24)} color="#075a7dff" />
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
            <MaterialCommunityIcons
              name="robot"
              size={scale(24)}
              color="#075a7dff"
            />
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
            <Ionicons name="warning" size={scale(24)} color="#075a7dff" />
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
            <Ionicons name="map" size={scale(24)} color="#075a7dff" />
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
            <Ionicons name="globe" size={scale(24)} color="#075a7dff" />
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

        {/* Benefits */}
        <View style={dynamicStyles.benefitItem}>
          <View style={styles.benefitIconContainer}>
            <Ionicons
              name="checkmark-circle"
              size={scale(24)}
              color="#22c55e"
            />
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
            <Ionicons
              name="checkmark-circle"
              size={scale(24)}
              color="#22c55e"
            />
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
            <Ionicons
              name="checkmark-circle"
              size={scale(24)}
              color="#22c55e"
            />
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{t("home.forPolicymakers")}</Text>
            <Text style={dynamicStyles.benefitDescription}>
              {t("home.forPolicymakersDesc")}
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
    width,
    height: verticalScale(250),
    borderRadius: scale(16),
    overflow: "hidden",
    marginBottom: verticalScale(16),
  },
  heroSlide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heroBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  indiaMapImage: {
    resizeMode: "contain",
    backgroundColor: "#e0f2fe", // Light blue that matches the app's theme
  },
  heroButtonOverlay: {
    position: "absolute",
    bottom: verticalScale(20), // Moved down from 32 to 20
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  getStartedButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)", // Slightly more transparent from 0.7 to 0.6
    paddingVertical: verticalScale(8), // Reduced from 10 to 8
    paddingHorizontal: scale(20), // Reduced from 24 to 20
    borderRadius: scale(22), // Slightly reduced from 25 to 22
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Reduced shadow opacity from 0.2 to 0.15
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(7, 90, 125, 0.7)", // Slightly more transparent border
  },
  getStartedText: {
    color: "#075a7dff",
    fontSize: scale(14),
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: scale(8),
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(12),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: scale(4),
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  // Legacy Hero Section Styles
  heroSection: {
    backgroundColor: "#075a7dff",
    padding: verticalScale(30),
    alignItems: "center",
    borderBottomLeftRadius: scale(25),
    borderBottomRightRadius: scale(25),
  },

  // Section Styles
  section: {
    padding: scale(24),
    marginVertical: verticalScale(10),
  },
  sectionTitle: {
    fontSize: scale(24),
    fontWeight: "bold",
    color: "#075a7dff",
    marginBottom: verticalScale(15),
    textAlign: "center",
  },
  sectionText: {
    fontSize: scale(16),
    lineHeight: verticalScale(24),
    textAlign: "center",
    marginBottom: verticalScale(20),
  },

  // Feature Items
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(15),
    marginVertical: verticalScale(8),
    borderRadius: scale(12),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
    marginTop: verticalScale(2),
  },
  featureIcon: {
    fontSize: scale(24),
    marginRight: scale(15),
    marginTop: verticalScale(2),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#075a7dff",
    marginBottom: verticalScale(5),
  },
  featureDescription: {
    fontSize: scale(14),
    lineHeight: verticalScale(20),
  },

  // Step Items
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(15),
    marginVertical: verticalScale(5),
    borderRadius: scale(10),
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  stepNumberContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#075a7dff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
  },
  stepNumber: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  stepText: {
    fontSize: scale(16),
    flex: 1,
    lineHeight: verticalScale(22),
  },

  // Benefit Items
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(15),
    marginVertical: verticalScale(5),
    borderRadius: scale(10),
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  benefitIconContainer: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
    marginTop: verticalScale(2),
  },
  benefitCheck: {
    fontSize: scale(20),
    marginRight: scale(15),
    marginTop: verticalScale(2),
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#075a7dff",
    marginBottom: verticalScale(3),
  },
  benefitDescription: {
    fontSize: scale(14),
    lineHeight: verticalScale(18),
  },

  // Footer
  footer: {
    backgroundColor: "#075a7dff",
    padding: verticalScale(30),
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: verticalScale(20),
  },
  footerLink: {
    padding: verticalScale(10),
  },
  footerLinkText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "500",
  },
  footerCredit: {
    color: "#A8E6E6",
    fontSize: scale(12),
    textAlign: "center",
    lineHeight: verticalScale(16),
  },
});
