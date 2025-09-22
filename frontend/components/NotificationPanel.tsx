import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import {
  useNotifications,
  Notification,
  NotificationCategory,
} from "../contexts/NotificationContext";
import { useTranslation } from "react-i18next";
import { scale } from "../utils/styling";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

const CategoryFilter = ({
  selectedCategory,
  onSelectCategory,
  notifications,
}: {
  selectedCategory: NotificationCategory | "all";
  onSelectCategory: (category: NotificationCategory | "all") => void;
  notifications: Notification[];
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const categories = [
    { key: "all", label: t("notifications.all"), icon: "list", count: safeNotifications.length },
    {
      key: "water_level",
      label: t("notifications.waterLevelAlerts"),
      icon: "water",
      count: safeNotifications.filter((n) => n && n.category === "water_level").length,
    },
    {
      key: "tip",
      label: t("notifications.tips"),
      icon: "bulb-outline",
      count: safeNotifications.filter((n) => n && n.category === "tip").length,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: scale(15), maxHeight: scale(50) }}
      contentContainerStyle={{ paddingHorizontal: scale(20), alignItems: "center" }}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          onPress={() => onSelectCategory(cat.key as NotificationCategory | "all")}
          style={{
            backgroundColor: selectedCategory === cat.key ? theme.colors.primary : theme.colors.surfaceSecondary,
            paddingHorizontal: scale(12),
            paddingVertical: scale(6),
            borderRadius: scale(20),
            marginRight: scale(8),
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={cat.icon as any}
            size={scale(14)}
            color={selectedCategory === cat.key ? "#FFFFFF" : theme.colors.text}
            style={{ marginRight: scale(6) }}
          />
          <Text
            style={{
              color: selectedCategory === cat.key ? "#FFFFFF" : theme.colors.text,
              fontSize: scale(12),
              marginRight: scale(6),
              fontWeight: selectedCategory === cat.key ? "700" : "600",
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cat.label}
          </Text>
          {cat.count > 0 && (
            <View
              style={{
                backgroundColor: selectedCategory === cat.key ? "rgba(255,255,255,0.3)" : theme.colors.primary,
                borderRadius: scale(10),
                minWidth: scale(18),
                height: scale(18),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: scale(10), fontWeight: "bold" }}>{cat.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const NotificationItem = ({
  notification,
  onDelete,
  onPress,
}: {
  notification: Notification;
  onDelete: () => void;
  onPress: () => void;
}) => {
  const theme = useTheme();
  if (!notification || !notification.id || !notification.title) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return theme.colors.danger;
      case "warning":
        return theme.colors.warning;
      case "success":
        return theme.colors.success;
      default:
        return theme.colors.info;
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getTypeBackground = (type: string) => {
    const c = getTypeColor(type);
    return hexToRgba(c, theme.isDark ? 0.18 : 0.12);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "critical":
        return "Critical";
      case "warning":
        return "Warning";
      case "success":
        return "Success";
      default:
        return "Info";
    }
  };

  const getNotificationIcon = (category: NotificationCategory, type: string) => {
    if (category === "water_level") {
      if (type === "critical") return "warning" as any;
      if (type === "warning") return "alert-circle" as any;
      if (type === "success") return "checkmark-circle" as any;
      return "water" as any;
    }
    if (category === "tip") return "bulb-outline" as any;
    return "information-circle" as any;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        backgroundColor: notification.read ? theme.colors.surface : getTypeBackground(notification.type),
        marginHorizontal: scale(12),
        marginBottom: scale(8),
        borderRadius: scale(8),
        paddingVertical: scale(12),
        paddingHorizontal: scale(12),
        borderLeftWidth: scale(4),
        borderLeftColor: getTypeColor(notification.type),
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={getNotificationIcon(notification.category, notification.type)}
          size={scale(18)}
          color={getTypeColor(notification.type)}
          style={{ marginRight: scale(8) }}
        />
        <Text
          style={{ fontSize: scale(15), fontWeight: notification.read ? "600" : "800", color: theme.colors.text, flex: 1 }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {notification.title}
        </Text>
        <View
          style={{
            backgroundColor: getTypeBackground(notification.type),
            borderWidth: 1,
            borderColor: getTypeColor(notification.type),
            paddingHorizontal: scale(8),
            paddingVertical: scale(2),
            borderRadius: scale(12),
            marginLeft: scale(8),
          }}
        >
          <Text style={{ color: getTypeColor(notification.type), fontSize: scale(11), fontWeight: "700" }}>
            {getTypeLabel(notification.type)}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={{ padding: scale(6) }}>
          <Ionicons name="close" size={scale(16)} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      {notification.message ? (
        <Text style={{ fontSize: scale(13), color: theme.colors.textSecondary, marginTop: scale(8), lineHeight: scale(18) }}>
          {notification.message}
        </Text>
      ) : null}

      <View style={{ marginTop: scale(10), flexDirection: "row", alignItems: "center" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1 }}>
          {notification.location ? (
            <View
              style={{
                backgroundColor: theme.colors.surfaceSecondary,
                borderRadius: scale(12),
                paddingHorizontal: scale(8),
                paddingVertical: scale(4),
                marginRight: scale(6),
                marginBottom: scale(6),
              }}
            >
              <Text style={{ fontSize: scale(11), color: theme.colors.textSecondary }}>
                Location: {notification.location}
              </Text>
            </View>
          ) : null}
          {notification.source ? (
            <View
              style={{
                backgroundColor: theme.colors.surfaceSecondary,
                borderRadius: scale(12),
                paddingHorizontal: scale(8),
                paddingVertical: scale(4),
                marginRight: scale(6),
                marginBottom: scale(6),
              }}
            >
              <Text style={{ fontSize: scale(11), color: theme.colors.textSecondary }}>
                Source: {notification.source}
              </Text>
            </View>
          ) : null}
        </View>
        {notification.timestamp ? (
          <Text style={{ fontSize: scale(11), color: theme.colors.textLight }}>
            {new Date(notification.timestamp as any).toLocaleString()}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export const NotificationListView: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications = [], markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications() || {};
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (!message) return;
    setToastMsg(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setToastMsg(null));
    }, 1600);
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const uniqueNotifications = safeNotifications.filter((notif, index, arr) => notif && notif.id && arr.findIndex((n) => n.id === notif.id) === index);

  const filteredNotifications =
    selectedCategory === "all" ? uniqueNotifications : uniqueNotifications.filter((n) => n && n.category === selectedCategory);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleClearAll = () => {
    Alert.alert(
      t("notifications.clearAll"),
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: t("notifications.cancel"), style: "cancel" },
        {
          text: t("notifications.clearAll"),
          style: "destructive",
          onPress: async () => {
                try {
                  await clearAllNotifications();
                  showToast("Cleared All");
            } catch (e) {}
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingTop: scale(18),
          paddingBottom: scale(12),
          paddingHorizontal: scale(16),
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => {
              markAllAsRead();
              showToast("All Read");
            }}
            style={{
              backgroundColor: theme.colors.primary,
              width: scale(36),
              height: scale(36),
              borderRadius: scale(18),
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel={t("notifications.markAllAsRead")}
          >
            <Ionicons name="checkmark-done" size={scale(18)} color={theme.colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearAll}
            style={{
              backgroundColor: theme.colors.danger,
              width: scale(36),
              height: scale(36),
              borderRadius: scale(18),
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel={t("notifications.clearAll")}
          >
            <Ionicons name="trash" size={scale(18)} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} notifications={uniqueNotifications} />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#007AFF" />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: scale(60) }}>
            <Ionicons name="notifications-off" size={scale(48)} color={theme.colors.textLight} style={{ marginBottom: scale(16) }} />
            <Text style={{ fontSize: scale(18), color: theme.colors.textSecondary, textAlign: "center", marginBottom: scale(8) }}>
              {t("notifications.noNotifications")}
            </Text>
            <Text style={{ fontSize: scale(14), color: theme.colors.textLight, textAlign: "center" }}>
              {selectedCategory === "all"
                ? "You're all caught up!"
                : `No ${typeof selectedCategory === "string" ? selectedCategory.replace("_", " ") : selectedCategory} notifications`}
            </Text>
          </View>
        ) : (
          <>
            {filteredNotifications
              .filter((n) => n && n.id)
              .map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={() => deleteNotification(notification.id)}
                  onPress={() => {
                    if (!notification.read) markAsRead(notification.id);
                  }}
                />
              ))}
            <View style={{ height: scale(20) }} />
          </>
        )}
      </ScrollView>

      {toastMsg ? (
        <Animated.View
          pointerEvents="none"
          style={{ position: "absolute", left: scale(16), right: scale(16), bottom: insets.bottom + scale(20), opacity: toastOpacity }}
        >
          <View
            style={{
              backgroundColor: theme.isDark ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.8)",
              paddingHorizontal: scale(14),
              paddingVertical: scale(10),
              borderRadius: scale(12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: scale(13), fontWeight: "600" }}>{toastMsg}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <NotificationListView onDone={onClose} />
    </Modal>
  );
};
