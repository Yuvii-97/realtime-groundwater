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
import { useTranslation } from "react-i18next"; // Changed from useLanguage
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

  // Safety check for notifications
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const categories = [
    {
      key: "all",
      label: t("notifications.all"),
      icon: "list",
      iconType: "Ionicons" as const,
      count: safeNotifications.length,
    },
    {
      key: "water_level",
      label: t("notifications.waterLevelAlerts"),
      icon: "water",
      iconType: "Ionicons" as const,
      count: safeNotifications.filter((n) => n && n.category === "water_level")
        .length,
    },
    {
      key: "tip",
      label: t("notifications.tips"),
      icon: "bulb-outline",
      iconType: "Ionicons" as const,
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
      {categories.map((category) => (
        <TouchableOpacity
          key={category.key}
          onPress={() =>
            onSelectCategory(category.key as NotificationCategory | "all")
          }
          style={{
            backgroundColor:
              selectedCategory === category.key ? "#007AFF" : "#F5F5F5",
            paddingHorizontal: scale(12),
            paddingVertical: scale(6),
            borderRadius: scale(20),
            marginRight: scale(8),
            flexDirection: "row",
            alignItems: "center",
            elevation: selectedCategory === category.key ? 3 : 1,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            minHeight: scale(32),
          }}
        >
          <Ionicons 
            name={category.icon as any} 
            size={scale(14)} 
            color={selectedCategory === category.key ? "#FFFFFF" : "#333333"}
            style={{ marginRight: scale(4) }}
          />
          <Text
            style={{
              color: selectedCategory === category.key ? "#FFFFFF" : "#333333",
              fontSize: scale(12),
              fontWeight: selectedCategory === category.key ? "600" : "400",
              marginRight: scale(4),
            }}
          >
            {category.label}
          </Text>
          {category.count > 0 && (
            <View
              style={{
                backgroundColor:
                  selectedCategory === category.key
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
                  color:
                    selectedCategory === category.key ? "#FFFFFF" : "#FFFFFF",
                  fontSize: scale(10),
                  fontWeight: "bold",
                }}
              >
                {category.count}
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
  // Safety check for notification object
  if (!notification || !notification.id || !notification.title) {
    return null;
  }

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

  // Compact list: no inline time/message; shown in detail on press

  const getNotificationIcon = (category: NotificationCategory, type: string) => {
    switch (category) {
      case 'water_level':
        switch (type) {
          case 'critical':
            return { name: 'warning', library: 'Ionicons' };
          case 'warning':
            return { name: 'alert-circle', library: 'Ionicons' };
          case 'success':
            return { name: 'checkmark-circle', library: 'Ionicons' };
          default:
            return { name: 'water', library: 'Ionicons' };
        }
      case 'tip':
        return { name: 'bulb-outline', library: 'Ionicons' };
      default:
        return { name: 'information-circle', library: 'Ionicons' };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: notification.read
          ? "#FFFFFF"
          : getTypeBackground(notification.type),
        marginHorizontal: scale(20),
        marginBottom: scale(10),
        borderRadius: scale(10),
        paddingVertical: scale(10),
        paddingHorizontal: scale(14),
        borderLeftWidth: scale(4),
        borderLeftColor: getTypeColor(notification.type),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1.5,
        minHeight: scale(44),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons 
              name={getNotificationIcon(notification.category, notification.type).name as any}
              size={scale(16)} 
              color={getTypeColor(notification.type)}
              style={{ marginRight: scale(8) }}
            />
            <Text
              style={{
                fontSize: scale(14),
                fontWeight: notification.read ? "500" : "700",
                color: "#333333",
                flex: 1,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <View
                style={{
                  width: scale(8),
                  height: scale(8),
                  borderRadius: scale(4),
                  backgroundColor: getTypeColor(notification.type),
                  marginLeft: scale(8),
                }}
              />
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={onDelete}
          style={{
            marginLeft: scale(8),
            padding: scale(4),
          }}
        >
          <Ionicons name="close" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation(); // Changed from useLanguage
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications() || {};

  const [selectedCategory, setSelectedCategory] = useState<
    NotificationCategory | "all"
  >("all");
  const [refreshing, setRefreshing] = useState(false);

  // Safety check for notifications and remove duplicates
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Remove any notifications with duplicate IDs
  const uniqueNotifications = safeNotifications.filter(
    (notif, index, arr) =>
      notif && notif.id && arr.findIndex((n) => n.id === notif.id) === index
  );

  const filteredNotifications =
    selectedCategory === "all"
      ? uniqueNotifications
      : uniqueNotifications.filter(
          (notif) => notif && notif.category === selectedCategory
        );

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    const details = [
      notification.message,
      notification.location ? `Location: ${notification.location}` : undefined,
      notification.source ? `Source: ${notification.source}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const buttons = [{ text: "Close", style: 'cancel' as const }];

    Alert.alert(notification.title, details || "", buttons);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingTop: scale(50),
            paddingBottom: scale(20),
            paddingHorizontal: scale(20),
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5E5",
            elevation: 2,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: scale(15),
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons 
                name="notifications" 
                size={scale(24)} 
                color="#333333" 
                style={{ marginRight: scale(8) }}
              />
              <Text
                style={{
                  fontSize: scale(24),
                  fontWeight: "bold",
                  color: "#333333",
                }}
              >
                {t("notifications.notifications")}
              </Text>
              {unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: "#FF3B30",
                    borderRadius: scale(12),
                    minWidth: scale(24),
                    height: scale(24),
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scale(12),
                      fontWeight: "bold",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={onClose}>
              <Text
                style={{
                  fontSize: scale(18),
                  color: "#007AFF",
                  fontWeight: "600",
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                backgroundColor: "#007AFF",
                paddingHorizontal: scale(12),
                paddingVertical: scale(8),
                borderRadius: scale(20),
                alignItems: "center",
                justifyContent: "center",
                minWidth: scale(36),
              }}
              accessibilityLabel={t("notifications.markAllAsRead")}
            >
              <Ionicons name="checkmark-done" size={scale(16)} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                backgroundColor: "#FF3B30",
                paddingHorizontal: scale(12),
                paddingVertical: scale(8),
                borderRadius: scale(20),
                alignItems: "center",
                justifyContent: "center",
                minWidth: scale(36),
              }}
              accessibilityLabel={t("notifications.clearAll")}
            >
              <Ionicons name="trash" size={scale(16)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          notifications={uniqueNotifications}
        />

        {/* Notifications List */}
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
                .filter((notification) => notification && notification.id)
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
    </Modal>
  );
};
