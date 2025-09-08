import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const API_KEY = "b5b84711ac2109d5da0b3329b81c62fe";

const screenWidth = Dimensions.get("window").width;

export default function Analytics() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: 13.0827,
    lon: 80.2707,
  });
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>("Chennai, India");

  const fetchWeatherForecast = async () => {
    if (!location) return;
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchWeatherForecast();
    }
  }, [location]);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#f5f5f5",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  // MODIFIED: Helper to create chart labels for dates with time, using all data
  const generateChartLabels = (dataList: any[]) => {
    return dataList.map((item: any) => {
      const date = new Date(item.dt_txt); // Parse dt_txt directly
      // Example: "08 Sep 12:00"
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    });
  };

  // Prepare chart data for temperature with all data points
  const tempChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list.map((item: any) =>
      (item.main.temp - 273.15).toFixed(1)
    ); // Convert Kelvin to Celsius
    return {
      labels,
      datasets: [
        { data, color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})` },
      ],
    };
  }, [weatherData]);

  // Prepare bar chart data for precipitation with all data points
  const rainChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list.map((item: any) => item.rain?.["3h"] || 0);
    return {
      labels,
      datasets: [
        { data, color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})` },
      ],
    };
  }, [weatherData]);

  // Prepare bar chart data for humidity with all data points
  const humidityChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list.map((item: any) => item.main.humidity);
    return {
      labels,
      datasets: [{ data }],
    };
  }, [weatherData]);

  // MODIFIED: Prepare pie chart data for weather conditions using all data
  const weatherPieData = useMemo(() => {
    if (!weatherData?.list) return [];
    const conditions = weatherData.list.reduce(
      (acc: { [key: string]: number }, item: any) => {
        const main = item.weather[0].main;
        acc[main] = (acc[main] || 0) + 1;
        return acc;
      },
      {}
    );
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"]; // More colors for more conditions
    return Object.keys(conditions).map((key, index) => ({
      name: key,
      population: conditions[key],
      color: colors[index % colors.length], // Cycle through colors
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    }));
  }, [weatherData]);

  // Enhanced insights for groundwater (using all data for averages)
  const weatherInsights = useMemo(() => {
    if (!weatherData?.list) return [];
    const rainEvents = weatherData.list.filter(
      (item: any) => item.weather[0].main === "Rain"
    );
    const totalDataPoints = weatherData.list.length;
    const avgTemp =
      weatherData.list.reduce(
        (sum: number, item: any) => sum + (item.main.temp - 273.15),
        0
      ) / totalDataPoints; // Avg temp in Celsius
    const avgHumidity =
      weatherData.list.reduce(
        (sum: number, item: any) => sum + item.main.humidity,
        0
      ) / totalDataPoints;
    const insights = [];
    if (rainEvents.length > 0) {
      insights.push(
        `Rain expected over ${rainEvents.length} forecast periods. Groundwater recharge likely, monitor for level increases.`
      );
    } else {
      insights.push(
        "No significant rain expected in the forecast. Groundwater levels may decline; consider conservation strategies."
      );
    }
    insights.push(
      `Average temperature: ${avgTemp.toFixed(
        1
      )}°C. Consistently high temperatures can increase evaporation from surface water and soil, potentially affecting groundwater recharge.`
    );
    insights.push(
      `Average humidity: ${avgHumidity.toFixed(
        1
      )}%. Lower humidity can lead to drier soil conditions and increased plant transpiration, both of which can impact the rate of groundwater infiltration.`
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

  // Calculate dynamic width for scrollable charts
  const dynamicChartWidth = (labelsLength: number) =>
    Math.max(screenWidth, labelsLength * 90); // Increased factor for better spacing

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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={{ marginBottom: 8 }}
            >
              <LineChart
                data={tempChartData}
                width={dynamicChartWidth(tempChartData.labels.length)}
                height={220}
                yAxisSuffix="°C"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                }}
                style={styles.chart}
                bezier
              />
            </ScrollView>
          )}
        </View>

        {/* Precipitation Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Precipitation Forecast</Text>
          {rainChartData && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={{ marginBottom: 8 }}
            >
              <BarChart
                data={rainChartData}
                width={dynamicChartWidth(rainChartData.labels.length)}
                height={220}
                yAxisLabel=""
                yAxisSuffix="mm"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                }}
                style={styles.chart}
                fromZero
              />
            </ScrollView>
          )}
        </View>

        {/* Humidity Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Humidity Forecast</Text>
          {humidityChartData && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={{ marginBottom: 8 }}
            >
              <BarChart
                data={humidityChartData}
                width={dynamicChartWidth(humidityChartData.labels.length)}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                }}
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
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
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
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  title: {
    fontSize: 26,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
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
    marginBottom: 40,
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
    fontSize: 16,
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
  },
});