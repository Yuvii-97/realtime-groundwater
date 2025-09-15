import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { colors } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../contexts/SettingsContext";
import { useTranslation } from "react-i18next"; // Use react-i18next directly
import { useNotifications } from "../contexts/NotificationContext";
import LanguageSelector from "./LanguageSelector";
import { NotificationPanel } from "./NotificationPanel";
import AsyncStorage from "@react-native-async-storage/async-storage"; // For saving language

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  onLanguageSwitch?: () => void;
  onNotificationsPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "Ground Water",
  showLogo = true,
  onLanguageSwitch,
  onNotificationsPress,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { notificationsEnabled } = useSettings();
  const { t, i18n } = useTranslation(); // Use i18next's translation hook
  const { unreadCount = 0, showNotificationPanel, openNotificationPanel, closeNotificationPanel } = useNotifications() || {};

  // Language change handler
  const handleLanguageChange = useCallback(
    async (languageCode: string) => {
      // Change language
      await i18n.changeLanguage(languageCode);

      // Save to AsyncStorage
      await AsyncStorage.setItem("language", languageCode);

      // Call any additional callback if provided
      if (onLanguageSwitch) {
        onLanguageSwitch();
      }
    },
    [i18n, onLanguageSwitch]
  );

  const handleNotificationPress = () => {
    openNotificationPanel();
    if (onNotificationsPress) {
      onNotificationsPress();
    }
  };

  const dynamicStyles = StyleSheet.create({
    header: {
      ...styles.header,
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...styles.title,
      color: theme.colors.text,
    },
    subtitle: {
      ...styles.subtitle,
      color: theme.colors.text,
    },
  });

  return (
    <View style={dynamicStyles.header}>
      <View style={styles.left}>
        {/* Drawer menu icon */}
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={scale(28)} color={theme.colors.text} />
        </TouchableOpacity>
        {showLogo && (
          <Image
            source={require("@/assets/images/cgwblogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <View style={styles.titleContainer}>
          <Text style={dynamicStyles.title}>
            {title === "Ground Water" ? `${t("groundWater")}` : title}
          </Text>
          <Text style={dynamicStyles.subtitle}>{`${t("analytics")}`}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <LanguageSelector
          showAsButton={true}
          onLanguageSelected={handleLanguageChange}
          currentLanguage={i18n.language}
        />
        <TouchableOpacity
          onPress={handleNotificationPress}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name={notificationsEnabled ? "bell" : "bell-off"}
            size={scale(28)}
            color={theme.colors.text}
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <NotificationPanel
        visible={showNotificationPanel}
        onClose={() => closeNotificationPanel()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingBottom: verticalScale(12),
    paddingHorizontal: scale(18),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: scale(45),
    height: verticalScale(38),
    marginLeft: scale(-4),
  },
  titleContainer: {
    justifyContent: "center",
    marginLeft: scale(-8),
  },
  title: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: colors.black,
  },
  subtitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: colors.black,
    marginTop: verticalScale(-4),
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: scale(18),
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -scale(4),
    right: -scale(4),
    backgroundColor: "#FF3B30",
    borderRadius: scale(10),
    minWidth: scale(18),
    height: scale(18),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: scale(10),
    fontWeight: "bold",
  },
});

export default AppHeader;
