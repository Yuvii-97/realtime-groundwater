import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import AppHeader from "@/components/AppHeader";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  onLanguageSwitch?: () => void;
  onNotificationsPress?: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  children,
  onLanguageSwitch,
  onNotificationsPress,
}) => (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#000" />
    <AppHeader
      title={title}
      onLanguageSwitch={onLanguageSwitch}
      onNotificationsPress={onNotificationsPress}
    />
    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1 },
});

export default PageLayout;
