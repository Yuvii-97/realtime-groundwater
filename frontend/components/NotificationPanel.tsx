import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import {
  useNotifications,
  Notification,
  NotificationCategory,
} from "../contexts/NotificationContext";
import { useTranslation } from "react-i18next";
import { scale } from "../utils/styling";
import { Ionicons } from "@expo/vector-icons";

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
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const categories = [
    {
      key: "all",
      label: t("notifications.all"),
      icon: "list",
      count: safeNotifications.length,
    },
    {
      key: "water_level",
      label: t("notifications.waterLevelAlerts"),
      icon: "water",
      count: safeNotifications.filter((n) => n && n.category === "water_level")
        .length,
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
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        alignItems: "center",
      }}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          onPress={() =>
            onSelectCategory(cat.key as NotificationCategory | "all")
          }
          style={{
            backgroundColor:
              selectedCategory === cat.key ? "#007AFF" : "#F5F5F5",
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
            color={selectedCategory === cat.key ? "#FFFFFF" : "#333333"}
            style={{ marginRight: scale(4) }}
          />
          {cat.count > 0 && (
            <View
              style={{
                backgroundColor:
                  selectedCategory === cat.key
                    ? "rgba(255,255,255,0.3)"
                    : "#007AFF",
                borderRadius: scale(10),
                minWidth: scale(18),
                height: scale(18),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scale(10),
                  fontWeight: "bold",
                }}
              >
                {cat.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const NotificationItem = ({
  notification,
  onPress,
  onDelete,
}: {
  notification: Notification;
  onPress: () => void;
  onDelete: () => void;
}) => {
  if (!notification || !notification.id || !notification.title) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "#FF3B30";
      case "warning":
        return "#FF9500";
      case "success":
        return "#34C759";
      default:
        return "#007AFF";
    }
  };

  const getTypeBackground = (type: string) => {
    switch (type) {
      case "critical":
        return "#FFE5E5";
      case "warning":
        return "#FFF2E5";
      case "success":
        return "#E5F7E5";
      default:
        return "#E5F3FF";
    }
  };

  const getNotificationIcon = (
    category: NotificationCategory,
    type: string
  ) => {
    if (category === "water_level") {
      if (type === "critical") return "warning";
      if (type === "warning") return "alert-circle";
      if (type === "success") return "checkmark-circle";
      return "water";
    }
    if (category === "tip") return "bulb-outline";
    return "information-circle";
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: notification.read
          ? "#FFFFFF"
          : getTypeBackground(notification.type),
        marginHorizontal: scale(12),
        marginBottom: scale(8),
        borderRadius: scale(8),
        paddingVertical: scale(8),
        paddingHorizontal: scale(12),
        borderLeftWidth: scale(4),
        borderLeftColor: getTypeColor(notification.type),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={
            getNotificationIcon(notification.category, notification.type) as any
          }
          size={scale(16)}
          color={getTypeColor(notification.type)}
          style={{ marginRight: scale(8) }}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: scale(14),
              fontWeight: notification.read ? "500" : "700",
              color: "#333333",
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {notification.title}
          </Text>
          {notification.message ? (
            <Text
              style={{
                fontSize: scale(12),
                color: "#666666",
                marginTop: scale(4),
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {notification.message}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: scale(8),
          }}
        >
          <TouchableOpacity
            onPress={onPress}
            style={{ padding: scale(6), marginRight: scale(6) }}
          >
            <Text
              style={{
                color: "#007AFF",
                fontSize: scale(12),
                fontWeight: "600",
              }}
            >
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={{ padding: scale(6) }}>
            <Ionicons name="close" size={scale(16)} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationListView: React.FC<{ onDone?: () => void }> = ({
  onDone,
}) => {
  const { t } = useTranslation();
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications() || {};
  const [selectedCategory, setSelectedCategory] = useState<
    NotificationCategory | "all"
  >("all");
  const [refreshing, setRefreshing] = useState(false);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const uniqueNotifications = safeNotifications.filter(
    (notif, index, arr) =>
      notif && notif.id && arr.findIndex((n) => n.id === notif.id) === index
  );

  const filteredNotifications =
    selectedCategory === "all"
      ? uniqueNotifications
      : uniqueNotifications.filter((n) => n && n.category === selectedCategory);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    const details = [
      notification.message,
      notification.location ? `Location: ${notification.location}` : undefined,
      notification.source ? `Source: ${notification.source}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    Alert.alert(notification.title, details || "", [
      { text: t("notifications.close") || "Close", style: "cancel" as const },
    ]);
  };

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
          onPress: clearAllNotifications,
        },
      ]
    );
  };

  // onDone handled by onDone prop (modal) or screen wrapper

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          // reduced top padding to be more compact
          paddingTop: scale(18),
          paddingBottom: scale(12),
          paddingHorizontal: scale(16),
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5E5",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={markAllAsRead}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#007AFF",
              paddingHorizontal: scale(10),
              paddingVertical: scale(6),
              borderRadius: scale(18),
            }}
            accessibilityLabel={t("notifications.markAllAsRead")}
          >
            <Ionicons
              name="checkmark-done"
              size={scale(14)}
              color="#FFFFFF"
              style={{ marginRight: scale(6) }}
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: scale(13),
                fontWeight: "600",
              }}
            >
              {t("notifications.markAllAsRead")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearAll}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FF3B30",
              paddingHorizontal: scale(10),
              paddingVertical: scale(6),
              borderRadius: scale(18),
            }}
            accessibilityLabel={t("notifications.clearAll")}
          >
            <Ionicons
              name="trash"
              size={scale(14)}
              color="#FFFFFF"
              style={{ marginRight: scale(6) }}
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: scale(13),
                fontWeight: "600",
              }}
            >
              {t("notifications.clearAll")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        notifications={uniqueNotifications}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: scale(60),
            }}
          >
            <Ionicons
              name="notifications-off"
              size={scale(48)}
              color="#CCCCCC"
              style={{ marginBottom: scale(16) }}
            />
            <Text
              style={{
                fontSize: scale(18),
                color: "#666666",
                textAlign: "center",
                marginBottom: scale(8),
              }}
            >
              {t("notifications.noNotifications")}
            </Text>
            <Text
              style={{
                fontSize: scale(14),
                color: "#999999",
                textAlign: "center",
              }}
            >
              {selectedCategory === "all"
                ? "You're all caught up!"
                : `No ${
                    typeof selectedCategory === "string"
                      ? selectedCategory.replace("_", " ")
                      : selectedCategory
                  } notifications`}
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
                  onPress={() => handleNotificationPress(notification)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            <View style={{ height: scale(20) }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <NotificationListView onDone={onClose} />
    </Modal>
  );
};
