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
  Easing,
  Modal,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { scale, verticalScale } from "@/utils/styling";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LanguageSelector from "../../components/LanguageSelector";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "../../contexts/NotificationContext";

const { width } = Dimensions.get("window");

// Hero Carousel Component
const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start at 1 instead of 0
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<ScrollView>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
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
    { ...heroSlides[heroSlides.length - 1], key: "last-duplicate" }, // Last slide at the beginning
    ...heroSlides.map((slide, index) => ({
      ...slide,
      key: `original-${index}`,
    })),
    { ...heroSlides[0], key: "first-duplicate" }, // First slide at the end
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

  // Animation functions for button press
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleButtonPress = () => {
    animateButtonPress();
    setTimeout(() => {
      router.push("/(drawer)/dashboard");
    }, 200);
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
            <Image source={slide.image} style={styles.heroBackgroundImage} />
            <View style={styles.heroButtonOverlay}>
              <TouchableOpacity onPress={handleButtonPress} activeOpacity={1}>
                <Animated.View
                  style={[
                    styles.getStartedButton,
                    {
                      transform: [{ scale: buttonScale }],
                      opacity: buttonOpacity,
                    },
                  ]}
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
                </Animated.View>
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
                          currentIndex === index + 1 ||
                          (currentIndex === 0 &&
                            index === heroSlides.length - 1) ||
                          (currentIndex === heroSlides.length + 1 &&
                            index === 0)
                            ? "#FFFFFF" // Solid white for active dot
                            : "#888888", // Solid grey for inactive dots
                      },
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

