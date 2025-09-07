import { Stack } from "expo-router";
import { SettingsProvider } from "../contexts/SettingsContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { NotificationProvider } from "../contexts/NotificationContext";

const StackLayout = () => {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
};

export default StackLayout;
