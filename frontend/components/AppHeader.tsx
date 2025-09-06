import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { colors } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../contexts/SettingsContext";

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
  const { language, notificationsEnabled } = useSettings();

  // Simple translation example
  const translations = {
    en: {
      groundWater: 'Ground Water',
      analytics: 'Analytics',
    },
    hi: {
      groundWater: 'भूजल',
      analytics: 'विश्लेषण',
    },
    te: {
      groundWater: 'భూగర్భజలాలు',
      analytics: 'విశ్లేషణ',
    },
    ta: {
      groundWater: 'நிலத்தடி நீர்',
      analytics: 'பகுப்பாய்வு',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

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
          <Text style={dynamicStyles.title}>{title === "Ground Water" ? t.groundWater : title}</Text>
          <Text style={dynamicStyles.subtitle}>{t.analytics}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={onLanguageSwitch} style={styles.iconButton}>
          <Ionicons
            name="language-outline"
            size={scale(28)}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNotificationsPress}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name={notificationsEnabled ? "bell" : "bell-off"}
            size={scale(28)}
            color={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
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
    marginLeft: scale(-4)
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
  },
});

export default AppHeader;
