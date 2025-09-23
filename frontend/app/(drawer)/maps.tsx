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
  Animated,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  Circle,
  Heatmap,
} from "react-native-maps";
import * as Location from "expo-location";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import stationsData from "@/assets/Coordinates/stations.json";
import type { FlatListProps } from "react-native";
import React, { forwardRef } from "react";
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

interface StationLevel {
  depth: number | null;
  fetchedAt: number;
  status: LevelStatus;
}

type LevelStatus =
  | "SAFE"
  | "WARNING"
  | "CRITICAL"
  | "DANGEROUS"
  | "NO_DATA"
  | "ERROR";

type MapViewType = "normal" | "heatmap";

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

    const dRaw = toNum(raw.latest_depth);
    const latest_depth: number | null = dRaw !== null ? Math.abs(dRaw) : null;
    const latest_status = normalizeStatus(raw.latest_status, latest_depth);

    if (seen.has(code)) {
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
  console.log(
    `[maps] stations parsed: total=${stats.total} kept=${stats.kept} invalidCoord=${stats.invalidCoord} missingCode=${stats.missingCode} duplicateCodes(forked)=${stats.duplicateCodes}`
  );
}

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

function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const USER_RADIUS_METERS = 20000;

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

const LEVEL_THRESHOLDS = {
  SAFE_MAX: 10,
  WARNING_MAX: 20,
  CRITICAL_MAX: 40,
};

function classifyDepth(depth: number | null): LevelStatus {
  if (depth === null || isNaN(depth)) return "NO_DATA";
  if (depth <= LEVEL_THRESHOLDS.SAFE_MAX) return "SAFE";
  if (depth <= LEVEL_THRESHOLDS.WARNING_MAX) return "WARNING";
  if (depth <= LEVEL_THRESHOLDS.CRITICAL_MAX) return "CRITICAL";
  return "DANGEROUS";
}

function levelColor(status: LevelStatus): string {
  switch (status) {
    case "SAFE":
      return "#16a34a";
    case "WARNING":
      return "#ea580c";
    case "CRITICAL":
      return "#dc2626";
    case "DANGEROUS":
      return "#7c3aed";
    case "NO_DATA":
      return "#64748b";
    case "ERROR":
      return "#1e293b";
    default:
      return "#64748b";
  }
}

// Heatmap utility functions
function getHeatmapWeight(status: LevelStatus): number {
  switch (status) {
    case "SAFE":
      return 0.2;
    case "WARNING":
      return 0.4;
    case "CRITICAL":
      return 0.7;
    case "DANGEROUS":
      return 1.0;
    case "NO_DATA":
    case "ERROR":
    default:
      return 0.1;
  }
}

const CATEGORY_FILTERS: {
  key: LevelStatus | "all";
  label: string;
  color?: string;
  icon?: string;
}[] = [
  { key: "all", label: "All", icon: "layers-outline" },
  {
    key: "SAFE",
    label: "Safe",
    color: levelColor("SAFE"),
    icon: "shield-checkmark",
  },
  {
    key: "WARNING",
    label: "Warning",
    color: levelColor("WARNING"),
    icon: "warning",
  },
  {
    key: "CRITICAL",
    label: "Critical",
    color: levelColor("CRITICAL"),
    icon: "alert-circle",
  },
  {
    key: "DANGEROUS",
    label: "Dangerous",
    color: levelColor("DANGEROUS"),
    icon: "nuclear",
  },
];

