import { Stack } from "expo-router";
import { SettingsProvider } from "../contexts/SettingsContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import ChatBox from "../components/ChatBox";
import "../src/i18n"; // Keep this for i18n initialization

const StackLayout = () => {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <ChatBox />
      </NotificationProvider>
    </SettingsProvider>
  );
};

export default StackLayout;
