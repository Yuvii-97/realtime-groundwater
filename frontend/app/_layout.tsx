import { Stack } from "expo-router";
import { SettingsProvider } from "../contexts/SettingsContext";

const StackLayout = () => {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
};

export default StackLayout;
