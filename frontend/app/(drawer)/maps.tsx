import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
// REMOVED: import ClusteredMapView from "react-native-map-clustering"; // Removed as requested

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import stationsData from "@/assets/Coordinates/stations.json";
import type { FlatListProps } from "react-native";
import React, { forwardRef } from "react"; // Import forwardRef
import { useNavigation } from "@react-navigation/native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

interface Station {
  state: string;
  district: string;
  station_code: string;
  station_name: string;
  latitude: number;
  longitude: number;
  well_type: string | null;
  station_status: string; // keep broad if mixed values
}

const rawStations: any[] = Array.isArray(stationsData)
  ? stationsData
  : Array.isArray((stationsData as any)?.data)
  ? (stationsData as any).data
  : [];

// Robust number parser
function toNum(v: any): number | null {
  if (v === 0) return 0;
  if (v === "0") return 0;
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function isValidLatLon(lat: number | null, lon: number | null): boolean {
  return (
    lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  );
}

// Collect stats for debugging why markers missing
interface ParseStats {
  total: number;
  kept: number;
  invalidCoord: number;
  missingCode: number;
  duplicateCodes: number;
}

function buildStations(list: any[]): {
  stations: Station[];
  stats: ParseStats;
} {
  const seen = new Set<string>();
  const result: Station[] = [];
  let invalidCoord = 0;
  let missingCode = 0;
  let duplicateCodes = 0;

  for (const raw of list) {
    if (!raw) continue;
    const codeRaw = raw.station_code ?? raw.stationCode ?? raw.code;
    if (!codeRaw || String(codeRaw).trim().length === 0) {
      missingCode++;
      continue;
    }
    const code = String(codeRaw).trim();

    const latCandidate =
      raw.latitude ?? raw.lat ?? raw.Latitude ?? raw.LAT ?? raw.LATITUDE;
    const lonCandidate =
      raw.longitude ??
      raw.lon ??
      raw.lng ??
      raw.Longitude ??
      raw.LON ??
      raw.LONGITUDE;

    const lat = toNum(latCandidate);
    const lon = toNum(lonCandidate);

    if (!isValidLatLon(lat, lon)) {
      invalidCoord++;
      continue;
    }

    if (seen.has(code)) {
      // Keep duplicates by suffix to avoid “missing” stations (optional)
      duplicateCodes++;
      const suffixCode = `${code}#${duplicateCodes}`;
      result.push({
        state: raw.state ?? raw.State ?? "",
        district: raw.district ?? raw.District ?? "",
        station_code: suffixCode,
        station_name:
          raw.station_name ?? raw.stationName ?? raw.name ?? suffixCode,
        latitude: lat!,
        longitude: lon!,
        well_type: raw.well_type ?? null,
        station_status: raw.station_status ?? raw.status ?? "Active",
      });
      continue;
    }

    seen.add(code);
    result.push({
      state: raw.state ?? raw.State ?? "",
      district: raw.district ?? raw.District ?? "",
      station_code: code,
      station_name: raw.station_name ?? raw.stationName ?? raw.name ?? code,
      latitude: lat!,
      longitude: lon!,
      well_type: raw.well_type ?? null,
      station_status: raw.station_status ?? raw.status ?? "Active",
    });
  }

  return {
    stations: result,
    stats: {
      total: list.length,
      kept: result.length,
      invalidCoord,
      missingCode,
      duplicateCodes,
    },
  };
}

const { stations, stats } = buildStations(rawStations);
const hasStations = stations.length > 0;

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(
    `[maps] stations parsed: total=${stats.total} kept=${stats.kept} invalidCoord=${stats.invalidCoord} missingCode=${stats.missingCode} duplicateCodes(forked)=${stats.duplicateCodes}`
  );
}