// Multilingual Feature Card Component with dual functionality
const MultilingualFeatureCard = ({
  iconName,
  iconLibrary = "Ionicons",
  title,
  description,
  dynamicStyles,
}: {
  iconName: string;
  iconLibrary?: "Ionicons" | "MaterialCommunityIcons";
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressIn = () => {
    Animated.timing(iconScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressOut = () => {
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    setIsExpanded(!isExpanded);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  const navigateToLanguagePage = () => {
    // Add haptic feedback for icon press
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show language selector modal
    setShowLanguageSelector(true);
  };

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    // Change language
    await i18n.changeLanguage(languageCode);
    // Save to AsyncStorage
    await AsyncStorage.setItem("language", languageCode);
    // Close modal
    setShowLanguageSelector(false);
  };

  const IconComponent =
    iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : Ionicons;

  // Dynamic styles for theme support
  const cardStyle = {
    ...styles.compactFeatureCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  };

  const iconContainerStyle = {
    ...styles.compactIconContainer,
    // Light mode => fixed "#e0f2fe", Dark mode => previous translucent primary
    backgroundColor: (theme as any).isDark
      ? theme.colors.primary + "20"
      : "#e0f2fe",
    borderWidth: 2,
    borderColor: (theme as any).isDark
      ? theme.colors.primary + "40"
      : "#bfe6f5",
    borderRadius: scale(20),
  };

  const titleStyle = {
    ...styles.compactCardTitle,
    color: theme.colors.text,
  };

  const expandedCardStyle = {
    ...styles.expandedInfoCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const expandedTitleStyle = {
    ...styles.expandedTitle,
    color: theme.colors.text,
  };

  const expandedDescriptionStyle = {
    ...styles.expandedDescriptionText,
    color: theme.colors.textSecondary,
  };

  // Language options
  const languages = [
    { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "hi-IN", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
    { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  ];

  return (
    <View style={styles.compactCardContainer}>
      {/* Small Compact Card */}
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          onPress={toggleExpanded}
          activeOpacity={1}
          style={styles.compactCardHeader}
        >
          {/* Separate touchable for icon */}
          <TouchableOpacity
            onPressIn={handleIconPressIn}
            onPressOut={handleIconPressOut}
            onPress={navigateToLanguagePage}
            activeOpacity={1}
            style={iconContainerStyle}
          >
            <Animated.View
              style={{
                transform: [{ scale: iconScale }],
              }}
            >
              <IconComponent
                name={iconName as any}
                size={scale(24)}
                color={theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expandable Information Section - Only shows when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            expandedCardStyle,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
                {
                  translateY: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.expandedInfoContent}>
            <Text style={expandedTitleStyle}>{title}</Text>
            <Text style={expandedDescriptionStyle}>{description}</Text>
          </View>
        </Animated.View>
      )}

      {/* Language Selector Modal */}
      <Modal
        visible={showLanguageSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageSelector(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowLanguageSelector(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: scale(16),
              padding: scale(20),
              width: "90%",
              maxWidth: scale(400),
              maxHeight: "70%",
              ...theme.shadows.large,
            }}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text
              style={{
                fontSize: scale(20),
                fontWeight: "bold",
                color: theme.colors.text,
                textAlign: "center",
                marginBottom: scale(20),
              }}
            >
              Select Language
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: scale(12),
                    paddingHorizontal: scale(16),
                    borderRadius: scale(8),
                    backgroundColor:
                      i18n.language === language.code
                        ? theme.colors.primary + "20"
                        : "transparent",
                    marginVertical: scale(4),
                  }}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={{ fontSize: scale(24), marginRight: scale(12) }}>
                    {language.flag}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: scale(16),
                        color: theme.colors.text,
                        fontWeight: "600",
                      }}
                    >
                      {language.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: scale(14),
                        color: theme.colors.textSecondary,
                        marginTop: scale(2),
                      }}
                    >
                      {language.nativeName}
                    </Text>
                  </View>
                  {i18n.language === language.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={scale(24)}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: scale(8),
                paddingVertical: scale(12),
                paddingHorizontal: scale(24),
                alignSelf: "center",
                marginTop: scale(20),
              }}
              onPress={() => setShowLanguageSelector(false)}
            >
              <Text
                style={{
                  color: theme.colors.surface,
                  fontSize: scale(16),
                  fontWeight: "600",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Real Time Data Feature Card Component with dual functionality
const RealTimeDataFeatureCard = ({
  iconName,
  iconLibrary = "Ionicons",
  title,
  description,
  dynamicStyles,
}: {
  iconName: string;
  iconLibrary?: "Ionicons" | "MaterialCommunityIcons";
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressIn = () => {
    Animated.timing(iconScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressOut = () => {
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    setIsExpanded(!isExpanded);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  const navigateToGroundwaterMonitoring = () => {
    // Add haptic feedback for icon press
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to Groundwater Monitoring page
    router.push("/(drawer)/groundwaterMonitoring");
  };

  const IconComponent =
    iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : Ionicons;

  // Dynamic styles for theme support
  const cardStyle = {
    ...styles.compactFeatureCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  };

  const iconContainerStyle = {
    ...styles.compactIconContainer,
    // Light mode => fixed "#e0f2fe", Dark mode => previous translucent primary
    backgroundColor: (theme as any).isDark
      ? theme.colors.primary + "20"
      : "#e0f2fe",
    borderWidth: 2,
    borderColor: (theme as any).isDark
      ? theme.colors.primary + "40"
      : "#bfe6f5",
    borderRadius: scale(20),
  };

  const titleStyle = {
    ...styles.compactCardTitle,
    color: theme.colors.text,
  };

  const expandedCardStyle = {
    ...styles.expandedInfoCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const expandedTitleStyle = {
    ...styles.expandedTitle,
    color: theme.colors.text,
  };

  const expandedDescriptionStyle = {
    ...styles.expandedDescriptionText,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={styles.compactCardContainer}>
      {/* Small Compact Card */}
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          onPress={toggleExpanded}
          activeOpacity={1}
          style={styles.compactCardHeader}
        >
          {/* Separate touchable for icon */}
          <TouchableOpacity
            onPressIn={handleIconPressIn}
            onPressOut={handleIconPressOut}
            onPress={navigateToGroundwaterMonitoring}
            activeOpacity={1}
            style={iconContainerStyle}
          >
            <Animated.View
              style={{
                transform: [{ scale: iconScale }],
              }}
            >
              <IconComponent
                name={iconName as any}
                size={scale(24)}
                color={theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expandable Information Section - Only shows when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            expandedCardStyle,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
                {
                  translateY: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.expandedInfoContent}>
            <Text style={expandedTitleStyle}>{title}</Text>
            <Text style={expandedDescriptionStyle}>{description}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// AI Predictions Feature Card Component with dual functionality
const AIPredictionsFeatureCard = ({
  iconName,
  iconLibrary = "Ionicons",
  title,
  description,
  dynamicStyles,
}: {
  iconName: string;
  iconLibrary?: "Ionicons" | "MaterialCommunityIcons";
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressIn = () => {
    Animated.timing(iconScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressOut = () => {
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    setIsExpanded(!isExpanded);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  const navigateToDashboard = () => {
    // Add haptic feedback for icon press
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to Dashboard page
    router.push("/(drawer)/dashboard");
  };

  const IconComponent =
    iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : Ionicons;

  // Dynamic styles for theme support
  const cardStyle = {
    ...styles.compactFeatureCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  };

  const iconContainerStyle = {
    ...styles.compactIconContainer,
    // Light mode => fixed "#e0f2fe", Dark mode => previous translucent primary
    backgroundColor: (theme as any).isDark
      ? theme.colors.primary + "20"
      : "#e0f2fe",
    borderWidth: 2,
    borderColor: (theme as any).isDark
      ? theme.colors.primary + "40"
      : "#bfe6f5",
    borderRadius: scale(20),
  };

  const titleStyle = {
    ...styles.compactCardTitle,
    color: theme.colors.text,
  };

  const expandedCardStyle = {
    ...styles.expandedInfoCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const expandedTitleStyle = {
    ...styles.expandedTitle,
    color: theme.colors.text,
  };

  const expandedDescriptionStyle = {
    ...styles.expandedDescriptionText,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={styles.compactCardContainer}>
      {/* Small Compact Card */}
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          onPress={toggleExpanded}
          activeOpacity={1}
          style={styles.compactCardHeader}
        >
          {/* Separate touchable for icon */}
          <TouchableOpacity
            onPressIn={handleIconPressIn}
            onPressOut={handleIconPressOut}
            onPress={navigateToDashboard}
            activeOpacity={1}
            style={iconContainerStyle}
          >
            <Animated.View
              style={{
                transform: [{ scale: iconScale }],
              }}
            >
              <IconComponent
                name={iconName as any}
                size={scale(24)}
                color={theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expandable Information Section - Only shows when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            expandedCardStyle,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
                {
                  translateY: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.expandedInfoContent}>
            <Text style={expandedTitleStyle}>{title}</Text>
            <Text style={expandedDescriptionStyle}>{description}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Status Alerts Feature Card Component with dual functionality
const StatusAlertsFeatureCard = ({
  iconName,
  iconLibrary = "Ionicons",
  title,
  description,
  dynamicStyles,
}: {
  iconName: string;
  iconLibrary?: "Ionicons" | "MaterialCommunityIcons";
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const { openNotificationPanel } = useNotifications();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressIn = () => {
    Animated.timing(iconScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressOut = () => {
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    setIsExpanded(!isExpanded);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  const navigateToNotifications = () => {
    // Add haptic feedback for icon press
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Open notification panel from header
    openNotificationPanel();
  };

  const IconComponent =
    iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : Ionicons;

  // Dynamic styles for theme support
  const cardStyle = {
    ...styles.compactFeatureCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  };

  const iconContainerStyle = {
    ...styles.compactIconContainer,
    // Light mode => fixed "#e0f2fe", Dark mode => previous translucent primary
    backgroundColor: (theme as any).isDark
      ? theme.colors.primary + "20"
      : "#e0f2fe",
    borderWidth: 2,
    borderColor: (theme as any).isDark
      ? theme.colors.primary + "40"
      : "#bfe6f5",
    borderRadius: scale(20),
  };

  const titleStyle = {
    ...styles.compactCardTitle,
    color: theme.colors.text,
  };

  const expandedCardStyle = {
    ...styles.expandedInfoCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const expandedTitleStyle = {
    ...styles.expandedTitle,
    color: theme.colors.text,
  };

  const expandedDescriptionStyle = {
    ...styles.expandedDescriptionText,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={styles.compactCardContainer}>
      {/* Small Compact Card */}
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          onPress={toggleExpanded}
          activeOpacity={1}
          style={styles.compactCardHeader}
        >
          {/* Separate touchable for icon */}
          <TouchableOpacity
            onPressIn={handleIconPressIn}
            onPressOut={handleIconPressOut}
            onPress={navigateToNotifications}
            activeOpacity={1}
            style={iconContainerStyle}
          >
            <Animated.View
              style={{
                transform: [{ scale: iconScale }],
              }}
            >
              <IconComponent
                name={iconName as any}
                size={scale(24)}
                color={theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expandable Information Section - Only shows when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            expandedCardStyle,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
                {
                  translateY: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.expandedInfoContent}>
            <Text style={expandedTitleStyle}>{title}</Text>
            <Text style={expandedDescriptionStyle}>{description}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Interactive Map Feature Card Component with dual functionality
const InteractiveMapFeatureCard = ({
  iconName,
  iconLibrary = "Ionicons",
  title,
  description,
  dynamicStyles,
}: {
  iconName: string;
  iconLibrary?: "Ionicons" | "MaterialCommunityIcons";
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressIn = () => {
    Animated.timing(iconScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handleIconPressOut = () => {
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    setIsExpanded(!isExpanded);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  const navigateToMaps = () => {
    // Add haptic feedback for icon press
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to Maps page
    router.push("/(drawer)/maps");
  };

  const IconComponent =
    iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : Ionicons;

  // Dynamic styles for theme support
  const cardStyle = {
    ...styles.compactFeatureCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  };

  const iconContainerStyle = {
    ...styles.compactIconContainer,
    // Light mode => fixed "#e0f2fe", Dark mode => previous translucent primary
    backgroundColor: (theme as any).isDark
      ? theme.colors.primary + "20"
      : "#e0f2fe",
    borderWidth: 2,
    borderColor: (theme as any).isDark
      ? theme.colors.primary + "40"
      : "#bfe6f5",
    borderRadius: scale(20),
  };

  const titleStyle = {
    ...styles.compactCardTitle,
    color: theme.colors.text,
  };

  const expandedCardStyle = {
    ...styles.expandedInfoCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const expandedTitleStyle = {
    ...styles.expandedTitle,
    color: theme.colors.text,
  };

  const expandedDescriptionStyle = {
    ...styles.expandedDescriptionText,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={styles.compactCardContainer}>
      {/* Small Compact Card */}
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          onPress={toggleExpanded}
          activeOpacity={1}
          style={styles.compactCardHeader}
        >
          {/* Separate touchable for icon */}
          <TouchableOpacity
            onPressIn={handleIconPressIn}
            onPressOut={handleIconPressOut}
            onPress={navigateToMaps}
            activeOpacity={1}
            style={iconContainerStyle}
          >
            <Animated.View
              style={{
                transform: [{ scale: iconScale }],
              }}
            >
              <IconComponent
                name={iconName as any}
                size={scale(24)}
                color={theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expandable Information Section - Only shows when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            expandedCardStyle,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
                {
                  translateY: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.expandedInfoContent}>
            <Text style={expandedTitleStyle}>{title}</Text>
            <Text style={expandedDescriptionStyle}>{description}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Compact Feature Card Component
const AnimatedFeatureCard = ({
  iconName,
  iconLibrary = "Ionicons",
  title,
  description,
  dynamicStyles,
}: {
  iconName: string;
  iconLibrary?: "Ionicons" | "MaterialCommunityIcons";
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    setIsExpanded(!isExpanded);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  const IconComponent =
    iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : Ionicons;

  // Dynamic styles for theme support
  const cardStyle = {
    ...styles.compactFeatureCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  };

  const iconContainerStyle = {
    ...styles.compactIconContainer,
    // Light mode => fixed "#e0f2fe", Dark mode => previous translucent primary
    backgroundColor: (theme as any).isDark
      ? theme.colors.primary + "20"
      : "#e0f2fe",
  };

  const titleStyle = {
    ...styles.compactCardTitle,
    color: theme.colors.text,
  };

  const expandedCardStyle = {
    ...styles.expandedInfoCard,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const expandedTitleStyle = {
    ...styles.expandedTitle,
    color: theme.colors.text,
  };

  const expandedDescriptionStyle = {
    ...styles.expandedDescriptionText,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={styles.compactCardContainer}>
      {/* Small Compact Card */}
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={toggleExpanded}
          activeOpacity={1}
          style={styles.compactCardHeader}
        >
          <View style={iconContainerStyle}>
            <IconComponent
              name={iconName as any}
              size={scale(24)}
              color={theme.colors.primary}
            />
          </View>
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expandable Information Section - Only shows when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            expandedCardStyle,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
                {
                  translateY: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.expandedInfoContent}>
            <Text style={expandedTitleStyle}>{title}</Text>
            <Text style={expandedDescriptionStyle}>{description}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Animated Benefit Item Component
const AnimatedBenefitItem = ({
  title,
  description,
  dynamicStyles,
}: {
  title: string;
  description: string;
  dynamicStyles: any;
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Dynamic styles for theme support
  const benefitItemStyle = {
    ...dynamicStyles.benefitItem,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const benefitIconContainerStyle = {
    ...styles.benefitIconContainer,
    backgroundColor: theme.colors.success + "20", // Success color with opacity
  };

  const benefitTitleStyle = {
    ...styles.benefitTitle,
    color: theme.colors.text,
  };

  const benefitDescriptionStyle = {
    ...dynamicStyles.benefitDescription,
    color: theme.colors.textSecondary,
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          benefitItemStyle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={benefitIconContainerStyle}>
          <Ionicons
            name="checkmark-circle"
            size={scale(24)}
            color={theme.colors.success}
          />
        </View>
        <View style={styles.benefitContent}>
          <Text style={benefitTitleStyle}>{title}</Text>
          <Text style={benefitDescriptionStyle}>{description}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated Step Item Component
const AnimatedStepItem = ({
  stepNumber,
  stepText,
  dynamicStyles,
}: {
  stepNumber: string;
  stepText: string;
  dynamicStyles: any;
}) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.timing(opacityAnim, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Dynamic styles for theme support
  const stepItemStyle = {
    ...dynamicStyles.stepItem,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  };

  const stepNumberContainerStyle = {
    ...styles.stepNumberContainer,
    backgroundColor: theme.colors.primary,
  };

  const stepNumberStyle = {
    ...styles.stepNumber,
    color: theme.colors.surface, // White text on primary background
  };

  const stepTextStyle = {
    ...dynamicStyles.stepText,
    color: theme.colors.text,
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          stepItemStyle,
          {
            opacity: opacityAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={stepNumberContainerStyle}>
          <Text style={stepNumberStyle}>{stepNumber}</Text>
        </View>
        <Text style={stepTextStyle}>{stepText}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated Section Component
const AnimatedSection = ({
  title,
  children,
  dynamicStyles,
}: {
  title: string;
  children: React.ReactNode;
  dynamicStyles: any;
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);

  // Dynamic styles for theme support
  const sectionStyle = {
    ...dynamicStyles.section,
    backgroundColor: theme.colors.background,
  };

  const sectionTitleStyle = {
    ...styles.sectionTitle,
    color: theme.colors.text,
  };

  return (
    <Animated.View
      style={[
        sectionStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={sectionTitleStyle}>{title}</Text>
      {children}
    </Animated.View>
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
      <AnimatedSection
        title={t("home.whyThisApp")}
        dynamicStyles={dynamicStyles}
      >
        <Text style={dynamicStyles.sectionText}>
          {t("home.whyThisAppDesc")}
        </Text>
      </AnimatedSection>

      {/* Key Features Section */}
      <AnimatedSection
        title={t("home.keyFeatures")}
        dynamicStyles={dynamicStyles}
      >
        <View style={styles.featureGrid}>
          <RealTimeDataFeatureCard
            iconName="analytics"
            iconLibrary="Ionicons"
            title={t("home.realTimeData")}
            description={t("home.realTimeDataDesc")}
            dynamicStyles={dynamicStyles}
          />

          <AIPredictionsFeatureCard
            iconName="robot"
            iconLibrary="MaterialCommunityIcons"
            title={t("home.aiPredictions")}
            description={t("home.aiPredictionsDesc")}
            dynamicStyles={dynamicStyles}
          />

          <StatusAlertsFeatureCard
            iconName="warning"
            iconLibrary="Ionicons"
            title={t("home.statusAlerts")}
            description={t("home.statusAlertsDesc")}
            dynamicStyles={dynamicStyles}
          />

          <InteractiveMapFeatureCard
            iconName="map"
            iconLibrary="Ionicons"
            title={t("home.interactiveMap")}
            description={t("home.interactiveMapDesc")}
            dynamicStyles={dynamicStyles}
          />

          <MultilingualFeatureCard
            iconName="globe"
            iconLibrary="Ionicons"
            title={t("home.multilingualSupport")}
            description={t("home.multilingualSupportDesc")}
            dynamicStyles={dynamicStyles}
          />
        </View>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection
        title={t("home.howItWorks")}
        dynamicStyles={dynamicStyles}
      >
        <AnimatedStepItem
          stepNumber="1"
          stepText={t("home.step1")}
          dynamicStyles={dynamicStyles}
        />

        <AnimatedStepItem
          stepNumber="2"
          stepText={t("home.step2")}
          dynamicStyles={dynamicStyles}
        />

        <AnimatedStepItem
          stepNumber="3"
          stepText={t("home.step3")}
          dynamicStyles={dynamicStyles}
        />
      </AnimatedSection>

      {/* Why Use It Section */}
      <AnimatedSection title={t("home.whyUseIt")} dynamicStyles={dynamicStyles}>
        <AnimatedBenefitItem
          title={t("home.forCitizens")}
          description={t("home.forCitizensDesc")}
          dynamicStyles={dynamicStyles}
        />

        <AnimatedBenefitItem
          title={t("home.forFarmers")}
          description={t("home.forFarmersDesc")}
          dynamicStyles={dynamicStyles}
        />

        <AnimatedBenefitItem
          title={t("home.forPolicymakers")}
          description={t("home.forPolicymakersDesc")}
          dynamicStyles={dynamicStyles}
        />
      </AnimatedSection>

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
    borderRadius: 0,
    overflow: "hidden",
    marginBottom: verticalScale(16),
    marginHorizontal: 0, // Ensure no horizontal margins
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
    borderRadius: 0, // Explicitly set to 0
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

  // Feature Card Styles
  featureGrid: {
    flex: 1,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  featureColumn: {
    flex: 1,
    marginHorizontal: scale(4),
  },

  // Compact Feature Card Styles
  compactCardContainer: {
    marginVertical: verticalScale(8),
    marginHorizontal: scale(4),
  },
  compactFeatureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  compactCardHeader: {
    alignItems: "center",
    padding: scale(16),
  },
  compactIconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(8),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactCardTitle: {
    fontSize: scale(12),
    fontWeight: "600",
    color: "#075a7dff",
    textAlign: "center",
    lineHeight: verticalScale(16),
  },

  // Expanded Info Card Styles
  expandedInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    marginTop: verticalScale(8),
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#075a7dff",
    borderTopWidth: 3,
  },
  expandedInfoContent: {
    padding: scale(20),
  },
  expandedTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#075a7dff",
    textAlign: "center",
    marginBottom: verticalScale(12),
  },
  expandedDescriptionText: {
    fontSize: scale(14),
    lineHeight: verticalScale(20),
    color: "#374151",
    textAlign: "left",
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    marginVertical: verticalScale(8),
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  featureCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(20),
  },
  featureCardContent: {
    height: verticalScale(80), // Fixed height container
    overflow: "hidden",
  },
  featureCardDescription: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    height: verticalScale(80), // Match the container height
    justifyContent: "center",
  },
  featureDescriptionText: {
    fontSize: scale(14),
    lineHeight: verticalScale(20),
    color: "#374151",
  },
  featureCardIconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
  },
  featureCardTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#075a7dff",
    flex: 1,
    marginLeft: scale(15),
  },
  featureCardArrow: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
});
