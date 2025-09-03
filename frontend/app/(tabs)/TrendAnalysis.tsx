// TrendAnalysisScreen.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function TrendAnalysisScreen() {
  // Dummy chart data (replace with API data later)
  const [trendData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [12.5, 11.8, 13.1, 12.0, 11.5, 12.3],
        color: () => `#2563eb`, // blue line
        strokeWidth: 2,
      },
    ],
    legend: ["Groundwater Level (m below ground level)"],
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Trends & Analysis</Text>

      {/* Line Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Groundwater Fluctuations</Text>
        <LineChart
          data={trendData}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix="m"
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#f9fafb",
            backgroundGradientTo: "#f9fafb",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#2563eb",
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insights</Text>
        <Text style={styles.insight}>
          - Average level this season: <Text style={styles.bold}>12.2m</Text>
        </Text>
        <Text style={styles.insight}>
          - Lowest recorded: <Text style={styles.bold}>11.5m</Text> (May)
        </Text>
        <Text style={styles.insight}>
          - Fluctuation trend: <Text style={styles.bold}>Stable</Text> with
          slight recharge in June
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#374151",
  },
  chart: {
    borderRadius: 12,
  },
  insight: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 6,
  },
  bold: {
    fontWeight: "700",
    color: "#111827",
  },
});
