import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  Animated,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { scale, verticalScale } from "@/utils/styling";
import { useTheme } from "@/hooks/useTheme";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

// Weather service (add this as a separate file if preferred)
const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.api-ninjas.com/v1/weather";

const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const url = `${BASE_URL}?lat=${lat}&lon=${lon}`;
  const response = await fetch(url, {
    headers: {
      "X-Api-Key": API_KEY,
    },
  });
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return response.json();
};

// Update WeatherData interface to match API-Ninjas response
interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  min_temp: number;
  max_temp: number;
  wind_speed: number;
  wind_degrees: number;
  sunrise: number;
  sunset: number;
  // Note: No daily/rain data in this API
}

// Updated Station interface to match your JSON
interface Station {
  state: string;
  district: string;
  station_code: string;
  station_name: string;
  latitude: number;
  longitude: number;
  well_type?: string | null;
  station_status: string;
  latest_depth?: number;
  latest_status?: string;
  latest_data_time?: string;
}

// New type for stations with computed distance
type StationWithDistance = Station & { distance: number };

interface WellData {
  currentLevel: number;
  trend: number;
  rechargeStatus: string;
  rechargeValue: number;
  rainfallForecast: number;
  trendData: {
    labels: string[];
    datasets: {
      data: number[];
      color: (opacity?: number) => string;
      strokeWidth: number;
    }[];
  };
  regions: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    level: number;
    status: "normal" | "critical" | "warning" | "good";
    totalStations: number;
    monitoredStations: number;
    rechargeTrend?: number[];
  }[];
}

interface PolicyMetrics {
  currentYear: number;
  lastYear: number;
  target: number;
  improvements: string[];
}

interface FarmerGuidance {
  waterAvailability: string;
  recommendedCrops: string[];
  advice: string;
  weatherAlerts: string[];
}

