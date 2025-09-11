import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { useTranslation } from "react-i18next"; // Changed from useLanguage
import { useTheme } from "../../hooks/useTheme";
import LanguageSelector from "../../components/LanguageSelector";

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

const refreshIntervalOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
];

export default function Settings() {
  const settings = useSettings();
  const { t } = useTranslation(); // Changed from useLanguage
  const theme = useTheme();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [intervalModalVisible, setIntervalModalVisible] = useState(false);

  const handleClearCache = () => {
    Alert.alert(t("settings.clearCache"), t("settings.clearCacheConfirm"), [
      { text: t("settings.cancel"), style: "cancel" },
      {
        text: t("settings.clear"),
        style: "destructive",
        onPress: () => {
          // Implement cache clearing logic here
          Alert.alert(t("settings.success"), t("settings.cacheCleared"));
        },
      },
    ]);
  };

  const handleResetSettings = () => {
    Alert.alert(
      t("settings.resetSettings"),
      t("settings.resetSettingsConfirm"),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("settings.reset"),
          style: "destructive",
          onPress: () => {
            // Reset all settings to default
            settings.setIsDarkMode(false);
            settings.setLanguage("en");
            settings.setNotificationsEnabled(true);
            settings.setAlertsEnabled(true);
            settings.setEmailNotifications(false);
            settings.setAutoRefresh(true);
            settings.setRefreshInterval(30);
            settings.setDataCollection(true);
            settings.setLocationAccess(true);
            settings.setTemperatureUnit("celsius");
            settings.setWaterLevelUnit("meters");
            Alert.alert(t("settings.success"), t("settings.settingsReset"));
          },
        },
      ]
    );
  };

  const getRefreshIntervalLabel = (value: number) => {
    return (
      refreshIntervalOptions.find((option) => option.value === value)?.label ||
      `${value} minutes`
    );
  };

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    rightElement,
    onPress,
    showArrow = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t("settings.settings")}
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          {t("settings.customizeExperience")}
        </Text>
      </View>

      {/* Appearance */}
      <SettingSection title={t("settings.appearance")}>
        <SettingItem
          icon="moon"
          title={t("settings.darkMode")}
          subtitle={t("settings.darkModeSubtitle")}
          rightElement={
            <Switch
              value={settings.isDarkMode}
              onValueChange={settings.setIsDarkMode}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.isDarkMode ? theme.colors.surface : "#f4f3f4"
              }
            />
          }
        />
      </SettingSection>

      {/* Language Selector */}
      <LanguageSelector />

      {/* Notifications */}
      <SettingSection title={t("settings.notifications")}>
        <SettingItem
          icon="notifications"
          title={t("settings.pushNotifications")}
          subtitle={t("settings.pushNotificationsSubtitle")}
          rightElement={
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={settings.setNotificationsEnabled}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.notificationsEnabled ? theme.colors.surface : "#f4f3f4"
              }
            />
          }
        />
        <SettingItem
          icon="warning"
          title={t("settings.waterLevelAlerts")}
          subtitle={t("settings.waterLevelAlertsSubtitle")}
          rightElement={
            <Switch
              value={settings.alertsEnabled}
              onValueChange={settings.setAlertsEnabled}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.alertsEnabled ? theme.colors.surface : "#f4f3f4"
              }
              disabled={!settings.notificationsEnabled}
            />
          }
        />
        <SettingItem
          icon="mail"
          title={t("settings.emailNotifications")}
          subtitle={t("settings.emailNotificationsSubtitle")}
          rightElement={
            <Switch
              value={settings.emailNotifications}
              onValueChange={settings.setEmailNotifications}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.emailNotifications ? theme.colors.surface : "#f4f3f4"
              }
            />
          }
        />
      </SettingSection>

      {/* Data & Sync */}
      <SettingSection title={t("settings.dataSync")}>
        <SettingItem
          icon="refresh"
          title={t("settings.autoRefresh")}
          subtitle={t("settings.autoRefreshSubtitle")}
          rightElement={
            <Switch
              value={settings.autoRefresh}
              onValueChange={settings.setAutoRefresh}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.autoRefresh ? theme.colors.surface : "#f4f3f4"
              }
            />
          }
        />
        <SettingItem
          icon="time"
          title={t("settings.refreshInterval")}
          subtitle={getRefreshIntervalLabel(settings.refreshInterval)}
          onPress={() => setIntervalModalVisible(true)}
          showArrow
        />
      </SettingSection>

      {/* Units */}
      <SettingSection title={t("settings.units")}>
        <SettingItem
          icon="thermometer"
          title={t("settings.temperatureUnit")}
          subtitle={
            settings.temperatureUnit === "celsius"
              ? t("settings.celsius")
              : t("settings.fahrenheit")
          }
          rightElement={
            <Switch
              value={settings.temperatureUnit === "fahrenheit"}
              onValueChange={(value) =>
                settings.setTemperatureUnit(value ? "fahrenheit" : "celsius")
              }
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.temperatureUnit === "fahrenheit"
                  ? theme.colors.surface
                  : "#f4f3f4"
              }
            />
          }
        />
        <SettingItem
          icon="water"
          title={t("settings.waterLevelUnit")}
          subtitle={
            settings.waterLevelUnit === "meters"
              ? t("settings.meters")
              : t("settings.feet")
          }
          rightElement={
            <Switch
              value={settings.waterLevelUnit === "feet"}
              onValueChange={(value) =>
                settings.setWaterLevelUnit(value ? "feet" : "meters")
              }
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.waterLevelUnit === "feet"
                  ? theme.colors.surface
                  : "#f4f3f4"
              }
            />
          }
        />
      </SettingSection>

      {/* Privacy */}
      <SettingSection title={t("settings.privacySecurity")}>
        <SettingItem
          icon="analytics"
          title={t("settings.dataCollection")}
          subtitle={t("settings.dataCollectionSubtitle")}
          rightElement={
            <Switch
              value={settings.dataCollection}
              onValueChange={settings.setDataCollection}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.dataCollection ? theme.colors.surface : "#f4f3f4"
              }
            />
          }
        />
        <SettingItem
          icon="location"
          title={t("settings.locationAccess")}
          subtitle={t("settings.locationAccessSubtitle")}
          rightElement={
            <Switch
              value={settings.locationAccess}
              onValueChange={settings.setLocationAccess}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                settings.locationAccess ? theme.colors.surface : "#f4f3f4"
              }
            />
          }
        />
      </SettingSection>

      {/* Storage */}
      <SettingSection title={t("settings.storage")}>
        <SettingItem
          icon="trash"
          title={t("settings.clearCache")}
          subtitle={t("settings.clearCacheSubtitle")}
          onPress={handleClearCache}
          showArrow
        />
      </SettingSection>

      {/* About */}
      <SettingSection title={t("settings.about")}>
        <SettingItem
          icon="information-circle"
          title={t("settings.appVersion")}
          subtitle="1.0.0"
        />
        <SettingItem
          icon="document-text"
          title={t("settings.privacyPolicy")}
          onPress={() =>
            Alert.alert(
              t("settings.privacyPolicy"),
              t("settings.privacyPolicyContent")
            )
          }
          showArrow
        />
        <SettingItem
          icon="document-text"
          title={t("settings.termsOfService")}
          onPress={() =>
            Alert.alert(
              t("settings.termsOfService"),
              t("settings.termsOfServiceContent")
            )
          }
          showArrow
        />
      </SettingSection>

      {/* Reset */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetSettings}
        >
          <Ionicons name="refresh-outline" size={20} color="#ef4444" />
          <Text style={styles.resetButtonText}>
            {t("settings.resetAllSettings")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("settings.selectLanguage")}
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    settings.language === item.code &&
                      styles.languageOptionSelected,
                  ]}
                  onPress={() => {
                    settings.setLanguage(item.code);
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      settings.language === item.code &&
                        styles.languageNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {settings.language === item.code && (
                    <Ionicons name="checkmark" size={20} color="#077A7D" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Refresh Interval Modal */}
      <Modal
        visible={intervalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIntervalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("settings.refreshInterval")}
              </Text>
              <TouchableOpacity onPress={() => setIntervalModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={refreshIntervalOptions}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.intervalOption,
                    settings.refreshInterval === item.value &&
                      styles.intervalOptionSelected,
                  ]}
                  onPress={() => {
                    settings.setRefreshInterval(item.value);
                    setIntervalModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.intervalLabel,
                      settings.refreshInterval === item.value &&
                        styles.intervalLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {settings.refreshInterval === item.value && (
                    <Ionicons name="checkmark" size={20} color="#077A7D" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },
  header: {
    backgroundColor: "#075a7dff",
    padding: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#A8E6E6",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#077A7D",
    marginBottom: 15,
    marginLeft: 5,
  },
  settingItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  languageOptionSelected: {
    backgroundColor: "#F0F9FF",
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  languageName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  languageNameSelected: {
    color: "#077A7D",
    fontWeight: "600",
  },
  intervalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  intervalOptionSelected: {
    backgroundColor: "#F0F9FF",
  },
  intervalLabel: {
    fontSize: 16,
    color: "#333",
  },
  intervalLabelSelected: {
    color: "#077A7D",
    fontWeight: "600",
  },
});
