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
      icon: "📋",
      count: safeNotifications.length,
    },
    {
      key: "water_level",
      label: t("notifications.waterLevelAlerts"),
      icon: "💧",
      count: safeNotifications.filter((n) => n && n.category === "water_level")
        .length,
    },
    {
      key: "prediction",
      label: t("notifications.predictions"),
      icon: "🔮",
      count: safeNotifications.filter((n) => n && n.category === "prediction")
        .length,
    },
    {
      key: "system",
      label: t("notifications.system"),
      icon: "⚙️",
      count: safeNotifications.filter((n) => n && n.category === "system")
        .length,
    },
    {
      key: "tip",
      label: t("notifications.tips"),
      icon: "💡",
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
          <Text style={{ fontSize: scale(14), marginRight: scale(4) }}>
            {category.icon}
          </Text>
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

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
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
        marginBottom: scale(12),
        borderRadius: scale(12),
        padding: scale(16),
        borderLeftWidth: scale(4),
        borderLeftColor: getTypeColor(notification.type),
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
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: scale(4),
            }}
          >
            {notification.icon && (
              <Text style={{ fontSize: scale(16), marginRight: scale(8) }}>
                {notification.icon}
              </Text>
            )}
            <Text
              style={{
                fontSize: scale(14),
                fontWeight: notification.read ? "500" : "700",
                color: "#333333",
                flex: 1,
              }}
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

          <Text
            style={{
              fontSize: scale(13),
              color: "#666666",
              lineHeight: scale(18),
              marginBottom: scale(8),
            }}
          >
            {notification.message}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {notification.location && (
                <Text
                  style={{
                    fontSize: scale(11),
                    color: "#999999",
                    marginRight: scale(12),
                  }}
                >
                  📍 {notification.location}
                </Text>
              )}
              <Text
                style={{
                  fontSize: scale(11),
                  color: "#999999",
                }}
              >
                {formatTime(notification.timestamp)}
              </Text>
            </View>

            {notification.actionable && (
              <View
                style={{
                  backgroundColor: getTypeColor(notification.type),
                  paddingHorizontal: scale(8),
                  paddingVertical: scale(4),
                  borderRadius: scale(12),
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scale(10),
                    fontWeight: "600",
                  }}
                >
                  ACTION
                </Text>
              </View>
            )}
          </View>

          {notification.source && (
            <Text
              style={{
                fontSize: scale(10),
                color: "#AAAAAA",
                marginTop: scale(4),
                fontStyle: "italic",
              }}
            >
              Source: {notification.source}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onDelete}
          style={{
            marginLeft: scale(8),
            padding: scale(4),
          }}
        >
          <Text style={{ fontSize: scale(16), color: "#CCCCCC" }}>✕</Text>
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

    if (notification.actionable) {
      Alert.alert(
        notification.title,
        `${notification.message}\n\nWhat would you like to do?`,
        [
          {
            text: "View Details",
            onPress: () => console.log("View details for:", notification.id),
          },
          {
            text: "Take Action",
            onPress: () => console.log("Take action for:", notification.id),
          },
          { text: "Dismiss", style: "cancel" },
        ]
      );
    }
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
              <Text
                style={{
                  fontSize: scale(24),
                  fontWeight: "bold",
                  color: "#333333",
                  marginRight: scale(8),
                }}
              >
                🔔 {t("notifications.notifications")}
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
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                backgroundColor: "#007AFF",
                paddingHorizontal: scale(16),
                paddingVertical: scale(8),
                borderRadius: scale(20),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scale(13),
                  fontWeight: "600",
                  marginRight: scale(4),
                }}
              >
                ✓ {t("notifications.markAllAsRead")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                backgroundColor: "#FF3B30",
                paddingHorizontal: scale(16),
                paddingVertical: scale(8),
                borderRadius: scale(20),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scale(13),
                  fontWeight: "600",
                  marginRight: scale(4),
                }}
              >
                🗑️ {t("notifications.clearAll")}
              </Text>
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
              <Text style={{ fontSize: scale(48), marginBottom: scale(16) }}>
                📭
              </Text>
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
