import { Drawer } from "expo-router/drawer";

export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen name="home" options={{ title: "Home" }} />
      <Drawer.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Drawer.Screen name="livedata" options={{ title: "Live Data" }} />
      <Drawer.Screen name="analytics" options={{ title: "Analytics" }} />
      <Drawer.Screen name="maps" options={{ title: "Maps" }} />
      <Drawer.Screen name="reports" options={{ title: "Reports" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  );
}
