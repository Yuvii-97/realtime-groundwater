import { Drawer } from "expo-router/drawer";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { Image, View, StyleSheet, Text } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import AppHeader from "@/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next"; // Changed from useLanguage
import { useTheme } from "@/hooks/useTheme";

export default function Layout() {
  const { t } = useTranslation(); // Changed from useLanguage
  const theme = useTheme();

  const dynamicStyles = StyleSheet.create({
    drawerBackground: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingBottom: 24,
    },
    logo: {
      width: 90,
      height: 90,
      marginRight: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
      marginBottom: 18,
      opacity: 0.3,
    },
  });

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={dynamicStyles.drawerBackground}
        >
          <View style={dynamicStyles.headerRow}>
            <Image
              source={require("@/assets/images/cgwblogo.png")}
              style={dynamicStyles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={dynamicStyles.title}>{t("groundWater")}</Text>
              <Text style={dynamicStyles.subtitle}>{t("analytics")}</Text>
            </View>
          </View>
          <View style={dynamicStyles.divider} />
          {/* Drawer items */}
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
      screenOptions={{
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerLabelStyle: {
          fontSize: 18,
          fontWeight: "bold",
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
        header: () => (
          <SafeAreaView
            edges={["top"]}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <AppHeader
              onLanguageSwitch={() => console.log("Switch Language")}
              onNotificationsPress={() => console.log("Notifications")}
            />
          </SafeAreaView>
        ),
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: t("drawer.home"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="dashboard"
        options={{
          title: t("drawer.dashboard"),
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="groundwaterMonitoring"
        options={{
          title: t("drawer.groundwaterMonitoring"),
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="water" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="predictions"
        options={{
          title: t("Predictions"),
          drawerIcon: ({ color, size, focused }) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name={focused ? "robot" : "robot-outline"}
                size={size}
                color={color}
              />
              {/* <MaterialCommunityIcons
                name="trending-up"
                size={Math.max(14, size - 4)}
                color={color}
                style={{ marginLeft: 4 }}
              /> */}
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          title: t("drawer.analytics"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="maps"
        options={{
          title: t("drawer.maps"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: t("drawer.reports"),
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: t("drawer.settings"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="StationDetail"
        options={{
          drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
          title: "Station Detail",
          drawerIcon: () => null,
          swipeEnabled: false,
          headerShown: true,
        }}
      />
    </Drawer>
  );
}
