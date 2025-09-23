import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Share,
  TextInput,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type AlertItem = {
  _id?: string;
  id?: string;
  stationCode?: string;
  stationName?: string;
  district?: string;
  level?: number;
  alertType?: string;
  message?: string;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
};

const API_BASE = "https://realtime-groundwater.onrender.com/api";

export default function Alerts() {
  const theme = useTheme();
  const router = useRouter();

  const [mode, setMode] = useState<"recent" | "all">("recent");
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI filters
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        mode === "recent"
          ? `${API_BASE}/alerts?sinceDays=7`
          : `${API_BASE}/alerts`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setItems(
        (Array.isArray(data) ? data : []).map((d: any) => ({
          ...d,
          read: false,
        }))
      );
    } catch (e: any) {
      setError(e.message || "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAlerts();
    } finally {
      setRefreshing(false);
    }
  };

  const shareAlert = async (a: AlertItem) => {
    try {
      await Share.share({
        message: `${a.alertType} - ${a.stationName || a.stationCode}\n${
          a.message
        }\n${a.createdAt || a.timestamp}`,
      });
    } catch {
      // ignore share errors
    }
  };

  const markAllRead = () =>
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
  const clearAll = () => setItems([]);

  // Deduplicate by station: group alerts by stationCode,
  // keep newest alert as the card primary, count others.
  const stations = useMemo(() => {
    const map = new Map<string, AlertItem[]>();
    items.forEach((it) => {
      const key = it.stationCode || it.stationName || "unknown";
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    });

    // produce array of aggregated station entries
    const list = Array.from(map.entries()).map(([key, arr]) => {
      arr.sort((a, b) => {
        const ta = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tb = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tb - ta;
      });
      const primary = arr[0];
      return {
        stationKey: key,
        stationName: primary.stationName || key,
        stationCode: primary.stationCode,
        district: primary.district,
        latest: primary,
        count: arr.length,
        allAlerts: arr,
      };
    });

    // apply filters: type, district, search
    return list
      .filter((s) => {
        if (typeFilter && s.latest.alertType !== typeFilter) return false;
        if (districtFilter && s.district !== districtFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !(s.stationName || "").toLowerCase().includes(q) &&
            !(s.stationCode || "").toLowerCase().includes(q) &&
            !(s.latest.message || "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = new Date(
          a.latest.createdAt || a.latest.timestamp || 0
        ).getTime();
        const tb = new Date(
          b.latest.createdAt || b.latest.timestamp || 0
        ).getTime();
        return tb - ta;
      });
  }, [items, typeFilter, districtFilter, search]);

  // derive available filter values
  const availableTypes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => {
      if (i.alertType) {
        s.add(i.alertType);
      }
    });
    return Array.from(s);
  }, [items]);

  const availableDistricts = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.district && s.add(i.district));
    return Array.from(s).sort();
  }, [items]);

  const sections = useMemo(() => {
    // group stations by district for section headers
    const map = new Map<string, typeof stations>();
    stations.forEach((st) => {
      const key = st.district || "Unknown";
      const arr = map.get(key) || [];
      arr.push(st);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ title: k, data: v }));
  }, [stations]);

  const openDetail = (id?: string) => {
    if (!id) return;
    // encode id and cast to any to satisfy expo-router's strict route union types
    router.push(`/(drawer)/notifications/${encodeURIComponent(id)}` as any);
  };

  const renderStation = ({ item }: { item: any }) => {
    const latest: AlertItem = item.latest;
    const time = latest.createdAt || latest.timestamp || "";
    return (
      <TouchableOpacity
        style={[styles.item, item.latest.read ? styles.itemRead : null]}
        onPress={() => openDetail(latest._id || latest.id)}
        activeOpacity={0.85}
      >
        <View style={styles.rowTop}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: typeColor(latest.alertType) },
            ]}
          >
            <MaterialCommunityIcons
              name={iconName(latest.alertType)}
              size={20}
              color="#fff"
            />
          </View>

          <View style={styles.flex}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={[styles.title, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.stationName}
              </Text>
              {item.count > 1 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{item.count}</Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {latest.message}
            </Text>

            {/* Additional small text below description */}
            <Text
              style={[
                styles.stationMeta,
                { color: theme.colors.textSecondary },
              ]}
            >
              Station: {item.stationName} ({item.stationCode || "—"}) •
              District: {item.district || "—"}
            </Text>
          </View>

          <View style={styles.meta}>
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
              {formatTime(time)}
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => shareAlert(latest)}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.countText}>{stations.length}</Text>
          <Text
            style={[styles.countLabel, { color: theme.colors.textSecondary }]}
          >
            Stations
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setMode("recent")}
            style={[styles.modeBtn, mode === "recent" && styles.modeBtnActive]}
          >
            <Text
              style={
                mode === "recent" ? styles.modeTextActive : styles.modeText
              }
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("all")}
            style={[styles.modeBtn, mode === "all" && styles.modeBtnActive]}
          >
            <Text
              style={mode === "all" ? styles.modeTextActive : styles.modeText}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters row */}
      <View style={styles.filtersRow}>
        <View style={styles.chips}>
          <TouchableOpacity
            onPress={() => setTypeFilter(null)}
            style={[styles.chip, typeFilter === null && styles.chipActive]}
          >
            <Text
              style={
                typeFilter === null ? styles.chipTextActive : styles.chipText
              }
            >
              All
            </Text>
          </TouchableOpacity>
          {availableTypes.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(typeFilter === t ? null : t)}
              style={[styles.chip, typeFilter === t && styles.chipActive]}
            >
              <Text
                style={
                  typeFilter === t ? styles.chipTextActive : styles.chipText
                }
              >
                {labelForType(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search station / message"
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TouchableOpacity
            onPress={markAllRead}
            style={[styles.headerBtn, { marginLeft: 8 }]}
          >
            <Text style={styles.headerBtnText}>Mark all</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* District chips */}
      <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setDistrictFilter(null)}
            style={[
              styles.smallChip,
              districtFilter === null && styles.chipActiveSmall,
            ]}
          >
            <Text
              style={
                districtFilter === null
                  ? styles.chipTextActiveSmall
                  : styles.chipTextSmall
              }
            >
              All districts
            </Text>
          </TouchableOpacity>
          {availableDistricts.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDistrictFilter(districtFilter === d ? null : d)}
              style={[
                styles.smallChip,
                districtFilter === d && styles.chipActiveSmall,
              ]}
            >
              <Text
                style={
                  districtFilter === d
                    ? styles.chipTextActiveSmall
                    : styles.chipTextSmall
                }
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.text }}>{`Error: ${error}`}</Text>
          <TouchableOpacity onPress={fetchAlerts} style={styles.retryBtn}>
            <Text style={{ color: "#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(i, idx) => (i.stationKey || idx).toString()}
          renderItem={renderStation}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text
                style={{ color: theme.colors.textSecondary, fontWeight: "700" }}
              >
                {title}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={{ color: theme.colors.textSecondary, padding: 20 }}>
              No alerts
            </Text>
          }
        />
      )}
    </View>
  );
}

