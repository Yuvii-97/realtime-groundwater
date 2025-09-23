import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NotificationListView } from "../components/NotificationPanel";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/styling";

export default function NotificationsScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: scale(50),
          paddingBottom: scale(12),
          paddingHorizontal: scale(16),
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5E5",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: scale(12) }}
        >
          <Ionicons name="chevron-back" size={scale(28)} color="#007AFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: scale(20), fontWeight: "700" }}>
          Notifications
        </Text>
      </View>

      <NotificationListView />
    </View>
  );
}
