import { Stack } from "expo-router";
import { SettingsProvider } from "../contexts/SettingsContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import "../src/i18n"; // Keep this for i18n initialization

const StackLayout = () => {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NotificationProvider>
    </SettingsProvider>
  );
};

export default StackLayout;
