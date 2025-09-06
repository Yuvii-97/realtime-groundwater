import { Drawer } from "expo-router/drawer";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { Image, View, StyleSheet, Text } from "react-native";
import { colors } from "@/constants/theme";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { scale, verticalScale } from "@/utils/styling";
import AppHeader from "@/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Layout() {
  const { t } = useLanguage();
  
  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.drawerBackground}
        >
          <View style={styles.headerRow}>
            <Image
              source={require("@/assets/images/cgwblogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.title}>{t('groundWater')}</Text>
              <Text style={styles.subtitle}>{t('analytics')}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {/* Drawer items */}
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
      screenOptions={{
        drawerActiveTintColor: colors.black,
        drawerInactiveTintColor: colors.black,
        drawerLabelStyle: {
          fontSize: 18,
          fontWeight: "bold",
        },
        drawerStyle: {
          backgroundColor: colors.white,
        },
        header: () => (
          <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
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
          title: t('home'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="dashboard"
        options={{
          title: t('dashboard'),
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
          title: t('groundwaterMonitoring'),
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="water" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="livedata"
        options={{
          title: t('liveData'),
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-line"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          title: t('analytics'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="maps"
        options={{
          title: t('maps'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: t('reports'),
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
          title: t('settings'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerBackground: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.black,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.black,
  },
  divider: {
    height: 1,
    backgroundColor: colors.black,
    marginHorizontal: 16,
    marginBottom: 18,
    opacity: 0.2,
  },
});