const sampleWellData: WellData = {
  currentLevel: 6.2,
  trend: -2.4,
  rechargeStatus: "Moderate",
  rechargeValue: 45,
  rainfallForecast: 25,
  trendData: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [8.5, 7.8, 7.2, 6.8, 6.5, 6.2],
        color: (opacity = 1) => `rgba(0, 180, 216, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  },
  regions: [
    {
      id: "1",
      name: "National",
      lat: 20.5937,
      lng: 78.9629,
      level: 5.8,
      status: "normal",
      totalStations: 31574,
      monitoredStations: 16346,
    },
    {
      id: "2",
      name: "Maharashtra",
      lat: 19.7515,
      lng: 75.7139,
      level: 7.2,
      status: "normal",
      totalStations: 2492,
      monitoredStations: 2180,
    },
    {
      id: "3",
      name: "Rajasthan",
      lat: 27.0238,
      lng: 74.2179,
      level: 3.1,
      status: "critical",
      totalStations: 1875,
      monitoredStations: 1080,
    },
    {
      id: "4",
      name: "Tamil Nadu",
      lat: 11.1271,
      lng: 78.6569,
      level: 8.5,
      status: "good",
      totalStations: 1586,
      monitoredStations: 1162,
    },
    {
      id: "5",
      name: "Punjab",
      lat: 31.1471,
      lng: 75.3412,
      level: 4.2,
      status: "warning",
      totalStations: 1450,
      monitoredStations: 546,
    },
    {
      id: "6",
      name: "Karnataka",
      lat: 15.3173,
      lng: 75.7139,
      level: 6.8,
      status: "normal",
      totalStations: 1200,
      monitoredStations: 950,
      rechargeTrend: [2, 3, 4, 6, 8, 12, 10, 9, 7, 5, 4, 3],
    },
    {
      id: "7",
      name: "Gujarat",
      lat: 22.2587,
      lng: 71.1924,
      level: 5.5,
      status: "warning",
      totalStations: 800,
      monitoredStations: 600,
      rechargeTrend: [1, 2, 3, 5, 7, 9, 8, 7, 6, 4, 3, 2],
    },
    {
      id: "8",
      name: "Uttar Pradesh",
      lat: 26.8467,
      lng: 80.9462,
      level: 7.1,
      status: "good",
      totalStations: 1500,
      monitoredStations: 1200,
      rechargeTrend: [3, 4, 6, 8, 10, 14, 12, 10, 8, 6, 5, 4],
    },
  ],
};

const policyMetrics: PolicyMetrics = {
  currentYear: 72,
  lastYear: 68,
  target: 80,
  improvements: [
    "15% increase in recharge",
    "20 new monitoring wells",
    "5 drought-resistant initiatives",
  ],
};

const farmerGuidance: FarmerGuidance = {
  waterAvailability: "Moderate",
  recommendedCrops: ["Millet", "Sorghum", "Pulses"],
  advice: "Consider drip irrigation for water efficiency",
  weatherAlerts: [
    "Heat wave expected next week",
    "Light rainfall predicted in 3 days",
  ],
};

export default function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string>("National");
  const [selectedRole, setSelectedRole] = useState<string>("Policymaker");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [wellData, setWellData] = useState<WellData>(sampleWellData);

  // New states for station selection and weather
  const [stations, setStations] = useState<Station[]>([]);
  const [nearestStations, setNearestStations] = useState<StationWithDistance[]>(
    []
  );
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationModalVisible, setStationModalVisible] =
    useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null); // Add this
  const [firstOpen, setFirstOpen] = useState<boolean>(true); // Track first open

  // Add loading state for stations
  const [stationsLoading, setStationsLoading] = useState<boolean>(true);

  // Map ref and centering state
  const mapRef = useRef<MapView | null>(null);
  const [didCenterOnUser, setDidCenterOnUser] = useState(false);

  const roles: string[] = ["Policymaker", "Researcher", "Farmer"];

  const handleDecisionSupport = () => {
    router.push("/predictions");
  };

  // Animated segmented control for role switcher
  const [segWidth, setSegWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const segmentWidth = segWidth > 0 ? segWidth / roles.length : 0;

  useEffect(() => {
    const idx = Math.max(0, roles.indexOf(selectedRole));
    const target = segmentWidth * idx + scale(3);
    Animated.timing(indicatorAnim, {
      toValue: target,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [selectedRole, segmentWidth]);

  // Scrolling to role-specific section
  const scrollRef = useRef<ScrollView | null>(null);
  const [roleAnchorY, setRoleAnchorY] = useState(0);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    requestAnimationFrame(() => {
      const y = Math.max(roleAnchorY - verticalScale(8), 0);
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  // Load stations from JSON (with loading state)
  useEffect(() => {
    const loadStations = async () => {
      setStationsLoading(true);
      try {
        const response = require("@/assets/Coordinates/stations.json");
        const data: Station[] = Array.isArray(response) ? response : [];
        setStations(data);
      } catch (error: unknown) {
        console.error("Failed to load stations:", error);
        Alert.alert(
          "Error",
          "Unable to load station data. Please check the file."
        );
      } finally {
        setStationsLoading(false);
      }
    };
    loadStations();
  }, []);

  // Location and station selection logic (with loading)
  useEffect(() => {
    (async () => {
      if (!firstOpen || stationsLoading) return; // Wait for stations to load
      setLocationLoading(true);
      setStationModalVisible(true); // Show modal immediately for loading
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLocationLoading(false);
        setStationModalVisible(false); // Hide modal if permission denied
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      setLocationLoading(false);
      setFirstOpen(false); // Mark as not first open

      // Find nearest stations
      if (stations.length > 0) {
        const nearest: StationWithDistance[] = stations
          .map((station) => ({
            ...station,
            distance: getDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              station.latitude,
              station.longitude
            ),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5); // Top 5 nearest
        setNearestStations(nearest);
        // Keep modal open to show stations
      } else {
        setStationModalVisible(false); // Hide if no stations
      }
    })();
  }, [firstOpen, stations, stationsLoading]);

  // Fetch weather when station is selected
  useEffect(() => {
    if (selectedStation) {
      setWeatherLoading(true);
      fetchWeather(selectedStation.latitude, selectedStation.longitude)
        .then(setWeather)
        .catch((error: unknown) => {
          console.error("Weather fetch error:", error);
          setWeatherError("Failed to fetch weather data");
        })
        .finally(() => setWeatherLoading(false));
    }
  }, [selectedStation]);

  // Helper to calculate distance (Haversine formula)
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Compute recharge status from depth
  const getRechargeStatus = (depth: number) => {
    if (depth <= 10) return "SAFE";
    if (depth <= 20) return "WARNING";
    if (depth <= 40) return "CRITICAL";
    return "DANGEROUS";
  };

  // DWLR Stations data for Tamil Nadu (existing)
  const dwlrStations = [
    {
      id: 1,
      name: "Chennai DWLR Station",
      status: "stable",
      depth: "12.5m",
      latitude: 13.0827,
      longitude: 80.2707,
      lastUpdated: "2 min ago",
    },
    {
      id: 2,
      name: "Coimbatore DWLR Station",
      status: "stress",
      depth: "18.7m",
      latitude: 11.0168,
      longitude: 76.9558,
      lastUpdated: "5 min ago",
    },
    {
      id: 3,
      name: "Madurai DWLR Station",
      status: "critical",
      depth: "25.1m",
      latitude: 9.9252,
      longitude: 78.1198,
      lastUpdated: "1 min ago",
    },
    {
      id: 4,
      name: "Trichy DWLR Station",
      status: "stable",
      depth: "9.8m",
      latitude: 10.7905,
      longitude: 78.7047,
      lastUpdated: "3 min ago",
    },
    {
      id: 5,
      name: "Salem DWLR Station",
      status: "stress",
      depth: "16.3m",
      latitude: 11.664,
      longitude: 78.146,
      lastUpdated: "7 min ago",
    },
    {
      id: 6,
      name: "Tirunelveli DWLR Station",
      status: "stable",
      depth: "7.2m",
      latitude: 8.7139,
      longitude: 77.7567,
      lastUpdated: "4 min ago",
    },
    {
      id: 7,
      name: "Vellore DWLR Station",
      status: "stable",
      depth: "11.4m",
      latitude: 12.9165,
      longitude: 79.1325,
      lastUpdated: "6 min ago",
    },
    {
      id: 8,
      name: "Thanjavur DWLR Station",
      status: "critical",
      depth: "20.8m",
      latitude: 10.787,
      longitude: 79.1378,
      lastUpdated: "8 min ago",
    },
    {
      id: 9,
      name: "Erode DWLR Station",
      status: "stress",
      depth: "14.6m",
      latitude: 11.341,
      longitude: 77.7172,
      lastUpdated: "3 min ago",
    },
    {
      id: 10,
      name: "Kanchipuram DWLR Station",
      status: "stable",
      depth: "10.2m",
      latitude: 12.8342,
      longitude: 79.7036,
      lastUpdated: "5 min ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "#4CAF50";
      case "stress":
        return "#FF9800";
      case "critical":
        return "#F44336";
      case "good":
        return "#06d6a0";
      case "warning":
        return "#ffd166";
      default:
        return "#2196F3";
    }
  };

  const filteredStations =
    selectedFilter === "all"
      ? dwlrStations
      : dwlrStations.filter((station) => station.status === selectedFilter);

  const filterOptions = [
    { key: "all", label: "All Stations", count: dwlrStations.length },
    {
      key: "stable",
      label: "Stable",
      count: dwlrStations.filter((s) => s.status === "stable").length,
    },
    {
      key: "stress",
      label: "Stress",
      count: dwlrStations.filter((s) => s.status === "stress").length,
    },
    {
      key: "critical",
      label: "Critical",
      count: dwlrStations.filter((s) => s.status === "critical").length,
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLocationLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          setLocationLoading(false);
          return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        setLocationLoading(false);
      } catch (error) {
        setErrorMsg("Error getting location");
        setLocationLoading(false);
        console.error("Location error:", error);
      }
    })();
  }, []);

  // Center map on user location once when available
  useEffect(() => {
    if (location && !didCenterOnUser && mapRef.current) {
      const { latitude, longitude } = location.coords;
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        },
        600
      );
      setDidCenterOnUser(true);
    }
  }, [location, didCenterOnUser]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    Alert.alert("Region Changed", `Now viewing data for ${region}`);
  };

  const handleWellSelect = (well: WellData["regions"][0]) => {
    Alert.alert(
      "Region Selected",
      `Region: ${well.name}\nLevel: ${well.level}m\nStatus: ${well.status}\nTotal Stations: ${well.totalStations}\nMonitored: ${well.monitoredStations}`
    );
  };

  const renderRegionStatus = (
    status: "normal" | "critical" | "warning" | "good"
  ) => {
    switch (status) {
      case "critical":
        return { color: "#ef476f", label: "Critical" }; // More vibrant red
      case "warning":
        return { color: "#ffd166", label: "Warning" }; // Existing yellow
      case "good":
        return { color: "#06d6a0", label: "Good" }; // Existing green
      default:
        return { color: "#118ab2", label: "Normal" }; // Slightly darker blue
    }
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) =>
      `rgba(${theme.isDark ? "59, 130, 246" : "17, 138, 178"}, ${opacity})`,
    labelColor: (opacity = 1) =>
      theme.colors.text.replace("rgb", "rgba").replace(")", `, ${opacity})`),
    style: {
      borderRadius: scale(12),
    },
    propsForDots: {
      r: scale(4),
      strokeWidth: scale(2),
      stroke: theme.colors.primary,
    },
    propsForLabels: {
      fontSize: scale(10),
    },
  };

  const renderRoleSpecificContent = () => {
    switch (selectedRole) {
      case "Policymaker":
        return (
          <View
            style={[
              styles.roleSection,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.roleHeaderRow}>
              <MaterialCommunityIcons
                name="account-tie"
                size={scale(18)}
                color={theme.colors.primary}
              />
              <Text style={[styles.roleTitle, { color: theme.colors.text }]}>Policy Metrics & Insights</Text>
            </View>
            <View style={styles.metricsRow}>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Groundwater Index
                </Text>
                <Text
                  style={[styles.metricValue, { color: theme.colors.primary }]}
                >
                  {policyMetrics.currentYear}%
                </Text>
                <Text
                  style={[styles.metricSub, { color: theme.colors.primary }]}
                >
                  Target: {policyMetrics.target}%
                </Text>
              </View>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Last Year
                </Text>
                <Text
                  style={[styles.metricValue, { color: theme.colors.primary }]}
                >
                  {policyMetrics.lastYear}%
                </Text>
              </View>
            </View>
            <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>
              Recent Improvements
            </Text>
            <View style={styles.chipRow}>
              {policyMetrics.improvements.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chip,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-decagram-outline"
                    size={scale(12)}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.chipText, { color: theme.colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.colors.primary,
                  alignSelf: "flex-start",
                  marginTop: verticalScale(6),
                },
              ]}
              onPress={handleDecisionSupport}
            >
              <Text
                style={[styles.actionBtnText, { color: theme.colors.surface }]}
              >
                Decision Support
              </Text>
            </TouchableOpacity>
            <View style={{ marginTop: verticalScale(8), gap: verticalScale(4) }}>
              <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>How this helps decisions</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Allocate recharge funds to lowest-index districts.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Prioritize adding stations where coverage is low.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Trigger drought advisories on falling weekly trends.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Track progress against targets to adjust policies.</Text>
            </View>
          </View>
        );
      case "Researcher":
        return (
          <View
            style={[
              styles.roleSection,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.roleHeaderRow}>
              <MaterialCommunityIcons
                name="chart-line"
                size={scale(18)}
                color={theme.colors.primary}
              />
              <Text style={[styles.roleTitle, { color: theme.colors.text }]}>Data Analysis Tools</Text>
            </View>
            <View style={styles.metricsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              >
                <View style={styles.actionBtnContent}>
                  <MaterialCommunityIcons name="database-export" size={scale(14)} color={theme.colors.surface} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.surface }]}>Export Data</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              >
                <View style={styles.actionBtnContent}>
                  <MaterialCommunityIcons name="compare" size={scale(14)} color={theme.colors.surface} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.surface }]}>Compare Regions</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              >
                <View style={styles.actionBtnContent}>
                  <MaterialCommunityIcons name="file-chart-outline" size={scale(14)} color={theme.colors.surface} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.surface }]}>Generate Report</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>
              Historical Trends
            </Text>
            <LineChart
              data={wellData.trendData}
              width={Dimensions.get("window").width - scale(48)}
              height={verticalScale(180)}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.colors.primary,
                  alignSelf: "flex-start",
                  marginTop: verticalScale(6),
                },
              ]}
              onPress={handleDecisionSupport}
            >
              <Text
                style={[styles.actionBtnText, { color: theme.colors.surface }]}
              >
                Decision Support
              </Text>
            </TouchableOpacity>
            <View style={{ marginTop: verticalScale(8), gap: verticalScale(4) }}>
              <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>How this helps decisions</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Detect anomalous wells for field validation.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Compare regions’ time-series to find regime shifts.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Correlate levels with rainfall and usage signals.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Export clean datasets for modeling and reports.</Text>
            </View>
          </View>
        );
      case "Farmer":
        return (
          <View
            style={[
              styles.roleSection,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.roleHeaderRow}>
              <MaterialCommunityIcons
                name="sprout-outline"
                size={scale(18)}
                color={theme.colors.primary}
              />
              <Text style={[styles.roleTitle, { color: theme.colors.text }]}>Farm Guidance</Text>
            </View>
            <View style={styles.metricsRow}>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Water Availability
                </Text>
                <Text
                  style={[styles.metricValue, { color: theme.colors.primary }]}
                >
                  {farmerGuidance.waterAvailability}
                </Text>
              </View>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Advice
                </Text>
                <Text
                  style={[styles.metricValue, { color: theme.colors.primary }]}
                >
                  {farmerGuidance.advice}
                </Text>
              </View>
            </View>
            <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>
              Recommended Crops
            </Text>
            <View style={styles.chipRow}>
              {farmerGuidance.recommendedCrops.map((crop, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chip,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                  ]}
                >
                  <MaterialCommunityIcons name="leaf" size={scale(12)} color={theme.colors.primary} />
                  <Text style={[styles.chipText, { color: theme.colors.text }]}>{crop}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>
              Weather Alerts
            </Text>
            <View style={styles.chipRow}>
              {farmerGuidance.weatherAlerts.map((alert, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chip,
                    { borderColor: "#ffe08a", backgroundColor: theme.isDark ? "#5a4500" : "#fff7da" },
                  ]}
                >
                  <Ionicons name="warning-outline" size={scale(12)} color="#b7791f" />
                  <Text style={[styles.chipText, { color: theme.colors.text }]}>{alert}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.colors.primary,
                  alignSelf: "flex-start",
                  marginTop: verticalScale(6),
                },
              ]}
              onPress={handleDecisionSupport}
            >
              <Text
                style={[styles.actionBtnText, { color: theme.colors.surface }]}
              >
                Decision Support
              </Text>
            </TouchableOpacity>
            <View style={{ marginTop: verticalScale(8), gap: verticalScale(4) }}>
              <Text style={[styles.roleSubTitle, { color: theme.colors.text }]}>How this helps decisions</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Select crops matching current water availability.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Plan irrigation schedule using near-term weather.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Act on alerts for heatwaves and dry spells.</Text>
              <Text style={[styles.improvementItem, { color: theme.colors.text }]}>• Use nearest station data for local guidance.</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Update top stats to use selected station data
  const getDynamicWellData = () => {
    if (!selectedStation) return sampleWellData;
    return {
      ...sampleWellData,
      currentLevel: selectedStation.latest_depth || sampleWellData.currentLevel,
      rechargeStatus:
        selectedStation.latest_status || sampleWellData.rechargeStatus,
      rainfallForecast: 0, // No rain data in this API, set to 0 or sample
    };
  };

  const dynamicWellData = getDynamicWellData();

  // Render station selection modal (with loading)
  const renderStationModal = () => (
    <Modal visible={stationModalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Select Nearest Station
          </Text>
          {stationsLoading ||
          locationLoading ||
          nearestStations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {stationsLoading
                  ? "Loading stations..."
                  : locationLoading
                  ? "Getting your location..."
                  : "Finding nearest stations..."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={nearestStations}
              keyExtractor={(item) => item.station_code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stationItem}
                  onPress={() => {
                    setSelectedStation(item);
                    setStationModalVisible(false);
                  }}
                >
                  <Text
                    style={[styles.stationName, { color: theme.colors.text }]}
                  >
                    {item.station_name}
                  </Text>
                  <Text
                    style={[
                      styles.stationDistance,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.distance.toFixed(1)} km away
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setStationModalVisible(false)}
          >
            <Text
              style={[styles.closeButtonText, { color: theme.colors.surface }]}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      {/* Role Switcher */}
      <View
        style={[
          styles.roleSwitcher,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onLayout={({ nativeEvent }) => setSegWidth(nativeEvent.layout.width)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.roleIndicatorPill,
            {
              width: Math.max(0, segmentWidth - scale(6)),
              backgroundColor: theme.colors.primary,
              transform: [{ translateX: indicatorAnim }],
            },
          ]}
        />
        {roles.map((role) => {
          const isActive = selectedRole === role;
          return (
            <TouchableOpacity
              key={role}
              style={styles.roleBtn}
              onPress={() => handleRoleSelect(role)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.roleBtnText,
                  { color: isActive ? theme.colors.surface : theme.colors.text },
                  isActive && { fontWeight: "700" },
                ]}
                numberOfLines={1}
              >
                {role}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        style={[
          styles.scrollArea,
          { backgroundColor: theme.colors.background },
        ]}
        contentContainerStyle={{ paddingBottom: verticalScale(32) }}
      >
        {/* Top Stats */}
        <View style={styles.topStatsRow}>
          <View
            style={[
              styles.topStatBox,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.topStatLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Current Level
            </Text>
            <Text style={[styles.topStatValue, { color: theme.colors.text }]}>
              {typeof dynamicWellData.currentLevel === "number"
                ? dynamicWellData.currentLevel.toFixed(2)
                : "N/A"}{" "}
              m
            </Text>
            <Text
              style={[
                styles.topStatTrend,
                dynamicWellData.trend < 0
                  ? styles.negativeTrend
                  : styles.positiveTrend,
              ]}
            >
              {dynamicWellData.trend > 0 ? "↑" : "↓"}{" "}
              {Math.abs(dynamicWellData.trend)}% this week
            </Text>
          </View>
          <View
            style={[
              styles.topStatBox,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.topStatLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Recharge Status
            </Text>
            <Text style={[styles.topStatValue, { color: theme.colors.text }]}>
              {dynamicWellData.rechargeStatus}
            </Text>
            <Text
              style={[styles.topStatSub, { color: theme.colors.textSecondary }]}
            >
              {dynamicWellData.rechargeValue}% capacity
            </Text>
          </View>
          <View
            style={[
              styles.topStatBox,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.topStatLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Rainfall Forecast
            </Text>
            <Text style={[styles.topStatValue, { color: theme.colors.text }]}>
              {dynamicWellData.rainfallForecast} mm
            </Text>
            <Text
              style={[styles.topStatSub, { color: theme.colors.textSecondary }]}
            >
              Next 48 hours
            </Text>
          </View>
        </View>

        {/* Region Status Overview */}
        <View style={styles.regionOverviewRow}>
          <View
            style={[
              styles.regionStatsCol,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[styles.regionStatsTitle, { color: theme.colors.text }]}
            >
              State Wise Station Count
            </Text>
            {/* Wrap the BarChart in a ScrollView for horizontal scrolling */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={{
                  labels: wellData.regions.map((r) => r.name.substring(0, 3)),
                  datasets: [
                    {
                      data: wellData.regions.map((r) => r.totalStations),
                      color: () => "#48cae4",
                    },
                    {
                      data: wellData.regions.map((r) => r.monitoredStations),
                      color: () => "#007ea7",
                    },
                  ],
                }}
                width={Dimensions.get("window").width * 2} // Wider for scrolling
                height={verticalScale(220)}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  ...(chartConfig as any),
                  barPercentage: 0.6,
                  propsForLabels: { fontSize: scale(9) },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#f0f0f0",
                  },
                }}
                style={styles.chart}
                verticalLabelRotation={scale(30)}
                showBarTops={false}
                withInnerLines={true}
              />
            </ScrollView>

            <View style={styles.regionList}>
              {wellData.regions.map((region) => {
                const status = renderRegionStatus(region.status);
                return (
                  <TouchableOpacity
                    key={region.id}
                    style={styles.regionListItem}
                    onPress={() => handleWellSelect(region)}
                  >
                    <View
                      style={[
                        styles.regionStatusDot,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <Text style={styles.regionListName}>{region.name}</Text>
                    <Text style={styles.regionListLevel}>{region.level}m</Text>
                    <Text style={styles.regionListStations}>
                      {region.monitoredStations}/{region.totalStations}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Map moved here under State Wise Station Count */}
            <View
              style={[styles.mapContainer, { marginTop: verticalScale(12) }]}
            >
              {/* Filter Controls for Map */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mapFilterContainer}
                contentContainerStyle={styles.mapFilterContent}
              >
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.mapFilterButton,
                      selectedFilter === option.key &&
                        styles.mapFilterButtonActive,
                      {
                        borderColor:
                          option.key !== "all"
                            ? getStatusColor(option.key)
                            : theme.colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedFilter(option.key)}
                  >
                    <Text
                      style={[
                        styles.mapFilterText,
                        { color: theme.colors.text },
                        selectedFilter === option.key && {
                          color: theme.colors.surface,
                        },
                      ]}
                    >
                      {option.label} ({option.count})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* MapView */}
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.mapView}
                initialRegion={{
                  latitude: location?.coords?.latitude || 11.1271, // Tamil Nadu center or current location
                  longitude: location?.coords?.longitude || 78.6569, // Tamil Nadu center or current location
                  latitudeDelta: 2.5, // Wider view to show whole Tamil Nadu
                  longitudeDelta: 2.5,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
              >
                {/* Current Location Marker */}
                {location && (
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="Your Current Location"
                    description="This is your current location"
                    pinColor="#2196F3"
                  />
                )}

                {/* Tamil Nadu DWLR Stations */}
                {filteredStations.map((station) => (
                  <Marker
                    key={station.id}
                    coordinate={{
                      latitude: station.latitude,
                      longitude: station.longitude,
                    }}
                    title={station.name}
                    description={`Depth: ${station.depth} | Status: ${station.status} | Updated: ${station.lastUpdated}`}
                    pinColor={getStatusColor(station.status)}
                  />
                ))}
              </MapView>

              {/* Legend */}
              <View
                style={[
                  styles.mapLegend,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[styles.mapLegendTitle, { color: theme.colors.text }]}
                >
                  Station Status
                </Text>
                <View style={styles.mapLegendItems}>
                  <View style={styles.mapLegendItem}>
                    <View
                      style={[
                        styles.mapLegendDot,
                        { backgroundColor: "#2196F3" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.mapLegendText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Current Location
                    </Text>
                  </View>
                  <View style={styles.mapLegendItem}>
                    <View
                      style={[
                        styles.mapLegendDot,
                        { backgroundColor: "#4CAF50" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.mapLegendText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Stable
                    </Text>
                  </View>
                  <View style={styles.mapLegendItem}>
                    <View
                      style={[
                        styles.mapLegendDot,
                        { backgroundColor: "#FF9800" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.mapLegendText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Stress
                    </Text>
                  </View>
                  <View style={styles.mapLegendItem}>
                    <View
                      style={[
                        styles.mapLegendDot,
                        { backgroundColor: "#F44336" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.mapLegendText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Critical
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>


        {/* Anchor for role-specific content */}
        <View
          onLayout={({ nativeEvent }) => setRoleAnchorY(nativeEvent.layout.y)}
        />

        {/* Role-specific content */}
        {renderRoleSpecificContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Jal Shakti | National Groundwater Management Program
          </Text>
        </View>
      </ScrollView>

      {/* Station Selection Modal */}
      {renderStationModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "space-between",
    gap: scale(10),
  },
  logoCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "#e3f2fd", // Lighter blue
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(10),
    borderWidth: scale(1),
    borderColor: "#90caf9", // Softer blue border
  },
  logoImg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
  },
  logoText: {
    // Added for the placeholder logo
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#1976d2",
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#1976d2", // Deeper blue
    letterSpacing: scale(0.5),
  },
  headerSubTitle: {
    fontSize: scale(12),
    color: "#424242",
    fontWeight: "500",
    marginTop: verticalScale(2),
  },
  roleSwitcher: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: scale(3),
    marginHorizontal: scale(12),
    marginTop: verticalScale(4),
    borderRadius: scale(10),
    gap: scale(6),
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
    elevation: 1,
    overflow: "hidden",
  },
  roleBtn: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    alignItems: "center",
    borderRadius: scale(8),
    backgroundColor: "transparent",
    zIndex: 1,
  },
  roleBtnActive: {
    backgroundColor: "#1976d2",
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
    elevation: 4,
  },
  roleBtnText: {
    color: "#1976d2",
    fontWeight: "500",
    fontSize: scale(14),
  },
  roleIndicatorPill: {
    position: "absolute",
    top: scale(3),
    bottom: scale(3),
    left: scale(3),
    borderRadius: scale(8),
  },
  roleBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(15),
    backgroundColor: "transparent",
  },
  topStatsRow: {
    flexDirection: "row",
    gap: scale(12),
    marginBottom: verticalScale(15),
    justifyContent: "space-between",
  },
  topStatBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(18),
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    minWidth: scale(100),
  },
  topStatLabel: {
    fontSize: scale(12),
    color: "#424242",
    fontWeight: "600",
    marginBottom: verticalScale(5),
  },
  topStatValue: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: verticalScale(3),
  },
  topStatTrend: {
    fontSize: scale(12),
    fontWeight: "500",
    marginTop: verticalScale(2),
  },
  topStatSub: {
    fontSize: scale(12),
    color: "#2196f3", // Blue for sub-text
    fontWeight: "500",
    marginTop: verticalScale(2),
  },
  positiveTrend: { color: "#28a745" }, // Green for positive
  negativeTrend: { color: "#dc3545" }, // Red for negative
  regionOverviewRow: {
    flexDirection: "row",
    gap: scale(12),
    marginBottom: verticalScale(15),
    alignItems: "flex-start",
  },
  regionStatsCol: {
    flex: 1.2,
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    minWidth: scale(200),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
  },
  regionStatsTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: verticalScale(8),
  },
  regionList: {
    marginTop: verticalScale(8),
    gap: verticalScale(5),
  },
  regionListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingVertical: verticalScale(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  regionStatusDot: {
    width: scale(9),
    height: scale(9),
    borderRadius: scale(4.5),
    marginRight: scale(2),
  },
  regionListName: {
    flex: 1,
    fontSize: scale(13),
    color: "#424242",
    fontWeight: "600",
  },
  regionListLevel: {
    fontSize: scale(12),
    color: "#1976d2",
    fontWeight: "600",
    marginRight: scale(7),
  },
  regionListStations: {
    fontSize: scale(12),
    color: "#2196f3",
    fontWeight: "600",
  },
  regionMapCol: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    minWidth: scale(200),
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
  },
  mapContainer: {
    width: "100%",
    height: verticalScale(300),
    borderRadius: scale(10),
    overflow: "hidden",
    borderWidth: scale(1),
    borderColor: "#e0e0e0",
    marginTop: verticalScale(8),
  },
  mapFilterContainer: {
    maxHeight: 50,
    paddingVertical: 0,
    marginVertical: 0,
    marginHorizontal: 5,
  },
  mapFilterContent: {
    paddingHorizontal: 8,
    paddingVertical: 0,
    gap: 8,
    alignItems: "center",
  },
  mapFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  mapFilterButtonActive: {
    backgroundColor: "#077A7D",
  },
  mapFilterText: {
    fontSize: scale(11),
    fontWeight: "500",
  },
  mapView: {
    flex: 1,
    height: verticalScale(200),
  },
  mapLegend: {
    padding: scale(8),
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  mapLegendTitle: {
    fontSize: scale(12),
    fontWeight: "bold",
    marginBottom: verticalScale(6),
  },
  mapLegendItems: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  mapLegendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapLegendDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(4),
  },
  mapLegendText: {
    fontSize: scale(10),
  },
  chart: {
    borderRadius: scale(10),
    marginVertical: verticalScale(8),
  },
  roleSection: {
    backgroundColor: "transparent",
    borderRadius: scale(12),
    padding: scale(15),
    marginBottom: verticalScale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
  },
  roleTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: verticalScale(8),
  },
  roleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(8),
  },
  metricsRow: {
    flexDirection: "row",
    gap: scale(12),
    marginBottom: verticalScale(10),
    flexWrap: "wrap", // Allow wrapping for smaller screens
  },
  metricBox: {
    flex: 1,
    minWidth: scale(120), // Ensure boxes don't get too small
    backgroundColor: "transparent",
    borderRadius: scale(10),
    padding: scale(12),
    alignItems: "center",
    borderWidth: scale(1),
    borderColor: "transparent",
  },
  metricLabel: {
    fontSize: scale(12),
    color: "#424242",
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  metricValue: {
    fontSize: scale(17),
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: verticalScale(2),
  },
  metricSub: {
    fontSize: scale(11),
    color: "#2196f3",
    fontWeight: "500",
  },
  roleSubTitle: {
    fontSize: scale(13),
    color: "#424242",
    fontWeight: "700",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(4),
  },
  improvementsList: {
    gap: verticalScale(3),
    marginBottom: verticalScale(6),
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: verticalScale(6),
    marginBottom: verticalScale(6),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: scale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
  },
  chipText: {
    fontSize: scale(11),
    fontWeight: "600",
  },
  improvementItem: {
    fontSize: scale(12),
    color: "#424242",
    fontWeight: "500",
    marginLeft: scale(4),
  },
  actionBtn: {
    backgroundColor: "#1976d2",
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    marginRight: scale(8),
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
    elevation: 2,
  },
  actionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: scale(12),
  },
  footer: {
    alignItems: "center",
    padding: scale(15),
    backgroundColor: "transparent",
    borderRadius: scale(12),
    marginTop: verticalScale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  footerText: {
    color: "#1976d2",
    fontSize: scale(12),
    fontWeight: "600",
  },
  mapHeader: {
    marginBottom: verticalScale(8),
    paddingHorizontal: scale(8),
  },
  mapTitle: {
    fontSize: scale(14),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  locationStatus: {
    fontSize: scale(11),
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: scale(12),
    padding: scale(20),
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    marginBottom: verticalScale(10),
  },
  stationItem: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  stationName: {
    fontSize: scale(16),
    fontWeight: "600",
  },
  stationDistance: {
    fontSize: scale(12),
  },
  closeButton: {
    marginTop: verticalScale(10),
    padding: scale(10),
    borderRadius: scale(8),
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: scale(14),
    fontWeight: "600",
  },
  loadingContainer: {
    padding: scale(20),
    alignItems: "center",
  },
  loadingText: {
    fontSize: scale(14),
    fontWeight: "500",
  },
});