// ---- safe region helper (reuse) ----
function computeInitialRegion(list: Station[]): Region {
  if (!list.length)
    return {
      latitude: 22.3511148,
      longitude: 78.6677428,
      latitudeDelta: 18,
      longitudeDelta: 18,
    };
  if (list.length === 1)
    return {
      latitude: list[0].latitude,
      longitude: list[0].longitude,
      latitudeDelta: 1,
      longitudeDelta: 1,
    };
  const lats = list.map((s) => s.latitude);
  const lons = list.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: (maxLat - minLat || 1) * 1.4,
    longitudeDelta: (maxLon - minLon || 1) * 1.4,
  };
}

// Lightweight debounce hook (fixed)
function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ================== MAIN MAPS SCREEN ==================
export default function MapsScreen() {
  const navigation = useNavigation<any>(); // add

  // Ref for the *static* map component
  const mapRef = useRef<MapView | null>(null);

  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const debouncedQuery = useDebounce(search, 300);
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true); // New loading state

  const statusColor = useCallback(
    (status: string) => (status === "Active" ? "#2E8B57" : "#B0B0B0"),
    []
  );

  const filtered = useMemo(() => {
    let base = stations; // Always filter from the full list
    if (filter === "active")
      base = base.filter((s) => s.station_status === "Active");
    else if (filter === "inactive")
      base = base.filter((s) => s.station_status !== "Active");
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      base = base.filter(
        (s) =>
          s.station_name.toLowerCase().includes(q) ||
          s.station_code.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q)
      );
    }
    return base;
  }, [filter, debouncedQuery]);

  // Memo focusStation to satisfy exhaustive-deps + keep stable reference
  const focusStation = useCallback((st: Station) => {
    if (!st || !isValidLatLon(st.latitude, st.longitude)) return;
    mapRef.current?.animateToRegion(
      {
        latitude: st.latitude,
        longitude: st.longitude,
        latitudeDelta: 0.05, // Zoom in closer
        longitudeDelta: 0.05, // Zoom in closer
      },
      600
    );
  }, []); // No dependencies as it's stable

  const togglePanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPanelOpen((o) => !o);
  };

  const handleStationPress = useCallback(
    (st: Station) => {
      navigation.navigate("StationDetail", {
        station: {
          code: st.station_code,
          name: st.station_name,
          district: st.district,
          state: st.state,
          lat: st.latitude,
          lon: st.longitude,
          status: st.station_status,
        },
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Station }) => {
      const active = selectedCode === item.station_code;
      return (
        <TouchableOpacity
          style={[styles.stationRow, active && styles.stationRowActive]}
          onPress={() => {
            focusStation(item);
            handleStationPress(item);
          }}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor(item.station_status) },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[styles.stationName, active && { color: "#075a7dff" }]}
            >
              {item.station_name}
            </Text>
            <Text style={styles.stationMeta} numberOfLines={1}>
              {item.station_code} • {item.district}, {item.state}
            </Text>
          </View>
          <Ionicons
            name="locate"
            size={18}
            color={active ? "#075a7dff" : "#888"}
          />
        </TouchableOpacity>
      );
    },
    [selectedCode, focusStation, handleStationPress, statusColor]
  );

  // FlatList perf helpers
  const keyExtractor = useCallback((s: Station) => s.station_code, []);
  const getItemLayout: NonNullable<FlatListProps<Station>["getItemLayout"]> = (
    _data,
    index
  ) => ({
    length: ITEM_HEIGHT, // Define ITEM_HEIGHT
    offset: ITEM_HEIGHT * index,
    index,
  });

  return (
    <View style={styles.container}>
      {/* The Static Map component */}
      <StaticStationsMap
        ref={mapRef}
        onMapReady={() => setIsLoadingMap(false)}
        onStationPress={handleStationPress} // pass handler
      />

      {/* Loading Overlay */}
      {isLoadingMap && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#075a7dff" />
          <Text style={styles.loadingText}>Loading stations...</Text>
        </View>
      )}

      {/* Filter Row */}
      <View style={styles.topOverlay}>
        <View style={styles.topBar}>
          <MaterialCommunityIcons name="earth" size={18} color="#fff" />
          <Text style={styles.topTitle}>Groundwater Stations</Text>
        </View>

        <View style={styles.filterRow}>
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
          ].map((opt) => {
            const active = filter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(opt.key as typeof filter)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={16}
            color="#555"
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Search station / code / district"
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#888}" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={[styles.panel, !panelOpen && styles.panelCollapsed]}>
        <TouchableOpacity
          style={styles.panelHandle}
          onPress={togglePanel}
          activeOpacity={0.7}
        >
          <View style={styles.handleBar} />
          <Text style={styles.panelTitle}>
            {panelOpen ? "Stations" : `${filtered.length} stations`}
          </Text>
          <Ionicons
            name={panelOpen ? "chevron-down" : "chevron-up"}
            size={18}
            color="#075a7dff"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {panelOpen && (
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={18} // Optimize FlatList initial rendering
            maxToRenderPerBatch={24} // Optimize FlatList batch rendering
            windowSize={9} // Optimize FlatList window size
            removeClippedSubviews={true} // Crucial for FlatList performance on large lists
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled" // Improve keyboard dismissal UX
          />
        )}
      </View>
    </View>
  );
}

