import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { scale, verticalScale } from "@/utils/styling";
import { useTheme } from "@/hooks/useTheme";

interface WellData {
  currentLevel: number;
  trend: number;
  rechargeStatus: string;
  rechargeValue: number;
  rainfallForecast: number;
  alert: string;
  trendData: {
    labels: string[];
    datasets: {
      data: number[];
      color: (opacity?: number) => string;
      strokeWidth: number;
    }[];
  };
  rechargeData: {
    labels: string[];
    datasets: {
      data: number[];
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
    rechargeTrend?: number[]; // Add this
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
  alert: "District XYZ showing critically low levels",
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
  rechargeData: {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        data: [30, 35, 40, 45, 42, 45, 50, 48, 46, 44, 42, 40],
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
    // Add more as needed
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
  const [selectedRegion, setSelectedRegion] = useState<string>("National");
  const [selectedRole, setSelectedRole] = useState<string>("Policymaker");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wellData, setWellData] = useState<WellData>(sampleWellData);

  const roles: string[] = ["Policymaker", "Researcher", "Farmer"];

  // DWLR Stations data for the map
  const dwlrStations = [
    {
      id: 1,
      name: "DWLR Station Alpha",
      status: "stable",
      depth: "8.2m",
      latitude: 28.6139,
      longitude: 77.209,
      lastUpdated: "2 min ago",
    },
    {
      id: 2,
      name: "DWLR Station Beta",
      status: "stress",
      depth: "15.7m",
      latitude: 28.6219,
      longitude: 77.2195,
      lastUpdated: "5 min ago",
    },
    {
      id: 3,
      name: "DWLR Station Gamma",
      status: "critical",
      depth: "22.1m",
      latitude: 28.6059,
      longitude: 77.1985,
      lastUpdated: "1 min ago",
    },
    {
      id: 4,
      name: "DWLR Station Delta",
      status: "stable",
      depth: "6.8m",
      latitude: 28.6289,
      longitude: 77.2065,
      lastUpdated: "3 min ago",
    },
    {
      id: 5,
      name: "DWLR Station Echo",
      status: "stress",
      depth: "18.3m",
      latitude: 28.5989,
      longitude: 77.2125,
      lastUpdated: "7 min ago",
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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

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
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>Policy Metrics & Insights</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Groundwater Index</Text>
                <Text style={styles.metricValue}>
                  {policyMetrics.currentYear}%
                </Text>
                <Text style={styles.metricSub}>
                  Target: {policyMetrics.target}%
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Last Year</Text>
                <Text style={styles.metricValue}>
                  {policyMetrics.lastYear}%
                </Text>
              </View>
            </View>
            <Text style={styles.roleSubTitle}>Recent Improvements</Text>
            <View style={styles.improvementsList}>
              {policyMetrics.improvements.map((item, idx) => (
                <Text key={idx} style={styles.improvementItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        );
      case "Researcher":
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>Data Analysis Tools</Text>
            <View style={styles.metricsRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Export Data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Compare Regions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Generate Report</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.roleSubTitle}>Historical Trends</Text>
            <LineChart
              data={wellData.trendData}
              width={Dimensions.get("window").width - scale(48)}
              height={verticalScale(180)}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        );
      case "Farmer":
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>Farm Guidance</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Water Availability</Text>
                <Text style={styles.metricValue}>
                  {farmerGuidance.waterAvailability}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Advice</Text>
                <Text style={styles.metricValue}>{farmerGuidance.advice}</Text>
              </View>
            </View>
            <Text style={styles.roleSubTitle}>Recommended Crops</Text>
            <View style={styles.improvementsList}>
              {farmerGuidance.recommendedCrops.map((crop, idx) => (
                <Text key={idx} style={styles.improvementItem}>
                  • {crop}
                </Text>
              ))}
            </View>
            <Text style={styles.roleSubTitle}>Weather Alerts</Text>
            <View style={styles.improvementsList}>
              {farmerGuidance.weatherAlerts.map((alert, idx) => (
                <Text key={idx} style={styles.improvementItem}>
                  ⚠️ {alert}
                </Text>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Role Switcher */}
      <View
        style={[styles.roleSwitcher, { backgroundColor: theme.colors.surface }]}
      >
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleBtn,
              { borderColor: theme.colors.border },
              selectedRole === role && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => setSelectedRole(role)}
          >
            <Text
              style={[
                styles.roleBtnText,
                { color: theme.colors.text },
                selectedRole === role && { color: theme.colors.surface },
              ]}
            >
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
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
              {wellData.currentLevel} m
            </Text>
            <Text
              style={[
                styles.topStatTrend,
                wellData.trend < 0
                  ? styles.negativeTrend
                  : styles.positiveTrend,
              ]}
            >
              {wellData.trend > 0 ? "↑" : "↓"} {Math.abs(wellData.trend)}% this
              week
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
              {wellData.rechargeStatus}
            </Text>
            <Text
              style={[styles.topStatSub, { color: theme.colors.textSecondary }]}
            >
              {wellData.rechargeValue}% capacity
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
              {wellData.rainfallForecast} mm
            </Text>
            <Text
              style={[styles.topStatSub, { color: theme.colors.textSecondary }]}
            >
              Next 48 hours
            </Text>
          </View>
        </View>

        {/* Alert */}
        <View
          style={[
            styles.alertSection,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={styles.alertIcon}>🚨</Text>
          <Text style={[styles.alertText, { color: theme.colors.text }]}>
            {wellData.alert}
          </Text>
          <TouchableOpacity
            style={[styles.alertBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text
              style={[styles.alertBtnText, { color: theme.colors.surface }]}
            >
              View Details
            </Text>
          </TouchableOpacity>
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
                provider={PROVIDER_GOOGLE}
                style={styles.mapView}
                initialRegion={{
                  latitude: 28.6139,
                  longitude: 77.209,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
              >
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

        {/* Trend Graph */}
        <View style={styles.trendSection}>
          <Text style={styles.regionStatsTitle}>Recharge Trend</Text>
          <View style={styles.chartWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={wellData.rechargeData}
                width={Dimensions.get("window").width * 2} // Wider for scrolling
                height={verticalScale(180)}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </ScrollView>
          </View>
        </View>

        {/* Role-specific content */}
        {renderRoleSpecificContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Jal Shakti | National Groundwater Management Program
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" }, // Softer background
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
    backgroundColor: "#e3f2fd",
    padding: scale(6),
    marginHorizontal: scale(20),
    marginTop: verticalScale(15),
    borderRadius: scale(10),
    gap: scale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
    elevation: 2,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: verticalScale(10),
    alignItems: "center",
    borderRadius: scale(8),
    backgroundColor: "transparent",
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
  roleBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(15),
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
  alertSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe0b2", // Light orange for alert
    borderRadius: scale(10),
    padding: scale(14),
    marginBottom: verticalScale(15),
    gap: scale(10),
    borderWidth: scale(1),
    borderColor: "#ffb74d",
  },
  alertIcon: { fontSize: scale(20), color: "#fb8c00" }, // Orange alert icon
  alertText: {
    flex: 1,
    fontSize: scale(14),
    color: "#333333",
    fontWeight: "600",
  },
  alertBtn: {
    backgroundColor: "#1976d2",
    borderRadius: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },
  alertBtnText: { color: "#ffffff", fontWeight: "600", fontSize: scale(12) },
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
  trendSection: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(15),
    marginBottom: verticalScale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
  },
  chart: {
    borderRadius: scale(10),
    marginVertical: verticalScale(8),
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  roleSection: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(15),
    marginBottom: verticalScale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
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
  metricsRow: {
    flexDirection: "row",
    gap: scale(12),
    marginBottom: verticalScale(10),
    flexWrap: "wrap", // Allow wrapping for smaller screens
  },
  metricBox: {
    flex: 1,
    minWidth: scale(120), // Ensure boxes don't get too small
    backgroundColor: "#e3f2fd",
    borderRadius: scale(10),
    padding: scale(12),
    alignItems: "center",
    borderWidth: scale(1),
    borderColor: "#bbdefb",
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
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: scale(12),
  },
  footer: {
    alignItems: "center",
    padding: scale(15),
    backgroundColor: "#e3f2fd",
    borderRadius: scale(12),
    marginTop: verticalScale(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#bbdefb",
  },
  footerText: {
    color: "#1976d2",
    fontSize: scale(12),
    fontWeight: "600",
  },
});
