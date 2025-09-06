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
  Image,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

// Assuming scale and verticalScale are correctly implemented in '@/utils/styling'
// These are placeholders for illustration purposes.
const scale = (size: number) => size; // Replace with actual scale implementation
const verticalScale = (size: number) => size; // Replace with actual verticalScale implementation

// Replace with your actual logo path if available
// import JalShaktiLogo from '../../../assets/jalshakti-logo.png';

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
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [30, 35, 40, 45, 42, 45],
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
  const [selectedRegion, setSelectedRegion] = useState<string>("National");
  const [selectedRole, setSelectedRole] = useState<string>("Policymaker");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wellData, setWellData] = useState<WellData>(sampleWellData);

  const roles: string[] = ["Policymaker", "Researcher", "Farmer"];

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
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(17, 138, 178, ${opacity})`, // Using a slightly darker blue
    labelColor: (opacity = 1) => `rgba(30, 42, 61, ${opacity})`,
    style: {
      borderRadius: scale(12),
    },
    propsForDots: {
      r: scale(4),
      strokeWidth: scale(2),
      stroke: "#007ea7", // Deeper blue for dots
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          {/* <Image source={JalShaktiLogo} style={styles.logoImg} resizeMode="contain" /> */}
          <Text style={styles.logoText}>JS</Text> {/* Placeholder */}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>JAL SHAKTI</Text>
          <Text style={styles.headerSubTitle}>
            Groundwater Monitoring Dashboard
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.regionSelector}
            onPress={() => {
              Alert.alert(
                "Select Region",
                "Choose a region to view data",
                wellData.regions.map((region) => ({
                  text: region.name,
                  onPress: () => handleRegionChange(region.name),
                }))
              );
            }}
          >
            <Text style={styles.regionText}>{selectedRegion}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Switcher */}
      <View style={styles.roleSwitcher}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleBtn,
              selectedRole === role && styles.roleBtnActive,
            ]}
            onPress={() => setSelectedRole(role)}
          >
            <Text
              style={[
                styles.roleBtnText,
                selectedRole === role && styles.roleBtnTextActive,
              ]}
            >
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: verticalScale(32) }}
      >
        {/* Top Stats */}
        <View style={styles.topStatsRow}>
          <View style={styles.topStatBox}>
            <Text style={styles.topStatLabel}>Current Level</Text>
            <Text style={styles.topStatValue}>{wellData.currentLevel} m</Text>
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
          <View style={styles.topStatBox}>
            <Text style={styles.topStatLabel}>Recharge Status</Text>
            <Text style={styles.topStatValue}>{wellData.rechargeStatus}</Text>
            <Text style={styles.topStatSub}>
              {wellData.rechargeValue}% capacity
            </Text>
          </View>
          <View style={styles.topStatBox}>
            <Text style={styles.topStatLabel}>Rainfall Forecast</Text>
            <Text style={styles.topStatValue}>
              {wellData.rainfallForecast} mm
            </Text>
            <Text style={styles.topStatSub}>Next 48 hours</Text>
          </View>
        </View>

        {/* Alert */}
        <View style={styles.alertSection}>
          <Text style={styles.alertIcon}>🚨</Text>
          <Text style={styles.alertText}>{wellData.alert}</Text>
          <TouchableOpacity style={styles.alertBtn}>
            <Text style={styles.alertBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Region Status Overview */}
        <View style={styles.regionOverviewRow}>
          <View style={styles.regionStatsCol}>
            <Text style={styles.regionStatsTitle}>
              State Wise Station Count
            </Text>
            <BarChart
              data={{
                labels: wellData.regions.map((r) => r.name.substring(0, 3)), // Shorten labels for chart
                datasets: [
                  {
                    data: wellData.regions.map((r) => r.totalStations),
                    color: () => "#48cae4", // Lighter blue for total
                  },
                  {
                    data: wellData.regions.map((r) => r.monitoredStations),
                    color: () => "#007ea7", // Deeper blue for monitored
                  },
                ],
                // removed unsupported 'legend' property
              }}
              width={Dimensions.get("window").width * 0.48 - scale(16)} // Adjust for padding
              height={verticalScale(220)}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              chartConfig={{
                ...(chartConfig as any), // cast to any to avoid strict type complaints
                barPercentage: 0.6, // keep valid prop if needed
                // removed unsupported 'categoryPercentage'
                propsForLabels: {
                  fontSize: scale(9),
                },
                propsForBackgroundLines: {
                  strokeDasharray: "", // Solid background lines
                  stroke: "#f0f0f0",
                },
              }}
              style={styles.chart}
              verticalLabelRotation={scale(30)}
              showBarTops={false}
              withInnerLines={true}
            />
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
          </View>
          <View style={styles.regionMapCol}>
            <Text style={styles.regionStatsTitle}>Map Overview</Text>
            <View style={styles.mapContainer}>
              <WebView
                source={{
                  uri: "https://www.openstreetmap.org/export/embed.html?bbox=67.0,7.5,97.0,37.0&layer=mapnik",
                }}
                style={styles.mapWebview}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
              />
            </View>
          </View>
        </View>

        {/* Trend Graph */}
        <View style={styles.trendSection}>
          <Text style={styles.regionStatsTitle}>Recharge Trend</Text>
          <BarChart
            data={wellData.rechargeData}
            width={Dimensions.get("window").width - scale(48)}
            height={verticalScale(180)}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={chartConfig}
            style={styles.chart}
          />
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
  container: { flex: 1, backgroundColor: "#f8fafd" }, // Lighter background
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth, // Thinner border
    borderBottomColor: "#e0e0e0",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  regionSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: scale(8),
    borderWidth: scale(1),
    borderColor: "#bbdefb",
    marginRight: scale(6),
  },
  regionText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#1976d2",
    marginRight: scale(4),
  },
  dropdownIcon: {
    fontSize: scale(10),
    color: "#1976d2",
  },
  notificationButton: {
    position: "relative",
    padding: scale(8),
  },
  notificationIcon: {
    fontSize: scale(20),
    color: "#1976d2",
  },
  notificationBadge: {
    position: "absolute",
    top: verticalScale(5),
    right: scale(5),
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: "#ef476f", // Vibrant red
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
    height: verticalScale(200),
    borderRadius: scale(10),
    overflow: "hidden",
    borderWidth: scale(1),
    borderColor: "#e0e0e0",
    marginTop: verticalScale(8),
  },
  mapWebview: {
    flex: 1,
    height: verticalScale(200),
    borderRadius: scale(10),
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
