import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useTheme } from "@/hooks/useTheme";
import * as Location from "expo-location";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Added for Gemini AI
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Region } from "react-native-maps";

// Define a structured type for insights (no TS errors)
interface InsightItem {
  title: string;
  bullets: string[];
  action: string;
  category: "recharge" | "monitoring" | "conservation" | "risk";
}

// const API_KEY = "ABC";
const API_KEY = "b5b84711ac2109d5da0b3329b81c62fe";
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error(
    "Gemini API key not set. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file."
  );
}

// If you have typing issues with the SDK, keep model as any to avoid TS errors
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model: any = genAI
  ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  : null;

const screenWidth = Dimensions.get("window").width;

export default function Analytics() {
  const theme = useTheme();
  const { colors } = theme;
  const [weatherData, setWeatherData] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>(
    "Fetching location..."
  );
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [tempLoc, setTempLoc] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [userOverride, setUserOverride] = useState(false); // if user manually picked
  const regionRef = useRef<any>(null);

  const fetchCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to fetch weather data for your area."
        );
        setLocation({ lat: 13.0827, lon: 80.2707 }); // Fallback to Chennai
        setLocationName("Chennai, India (Default)");
        return;
      }

      let locationResult = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationResult.coords;
      setLocation({ lat: latitude, lon: longitude });

      // Reverse geocode to get location name
      let address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address.length > 0) {
        const { city, region, country } = address[0];
        setLocationName(`${city || region || "Unknown"}, ${country || ""}`);
      } else {
        setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert(
        "Error",
        "Failed to fetch your location. Using default location."
      );
      setLocation({ lat: 13.0827, lon: 80.2707 }); // Fallback
      setLocationName("Chennai, India (Default)");
    }
  };

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

  // Helper: parse JSON returned by Gemini (handles ```json fences)
  const parseInsightsJSON = (text: string): InsightItem[] => {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("JSON is not an array");
    // Coerce and validate minimally
    return parsed
      .map((it: any) => ({
        title: String(it.title ?? "Insight"),
        bullets: Array.isArray(it.bullets)
          ? it.bullets.map((b: any) => String(b))
          : [String(it.detail ?? it.description ?? "").trim()].filter(Boolean),
        action: String(it.action ?? "Review data for further analysis"),
        category: (
          ["recharge", "monitoring", "conservation", "risk"] as const
        ).includes(it.category)
          ? it.category
          : "monitoring",
      }))
      .slice(0, 4);
  };

  // Build a compact forecast to reduce tokens (keeps it readable for Gemini)
  const compactForecast = (list: any[]) => {
    return list.map((it: any) => ({
      dt: String(it.dt_txt),
      t: Number(((it.main?.temp ?? 0) - 273.15).toFixed(1)), // °C
      h: Number(it.main?.humidity ?? 0), // %
      r: Number((it.rain?.["3h"] ?? 0).toFixed(2)), // mm
      w: Number((it.wind?.speed ?? 0).toFixed(1)), // m/s
      c: String(it.weather?.[0]?.main ?? "NA"), // condition
    }));
  };

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async function generateWithRetry(
    prompt: string,
    maxRetries = 3
  ): Promise<string> {
    if (!model) return "";
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const resp = await result.response;
        return resp.text();
      } catch (err: any) {
        const msg = String(err?.message ?? "");
        const shouldRetry =
          msg.includes("503") ||
          /overloaded/i.test(msg) ||
          /quota|exhausted|rate|429/i.test(msg);
        if (attempt < maxRetries && shouldRetry) {
          const wait = Math.min(
            2000 * Math.pow(2, attempt) + Math.random() * 400,
            12000
          );
          await sleep(wait);
          attempt++;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Retries exhausted");
  }

  // Send the full 5-day forecast (compact) and improve resilience + parsing
  const generateGroundwaterInsights = async () => {
    if (!weatherData?.list || !model) return;
    setGeneratingInsights(true);
    try {
      const payload = {
        location: {
          name: locationName,
          lat: location?.lat,
          lon: location?.lon,
        },
        city: weatherData.city
          ? {
              name: weatherData.city.name,
              country: weatherData.city.country,
              timezone: weatherData.city.timezone,
            }
          : null,
        list: compactForecast(weatherData.list), // full 5-day list, compacted
      };
      const payloadJson = JSON.stringify(payload);

      const prompt = `
You are a groundwater domain expert. Analyze the 5-day forecast payload and produce concise, actionable insights for stakeholders.

Return ONLY valid JSON array with exactly 4 items, each:
{
  "title": "Short, specific title",
  "bullets": ["point 1", "point 2", "point 3"],
  "action": "One recommended action",
  "category": "recharge" | "monitoring" | "conservation" | "risk"
}

Data:
${payloadJson}
`;

      const text: string = await generateWithRetry(prompt, 3);

      try {
        const structured = parseInsightsJSON(text);
        setInsights(structured);
      } catch {
        // Fallback: turn paragraphs into readable bullets
        const fallbackBullets: string[] = text
          .split(/\r?\n+/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 12); // 3 bullets x 4 items

        const grouped: InsightItem[] = Array.from({ length: 4 }).map(
          (_, i) => ({
            title: `Insight ${i + 1}`,
            bullets: fallbackBullets.slice(i * 3, i * 3 + 3),
            action:
              "Prioritize targeted groundwater monitoring in the next 7 days.",
            category: "monitoring",
          })
        );
        setInsights(grouped);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights([
        {
          title: "Service temporarily unavailable",
          bullets: [
            "The insight service is currently overloaded (503).",
            "Your data was processed locally; try again shortly for AI insights.",
          ],
          action: "Tap refresh in a few minutes.",
          category: "monitoring",
        },
      ]);
    } finally {
      setGeneratingInsights(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherForecast();
    }
  }, [location]);

  useEffect(() => {
    if (weatherData) {
      generateGroundwaterInsights();
    }
  }, [weatherData]);

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.background,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
    labelColor: (opacity = 1) =>
      colors.text.includes("rgb")
        ? colors.text.replace("rgb", "rgba").replace(")", `, ${opacity})`)
        : `rgba(55, 65, 81, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  const generateChartLabels = (dataList: any[]) => {
    return dataList.map((item: any) => {
      const date = new Date(item.dt_txt);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    });
  };

  // Helper functions for recharge calculation
  const getSeason = (month: number): string => {
    if (month >= 5 && month <= 8) return "Monsoon";
    if (month >= 3 && month <= 5) return "Summer";
    if (month >= 11 || month <= 1) return "Winter";
    return "Post-monsoon";
  };

  // Calculate recharge rate based on weather parameters
  const calculateRechargeRate = (
    rainfall: number,
    temp: number,
    humidity: number,
    month: number
  ): number => {
    let baseRecharge = 0;

    // Rainfall contribution (primary factor)
    if (rainfall > 10) {
      baseRecharge += rainfall * 0.3; // 30% of rainfall contributes to recharge
    } else if (rainfall > 5) {
      baseRecharge += rainfall * 0.2; // 20% for moderate rain
    } else if (rainfall > 0) {
      baseRecharge += rainfall * 0.1; // 10% for light rain
    }

    // Temperature impact (high temp reduces recharge due to evaporation)
    if (temp > 35) {
      baseRecharge *= 0.6; // 40% reduction in hot weather
    } else if (temp > 25) {
      baseRecharge *= 0.8; // 20% reduction in warm weather
    }

    // Humidity impact (high humidity reduces evaporation)
    if (humidity > 80) {
      baseRecharge *= 1.1; // 10% increase in high humidity
    } else if (humidity < 40) {
      baseRecharge *= 0.9; // 10% decrease in low humidity
    }

    // Seasonal adjustment
    const seasonMultiplier =
      getSeason(month) === "Monsoon"
        ? 1.5
        : getSeason(month) === "Summer"
        ? 0.5
        : 1.0;
    baseRecharge *= seasonMultiplier;

    // Ensure realistic bounds (0-15 mm/day)
    return Math.max(0, Math.min(15, baseRecharge));
  };

  const tempChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list.map((item: any) =>
      (item.main.temp - 273.15).toFixed(1)
    );
    return {
      labels,
      datasets: [
        { data, color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})` },
      ],
    };
  }, [weatherData]);

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

  const humidityChartData = useMemo(() => {
    if (!weatherData?.list) return null;
    const labels = generateChartLabels(weatherData.list);
    const data = weatherData.list.map((item: any) => item.main.humidity);
    return {
      labels,
      datasets: [{ data }],
    };
  }, [weatherData]);

  // Recharge Estimation based on weather data
  const rechargeEstimationData = useMemo(() => {
    if (!weatherData?.list) return null;

    const rechargeData = weatherData.list.map((item: any, index: number) => {
      const rainfall = item.rain?.["3h"] || 0; // mm in 3 hours
      const temp = item.main.temp - 273.15; // Convert to Celsius
      const humidity = item.main.humidity || 0;
      const date = new Date(item.dt_txt);
      const month = date.getMonth();

      // Calculate recharge rate based on weather parameters
      let rechargeRate = calculateRechargeRate(rainfall, temp, humidity, month);
      return rechargeRate;
    });

    const labels = generateChartLabels(weatherData.list);
    return {
      labels,
      datasets: [
        {
          data: rechargeData,
          color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [weatherData]);

  // Calculate recharge statistics
  const rechargeStats = useMemo(() => {
    if (!rechargeEstimationData?.datasets?.[0]?.data) return null;

    const data = rechargeEstimationData.datasets[0].data as number[];
    const totalRecharge = data.reduce((sum, val) => sum + val, 0);
    const avgRecharge = totalRecharge / data.length;
    const maxRecharge = Math.max(...data);
    const minRecharge = Math.min(...data);

    // Count days with significant recharge (>2mm/day)
    const significantRechargeDays = data.filter((val) => val > 2).length;

    return {
      total: totalRecharge.toFixed(1),
      average: avgRecharge.toFixed(2),
      maximum: maxRecharge.toFixed(1),
      minimum: minRecharge.toFixed(1),
      significantDays: significantRechargeDays,
      totalDays: data.length,
    };
  }, [rechargeEstimationData]);

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
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
    ];
    return Object.keys(conditions).map((key, index) => ({
      name: key,
      population: conditions[key],
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    }));
  }, [weatherData]);

  const openPicker = () => {
    if (location) {
      setTempLoc({ ...location });
      regionRef.current = {
        latitude: location.lat,
        longitude: location.lon,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }
    setPickerVisible(true);
  };

  // ========== SEARCH (Nominatim) WITH DEBOUNCE ==========
  useEffect(() => {
    const q = searchQuery.trim();
    if (!pickerVisible || q.length < 3) {
      setSearchResults([]);
      return;
    }
    const h = setTimeout(async () => {
      try {
        setSearching(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=8`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en" },
        });
        const json = await res.json();
        setSearchResults(json || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(h);
  }, [searchQuery, pickerVisible]);

  // ========== HANDLE CONFIRM ==========
  const confirmLocation = async () => {
    if (tempLoc) {
      setPickerVisible(false);
      setUserOverride(true);
      setLoading(true);
      setWeatherData(null);

      // Optimistically set location name from search or coordinates
      if (searchQuery.trim().length >= 3) {
        setLocationName(searchQuery.split(",")[0]);
      } else {
        setLocationName(`${tempLoc.lat.toFixed(2)}, ${tempLoc.lon.toFixed(2)}`);
      }
      setLocation(tempLoc);

      // Optionally: refine with reverse geocode (does not block UI)
      try {
        const addr = await Location.reverseGeocodeAsync({
          latitude: tempLoc.lat,
          longitude: tempLoc.lon,
        });
        if (addr.length) {
          const { city, region, country } = addr[0];
          setLocationName(
            `${city || region || "Location"}, ${country || ""}`.trim()
          );
        }
      } catch {}
    } else {
      setPickerVisible(false);
    }
  };

  // If user has overridden, prevent auto-refresh resetting their choice
  useEffect(() => {
    if (userOverride) return;
    fetchCurrentLocation();
  }, []); // keep original effect logic but gated

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading weather data for {locationName}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicChartWidth = (labelsLength: number) =>
    Math.max(screenWidth, labelsLength * 90);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Weather Forecast and Analysis of Your Location
          </Text>
          <View style={{ gap: 6 }}>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                if (userOverride) setUserOverride(false);
                setLoading(true);
                fetchCurrentLocation();
              }}
            >
              <Text style={styles.refreshButtonText}>Use Device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.primary,
                },
              ]}
              onPress={openPicker}
            >
              <Text
                style={[styles.refreshButtonText, { color: colors.primary }]}
              >
                Change Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.locationText, { color: colors.textSecondary }]}>
          📍 Location: {locationName}
        </Text>

        {/* Temperature Chart */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, borderBottomColor: colors.border },
            ]}
          >
            <Ionicons
              name="thermometer-outline"
              size={18}
              color={colors.text}
            />{" "}
            Temperature Forecast
          </Text>
          {tempChartData && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
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
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, borderBottomColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="weather-rainy"
              size={18}
              color={colors.text}
            />{" "}
            Precipitation Forecast
          </Text>
          {rainChartData && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
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
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, borderBottomColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="water-percent"
              size={18}
              color={colors.text}
            />{" "}
            Humidity Forecast
          </Text>
          {humidityChartData && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
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

        {/* Recharge Estimation Chart */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, borderBottomColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="water-plus"
              size={18}
              color={colors.text}
            />{" "}
            Groundwater Recharge Estimation
          </Text>

          {/* Recharge Statistics Cards */}
          {rechargeStats && (
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {rechargeStats.total}mm
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Total Recharge (5-day)
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.statValue, { color: "#2F855A" }]}>
                  {rechargeStats.average}mm/day
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Average Daily
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.statValue, { color: "#3182CE" }]}>
                  {rechargeStats.significantDays}/{rechargeStats.totalDays}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  High Recharge Days
                </Text>
              </View>
            </View>
          )}

          {rechargeEstimationData && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
            >
              <LineChart
                data={rechargeEstimationData}
                width={dynamicChartWidth(rechargeEstimationData.labels.length)}
                height={220}
                yAxisLabel=""
                yAxisSuffix="mm"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                }}
                style={styles.chart}
                fromZero
                bezier
              />
            </ScrollView>
          )}

          {/* Recharge Explanation */}
          <View style={styles.explanationContainer}>
            <Text style={[styles.explanationTitle, { color: colors.text }]}>
              How Recharge is Calculated:
            </Text>
            <Text
              style={[styles.explanationText, { color: colors.textSecondary }]}
            >
              • Rainfall contribution: 10-30% of precipitation depending on
              intensity{"\n"}• Temperature impact: High temperatures ({">"}35°C)
              reduce recharge by 40%{"\n"}• Humidity effect: High humidity (
              {">"}80%) increases recharge by 10%{"\n"}• Seasonal adjustment:
              Monsoon season multiplier of 1.5x applied
            </Text>
          </View>
        </View>

        {/* Weather Conditions Pie Chart */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, borderBottomColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={18}
              color={colors.text}
            />{" "}
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

        {/* AI-Generated Groundwater Insights */}
        <View
          style={[
            styles.insightsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, borderBottomColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="brain"
              size={18}
              color={colors.text}
            />{" "}
            Smart Groundwater Insights
          </Text>

          {generatingInsights ? (
            <View style={styles.insightLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[styles.insightText, { color: colors.textSecondary }]}
              >
                Analyzing forecast for groundwater implications...
              </Text>
            </View>
          ) : (
            insights.map((ins, idx) => {
              const cat =
                ins.category === "risk"
                  ? { color: "#E53E3E", icon: "alert" }
                  : ins.category === "recharge"
                  ? { color: "#3182CE", icon: "water-plus" }
                  : ins.category === "conservation"
                  ? { color: "#2F855A", icon: "leaf" }
                  : { color: colors.primary, icon: "chart-line" }; // monitoring

              return (
                <View
                  key={idx}
                  style={[
                    styles.insightItem,
                    {
                      backgroundColor: colors.background,
                      borderLeftColor: cat.color,
                    },
                  ]}
                >
                  <View style={styles.insightHeader}>
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={20}
                      color={cat.color}
                      style={styles.insightIcon}
                    />
                    <Text style={[styles.insightTitle, { color: colors.text }]}>
                      {ins.title}
                    </Text>
                    <View style={[styles.badge, { borderColor: cat.color }]}>
                      <Text style={[styles.badgeText, { color: cat.color }]}>
                        {ins.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {ins.bullets.map((b, bi) => (
                    <View key={bi} style={styles.bulletRow}>
                      <View
                        style={[
                          styles.bulletDot,
                          { backgroundColor: cat.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.bulletText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {b}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.insightAction}>
                    <MaterialCommunityIcons
                      name="lightbulb-on-outline"
                      size={16}
                      color={cat.color}
                      style={styles.actionIcon}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {ins.action}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Location Picker Modal */}
        <Modal
          visible={pickerVisible}
          animationType="slide"
          onRequestClose={() => setPickerVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Select Location
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search place (min 3 chars)"
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.lat + item.lon}
                style={styles.resultsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultRow}
                    onPress={() => {
                      const lat = parseFloat(item.lat);
                      const lon = parseFloat(item.lon);
                      setTempLoc({ lat, lon });
                      setMapRegion({
                        latitude: lat,
                        longitude: lon,
                        latitudeDelta: 0.4,
                        longitudeDelta: 0.4,
                      });
                      setSearchResults([]);
                      setSearchQuery(item.display_name);
                    }}
                  >
                    <Ionicons
                      name="location"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      numberOfLines={2}
                      style={[styles.resultText, { color: colors.text }]}
                    >
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <View style={{ flex: 1 }}>
              {tempLoc && (
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={
                    regionRef.current || {
                      latitude: tempLoc.lat,
                      longitude: tempLoc.lon,
                      latitudeDelta: 0.5,
                      longitudeDelta: 0.5,
                    }
                  }
                  onRegionChangeComplete={(r) => {
                    regionRef.current = r;
                    setTempLoc({ lat: r.latitude, lon: r.longitude });
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: tempLoc.lat,
                      longitude: tempLoc.lon,
                    }}
                    title="Selected"
                  />
                </MapView>
              )}
            </View>

            <View style={styles.pickerFooter}>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={[styles.pickerBtnText, { color: colors.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.primary }]}
                onPress={confirmLocation}
                disabled={!tempLoc}
              >
                <Text style={[styles.pickerBtnText, { color: "#fff" }]}>
                  Use This
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
  insightsCard: {
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40,
  },
  insightItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  insightIcon: {
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bulletText: {
    fontSize: 14,
    color: "#333",
  },
  insightAction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#333",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#eef2f5",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  resultsList: {
    maxHeight: 160,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d3d9de",
  },
  resultText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  pickerFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 14,
  },
  explanationContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
