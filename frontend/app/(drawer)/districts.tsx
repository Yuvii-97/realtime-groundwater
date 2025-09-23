import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_BASE = "https://realtime-groundwater.onrender.com/api";

export default function Districts() {
  const theme = useTheme();
  const router = useRouter();
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE}/alerts`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const s = new Set<string>();
        (Array.isArray(data) ? data : []).forEach((a: any) => {
          if (a.district) s.add(a.district);
        });
        setDistricts(Array.from(s).sort());
      } catch (e: any) {
        setError(e?.message ?? "Failed to load districts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openAlerts = (district: string) => {
    router.push(`/(drawer)/alerts?district=${encodeURIComponent(district)}`);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (error)
    return (
      <View style={[styles.center, { padding: 16 }]}>
        <Text style={{ color: theme.colors.text }}>{error}</Text>
      </View>
    );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Districts
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {districts.length} found
        </Text>
      </View>

      <FlatList
        data={districts}
        keyExtractor={(i) => i}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openAlerts(item)}
            style={[styles.item, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.8}
          >
            <View style={styles.itemRow}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={20}
                color={theme.colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                  {item}
                </Text>
                <Text
                  style={[
                    styles.itemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  View alerts for this district
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 20 }}>
            <Text style={{ color: theme.colors.textSecondary }}>
              No districts available
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  item: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  itemSubtitle: { fontSize: 12, marginTop: 4 },
});
