import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView, // Added for better layout on some devices
} from "react-native";
// import * as Location from "expo-location"; // Commented out as we're hardcoding location
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const API_KEY="ABC";
// const API_KEY = "b5b84711ac2109d5da0b3329b81c62fe"; 

const screenWidth = Dimensions.get("window").width;

export default function Analytics() {
  const [weatherData, setWeatherData] = useState<any>(null);
  // Hardcoding Chennai location for the demo
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: 13.0827,
    lon: 80.2707,
  });
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>("Chennai, India"); // Hardcoding location name

  // Removed getUserLocation as location is hardcoded

  // Fetch weather forecast
  const fetchWeatherForecast = async () => {
    if (!location) return; // Should not happen with hardcoded location
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  // Removed fetchLocationName as location name is hardcoded

  useEffect(() => {
    // Only fetch weather data since location is already set
    if (location) {
      fetchWeatherForecast();
      // fetchLocationName(); // No longer needed
    }
  }, [location]);

  // Chart configuration for consistent styling
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#f5f5f5",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`, // Default blue
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  // Helper to create chart labels for dates
  const generateChartLabels = (dataList: any[], maxLabels = 8) => {
    return dataList.slice(0, maxLabels).map((item: any, index: number) => {
      const date = new Date(item.dt * 1000);
      if (index === 0 || index === maxLabels - 1 || index % 2 === 0) {
        // Show start, end, and some intermediate labels
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
      return "";
    });
  };

  // Prepare chart data for temperature with scrollable X-axis
  const tempChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list
      .slice(0, 8)
      .map((item: any) => item.main.temp);
    return {
      labels,
      datasets: [
        { data, color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})` },
      ], // Red for temperature
    };
  }, [weatherData]);

  // Prepare bar chart data for precipitation with scrollable X-axis
  const rainChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list
      .slice(0, 8)
      .map((item: any) => item.rain?.["3h"] || 0);
    return {
      labels,
      datasets: [
        { data, color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})` },
      ], // Blue for rain
    };
  }, [weatherData]);

  // Add humidityChartData if missing
  const humidityChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = weatherData.list
      .slice(0, 8)
      .map((item: any, index: number) =>
        index % 2 === 0
          ? new Date(item.dt * 1000).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })
          : ""
      );
    const data = weatherData.list
      .slice(0, 8)
      .map((item: any) => item.main.humidity);
    return {
      labels,
      datasets: [{ data }],
    };
  }, [weatherData]);

  // Prepare pie chart data for weather conditions
  const weatherPieData = useMemo(() => {
    if (!weatherData?.list) return [];
    const conditions = weatherData.list
      .slice(0, 8)
      .reduce((acc: { [key: string]: number }, item: any) => {
        const main = item.weather[0].main;
        acc[main] = (acc[main] || 0) + 1;
        return acc;
      }, {});
    return Object.keys(conditions).map((key, index) => ({
      name: key,
      population: conditions[key],
      color: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"][index % 4],
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    }));
  }, [weatherData]);

  // Enhanced insights for groundwater
  const weatherInsights = useMemo(() => {
    if (!weatherData?.list) return [];
    const rainEvents = weatherData.list.filter(
      (item: any) => item.weather[0].main === "Rain"
    );
    const avgTemp =
      weatherData.list
        .slice(0, 8)
        .reduce((sum: number, item: any) => sum + item.main.temp, 0) / 8;
    const avgHumidity =
      weatherData.list
        .slice(0, 8)
        .reduce((sum: number, item: any) => sum + item.main.humidity, 0) / 8;
    const insights = [];
    if (rainEvents.length > 0) {
      insights.push(
        `Rain expected (${rainEvents.length} events). Groundwater recharge likely, monitor for level increases.`
      );
    } else {
      insights.push(
        "No rain expected. Groundwater levels may decline; consider conservation."
      );
    }
    insights.push(
      `Average temperature: ${avgTemp.toFixed(
        1
      )}°C. High temps may increase evaporation, affecting groundwater.`
    );
    insights.push(
      `Average humidity: ${avgHumidity.toFixed(
        1
      )}%. Low humidity could lead to drier soil, impacting recharge.`
    );
    return insights;
  }, [weatherData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>
          Weather Analytics for Groundwater Monitoring
        </Text>
        {locationName && (
          <Text style={styles.locationText}>Location: {locationName}</Text>
        )}

        {/* Temperature Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Temperature Forecast</Text>
          {tempChartData && (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <LineChart
                data={tempChartData}
                width={Math.max(
                  screenWidth - 40,
                  tempChartData.labels.length * 60
                )} // Dynamic width for scroll
                height={220}
                yAxisSuffix="°C"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                }} // Specific color for temp
                style={styles.chart}
                bezier // Makes the line chart smooth
              />
            </ScrollView>
          )}
        </View>

        {/* Precipitation Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Precipitation Forecast</Text>
          {rainChartData && (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <BarChart
                data={rainChartData}
                width={Math.max(
                  screenWidth - 40,
                  rainChartData.labels.length * 60
                )} // Dynamic width for scroll
                height={220}
                yAxisLabel=""
                yAxisSuffix="mm"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                }} // Specific color for rain
                style={styles.chart}
                fromZero // Ensure bars start from zero
              />
            </ScrollView>
          )}
        </View>

        {/* Humidity Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Humidity Forecast</Text>
          {humidityChartData && (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <BarChart
                data={humidityChartData}
                width={Math.max(
                  screenWidth - 40,
                  humidityChartData.labels.length * 60
                )} // Dynamic width for scroll
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                }} // Specific color for humidity
                style={styles.chart}
                fromZero
              />
            </ScrollView>
          )}
        </View>

        {/* Weather Conditions Pie Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>
            Weather Conditions Distribution
          </Text>
          {weatherPieData.length > 0 && (
            <PieChart
              data={weatherPieData}
              width={screenWidth - 40} // Pie chart usually doesn't scroll horizontally
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute // Shows absolute values in legend
            />
          )}
        </View>

        {/* Groundwater Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>Groundwater Insights</Text>
          {weatherInsights.map((ins, idx) => (
            <View key={idx} style={styles.insightItem}>
              <Text style={styles.insightText}>{ins}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb", // Match container background
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  title: {
    fontSize: 26, // Slightly larger title
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#0A84FF",
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "#475569",
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000", // Add subtle shadow for depth
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20, // Slightly larger section titles
    fontWeight: "700", // Bolder
    marginBottom: 14, // More space
    color: "#1e293b",
    borderBottomWidth: 1, // Underline for section titles
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18, // Slightly more padding
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: 40, // Added spacing at the bottom
  },
  insightItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0A84FF",
  },
  insightText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  locationText: {
    fontSize: 16, // Larger for better visibility
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
    marginBottom: 20, // More spacing
  },
});