// ================== MAIN MAPS SCREEN ==================
export default function MapsScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);

  const [mapViewType, setMapViewType] = useState<MapViewType>("normal");
  const [filter, setFilter] = useState<LevelStatus | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedQuery = useDebounce(search, 300);
  const [panelOpen, setPanelOpen] = useState(true);
  const [topControlsOpen, setTopControlsOpen] = useState(true);

  const panelAnim = useRef(new Animated.Value(1)).current;
  const topAnim = useRef(new Animated.Value(1)).current;

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [userLoc, setUserLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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
    return new Set(filtered.map((s) => s.station_code));
  }, [filtered]);

  // Heatmap points calculation
  const heatmapPoints = useMemo(() => {
    if (mapViewType !== "heatmap") return [];

    return filtered
      .filter((station) => {
        const level = levels[station.station_code];
        return level && level.status !== "NO_DATA" && level.status !== "ERROR";
      })
      .map((station) => {
        const level = levels[station.station_code];
        return {
          latitude: station.latitude,
          longitude: station.longitude,
          weight: getHeatmapWeight(level.status),
        };
      });
  }, [mapViewType, filtered, levels]);

  const focusStation = useCallback((st: Station) => {
    if (!st || !isValidLatLon(st.latitude, st.longitude)) return;
    mapRef.current?.animateToRegion(
      {
        latitude: st.latitude,
        longitude: st.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600
    );
  }, []);

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

  const toggleTopControls = () => {
    const next = !topControlsOpen;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTopControlsOpen(next);
    Animated.timing(topAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const toggleMapView = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMapViewType(mapViewType === "normal" ? "heatmap" : "normal");
  };

  const recenterBottom = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [82 + 20, PANEL_HEIGHT + 20],
  });

  const topTranslateY = topAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-250, 0], // Adjust -250 based on approximate height of topControls
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

  const nearbyCount = nearbyCodes.size;

  const renderItem = useCallback(
    ({ item }: { item: Station }) => {
      const active = selectedCode === item.station_code;
      const level = levels[item.station_code];
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
          style={[styles.stationCard, active && styles.stationCardActive]}
          onPress={() => {
            focusStation(item);
            handleStationPress(item);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.stationCardHeader}>
            <View style={styles.stationInfo}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: level
                      ? levelColor(level.status)
                      : "#64748b",
                  },
                ]}
              />
              <Text
                numberOfLines={1}
                style={[styles.stationName, active && { color: "#0369a1" }]}
              >
                {item.station_name}
              </Text>
            </View>

            <View style={styles.stationActions}>
              {level?.depth != null && (
                <View
                  style={[
                    styles.depthBadge,
                    { backgroundColor: `${levelColor(level.status)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.depthText,
                      { color: levelColor(level.status) },
                    ]}
                  >
                    {level.depth.toFixed(1)}m
                  </Text>
                </View>
              )}
              <Ionicons
                name="location-sharp"
                size={18}
                color={active ? "#0369a1" : "#64748b"}
              />
            </View>
          </View>

          <View style={styles.stationMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="code-working" size={12} color="#64748b" />
              <Text style={styles.metaText}>{item.station_code}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color="#64748b" />
              <Text style={styles.metaText}>
                {item.district}, {item.state}
              </Text>
            </View>
            {dist !== null && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={12} color="#64748b" />
                <Text style={styles.metaText}>{dist.toFixed(1)} km</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedCode, focusStation, handleStationPress, userLoc, levels]
  );

  const keyExtractor = useCallback((s: Station) => s.station_code, []);
  const getItemLayout: NonNullable<FlatListProps<Station>["getItemLayout"]> = (
    _data,
    index
  ) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

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
        mapViewType={mapViewType}
        heatmapPoints={heatmapPoints}
        onMapReady={() => setIsLoadingMap(false)}
        onStationPress={handleStationPress}
        markerPinColor={markerPinColor}
        levels={levels}
        levelsLoading={levelsLoading}
      />

      {isLoadingMap && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0369a1" />
          <Text style={styles.loadingText}>
            Loading groundwater stations...
          </Text>
        </View>
      )}

      {/* Enhanced Top Controls - now collapsible and more transparent */}
      <Animated.View
        style={[
          styles.topControls,
          { transform: [{ translateY: topTranslateY }] },
        ]}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="water-well"
                size={20}
                color="#fff"
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>Groundwater</Text>
              <Text style={styles.headerSubtitle}>Monitoring Network</Text>
            </View>
          </View>

          {userLoc && (
            <View style={styles.nearbyIndicator}>
              <Ionicons name="radio" size={14} color="#10b981" />
              <Text style={styles.nearbyText}>{nearbyCount}</Text>
            </View>
          )}
        </View>

        {/* Map View Toggle */}
        <View style={styles.mapToggleContainer}>
          <TouchableOpacity
            style={[
              styles.mapToggleButton,
              mapViewType === "normal" && styles.mapToggleButtonActive,
            ]}
            onPress={toggleMapView}
            activeOpacity={0.8}
          >
            <Ionicons
              name="map"
              size={16}
              color={mapViewType === "normal" ? "#0369a1" : "#f8fafc"}
            />
            <Text
              style={[
                styles.mapToggleText,
                mapViewType === "normal" && styles.mapToggleTextActive,
              ]}
            >
              Markers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mapToggleButton,
              mapViewType === "heatmap" && styles.mapToggleButtonActive,
            ]}
            onPress={toggleMapView}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="gradient-horizontal"
              size={16}
              color={mapViewType === "heatmap" ? "#0369a1" : "#f8fafc"}
            />
            <Text
              style={[
                styles.mapToggleText,
                mapViewType === "heatmap" && styles.mapToggleTextActive,
              ]}
            >
              Heatmap
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {CATEGORY_FILTERS.map((opt) => {
            const active = filter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                  opt.color && active && { backgroundColor: opt.color },
                ]}
                onPress={() => setFilter(opt.key)}
                activeOpacity={0.8}
              >
                {opt.icon && (
                  <Ionicons
                    name={opt.icon as any}
                    size={14}
                    color={active ? "#fff" : opt.color || "#64748b"}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              placeholder="Search stations, codes, or locations..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Messages */}
        {locationError && (
          <View style={styles.statusMessage}>
            <Ionicons name="warning" size={14} color="#ef4444" />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}
        {locating && !userLoc && (
          <View style={styles.statusMessage}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.infoText}>Getting your location...</Text>
          </View>
        )}

        {/* Add handle at the bottom for collapsing upwards */}
        <TouchableOpacity
          style={styles.topHandle}
          onPress={toggleTopControls}
          activeOpacity={0.7}
        >
          <Ionicons
            name={topControlsOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#000000" // Changed to black
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Enhanced Bottom Panel */}
      <View style={[styles.panel, !panelOpen && styles.panelCollapsed]}>
        <TouchableOpacity
          style={styles.panelHandle}
          onPress={togglePanel}
          activeOpacity={0.7}
        >
          <View style={styles.handleBar} />
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              {panelOpen
                ? "Monitoring Stations"
                : `${filtered.length} stations found`}
            </Text>
            <View style={styles.panelCounter}>
              <Text style={styles.counterText}>{filtered.length}</Text>
            </View>
          </View>
          <Ionicons
            name={panelOpen ? "chevron-down" : "chevron-up"}
            size={20}
            color="#0369a1"
          />
        </TouchableOpacity>

        {panelOpen && currentLevel && currentLevel.depth != null && (
          <View style={styles.currentStationBanner}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerIcon}>
                <Ionicons
                  name="water"
                  size={16}
                  color={levelColor(currentLevel.status)}
                />
              </View>
              <View style={styles.bannerInfo}>
                <Text numberOfLines={1} style={styles.bannerTitle}>
                  {currentStation?.station_name || currentStation?.station_code}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  {currentLevel.depth.toFixed(2)} meters below ground level
                </Text>
              </View>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: levelColor(currentLevel.status) },
                ]}
              >
                <Text style={styles.statusChipText}>{currentLevel.status}</Text>
              </View>
            </View>
          </View>
        )}

        {panelOpen && (
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={12}
            maxToRenderPerBatch={16}
            windowSize={8}
            removeClippedSubviews={true}
            style={styles.stationList}
            contentContainerStyle={styles.stationListContent}
            keyboardShouldPersistTaps="handled"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Enhanced Recenter Button */}
      {userLoc && (
        <Animated.View
          style={[styles.recenterButton, { bottom: recenterBottom }]}
        >
          <TouchableOpacity
            style={styles.recenterButtonInner}
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
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={22} color="#0369a1" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ================== STATIC MAP COMPONENT ==================
interface StaticStationsMapProps {
  onMapReady: () => void;
  onStationPress: (st: Station) => void;
  userLoc: { latitude: number; longitude: number } | null;
  nearbyCodes: Set<string>;
  visibleCodes: Set<string>;
  mapViewType: MapViewType;
  heatmapPoints: Array<{
    latitude: number;
    longitude: number;
    weight: number;
  }>;
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
      mapViewType,
      heatmapPoints,
      markerPinColor,
      levels,
      levelsLoading,
    },
    ref
  ) {
    if (!hasStations) {
      return (
        <View style={styles.emptyMapContainer}>
          <MaterialCommunityIcons
            name="map-marker-off"
            size={48}
            color="#94a3b8"
          />
          <Text style={styles.emptyMapText}>No station data available</Text>
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
        showsMyLocationButton={false}
        onMapReady={onMapReady}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {userLoc && (
          <>
            <Marker
              key="__user"
              coordinate={userLoc}
              title="Your Location"
              pinColor="#0369a1"
            />
            <Circle
              key="__user_radius"
              center={userLoc}
              radius={USER_RADIUS_METERS}
              strokeColor="rgba(3,105,161,0.3)"
              fillColor="rgba(3,105,161,0.1)"
              strokeWidth={2}
            />
          </>
        )}

        {/* Render markers only in normal view */}
        {mapViewType === "normal" &&
          stations.map((st) => {
            if (!visibleCodes.has(st.station_code)) return null;

            const isNearby = nearbyCodes.has(st.station_code);

            return (
              <Marker
                key={`station-${st.station_code}`}
                coordinate={{ latitude: st.latitude, longitude: st.longitude }}
                title={st.station_name}
                description={`${st.station_code} • ${st.district}`}
                pinColor={markerPinColor(st, isNearby)}
                onPress={() => onStationPress(st)}
              />
            );
          })}

        {/* Render heatmap only in heatmap view */}
        {mapViewType === "heatmap" && heatmapPoints.length > 0 && (
          <Heatmap
            points={heatmapPoints}
            radius={50}
            opacity={0.8}
            gradient={{
              colors: ["#16a34a", "#ea580c", "#dc2626", "#7c3aed"],
              startPoints: [0.2, 0.4, 0.7, 1.0],
              colorMapSize: 256,
            }}
          />
        )}
      </MapView>
    );
  })
);

// ================== ENHANCED STYLES ==================
const PANEL_HEIGHT = height * 0.42;
const ITEM_HEIGHT = 88;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  map: {
    flex: 1,
  },

  // Enhanced Top Controls
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#ffffff", // Changed to white like the bottom panel
    backdropFilter: "blur(10px)", // Reduced blur for white background
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.8)", // Added border like bottom panel
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(3,105,161,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3,105,161,0.3)",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a", // Changed to dark color for white background
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#64748b", // Adjusted for white background
    fontWeight: "500",
  },

  nearbyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },

  nearbyText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "700",
  },

  // Map Toggle
  mapToggleContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "rgba(248,250,252,0.8)", // Lightened for white background
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.5)",
  },

  mapToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },

  mapToggleButtonActive: {
    backgroundColor: "#f8fafc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  mapToggleText: {
    color: "#64748b", // Darker for white background
    fontSize: 14,
    fontWeight: "600",
  },

  mapToggleTextActive: {
    color: "#0369a1",
    fontWeight: "700",
  },

  // Filter Chips
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(248,250,252,0.6)", // Lightened
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.5)",
  },

  filterChipActive: {
    backgroundColor: "#0369a1",
    borderColor: "#0369a1",
    shadowColor: "#0369a1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  filterChipText: {
    color: "#64748b", // Darker
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  // Search
  searchContainer: {
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.05)", // Light background for search
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.3)",
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },

  clearButton: {
    padding: 4,
  },

  // Status Messages
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  errorText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },

  infoText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },

  // Enhanced Panel
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    overflow: "hidden",
  },

  panelCollapsed: {
    height: 82,
  },

  panelHandle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.8)",
  },

  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    position: "absolute",
    top: 8,
    left: (width - 40) / 2,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  panelTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: 0.5,
  },

  panelCounter: {
    backgroundColor: "#0369a1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },

  counterText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Current Station Banner
  currentStationBanner: {
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(100,116,139,0.2)",
  },

  bannerInfo: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },

  bannerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  statusChipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // Station Cards
  stationList: {
    flex: 1,
  },

  stationListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 24,
  },

  stationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  stationCardActive: {
    borderColor: "#0369a1",
    backgroundColor: "#f0f9ff",
    shadowColor: "#0369a1",
    shadowOpacity: 0.15,
    transform: [{ scale: 1.02 }],
  },

  stationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  stationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },

  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  stationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    letterSpacing: 0.3,
  },

  stationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  depthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.2)",
  },

  depthText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  stationMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },

  // Loading and Empty States
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },

  emptyMapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    gap: 12,
  },

  emptyMapText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },

  // Recenter Button
  recenterButton: {
    position: "absolute",
    right: 20,
    zIndex: 50,
  },

  recenterButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.8)",
  },

  // Top handle for collapsing
  topHandle: {
    alignSelf: "center",
    paddingVertical: 2, // Decreased from 4
    paddingHorizontal: 4, // Decreased from 8
    marginTop: 2, // Decreased from 4
  },
});