// ================== STATIC MAP (NO RE-RENDERS) ==================
interface StaticStationsMapProps {
  onMapReady: () => void;
  onStationPress: (st: Station) => void;
}

const StaticStationsMap = React.memo(
  forwardRef<MapView, StaticStationsMapProps>(function StaticStationsMap(
    { onMapReady, onStationPress },
    ref
  ) {
    if (!hasStations) {
      return (
        <View
          style={[
            styles.map,
            {
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#eef",
            },
          ]}
        >
          <Text style={{ color: "#444" }}>No valid station coordinates</Text>
        </View>
      );
    }

    const initialRegion = {
      latitude: 9.6694,
      longitude: 78.1083,
      latitudeDelta: 1,
      longitudeDelta: 1,
    };

    return (
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsCompass
        showsScale
        showsUserLocation={false}
        onMapReady={onMapReady}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {stations.map((st) => (
          <Marker
            key={`station-${st.station_code}`}
            coordinate={{ latitude: st.latitude, longitude: st.longitude }}
            title={st.station_name}
            description={`Code: ${st.station_code} • ${st.district}`}
            pinColor={st.station_status === "Active" ? "green" : "gray"}
            onPress={() => onStationPress(st)}
          />
        ))}
      </MapView>
    );
  })
);
// ================== END STATIC MAP ==================

const PANEL_HEIGHT = height * 0.38;
const ITEM_HEIGHT = 54; // Assuming a fixed height for FlatList items

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  map: { flex: 1 },

  // Updated topOverlay styles for plain View (no LinearGradient)
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(0,0,0,0.4)", // A solid background for clarity
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  topTitle: {
    color: "#fff", // Set to white for contrast on the dark background
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Slightly transparent white
    borderRadius: 18,
  },
  chipActive: {
    backgroundColor: "#075a7dff",
  },
  chipText: {
    color: "#fff", // White text for chips
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: "#fff",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
    color: "#111",
  },

  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 14,
    overflow: "hidden",
  },
  panelCollapsed: {
    height: 62,
  },
  panelHandle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EFF3",
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C5D3DB",
    position: "absolute",
    top: 6,
    left: (width - 38) / 2 - 14,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#075a7dff",
    marginLeft: 4,
  },

  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F4F6",
    gap: 12,
  },
  stationRowActive: {
    backgroundColor: "#F0FAFF",
  },
  statusBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E2D33",
    marginBottom: 2,
  },
  stationMeta: {
    fontSize: 11,
    color: "#6B7E86",
  },

  markerWrapper: {
    minWidth: 48,
    maxWidth: 90,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    color: "#0F1820",
  },
  markerSelectedShadow: {
    shadowColor: "#075a7dff",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  // Removed cluster styles as ClusteredMapView is no longer used
  // clusterContainer: { ... },
  // clusterText: { ... },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100, // Ensure it's above the map but below other overlays
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
