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
  Animated, // <-- add
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  Circle,
} from "react-native-maps";
import * as Location from "expo-location"; // (If not using Expo, use react-native-geolocation-service)

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
  station_status: string;
  latest_depth?: number | null;
  latest_status?: LevelStatus;
  latest_data_time?: string;
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

    // normalize latest fields
    const dRaw = toNum(raw.latest_depth);
    const latest_depth: number | null = dRaw !== null ? Math.abs(dRaw) : null;
    const latest_status = normalizeStatus(raw.latest_status, latest_depth);

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
        // keep latest fields
        latest_depth,
        latest_status,
        latest_data_time: raw.latest_data_time ?? null,
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
      // keep latest fields
      latest_depth,
      latest_status,
      latest_data_time: raw.latest_data_time ?? null,
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

// Add helper to coerce status or classify by depth
function normalizeStatus(s: any, depth: number | null): LevelStatus {
  const u = typeof s === "string" ? s.toUpperCase() : "";
  if (
    u === "SAFE" ||
    u === "WARNING" ||
    u === "CRITICAL" ||
    u === "DANGEROUS" ||
    u === "NO_DATA" ||
    u === "ERROR"
  ) {
    return u as LevelStatus;
  }
  return classifyDepth(depth);
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

// ================== CONFIG ==================
const USER_RADIUS_METERS = 20000; // 20 km search radius

// --- add below isValidLatLon helper ---
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ================== MAIN MAPS SCREEN ==================
export default function MapsScreen() {
  const navigation = useNavigation<any>();

  // Ref for the *static* map component
  const mapRef = useRef<MapView | null>(null);

  const [filter, setFilter] = useState<LevelStatus | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedQuery = useDebounce(search, 300);
  const [panelOpen, setPanelOpen] = useState(true);

  // Animate panel progress: 1 = open, 0 = collapsed
  const panelAnim = useRef(new Animated.Value(1)).current;

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true); // New loading state
  const [userLoc, setUserLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Build levels from stations that now include latest_* fields
  const [levels] = useState<Record<string, StationLevel>>(() => {
    const map: Record<string, StationLevel> = {};
    stations.forEach((s) => {
      const depth =
        typeof s.latest_depth === "number"
          ? s.latest_depth
          : s.latest_depth ?? null;
      const status = (s.latest_status as LevelStatus) || classifyDepth(depth);
      map[s.station_code] = { depth, status, fetchedAt: Date.now() };
    });
    return map;
  });
  const levelsLoading = false;

  const [firstVisibleCode, setFirstVisibleCode] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let base = stations;
    if (filter !== "all") {
      // keep only stations whose fetched level status matches selected category
      base = base.filter((s) => levels[s.station_code]?.status === filter);
    }
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
  }, [filter, debouncedQuery, levels]);

  const visibleCodes = useMemo(() => {
    // Same subset used in FlatList (search + category)
    return new Set(filtered.map((s) => s.station_code));
  }, [filtered]);

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
    const next = !panelOpen;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPanelOpen(next);
    Animated.timing(panelAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  // Interpolate bottom offset of recenter button from panelAnim
  const recenterBottom = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [62 + 16, PANEL_HEIGHT + 16], // collapsed => open
  });

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

  // Stations within radius
  const nearbyCodes = useMemo(() => {
    if (!userLoc) return new Set<string>();
    const set = new Set<string>();
    for (const s of stations) {
      const d = distanceKm(
        userLoc.latitude,
        userLoc.longitude,
        s.latitude,
        s.longitude
      );
      if (d * 1000 <= USER_RADIUS_METERS) set.add(s.station_code);
    }
    return set;
  }, [userLoc]);

  // Count for UI badge
  const nearbyCount = nearbyCodes.size;

  const renderItem = useCallback(
    ({ item }: { item: Station }) => {
      const active = selectedCode === item.station_code;
      const dist = userLoc
        ? distanceKm(
            userLoc.latitude,
            userLoc.longitude,
            item.latitude,
            item.longitude
          )
        : null;
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
              {
                backgroundColor: levels[item.station_code]
                  ? levelColor(levels[item.station_code].status)
                  : "#6b7280",
              },
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
              {dist !== null && (
                <Text style={{ color: "#557" }}> • {dist.toFixed(1)} km</Text>
              )}
              {levels[item.station_code]?.depth != null && (
                <Text style={{ color: "#075a7dff" }}>
                  {" "}
                  • {levels[item.station_code].depth!.toFixed(2)} m
                </Text>
              )}
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
    [
      selectedCode,
      focusStation,
      handleStationPress,
      userLoc,
      nearbyCodes,
      levels,
    ]
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

  // Request location & fetch once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLocating(true);
        setLocationError(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setUserLoc({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          // Optionally center map to user once
          mapRef.current?.animateToRegion(
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.6,
              longitudeDelta: 0.6,
            },
            600
          );
        }
      } catch {
        if (!cancelled) setLocationError("Failed to get location");
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Use status from levels, or fallback to station.latest_status/depth
  const markerPinColor = useCallback(
    (st: Station, _isNearby?: boolean) => {
      const status =
        levels[st.station_code]?.status ??
        (st.latest_status as LevelStatus) ??
        classifyDepth(st.latest_depth ?? null);
      return levelColor(status as LevelStatus);
    },
    [levels]
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: Station }> }) => {
      if (viewableItems?.length) {
        setFirstVisibleCode(viewableItems[0].item.station_code);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  // Derive “current” station for depth badge (selected first, else first visible)
  const currentStation = useMemo(
    () =>
      stations.find(
        (s) => s.station_code === (selectedCode || firstVisibleCode)
      ) || null,
    [selectedCode, firstVisibleCode]
  );

  const currentLevel = currentStation
    ? levels[currentStation.station_code]
    : undefined;

  return (
    <View style={styles.container}>
      <StaticStationsMap
        ref={mapRef}
        userLoc={userLoc}
        nearbyCodes={nearbyCodes}
        visibleCodes={visibleCodes}
        onMapReady={() => setIsLoadingMap(false)}
        onStationPress={handleStationPress}
        markerPinColor={markerPinColor}
        levels={levels}
        levelsLoading={levelsLoading}
      />

      {isLoadingMap && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#075a7dff" />
          <Text style={styles.loadingText}>Loading stations...</Text>
        </View>
      )}

      {/* Top overlay additions */}
      <View style={styles.topOverlay}>
        <View style={styles.topBar}>
          <MaterialCommunityIcons name="earth" size={18} color="#fff" />
          <Text style={styles.topTitle}>Groundwater Stations</Text>
          {userLoc && (
            <View style={styles.nearBadge}>
              <Ionicons name="navigate-circle" size={14} color="#fff" />
              <Text style={styles.nearBadgeText}>{nearbyCount} near</Text>
            </View>
          )}
        </View>

        <View style={styles.filterRow}>
          {CATEGORY_FILTERS.map((opt) => {
            const active = filter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  opt.color &&
                    !active && {
                      borderColor: opt.color,
                      borderWidth: 1,
                      backgroundColor: "rgba(255,255,255,0.10)",
                    },
                  active && {
                    backgroundColor: opt.color || "#075a7dff",
                    borderColor: opt.color || "#075a7dff",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setFilter(opt.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && { color: "#fff", fontWeight: "600" },
                  ]}
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
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {locationError && (
          <Text style={styles.locErrorText}>{locationError}</Text>
        )}
        {locating && !userLoc && (
          <Text style={styles.locInfoText}>Locating...</Text>
        )}
      </View>

      {/* Bottom panel unchanged */}
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

        {panelOpen && currentLevel && currentLevel.depth != null && (
          <View style={styles.depthInfoBar}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.depthInfoName}>
                {currentStation?.station_name
                  ? currentStation.station_name
                  : currentStation?.station_code}
              </Text>
              <Text style={styles.depthInfoMeta} numberOfLines={1}>
                {currentLevel.depth.toFixed(2)} m bgl •{" "}
                {currentLevel.status === "SAFE"
                  ? "Safe"
                  : currentLevel.status === "WARNING"
                  ? "Warning"
                  : currentLevel.status === "CRITICAL"
                  ? "Critical"
                  : currentLevel.status === "DANGEROUS"
                  ? "Dangerous"
                  : currentLevel.status === "NO_DATA"
                  ? "No data"
                  : "Error"}
              </Text>
            </View>
            <View
              style={[
                styles.depthStatusPill,
                { backgroundColor: levelColor(currentLevel.status) },
              ]}
            >
              <Text style={styles.depthStatusPillText}>
                {currentLevel.status === "SAFE"
                  ? "SAFE"
                  : currentLevel.status === "WARNING"
                  ? "WARN"
                  : currentLevel.status === "CRITICAL"
                  ? "CRIT"
                  : currentLevel.status === "DANGEROUS"
                  ? "DANG"
                  : "NA"}
              </Text>
            </View>
          </View>
        )}

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
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        )}
      </View>

      {/* Replace the recenter button block */}
      {userLoc && (
        <Animated.View style={[styles.recenterBtn, { bottom: recenterBottom }]}>
          <TouchableOpacity
            style={styles.recenterBtnInner}
            onPress={() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: userLoc.latitude,
                  longitude: userLoc.longitude,
                  latitudeDelta: 0.25,
                  longitudeDelta: 0.25,
                },
                600
              );
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="locate" size={20} color="#075a7dff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ================== STATIC MAP ==================
interface StaticStationsMapProps {
  onMapReady: () => void;
  onStationPress: (st: Station) => void;
  userLoc: { latitude: number; longitude: number } | null;
  nearbyCodes: Set<string>;
  visibleCodes: Set<string>;
  markerPinColor: (st: Station, isNearby: boolean) => string;
  levels: Record<string, StationLevel>;
  levelsLoading: boolean;
}

const StaticStationsMap = React.memo(
  forwardRef<MapView, StaticStationsMapProps>(function StaticStationsMap(
    {
      onMapReady,
      onStationPress,
      userLoc,
      nearbyCodes,
      visibleCodes,
      markerPinColor,
      levels,
      levelsLoading,
    },
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

    const initialRegion = computeInitialRegion(stations);

    return (
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsCompass
        showsScale
        showsUserLocation={!!userLoc}
        showsMyLocationButton={false} // hide default auto-locate button
        onMapReady={onMapReady}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {userLoc && (
          <>
            <Marker
              key="__user"
              coordinate={userLoc}
              title="You"
              pinColor="#2563eb"
            />
            <Circle
              key="__user_radius"
              center={userLoc}
              radius={USER_RADIUS_METERS}
              strokeColor="rgba(37,99,235,0.5)"
              fillColor="rgba(37,99,235,0.12)"
              strokeWidth={2}
            />
          </>
        )}
        {stations.map((st) => {
          // Only show if in current filtered set
          if (!visibleCodes.has(st.station_code)) return null;

          const isNearby = nearbyCodes.has(st.station_code);
          const lvl = levels[st.station_code]; // This gets the level object

          // Optional: still hide NO_DATA / ERROR unless "all"
          return (
            <Marker
              key={`station-${st.station_code}`}
              coordinate={{ latitude: st.latitude, longitude: st.longitude }}
              title={st.station_name}
              description={`Code: ${st.station_code} • ${st.district}`}
              pinColor={markerPinColor(st, isNearby)} // <-- This is where the color is set
              onPress={() => onStationPress(st)}
            />
          );
        })}
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
  chipText: {
    color: "#fff", // White text for chips
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
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
  nearBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  nearBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  locErrorText: {
    marginTop: 6,
    fontSize: 11,
    color: "#fecaca",
  },
  locInfoText: {
    marginTop: 6,
    fontSize: 11,
    color: "#e2e8f0",
  },
  recenterBtn: {
    position: "absolute",
    right: 14,
    zIndex: 70,
  },
  // Button visuals moved here
  recenterBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },

  // New styles for depth info bar
  depthInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EFF3",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  depthInfoName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#102027",
    marginBottom: 2,
  },
  depthInfoMeta: {
    fontSize: 11,
    color: "#5b6a71",
  },
  depthStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  depthStatusPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

// ADD near other interfaces (after Station interface)
interface StationLevel {
  depth: number | null; // meters below ground (m bgl)
  fetchedAt: number; // epoch ms
  status: LevelStatus;
}
type LevelStatus =
  | "SAFE"
  | "WARNING"
  | "CRITICAL"
  | "DANGEROUS"
  | "NO_DATA"
  | "ERROR";

const LEVEL_THRESHOLDS = {
  SAFE_MAX: 10, // 0 - 10  => SAFE
  WARNING_MAX: 20, // 10 - 20 => WARNING
  CRITICAL_MAX: 40, // 20 - 40 => CRITICAL
};

// ADD helper classify depth (top-level, before component)
function classifyDepth(depth: number | null): LevelStatus {
  if (depth === null || isNaN(depth)) return "NO_DATA";
  if (depth <= LEVEL_THRESHOLDS.SAFE_MAX) return "SAFE";
  if (depth <= LEVEL_THRESHOLDS.WARNING_MAX) return "WARNING";
  if (depth <= LEVEL_THRESHOLDS.CRITICAL_MAX) return "CRITICAL";
  return "DANGEROUS";
}

// OPTIONAL color map
function levelColor(status: LevelStatus): string {
  switch (status) {
    case "SAFE":
      return "green";
    case "WARNING":
      return "orange";
    case "CRITICAL":
      return "red";
    case "DANGEROUS":
      return "purple";
    case "NO_DATA":
      return "gray";
    case "ERROR":
      return "black";
    default:
      return "gray";
  }
}

// ====== 5. ADD CATEGORY FILTER DEFINITIONS (place near other constants) ======
const CATEGORY_FILTERS: {
  key: LevelStatus | "all";
  label: string;
  color?: string;
}[] = [
  { key: "all", label: "All" },
  { key: "SAFE", label: "Safe", color: levelColor("SAFE") },
  { key: "WARNING", label: "Warning", color: levelColor("WARNING") },
  { key: "CRITICAL", label: "Critical", color: levelColor("CRITICAL") },
  { key: "DANGEROUS", label: "Dangerous", color: levelColor("DANGEROUS") },
];
