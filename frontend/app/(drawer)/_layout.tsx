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

export default function Layout() {
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
              <Text style={styles.title}>Ground Water</Text>
              <Text style={styles.subtitle}>Analytics</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {/* Drawer items */}
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.black,
        drawerInactiveTintColor: colors.black,
        drawerLabelStyle: {
          fontSize: 18,
          fontWeight: "bold",
        },
        drawerStyle: {
          backgroundColor: colors.white,
        },
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
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
          title: "Ground Water Monitoring",
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="water" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="livedata"
        options={{
          title: "Live Data",
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
          title: "Analytics",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="maps"
        options={{
          title: "Maps",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: "Reports",
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
          title: "Settings",
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
