import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { colors } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";

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

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {/* Drawer menu icon */}
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={scale(28)} color={colors.black} />
        </TouchableOpacity>
        {showLogo && (
          <Image
            source={require("@/assets/images/cgwblogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Analytics</Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={onLanguageSwitch} style={styles.iconButton}>
          <Ionicons
            name="language-outline"
            size={scale(28)}
            color={colors.black}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNotificationsPress}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={scale(28)}
            color={colors.black}
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
