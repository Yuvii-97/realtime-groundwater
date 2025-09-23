import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

const API_BASE = "https://realtime-groundwater.onrender.com/api";

export default function NotificationDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id?: string };
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItem(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load alert");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.text }}>{error}</Text>
      </View>
    );
  if (!item)
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.text }}>Alert not found</Text>
      </View>
    );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={{ color: theme.colors.primary }}>Back</Text>
      </TouchableOpacity>

      <View
        style={[styles.card, { borderLeftColor: typeColor(item.alertType) }]}
      >
        <View style={styles.headerRow}>
          <MaterialCommunityIcons
            name={iconName(item.alertType)}
            size={28}
            color="#fff"
            style={[
              styles.icon,
              { backgroundColor: typeColor(item.alertType) },
            ]}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {item.stationName || item.stationCode}
            </Text>
            <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
              {item.district || "—"}
            </Text>
          </View>
        </View>

        <Text style={[styles.message, { color: theme.colors.text }]}>
          {item.message}
        </Text>

        <View style={styles.row}>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Level: {String(item.level ?? "—")}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Timestamp: {formatTime(item.timestamp)}
          </Text>
        </View>

        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Created: {formatTime(item.createdAt)}
        </Text>

        {/* raw payload for debugging */}
        <View style={styles.raw}>
          <Text
            style={{
              fontWeight: "700",
              marginBottom: 6,
              color: theme.colors.text,
            }}
          >
            Raw
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            {JSON.stringify(item, null, 2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function formatTime(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}
function typeColor(type?: string) {
  switch ((type || "").toLowerCase()) {
    case "threshold_breach":
      return "#ef4444";
    case "sudden_jump":
      return "#f59e0b";
    case "trend_down":
      return "#06b6d4";
    case "trend_up":
      return "#06b6d4";
    default:
      return "#6b7280";
  }
}
function iconName(type?: string) {
  switch ((type || "").toLowerCase()) {
    case "threshold_breach":
      return "alert-circle";
    case "sudden_jump":
      return "flash-alert";
    case "trend_down":
      return "trending-down";
    case "trend_up":
      return "trending-up";
    default:
      return "bell-outline";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  back: { marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 6,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  icon: { width: 44, height: 44, borderRadius: 10, padding: 8 },
  title: { fontSize: 18, fontWeight: "800" },
  sub: { fontSize: 13, marginTop: 2 },
  message: { fontSize: 16, marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  meta: { fontSize: 13 },
  raw: {
    marginTop: 14,
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 8,
  },
});