// helpers
function formatTime(s?: string) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

function typeColor(type?: string) {
  if (!type) return "#999";
  switch (type?.toLowerCase()) {
    case "threshold_breach":
      return "#ef4444";
    case "sudden_jump":
      return "#f59e0b";
    case "trend_down":
    case "trend_up":
      return "#06b6d4";
    default:
      return "#6b7280";
  }
}

function iconName(type?: string) {
  if (!type) return "bell-outline";
  switch (type?.toLowerCase()) {
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

function labelForType(type?: string) {
  if (!type) return "Alert";
  switch (type.toLowerCase()) {
    case "threshold_breach":
      return "Threshold";
    case "sudden_jump":
      return "Sudden";
    case "trend_down":
      return "Trend down";
    case "trend_up":
      return "Trend up";
    default:
      return type;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 6 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 6,
  },
  countText: { fontSize: 20, fontWeight: "700" },
  countLabel: { fontSize: 12 },
  filtersRow: { paddingHorizontal: 12, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: "#075a7dff", borderColor: "#075a7dff" },
  chipText: { color: "#374151" },
  chipTextActive: { color: "#fff" },

  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
    marginBottom: 6,
  },
  chipActiveSmall: { backgroundColor: "#075a7dff", borderColor: "#075a7dff" },
  chipTextSmall: { color: "#374151", fontSize: 12 },
  chipTextActiveSmall: { color: "#fff", fontSize: 12 },

  searchInput: {
    minWidth: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },

  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerBtnText: { color: "#374151" },

  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  modeBtnActive: {
    backgroundColor: "#075a7dff",
    borderColor: "#075a7dff",
  },
  modeText: { color: "#374151" },
  modeTextActive: { color: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 2,
  },
  itemRead: { opacity: 0.65 },
  rowTop: { flexDirection: "row", alignItems: "flex-start" },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  flex: { flex: 1 },
  title: { fontWeight: "800", fontSize: 15 },
  subtitle: { fontSize: 13, marginTop: 6 },
  stationMeta: { marginTop: 6, fontSize: 12, opacity: 0.85 },
  meta: { marginLeft: 8 },
  time: { fontSize: 12 },
  countBadge: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  itemActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionText: { fontSize: 13 },
  retryBtn: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#075a7dff",
    borderRadius: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
});
