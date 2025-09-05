import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("Delhi, India");
  const [notificationCount, setNotificationCount] = useState(2);

  const currentGroundwaterData = {
    depth: 12.4,
    trend: "down", // "up", "down", "stable"
    trendPercentage: -2.3,
    forecast: "Slight depletion expected",
  };

  const insightsData = {
    rechargeStatus: "Medium",
    rainfallCorrelation: "+1.2m after 15mm rain",
    anomalyAlerts: 1,
    waterAvailabilityIndex: 68,
  };

  const nearbyStations = [
    {
      id: 1,
      name: "Station A",
      status: "stable",
      distance: "2.1 km",
      latitude: 28.6139,
      longitude: 77.209,
    },
    {
      id: 2,
      name: "Station B",
      status: "stress",
      distance: "3.8 km",
      latitude: 28.6219,
      longitude: 77.2195,
    },
    {
      id: 3,
      name: "Station C",
      status: "critical",
      distance: "5.2 km",
      latitude: 28.6059,
      longitude: 77.1985,
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗️";
      case "down":
        return "↘️";
      default:
        return "→";
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>AquaSense</Text>
            <Text style={styles.tagline}>
              sensing and analyzing groundwater
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.locationSelector}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{selectedLocation}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Real-Time Groundwater Snapshot */}
      <View style={styles.heroSection}>
        <Text style={styles.sectionTitle}>Current Groundwater Status</Text>
        <View style={styles.groundwaterCard}>
          <View style={styles.depthContainer}>
            <Text style={styles.depthValue}>
              {currentGroundwaterData.depth}m
            </Text>
            <Text style={styles.depthLabel}>below ground level</Text>
          </View>

          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>
              {getTrendIcon(currentGroundwaterData.trend)}
            </Text>
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    currentGroundwaterData.trend === "down"
                      ? "#F44336"
                      : "#4CAF50",
                },
              ]}
            >
              {currentGroundwaterData.trendPercentage > 0 ? "+" : ""}
              {currentGroundwaterData.trendPercentage}%
            </Text>
          </View>
        </View>

        <View style={styles.forecastCard}>
          <Text style={styles.forecastIcon}>🔮</Text>
          <Text style={styles.forecastText}>
            {currentGroundwaterData.forecast}
          </Text>
        </View>
      </View>

      {/* Mini Map Section */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Nearby DWLR Stations</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 28.6139,
              longitude: 77.209,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {nearbyStations.map((station) => (
              <Marker
                key={station.id}
                coordinate={{
                  latitude: station.latitude,
                  longitude: station.longitude,
                }}
                title={station.name}
                description={`Status: ${station.status} | Distance: ${station.distance}`}
                pinColor={getStatusColor(station.status)}
              />
            ))}
          </MapView>
        </View>

        <View style={styles.stationsList}>
          {nearbyStations.map((station) => (
            <TouchableOpacity key={station.id} style={styles.stationItem}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(station.status) },
                ]}
              />
              <View style={styles.stationInfo}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationDistance}>{station.distance}</Text>
              </View>
              <Text style={styles.stationStatus}>{station.status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Insights Dashboard */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Quick Insights</Text>
        <View style={styles.insightsGrid}>
          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>💧</Text>
            <Text style={styles.insightLabel}>Recharge Status</Text>
            <Text style={styles.insightValue}>
              {insightsData.rechargeStatus}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>🌧️</Text>
            <Text style={styles.insightLabel}>Rainfall Impact</Text>
            <Text style={styles.insightValue}>
              {insightsData.rainfallCorrelation}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>⚠️</Text>
            <Text style={styles.insightLabel}>Anomaly Alerts</Text>
            <Text
              style={[
                styles.insightValue,
                {
                  color: insightsData.anomalyAlerts > 0 ? "#F44336" : "#4CAF50",
                },
              ]}
            >
              {insightsData.anomalyAlerts}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📊</Text>
            <Text style={styles.insightLabel}>Availability Index</Text>
            <Text style={styles.insightValue}>
              {insightsData.waterAvailabilityIndex}/100
            </Text>
          </View>
        </View>
      </View>

      {/* Call-to-Action Section */}
      <View style={styles.ctaSection}>
        <TouchableOpacity style={[styles.ctaButton, styles.primaryCta]}>
          <Text style={styles.ctaPrimaryText}>📈 Check Detailed Report</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={[styles.ctaButton, styles.secondaryCta]}>
            <Text style={styles.ctaSecondaryText}>🤝 Contribute Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ctaButton, styles.secondaryCta]}>
            <Text style={styles.ctaSecondaryText}>📋 Policy Insights</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },

  // Header Styles
  header: {
    backgroundColor: "#075a7dff",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 14,
    color: "#A8E6E6",
    fontStyle: "italic",
  },
  notificationButton: {
    position: "relative",
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownIcon: {
    color: "#FFFFFF",
    fontSize: 12,
  },

  // Section Styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#077A7D",
    marginBottom: 15,
  },

  // Hero Section Styles
  heroSection: {
    padding: 20,
  },
  groundwaterCard: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  depthContainer: {
    flex: 1,
  },
  depthValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#077A7D",
  },
  depthLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  trendContainer: {
    alignItems: "center",
  },
  trendIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  trendText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  forecastCard: {
    backgroundColor: "#E0F7F7",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  forecastIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  forecastText: {
    flex: 1,
    color: "#077A7D",
    fontSize: 14,
    fontWeight: "500",
  },

  // Map Section Styles
  mapSection: {
    padding: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    width: "100%",
    height: "100%",
  },

  // Stations List Styles
  stationsList: {
    gap: 10,
  },
  stationItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  stationDistance: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  stationStatus: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
    color: "#666",
  },

  // Insights Section Styles
  insightsSection: {
    padding: 20,
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 15,
    width: (width - 55) / 2,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#077A7D",
    textAlign: "center",
  },

  // CTA Section Styles
  ctaSection: {
    padding: 20,
    paddingBottom: 30,
  },
  ctaButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryCta: {
    backgroundColor: "#077A7D",
    marginBottom: 15,
  },
  secondaryCta: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#077A7D",
  },
  ctaPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  ctaSecondaryText: {
    color: "#077A7D",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
  },
});
