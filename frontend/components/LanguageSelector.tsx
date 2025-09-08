import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next"; // Use react-i18next directly
import { useTheme } from "../hooks/useTheme";
import { scale, verticalScale } from "@/utils/styling";

interface LanguageSelectorProps {
  showAsButton?: boolean;
  onLanguageSelected?: (languageCode: string) => void;
  currentLanguage?: string;
}

export default function LanguageSelector({
  showAsButton = false,
  onLanguageSelected,
  currentLanguage = "en-US",
}: LanguageSelectorProps) {
  const { t } = useTranslation(); // Use i18next directly
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Define supported languages (you can move this to a separate file if needed)
  const supportedLanguages = [
    { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "hi-IN", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
    { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  ];

  // Find current language object
  const currentLangObj =
    supportedLanguages.find((lang) => lang.code === currentLanguage) ||
    supportedLanguages[0];

  const handleLanguageSelect = (language: any) => {
    onLanguageSelected?.(language.code);
    setModalVisible(false);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: showAsButton ? "transparent" : theme.colors.surface,
      borderRadius: showAsButton ? 0 : scale(12),
      padding: showAsButton ? 0 : scale(16),
      marginVertical: showAsButton ? 0 : scale(8),
    },
    button: {
      padding: showAsButton ? scale(8) : 0,
      borderRadius: showAsButton ? scale(8) : 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: scale(18),
      fontWeight: "600",
      color: theme.colors.text,
    },
    currentLanguage: {
      flexDirection: "row",
      alignItems: "center",
    },
    languageText: {
      fontSize: scale(16),
      color: theme.colors.textSecondary,
      marginRight: scale(8),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: scale(16),
      padding: scale(20),
      width: "90%",
      maxHeight: "70%",
    },
    modalTitle: {
      fontSize: scale(20),
      fontWeight: "bold",
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: scale(20),
    },
    languageItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: scale(16),
      paddingHorizontal: scale(12),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + "30",
    },
    languageInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    flag: {
      fontSize: scale(24),
      marginRight: scale(12),
    },
    languageDetails: {
      flex: 1,
    },
    languageName: {
      fontSize: scale(16),
      color: theme.colors.text,
      fontWeight: "600",
    },
    nativeName: {
      fontSize: scale(14),
      color: theme.colors.textSecondary,
      marginTop: scale(2),
    },
    selectedIndicator: {
      color: theme.colors.primary,
    },
    closeButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: scale(8),
      paddingVertical: scale(12),
      paddingHorizontal: scale(24),
      alignSelf: "center",
      marginTop: scale(20),
    },
    closeButtonText: {
      color: theme.colors.text,
      fontSize: scale(16),
      fontWeight: "600",
    },
  });

  const renderLanguageItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={dynamicStyles.languageItem}
      onPress={() => handleLanguageSelect(item)}
    >
      <View style={dynamicStyles.languageInfo}>
        <Text style={dynamicStyles.flag}>{item.flag}</Text>
        <View style={dynamicStyles.languageDetails}>
          <Text style={dynamicStyles.languageName}>{item.name}</Text>
          <Text style={dynamicStyles.nativeName}>{item.nativeName}</Text>
        </View>
      </View>
      {currentLanguage === item.code && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          style={dynamicStyles.selectedIndicator}
        />
      )}
    </TouchableOpacity>
  );

  if (showAsButton) {
    return (
      <>
        <TouchableOpacity
          style={dynamicStyles.button}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons
            name="language-outline"
            size={scale(28)}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={dynamicStyles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable
              style={dynamicStyles.modalContent}
              onPress={() => {}} // Prevent closing when tapping inside modal
            >
              <Text style={dynamicStyles.modalTitle}>{`${t("language")}`}</Text>

              <FlatList
                data={supportedLanguages}
                renderItem={renderLanguageItem}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
              />

              <TouchableOpacity
                style={dynamicStyles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={dynamicStyles.closeButtonText}>{`${t(
                  "close"
                )}`}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity
        style={dynamicStyles.header}
        onPress={() => setModalVisible(true)}
      >
        <Text style={dynamicStyles.title}>{`${t("language")}`}</Text>
        <View style={dynamicStyles.currentLanguage}>
          <Text style={dynamicStyles.flag}>{currentLangObj.flag}</Text>
          <Text style={dynamicStyles.languageText}>
            {currentLangObj.nativeName}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={dynamicStyles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={dynamicStyles.modalContent}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <Text style={dynamicStyles.modalTitle}>{`${t("language")}`}</Text>

            <FlatList
              data={supportedLanguages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={dynamicStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={dynamicStyles.closeButtonText}>{`${t(
                "close"
              )}`}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
