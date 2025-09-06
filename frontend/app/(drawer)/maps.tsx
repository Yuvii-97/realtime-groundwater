import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width, height } = Dimensions.get("window");

export default function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState("all");

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DWLR Stations Map</Text>
        <Text style={styles.headerSubtitle}>
          Real-time Groundwater Monitoring
        </Text>
      </View>

      {/* Filter Controls */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              selectedFilter === option.key && styles.filterButtonActive,
              {
                borderColor:
                  option.key !== "all" ? getStatusColor(option.key) : "#077A7D",
              },
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === option.key && styles.filterTextActive,
              ]}
            >
              {option.label} ({option.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
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
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Station Status Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Stable (Normal levels)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
            <Text style={styles.legendText}>Stress (Moderate depletion)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Critical (Severe depletion)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },
  header: {
    backgroundColor: "#075a7dff",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#A8E6E6",
    fontStyle: "italic",
  },
  filterContainer: {
    maxHeight: 60,
    paddingVertical: 0,
    marginVertical: 0,
    marginHorizontal: 10, // keep only horizontal spacing
    borderBottomWidth: 0, // remove extra vertical space from borders
  },
  filterContent: {
    paddingHorizontal: 10,
    paddingVertical: 0,
    gap: 10,
    alignItems: "center", // vertically center buttons to their own height
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 6, // slightly tighter
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  filterButtonActive: {
    backgroundColor: "#077A7D",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#077A7D",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  legend: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#077A7D",
    marginBottom: 10,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
});
