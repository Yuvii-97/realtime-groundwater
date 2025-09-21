import { Stack, usePathname } from "expo-router";
import { SettingsProvider } from "../contexts/SettingsContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import ChatBox from "../components/ChatBox";
import "../src/i18n"; // Keep this for i18n initialization

const StackLayout = () => {
  const pathname = usePathname();
  // Hide on native-like splash route ("/" or "/splash") and any route ending with "/maps"
  const hideChat =
    pathname === "/splash" || pathname === "/" || pathname.endsWith("/maps");

  return (
    <SettingsProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {!hideChat && <ChatBox />}
      </NotificationProvider>
    </SettingsProvider>
  );
};

export default StackLayout;
