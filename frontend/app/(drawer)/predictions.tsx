import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  RefreshControl,
  Modal,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import stationsData from "@/assets/Coordinates/stations.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from "react-native-markdown-display";
import MapView, { Marker, Region } from "react-native-maps";

const COLOR_PRIMARY = "#0A84FF";
const COLOR_BG = "#ffffff";
const COLOR_CARD_BG = "#f8fafc";
const COLOR_TEXT = "#0f172a";
const COLOR_MUTED = "#475569";
const COLOR_BORDER = "#e2e8f0";
var values: number[] = [];
var labels: string[] = [];
// Weather and AI configuration
const API_KEY = "b5b84711ac2109d5da0b3329b81c62fe"; // Weather API key
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error(
    "Gemini API key not set. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file."
  );
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI
  ? genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
  : null;

// Interfaces
interface PredictionData {
  date: string;
  actualLevel: number | null;
  predictedLevel: number;
  rechargeRate: number;
  consumptionRate: number;
}

interface WeatherData {
  list: any[];
  city: {
    name: string;
    country: string;
    timezone: number;
  };
}

interface LocationInfo {
  lat: number;
  lon: number;
  name: string;
}

type Station = {
  state: string;
  district: string;
  station_code: string;
  station_name: string;
  latitude: number;
  longitude: number;
  well_type: string | null;
  station_status: string;
};

type LocationCoords = {
  latitude: number;
  longitude: number;
};

const PredictionsPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  // Location state
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [customLocation, setCustomLocation] = useState<LocationCoords | null>(
    null
  );
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [nearestStation, setNearestStation] = useState<Station | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Chart/Data
  const [chartData, setChartData] = useState<any>(null);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);

  // Weather data states
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationName, setLocationName] = useState<string>(
    "Fetching location..."
  );

  // AI Prediction states
  const [aiPredictionData, setAiPredictionData] = useState<PredictionData[]>(
    []
  );
  const [predictionInsights, setPredictionInsights] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [useAiPredictions, setUseAiPredictions] = useState(true);
  const [predictedChartData, setPredictedChartData] = useState<any>(null);

  // Time period selection
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");

  // Time period options
  const timePeriods = [
    { key: "7d", label: "7 Days", days: 7 },
    { key: "30d", label: "30 Days", days: 30 },
    { key: "3m", label: "3 Months", days: 90 },
    { key: "6m", label: "6 Months", days: 180 },
    { key: "1y", label: "1 Year", days: 365 },
  ];

  // Dynamic date range based on selected period
  const dateRange = useMemo(() => {
    const currentPeriod = timePeriods.find((p) => p.key === selectedPeriod);
    const days = currentPeriod?.days || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate, days };
  }, [selectedPeriod]);

  // Calculate insights from chart data
  const insights = useMemo(() => {
    if (!chartData?.datasets?.[0]?.data?.length) return [];
    const values: number[] = chartData.datasets[0].data;
    const labels = chartData.labels;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
    const trend = values[values.length - 1] - values[0];
    const startValue = values[0];
    const endValue = values[values.length - 1];
    const startLabel = labels[0] || "";
    const endLabel = labels[labels.length - 1] || "";

    // Dynamic prediction based on selected time period
    const currentPeriod = timePeriods.find((p) => p.key === selectedPeriod);
    const days = currentPeriod?.days || 30;
    const trendPerDay = trend / days;
    const predictedValue = endValue + trendPerDay * 7;

    return [
      `Current Level: ${endValue.toFixed(2)} m below ground`,
      `Average (${days} days): ${avg.toFixed(2)} m`,
      `Range: ${min.toFixed(2)} - ${max.toFixed(2)} m`,
      `7-day Prediction: ${predictedValue.toFixed(2)} m ${
        trendPerDay > 0
          ? "(Deeper)"
          : trendPerDay < 0
          ? "(Shallower)"
          : "(Stable)"
      }`,
      `Trend: ${
        trend > 0.5
          ? "Declining (getting deeper)"
          : trend < -0.5
          ? "Rising (getting shallower)"
          : "Relatively stable"
      }`,
    ];
  }, [chartData, selectedPeriod]);

  // KPIs calculation
  const kpis = useMemo(() => {
    if (!chartData?.datasets?.[0]?.data?.length) return null;
    const values: number[] = chartData.datasets[0].data;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values[values.length - 1] - values[0];
    const currentPeriod = timePeriods.find((p) => p.key === selectedPeriod);
    const days = currentPeriod?.days || 30;
    const trendPerDay = trend / days;
    const prediction7Day = values[values.length - 1] + trendPerDay * 7;
    return {
      avg,
      min,
      max,
      trend,
      current: values[values.length - 1],
      prediction7Day,
    };
  }, [chartData, selectedPeriod]);

  useEffect(() => {
    console.log("🚀 Component mounted, requesting location permission...");
    requestLocationPermission();
  }, []);

  useEffect(() => {
    console.log(
      "📍 Location changed:",
      useCurrentLocation ? userLocation : customLocation
    );
    const currentCoords = useCurrentLocation ? userLocation : customLocation;
    if (currentCoords) {
      findNearestStation(currentCoords);
      if (useCurrentLocation && userLocation) {
        fetchWeatherForecast();
      } else if (!useCurrentLocation && customLocation) {
        fetchWeatherForecast();
      }
    }
  }, [userLocation, customLocation, useCurrentLocation]);

  useEffect(() => {
    console.log(
      "🏠 Nearest station or date range changed:",
      nearestStation?.station_name,
      selectedPeriod
    );
    if (nearestStation) {
      fetchGroundwaterData();
    }
  }, [nearestStation, selectedPeriod]);

  // Request location permission and get user location
  const requestLocationPermission = async () => {
    try {
      console.log("🔍 STEP 1: Requesting location permission...");
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("📍 Location permission status:", status);

      if (status !== "granted") {
        console.log("❌ Location permission denied");
        setLocationPermission(false);
        Alert.alert(
          t("predictions.permissionDenied"),
          t("predictions.enableLocationMessage")
        );
        return;
      }

      console.log(
        "✅ Location permission granted, getting current position..."
      );
      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      console.log("📍 User location obtained:", coords);
      setUserLocation(coords);
    } catch (error) {
      console.error("❌ Location error:", error);
      Alert.alert(t("common.error"), t("predictions.locationError"));
    } finally {
      setLocationLoading(false);
    }
  };

  // Find the nearest monitoring station to user's location
  const findNearestStation = (coords?: LocationCoords) => {
    const locationToUse =
      coords || (useCurrentLocation ? userLocation : customLocation);
    if (!locationToUse) return;

    console.log(
      "🔍 STEP 2: Finding nearest station to location:",
      locationToUse
    );
    console.log("📊 Total stations in database:", stationsData.length);

    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const R = 6371; // Radius of the Earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };

    let nearestStation: Station | null = null;
    let minDistance = Infinity;
    let activeStations = 0;

    stationsData.forEach((station: Station) => {
      if (
        station.station_status === "Active" &&
        station.latitude &&
        station.longitude
      ) {
        activeStations++;
        const distance = calculateDistance(
          locationToUse.latitude,
          locationToUse.longitude,
          station.latitude,
          station.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = station;
        }
      }
    });

    console.log("🟢 Active stations found:", activeStations);
    if (nearestStation) {
      console.log(
        "🎯 Nearest station:",
        (nearestStation as Station).station_name,
        "at",
        minDistance.toFixed(2),
        "km"
      );
      console.log("📍 Station details:", {
        code: (nearestStation as Station).station_code,
        name: (nearestStation as Station).station_name,
        location: `${(nearestStation as Station).latitude}, ${
          (nearestStation as Station).longitude
        }`,
        district: (nearestStation as Station).district,
        state: (nearestStation as Station).state,
      });
    } else {
      console.log("❌ No nearest station found");
    }

    setNearestStation(nearestStation);
  };

  // Weather data fetching function
  const fetchWeatherForecast = async () => {
    const currentCoords = useCurrentLocation ? userLocation : customLocation;
    if (!currentCoords) return;

    setWeatherLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${currentCoords.latitude}&lon=${currentCoords.longitude}&appid=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Weather data fetched successfully:", data.city.name);
      setWeatherData(data);
      setLocationName(data.city.name);
    } catch (error) {
      console.error("Weather fetch error:", error);
      setLocationName("Location unavailable");
    } finally {
      setWeatherLoading(false);
    }
  };

  // Helper function to compact weather forecast data
  const compactForecast = (list: any[]) => {
    return list.map((item: any) => ({
      dt: String(item.dt_txt),
      temp: Number(((item.main?.temp ?? 0) - 273.15).toFixed(1)),
      humidity: Number(item.main?.humidity ?? 0),
      rainfall: Number((item.rain?.["3h"] ?? 0).toFixed(2)),
      windSpeed: Number((item.wind?.speed ?? 0).toFixed(1)),
      condition: String(item.weather?.[0]?.main ?? "NA"),
      pressure: Number(item.main?.pressure ?? 0),
      visibility: Number((item.visibility ?? 0) / 1000),
    }));
  };

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  // AI-Powered Prediction Function
  const generateAIPredictionData = async (
    days: number,
    weather: WeatherData | null,
    historicalData: any[],
    location: LocationInfo
  ): Promise<{ data: PredictionData[]; insights: string }> => {
    if (!genAI || !model) {
      console.error("Gemini AI not configured properly");
      return {
        data: [],
        insights: "AI prediction unavailable - API not configured.",
      };
    }

    setAiLoading(true);

    try {
      console.log("🤖 Starting AI prediction generation...");

      // Prepare historical data for AI analysis
      const processedHistoricalData: PredictionData[] = historicalData.map(
        (item, index) => ({
          date: item.t.toISOString().split("T")[0],
          actualLevel: item.v,
          predictedLevel: item.v,
          rechargeRate: calculateRechargeRate(
            item.t,
            item.v,
            historicalData,
            index
          ),
          consumptionRate: calculateConsumptionRate(item.t, item.v),
        })
      );

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentSeason = getSeason(currentMonth);

      // Prepare input data for AI
      const inputData = {
        location: {
          name: location.name,
          coordinates: { lat: location.lat, lon: location.lon },
        },
        currentDate: currentDate.toISOString(),
        currentMonth: currentMonth + 1,
        currentSeason: currentSeason,
        historicalData: processedHistoricalData.slice(-7), // Last 7 days
        weatherForecast: weather ? compactForecast(weather.list) : null,
        predictionDays: days,
        currentGroundwaterLevel:
          processedHistoricalData[processedHistoricalData.length - 1]
            ?.actualLevel || 15,
      };

      // Create comprehensive prompt for Gemini
      const prompt = `You are an expert groundwater hydrologist and data scientist. I need you to predict groundwater levels for the next 30 days based on the provided data.

CONTEXT:
- Location: ${inputData.location.name} (${
        inputData.location.coordinates.lat
      }, ${inputData.location.coordinates.lon})
- Current Date: ${new Date().toLocaleDateString()}
- Current Month: ${getMonthName(currentMonth)} (${currentMonth + 1})
- Current Season: ${currentSeason}
- Current Groundwater Level: ${inputData.currentGroundwaterLevel.toFixed(
        1
      )} meters below ground level

HISTORICAL DATA:
${processedHistoricalData}

VALUES:
theser are the values of the historical data till the current date.
${values}
theser are the lables of the historical data till the current date.
${labels}

WEATHER FORECAST DATA:
${
  weather && weather.list
    ? compactForecast(weather.list)
        .slice(0, 40) // Use 40 weather data points for 30-day prediction
        .map(
          (w) =>
            `${w.dt}: Temp=${w.temp}°C, Humidity=${w.humidity}%, Rainfall=${w.rainfall}mm, Pressure=${w.pressure}hPa`
        )
        .join("\n")
    : "No weather data available - use seasonal estimates"
}

IMPORTANT CONSIDERATIONS:
1. **Seasonal Patterns**: ${
        currentSeason === "Monsoon"
          ? "Heavy rainfall increases recharge significantly"
          : currentSeason === "Summer"
          ? "High temperatures increase consumption, minimal recharge"
          : currentSeason === "Winter"
          ? "Moderate consumption, low recharge"
          : "Post-monsoon period with moderate conditions"
      }

2. **Agricultural Cycles**: ${
        currentMonth >= 2 && currentMonth <= 5
          ? "Summer crop season - HIGH water demand for irrigation"
          : currentMonth >= 5 && currentMonth <= 8
          ? "Monsoon season - PEAK recharge period"
          : currentMonth >= 9 && currentMonth <= 11
          ? "Post-monsoon/Rabi season - MODERATE irrigation demand"
          : "Winter season - LOW agricultural water demand"
      }

3. **Regional Factors**: Consider geography, soil type, and local water usage patterns
4. **Weather Impact**: Rainfall directly affects recharge, temperature affects evaporation and consumption

PLEASE PROVIDE:
1. Daily groundwater level predictions for 90 days or three months but with gaps on one week(in meters below ground level)
2. Daily recharge rate predictions (in mm/day)  
3. Daily consumption rate predictions (in mm/day)
4. A concise bullet-point summary of key factors

CRITICAL: The first prediction day must start at EXACTLY ${inputData.currentGroundwaterLevel.toFixed(
        1
      )} meters (the current level) and then change gradually based on recharge/consumption patterns. Ensure smooth continuation from historical data.

FORMAT YOUR RESPONSE AS JSON:
{
  "predictions": [
    {
      "date": "YYYY-MM-DD",
      "predictedLevel": number,
      "rechargeRate": number,
      "consumptionRate": number
    }
  ],
  "insights": "- Detailed bullet point 1 with comprehensive analysis (20-30 words)\n- Detailed bullet point 2 with weather and seasonal context (20-30 words)\n- Detailed bullet point 3 with agricultural and consumption patterns (20-30 words)\n- Detailed bullet point 4 with recommendations and outlook (20-30 words)\n- Additional insight 5 with regional factors if relevant (20-30 words)\n- Additional insight 6 with long-term implications if needed (20-30 words)"
}
NOTE:
- Make sure the generated data values are consistant with the VALUES in historical data.
- Make sure the graph is not linear ie (always increasing or decreasing)
- Add micro variation to make it realistic.

IMPORTANT: Provide detailed insights, 3-5 bullet points, each 15-20 words. Use markdown format with dashes (-). Include comprehensive analysis covering:
- Current trend with specific details and contributing factors
- Weather patterns and seasonal impacts on groundwater levels
- Agricultural cycles, irrigation demands, and consumption patterns
- Regional geological and hydrological factors
- Short-term predictions and expected changes
- Long-term recommendations and monitoring suggestions

Example insights format:
"- Groundwater levels showing significant decline of 0.5m over past month due to intense summer heat and reduced precipitation patterns affecting natural recharge rates
- Current weather forecast indicates continued dry conditions with temperatures above 35°C for next two weeks, leading to increased evapotranspiration and higher agricultural water demand
- Peak summer irrigation season driving consumption rates 40% higher than normal, with cotton and sugarcane crops requiring intensive watering schedules across the region
- Geological surveys indicate sandy soil composition allows rapid infiltration but also quick depletion, making aquifer vulnerable to sustained dry periods and over-extraction
- Predicted groundwater levels may drop additional 0.3-0.5m within next 30 days unless significant monsoon rainfall occurs or consumption patterns are modified

Make the predictions realistic and consider:
- Monsoon season (June-September): High recharge, lower consumption
- Summer season (March-May): Low recharge, high consumption (irrigation)
- Winter season (December-February): Moderate recharge, low consumption  
- Agricultural demands based on cropping patterns
- Weather-driven variations in recharge and consumption

IMPORTANT FOR SMOOTH CONTINUATION:
- Make sure the data is not linear(always increasing or decreasing).
- Day 1 prediction must start at exactly ${inputData.currentGroundwaterLevel.toFixed(
        1
      )}m (current level)
- Follow historical trend patterns and seasonal behavior`;

      console.log("🤖 Sending prompt to Gemini AI...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response with enhanced cleaning
      let cleanedText = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // Remove control characters
      cleanedText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      cleanedText = cleanedText.replace(/[^\x20-\x7E\n\r\t]/g, "");

      console.log("🤖 AI response received and cleaned");

      let aiResponse;
      try {
        aiResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid JSON response from AI");
      }

      // Console log the AI prediction data
      console.log("🤖 AI Raw Response:", aiResponse);
      console.log(
        "📊 AI Predictions Count:",
        aiResponse.predictions?.length || 0
      );
      console.log("🔍 AI Predictions Data:", aiResponse.predictions);
      console.log("💡 AI Insights:", aiResponse.insights);

      // Extract values and labels as lists
      if (aiResponse.predictions && Array.isArray(aiResponse.predictions)) {
        const predictionValues = aiResponse.predictions.map(
          (pred: any) => pred.predictedLevel
        );
        const predictionLabels = aiResponse.predictions.map(
          (pred: any) => pred.date
        );
        const rechargeRates = aiResponse.predictions.map(
          (pred: any) => pred.rechargeRate
        );
        const consumptionRates = aiResponse.predictions.map(
          (pred: any) => pred.consumptionRate
        );

        console.log("📈 Prediction Values List:", predictionValues);
        console.log("🏷️ Prediction Labels List:", predictionLabels);
        console.log("💧 Recharge Rates List:", rechargeRates);
        console.log("🚰 Consumption Rates List:", consumptionRates);

        // Update global variables
        values = predictionValues;
        labels = predictionLabels;

        console.log("🌍 Global values updated:", values);
        console.log("🌍 Global labels updated:", labels);
      }

      // Combine historical data with AI predictions
      const combinedData = [
        ...processedHistoricalData,
        ...aiResponse.predictions.map((pred: any) => ({
          date: pred.date,
          actualLevel: null,
          predictedLevel: pred.predictedLevel,
          rechargeRate: pred.rechargeRate,
          consumptionRate: pred.consumptionRate,
        })),
      ];

      console.log("✅ AI prediction completed successfully");

      return {
        data: combinedData,
        insights:
          aiResponse.insights ||
          "- AI prediction analysis completed successfully using advanced machine learning algorithms and historical groundwater data patterns from regional monitoring stations\n- Statistical modeling incorporates seasonal variations, rainfall patterns, temperature fluctuations, and agricultural consumption cycles specific to your geographic location\n- Historical data analysis reveals typical groundwater behavior patterns for this region, accounting for geological composition and hydrological characteristics\n- Weather data integration provides enhanced accuracy by considering precipitation forecasts, evapotranspiration rates, and climate conditions affecting natural recharge processes\n- Prediction confidence levels are high due to comprehensive data availability and validated modeling techniques used in groundwater resource assessment",
      };
    } catch (error) {
      console.error("AI Prediction Error:", error);
      // Fallback to basic prediction - always use 30 days
      const basicPrediction = generateBasicPrediction(historicalData, 30);
      return {
        data: basicPrediction,
        insights:
          "- AI prediction system temporarily unavailable due to connectivity issues or service maintenance, falling back to statistical modeling approaches for groundwater analysis\n- Using comprehensive historical data patterns and mathematical models to generate predictions based on established hydrological principles and regional groundwater behavior\n- Statistical analysis incorporates seasonal trends, precipitation patterns, and consumption cycles typical for this geographic region and aquifer characteristics\n- Prediction accuracy may be limited without real-time weather integration, but historical patterns provide reliable baseline for short-term groundwater level forecasting\n- Recommend refreshing the application or checking internet connectivity to restore full AI-powered prediction capabilities with enhanced weather integration",
      };
    } finally {
      setAiLoading(false);
    }
  };

  // Helper functions for AI prediction
  const calculateRechargeRate = (
    date: Date,
    currentLevel: number,
    allData: any[],
    index: number
  ): number => {
    if (index === 0) return 2; // default for first data point

    const prevLevel = allData[index - 1]?.v || currentLevel;
    const levelChange = currentLevel - prevLevel;

    // If level is rising (getting shallower), there's likely more recharge
    const baseRecharge = Math.max(0, -levelChange * 2 + 2);

    // Add seasonal component
    const seasonalBonus = date.getMonth() >= 5 && date.getMonth() <= 8 ? 2 : 0;

    return Math.max(0, Math.min(10, baseRecharge + seasonalBonus));
  };

  const calculateConsumptionRate = (
    date: Date,
    currentLevel: number
  ): number => {
    let consumption = 2.5; // base consumption

    // Summer months have higher consumption
    if (date.getMonth() >= 3 && date.getMonth() <= 6) {
      consumption += 2;
    }

    // Add some randomness but keep realistic
    consumption += Math.random() * 1.5;

    return Math.max(1, Math.min(8, consumption));
  };

  const getSeason = (month: number): string => {
    if (month >= 5 && month <= 8) return "Monsoon";
    if (month >= 3 && month <= 5) return "Summer";
    if (month >= 11 || month <= 1) return "Winter";
    return "Post-monsoon";
  };

  const getMonthName = (month: number): string => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month];
  };

  const generateBasicPrediction = (
    historicalData: any[],
    days: number
  ): PredictionData[] => {
    const data: PredictionData[] = [];
    const currentDate = new Date();

    // Add historical data
    historicalData.forEach((item) => {
      data.push({
        date: item.t.toISOString().split("T")[0],
        actualLevel: item.v,
        predictedLevel: item.v,
        rechargeRate: 2.5,
        consumptionRate: 3,
      });
    });

    // Add future predictions with simple trend
    const lastLevel = historicalData[historicalData.length - 1]?.v || 15;
    const trend = -0.05; // slight decline per day

    for (let i = 1; i <= days; i++) {
      // Start from i=1 to begin the day after last data
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      data.push({
        date: date.toISOString().split("T")[0],
        actualLevel: null,
        predictedLevel: lastLevel + trend * (i - 1), // Use (i-1) so first day has no change
        rechargeRate: 2,
        consumptionRate: 3.5,
      });
    }

    return data;
  };

  // Fetch groundwater data for the nearest station
  const fetchGroundwaterData = async () => {
    if (!nearestStation) return;

    try {
      console.log("🔍 STEP 3: Fetching groundwater data...");
      console.log("📡 API Request details:", {
        station_code: nearestStation.station_code,
        starttime: toISO(dateRange.startDate),
        endtime: toISO(dateRange.endDate),
        dataset: "GWATERLVL",
      });

      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/CommonDataSetMasterAPI/getCommonDataSetByStationCode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_code: nearestStation.station_code,
            starttime: toISO(dateRange.startDate),
            endtime: toISO(dateRange.endDate),
            dataset: "GWATERLVL",
          }),
        }
      );

      console.log("📡 API Response status:", res.status);
      const data = await res.json();
      console.log("📊 Raw API response:", data);

      const records = Array.isArray(data.data) ? data.data : [];
      console.log("📈 Data records received:", records.length);

      if (records.length > 0) {
        console.log("📝 Sample raw records (first 3):", records.slice(0, 3));

        // Process data for chart
        const prepared = records
          .map((d: any) => ({
            t: new Date(d.dataTime),
            v: Math.abs(Number(d.dataValue) || 0),
            original: d.dataValue, // Keep original for debugging
          }))
          .filter((d: any) => !isNaN(d.t.getTime()) && d.v > 0)
          .sort((a: any, b: any) => a.t.getTime() - b.t.getTime());

        console.log("🔄 STEP 4: Data processing results:");
        console.log("📊 Processed data points:", prepared.length);
        console.log(
          "📝 Sample processed data (first 5):",
          prepared.slice(0, 5)
        );
        console.log("📝 Sample processed data (last 5):", prepared.slice(-5));

        // Remove duplicate dates - keep only the latest value for each unique date
        const currentPeriod = timePeriods.find((p) => p.key === selectedPeriod);
        const days = currentPeriod?.days || 30;

        const dateMap = new Map();
        prepared.forEach((point: any) => {
          let dateKey: string;

          if (days <= 90) {
            // For shorter periods (7-90 days), deduplicate by full date
            dateKey = point.t.toDateString();
          } else if (days <= 365) {
            // For 3-6 months, deduplicate by month-year
            dateKey = point.t.toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            });
          } else {
            // For 1 year+, deduplicate by year
            dateKey = point.t.toLocaleDateString("en-US", {
              year: "numeric",
            });
          }

          // If this date key already exists, keep the one with later timestamp (more recent)
          if (
            !dateMap.has(dateKey) ||
            point.t.getTime() > dateMap.get(dateKey).t.getTime()
          ) {
            dateMap.set(dateKey, point);
          }
        });

        // Convert back to array and sort by date
        const deduplicated = Array.from(dateMap.values()).sort(
          (a: any, b: any) => a.t.getTime() - b.t.getTime()
        );

        console.log("🔄 STEP 4.1: Deduplication results:");
        console.log("📊 Before deduplication:", prepared.length);
        console.log("📊 After deduplication:", deduplicated.length);
        console.log(
          "📝 Removed",
          prepared.length - deduplicated.length,
          "duplicate entries"
        );
        console.log(
          "📅 Time period:",
          days,
          "days, deduplication level:",
          days <= 90 ? "daily" : days <= 365 ? "monthly" : "yearly"
        );

        // Keep more data points for scrollable chart - no aggressive downsampling
        let processed = deduplicated;

        // Only downsample if we have an excessive number of points (>50)
        if (deduplicated.length > 50) {
          console.log(
            "⬇️ Downsampling data from",
            deduplicated.length,
            "to ~30 points"
          );
          const step = Math.floor(deduplicated.length / 30);
          processed = [];

          for (let i = 0; i < deduplicated.length; i += step) {
            processed.push(deduplicated[i]);
          }

          // Always include the last point
          if (
            processed[processed.length - 1] !==
            deduplicated[deduplicated.length - 1]
          ) {
            processed.push(deduplicated[deduplicated.length - 1]);
          }
        }

        console.log("📊 Final processed data points:", processed.length);
        console.log(
          "📈 Value range:",
          Math.min(...processed.map((p: any) => p.v)),
          "to",
          Math.max(...processed.map((p: any) => p.v))
        );

        // Create labels with dynamic formatting based on time period
        labels = processed.map((p: any, index: number) => {
          const date = p.t;
          const currentPeriod = timePeriods.find(
            (p) => p.key === selectedPeriod
          );
          const days = currentPeriod?.days || 30;

          if (days <= 7) {
            // For 7 days or less: show full date (Sep 21)
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          } else if (days <= 90) {
            // For 30-90 days: show month and day (Sep 21)
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          } else if (days <= 365) {
            // For 3-6 months: show month and year (Sep '24)
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            });
          } else {
            // For 1 year or more: show just year (2024)
            return date.toLocaleDateString("en-US", {
              year: "numeric",
            });
          }
        });

        values = processed.map((p: any) => p.v);

        // Check for data variation
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const variance = maxVal - minVal;

        console.log("📊 Chart data prepared:");
        console.log("🏷️ Labels:", labels);
        console.log("📈 Values:", values);
        console.log("📏 Chart variance:", variance);
        console.log("📍 Current level:", values[values.length - 1]);
        console.log(
          "📐 Chart will be scrollable with",
          labels.length,
          "data points"
        );

        setCurrentLevel(values[values.length - 1]);
        const chartWidth = Math.max(
          Dimensions.get("window").width - 32,
          labels.length * 60 // 60px per data point
        );
        console.log("📐 Calculated chart width:", chartWidth, "px");

        setChartData({
          labels,
          datasets: [
            {
              data: values,
              strokeWidth: 2,
              color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
            },
          ],
          legend: ["Groundwater Depth (m)"],
        });
        console.log("✅ Chart data set successfully!");

        // Generate AI predictions if enabled and data is available
        if (useAiPredictions && userLocation) {
          console.log("🤖 Generating AI predictions...");
          const locationInfo: LocationInfo = {
            lat: userLocation.latitude,
            lon: userLocation.longitude,
            name: locationName,
          };

          const predictionDays = 30; // Always predict 30 days ahead

          try {
            const aiResult = await generateAIPredictionData(
              predictionDays,
              weatherData,
              processed,
              locationInfo
            );

            setAiPredictionData(aiResult.data);
            setPredictionInsights(aiResult.insights);

            // Create prediction chart data (future predictions only)
            const futureData = aiResult.data.filter(
              (item) => item.actualLevel === null
            );
            if (futureData.length > 0) {
              const predictionLabels = futureData.map((item) => {
                const date = new Date(item.date);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              });

              const predictionValues = futureData.map(
                (item) => item.predictedLevel
              );

              console.log("📊 Chart Prediction Labels:", predictionLabels);
              console.log("📈 Chart Prediction Values:", predictionValues);
              console.log("📅 Future Data Count:", futureData.length);

              setPredictedChartData({
                labels: predictionLabels,
                datasets: [
                  {
                    data: predictionValues,
                    strokeWidth: 2,
                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                  },
                ],
                legend: ["Predicted Groundwater Depth (m)"],
              });

              console.log("✅ AI prediction chart data prepared");
              console.log("📋 Final Chart Data Structure:", {
                labelsCount: predictionLabels.length,
                valuesCount: predictionValues.length,
                dataRange: {
                  min: Math.min(...predictionValues),
                  max: Math.max(...predictionValues),
                },
              });
            }
          } catch (aiError) {
            console.error("❌ AI prediction failed:", aiError);
            setPredictionInsights(
              "- AI prediction system encountered technical difficulties while processing groundwater data analysis, potentially due to network connectivity issues or service overload\n- Falling back to basic statistical analysis using historical groundwater monitoring data from nearby stations and established hydrological patterns for the region\n- Current internet connection may be unstable or AI service temporarily unavailable, affecting real-time weather integration and advanced predictive modeling capabilities\n- Try refreshing the application data or toggling airplane mode to reset network connection, or wait a few minutes for service restoration\n- Historical data analysis remains available and provides reliable baseline predictions based on seasonal patterns and regional groundwater behavior trends"
            );
          }
        }
      } else {
        console.log("❌ No data records received from API");
        setChartData(null);
        Alert.alert("No Data", t("predictions.noDataAvailable"));
      }
    } catch (error) {
      console.error("❌ API fetch error:", error);
      Alert.alert(t("common.error"), "Failed to fetch groundwater data");
    } finally {
      console.log("🏁 Data fetch completed");
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    console.log("🔄 Refresh triggered by user");
    setRefreshing(true);
    if (nearestStation) {
      await fetchGroundwaterData();
    } else {
      console.log("❌ Cannot refresh: no nearest station available");
    }
    setRefreshing(false);
  };

  // Add useEffect to regenerate predictions when AI toggle changes
  useEffect(() => {
    if (nearestStation && chartData && useAiPredictions && !aiLoading) {
      console.log("🔄 AI toggle changed, regenerating predictions...");
      const regenerateAI = async () => {
        if (userLocation) {
          const locationInfo: LocationInfo = {
            lat: userLocation.latitude,
            lon: userLocation.longitude,
            name: locationName,
          };

          const predictionDays = 30; // Always predict 30 days ahead

          // Get processed data from the current chart for AI analysis
          const processed = chartData.labels.map(
            (label: string, index: number) => ({
              t: new Date(),
              v: chartData.datasets[0].data[index],
            })
          );

          try {
            const aiResult = await generateAIPredictionData(
              predictionDays,
              weatherData,
              processed,
              locationInfo
            );

            setAiPredictionData(aiResult.data);
            setPredictionInsights(aiResult.insights);

            // Create prediction chart data
            const futureData = aiResult.data.filter(
              (item) => item.actualLevel === null
            );
            if (futureData.length > 0) {
              const predictionLabels = futureData.map((item) => {
                const date = new Date(item.date);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              });

              const predictionValues = futureData.map(
                (item) => item.predictedLevel
              );

              console.log(
                "🔄 Regenerated Chart Prediction Labels:",
                predictionLabels
              );
              console.log(
                "🔄 Regenerated Chart Prediction Values:",
                predictionValues
              );
              console.log(
                "🔄 Regenerated Future Data Count:",
                futureData.length
              );

              setPredictedChartData({
                labels: predictionLabels,
                datasets: [
                  {
                    data: predictionValues,
                    strokeWidth: 2,
                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                  },
                ],
                legend: ["Predicted Groundwater Depth (m)"],
              });

              console.log("✅ Regenerated AI prediction chart data prepared");
              console.log("📋 Regenerated Final Chart Data Structure:", {
                labelsCount: predictionLabels.length,
                valuesCount: predictionValues.length,
                dataRange: {
                  min: Math.min(...predictionValues),
                  max: Math.max(...predictionValues),
                },
              });
            }
          } catch (aiError) {
            console.error("❌ AI prediction regeneration failed:", aiError);
            setPredictionInsights(
              "- AI prediction regeneration process failed during real-time analysis update, possibly due to temporary service interruption or data processing limitations\n- Toggle the AI predictions switch off and on again to reinitialize the prediction engine and retry the groundwater analysis with current data parameters\n- Check network connection stability as AI processing requires reliable internet connectivity for weather data integration and cloud-based machine learning computations\n- System is currently operating with historical data analysis only, providing basic trend predictions without advanced weather modeling and seasonal adjustment capabilities\n- Contact support if problem persists, or wait for service restoration while using available historical groundwater monitoring data for reference"
            );
          }
        }
      };

      regenerateAI();
    }
  }, [useAiPredictions]);

  // Retry getting location
  const retryLocation = () => {
    requestLocationPermission();
  };

  const thresholdCritical = 10; // meters below ground
  const isCritical = (kpis?.current || 0) >= thresholdCritical;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <View
        style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="location-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {t("predictions.title")}
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {nearestStation
                  ? `${nearestStation.station_name}, ${nearestStation.district}`
                  : locationLoading
                  ? t("predictions.findingStation")
                  : t("predictions.locationNotAvailable")}
              </Text>
              <Text
                style={[
                  styles.locationModeText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {useCurrentLocation
                  ? "📍 Current Location"
                  : "🗺️ Custom Location"}
              </Text>
            </View>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={[
                styles.locationToggleBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons
                name={useCurrentLocation ? "map-outline" : "location-outline"}
                size={16}
                color="#ffffff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Location Permission / Error States */}
      {!locationPermission && useCurrentLocation && (
        <View
          style={[styles.errorCard, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons name="location" size={48} color={COLOR_MUTED} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            {t("predictions.locationAccessRequired")}
          </Text>
          <Text
            style={[
              styles.errorSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t("predictions.enableLocationMessage")}
          </Text>
          <View style={styles.permissionActions}>
            <TouchableOpacity style={styles.retryBtn} onPress={retryLocation}>
              <Text style={styles.retryBtnText}>
                {t("predictions.enableLocation")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.customLocationBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => setShowLocationModal(true)}
            >
              <Text
                style={[
                  styles.customLocationBtnText,
                  { color: theme.colors.primary },
                ]}
              >
                Select Custom Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {locationLoading && (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {t("predictions.gettingLocation")}
          </Text>
        </View>
      )}

      {/* Chart Card */}
      {((locationPermission && useCurrentLocation) ||
        (!useCurrentLocation && customLocation)) &&
        nearestStation && (
          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.chartHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t("predictions.trendPrediction")}
              </Text>
            </View>

            {/* Time Period Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.periodSelectorContainer}
              contentContainerStyle={styles.periodSelectorContent}
            >
              {timePeriods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive,
                    {
                      backgroundColor:
                        selectedPeriod === period.key
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period.key &&
                        styles.periodButtonTextActive,
                      {
                        color:
                          selectedPeriod === period.key
                            ? "#ffffff"
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <View style={styles.loadingChart}>
                <ActivityIndicator size="large" color={COLOR_PRIMARY} />
                <Text
                  style={[styles.loadingText, { color: theme.colors.text }]}
                >
                  {t("predictions.loadingData")}
                </Text>
              </View>
            ) : chartData?.datasets?.[0]?.data?.length ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={{ marginHorizontal: 8 }}
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                >
                  <LineChart
                    data={chartData}
                    width={Math.max(
                      Dimensions.get("window").width - 32,
                      chartData.labels.length * 60 // 60px per data point for good spacing
                    )}
                    height={260}
                    chartConfig={{
                      backgroundColor: theme.colors.surface,
                      backgroundGradientFrom: theme.colors.surface,
                      backgroundGradientTo: theme.colors.surface,
                      decimalPlaces: 2,
                      color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                      labelColor: (opacity = 1) =>
                        theme.isDark
                          ? `rgba(248, 250, 252, ${opacity})`
                          : `rgba(15, 23, 42, ${opacity})`,
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#0A84FF",
                        fill: "#ffffff",
                      },
                      propsForBackgroundLines: {
                        stroke: theme.isDark ? "#374151" : "#e5e7eb",
                      },
                      propsForLabels: {
                        fontSize: 11,
                      },
                    }}
                    bezier={false}
                    yAxisSuffix=" m"
                    fromZero={false}
                    style={styles.chart}
                    verticalLabelRotation={45}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                  />
                </ScrollView>
                <Text
                  style={[
                    styles.axisLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {selectedPeriod === "7d"
                    ? "Past 7 Days"
                    : selectedPeriod === "30d"
                    ? "Past 30 Days"
                    : selectedPeriod === "3m"
                    ? "Past 3 Months"
                    : selectedPeriod === "6m"
                    ? "Past 6 Months"
                    : "Past 1 Year"}
                </Text>
                <View style={styles.scrollIndicator}>
                  <Ionicons
                    name="swap-horizontal"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.scrollIndicatorText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Scroll left/right to view all data points
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons
                  name="analytics-outline"
                  size={48}
                  color={COLOR_MUTED}
                />
                <Text
                  style={[
                    styles.noDataText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t("predictions.noDataAvailable")}
                </Text>
              </View>
            )}
          </View>
        )}

      {/* AI Toggle and Weather Status */}
      {((locationPermission && useCurrentLocation) ||
        (!useCurrentLocation && customLocation)) &&
        nearestStation && (
          <>
            {/* AI Toggle */}
            <View style={styles.aiToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.aiToggleButton,
                  {
                    backgroundColor: useAiPredictions
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setUseAiPredictions(!useAiPredictions)}
                disabled={aiLoading}
              >
                <Text
                  style={[
                    styles.aiToggleText,
                    {
                      color: useAiPredictions
                        ? theme.colors.surface
                        : theme.colors.primary,
                    },
                  ]}
                >
                  🤖{" "}
                  {useAiPredictions
                    ? "AI Predictions ON"
                    : "AI Predictions OFF"}
                </Text>
                {aiLoading && (
                  <ActivityIndicator
                    size="small"
                    color={
                      useAiPredictions
                        ? theme.colors.surface
                        : theme.colors.primary
                    }
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Weather Status */}
            {weatherLoading ? (
              <View style={styles.weatherStatus}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text
                  style={[
                    styles.weatherStatusText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Fetching weather data for enhanced predictions...
                </Text>
              </View>
            ) : weatherData ? (
              <View
                style={[
                  styles.weatherSummary,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.weatherSummaryTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Current Weather Conditions
                </Text>
                {weatherData.list && weatherData.list[0] && (
                  <View style={styles.weatherDetails}>
                    <Text
                      style={[
                        styles.weatherDetail,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      🌡️{" "}
                      {(weatherData.list[0].main.temp - 273.15 || 0).toFixed(1)}
                      °C
                    </Text>
                    <Text
                      style={[
                        styles.weatherDetail,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      💧 {weatherData.list[0].main.humidity || 0}% humidity
                    </Text>
                    <Text
                      style={[
                        styles.weatherDetail,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      🌧️ {(weatherData.list[0].rain?.["3h"] || 0).toFixed(1)}mm
                      rainfall
                    </Text>
                    <Text
                      style={[
                        styles.weatherDetail,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      📊 {weatherData.list[0].main.pressure || 0}hPa pressure
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text
                style={[
                  styles.weatherStatusText,
                  { color: theme.colors.textSecondary, textAlign: "center" },
                ]}
              >
                ⚠️ Using estimated patterns (weather data unavailable)
              </Text>
            )}

            {/* AI Prediction Chart */}
            {useAiPredictions &&
              predictedChartData?.datasets?.[0]?.data?.length && (
                <View
                  style={[
                    styles.chartCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.colors.text,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="chart-line"
                      size={18}
                      color={theme.colors.text}
                    />{" "}
                    AI Predicted Groundwater Level
                  </Text>
                  <Text
                    style={[
                      styles.chartDescription,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    🟠 Orange line shows AI-forecasted levels for the next 30
                    days
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    style={{ marginHorizontal: 8 }}
                    contentContainerStyle={{ paddingHorizontal: 8 }}
                  >
                    <LineChart
                      data={predictedChartData}
                      width={Math.max(
                        Dimensions.get("window").width - 32,
                        predictedChartData.labels.length * 25
                      )}
                      height={260}
                      chartConfig={{
                        backgroundColor: theme.colors.surface,
                        backgroundGradientFrom: theme.colors.surface,
                        backgroundGradientTo: theme.colors.surface,
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                        labelColor: (opacity = 1) =>
                          theme.isDark
                            ? `rgba(248, 250, 252, ${opacity})`
                            : `rgba(15, 23, 42, ${opacity})`,
                        propsForDots: {
                          r: "3",
                          strokeWidth: "1.5",
                          stroke: "rgba(255, 152, 0, 1)",
                          fill: "#ffffff",
                        },
                        propsForBackgroundLines: {
                          stroke: theme.isDark ? "#374151" : "#e5e7eb",
                        },
                        propsForLabels: {
                          fontSize: 11,
                        },
                      }}
                      bezier={false}
                      yAxisSuffix=" m"
                      fromZero={false}
                      style={styles.chart}
                      verticalLabelRotation={45}
                      withInnerLines={false}
                      withOuterLines={true}
                      withVerticalLines={false}
                      withHorizontalLines={true}
                    />
                  </ScrollView>
                  <Text
                    style={[
                      styles.axisLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Future Predictions - Next{" "}
                    {selectedPeriod.replace(/[^0-9]/g, "")} Days
                  </Text>
                </View>
              )}

            {/* AI Prediction Insights */}
            {useAiPredictions && predictionInsights && (
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.text,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="brain"
                    size={18}
                    color={theme.colors.text}
                  />{" "}
                  AI Prediction Insights
                </Text>
                <Text
                  style={[
                    styles.chartDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  🧠 Key prediction factors and trends (markdown format)
                </Text>

                <View
                  style={[
                    styles.insightsContainer,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Markdown
                    style={{
                      body: {
                        color: theme.colors.text,
                        fontSize: 14,
                        lineHeight: 22,
                        fontWeight: "500",
                      },
                      bullet_list: {
                        marginVertical: 4,
                      },
                      list_item: {
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginVertical: 2,
                      },
                      bullet_list_icon: {
                        color: theme.colors.primary,
                        fontSize: 14,
                        fontWeight: "bold",
                        marginRight: 8,
                        marginTop: 2,
                      },
                      bullet_list_content: {
                        flex: 1,
                        color: theme.colors.text,
                        fontSize: 14,
                        fontWeight: "500",
                      },
                    }}
                  >
                    {predictionInsights}
                  </Markdown>
                </View>
              </View>
            )}
          </>
        )}

      {/* Current Level & Prediction Cards */}
      {((locationPermission && useCurrentLocation) ||
        (!useCurrentLocation && customLocation)) &&
        nearestStation &&
        kpis && (
          <View style={styles.kpiGrid}>
            <View
              style={[
                styles.kpiCard,
                styles.currentLevelCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: "#e6f4ff" }]}>
                <Ionicons name="water" size={24} color={COLOR_PRIMARY} />
              </View>
              <Text
                style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}
              >
                {t("predictions.currentLevel")}
              </Text>
              <Text
                style={[styles.kpiValueLarge, { color: theme.colors.text }]}
              >
                {kpis.current.toFixed(2)} m
              </Text>
              <Text
                style={[
                  styles.kpiSubtext,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("predictions.belowGround")}
              </Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                styles.predictionCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: "#fff7ed" }]}>
                <MaterialCommunityIcons
                  name="crystal-ball"
                  size={24}
                  color="#f97316"
                />
              </View>
              <Text
                style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}
              >
                {t("predictions.sevenDayPrediction")}
              </Text>
              <Text
                style={[styles.kpiValueLarge, { color: theme.colors.text }]}
              >
                {kpis.prediction7Day.toFixed(2)} m
              </Text>
              <Text
                style={[
                  styles.kpiSubtext,
                  {
                    color:
                      kpis.trend > 0.1
                        ? "#ef4444"
                        : kpis.trend < -0.1
                        ? "#16a34a"
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {kpis.trend > 0.1
                  ? t("predictions.declining")
                  : kpis.trend < -0.1
                  ? t("predictions.rising")
                  : t("predictions.stableArrow")}
              </Text>
            </View>
          </View>
        )}

      {/* Statistics Grid */}
      {((locationPermission && useCurrentLocation) ||
        (!useCurrentLocation && customLocation)) &&
        nearestStation &&
        kpis && (
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons
                name="analytics"
                size={18}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {selectedPeriod === "7d"
                  ? "7-Day Average"
                  : selectedPeriod === "30d"
                  ? "30-Day Average"
                  : selectedPeriod === "3m"
                  ? "3-Month Average"
                  : selectedPeriod === "6m"
                  ? "6-Month Average"
                  : "1-Year Average"}
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {kpis.avg.toFixed(2)} m
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="trending-down" size={18} color="#16a34a" />
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("predictions.minimum")}
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {kpis.min.toFixed(2)} m
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="trending-up" size={18} color="#ef4444" />
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("predictions.maximum")}
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {kpis.max.toFixed(2)} m
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <MaterialCommunityIcons
                name="chart-line"
                size={18}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("predictions.trendLabel")}
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {Math.abs(kpis.trend).toFixed(2)} m
              </Text>
            </View>
          </View>
        )}
      {/* Insights Card */}
      {((locationPermission && useCurrentLocation) ||
        (!useCurrentLocation && customLocation)) &&
        nearestStation &&
        insights.length > 0 && (
          <View
            style={[
              styles.insightsCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.insightsHeader}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.insightsTitle, { color: theme.colors.text }]}
              >
                {t("predictions.insightsAnalysis")}
              </Text>
            </View>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightRow}>
                <Text style={styles.insightBullet}>•</Text>
                <Text
                  style={[
                    styles.insightText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        )}

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Location
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowLocationModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.locationOptions}>
            <TouchableOpacity
              style={[
                styles.locationOption,
                {
                  backgroundColor: useCurrentLocation
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                setUseCurrentLocation(true);
                if (userLocation) {
                  setShowLocationModal(false);
                }
              }}
            >
              <Ionicons
                name="location"
                size={20}
                color={useCurrentLocation ? "#ffffff" : theme.colors.primary}
              />
              <Text
                style={[
                  styles.locationOptionText,
                  {
                    color: useCurrentLocation ? "#ffffff" : theme.colors.text,
                  },
                ]}
              >
                Use Current Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationOption,
                {
                  backgroundColor: !useCurrentLocation
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setUseCurrentLocation(false)}
            >
              <Ionicons
                name="map"
                size={20}
                color={!useCurrentLocation ? "#ffffff" : theme.colors.primary}
              />
              <Text
                style={[
                  styles.locationOptionText,
                  {
                    color: !useCurrentLocation ? "#ffffff" : theme.colors.text,
                  },
                ]}
              >
                Select Custom Location
              </Text>
            </TouchableOpacity>
          </View>

          {!useCurrentLocation && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: customLocation?.latitude || 20.5937,
                  longitude: customLocation?.longitude || 78.9629,
                  latitudeDelta: 10,
                  longitudeDelta: 10,
                }}
                onPress={(event) => {
                  const { coordinate } = event.nativeEvent;
                  setCustomLocation({
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                  });
                }}
              >
                {/* Show all stations as markers */}
                {stationsData
                  .filter(
                    (station: Station) =>
                      station.station_status === "Active" &&
                      station.latitude &&
                      station.longitude
                  )
                  .map((station: Station, index: number) => (
                    <Marker
                      key={`station-${station.station_code}-${index}`}
                      coordinate={{
                        latitude: station.latitude,
                        longitude: station.longitude,
                      }}
                      title={station.station_name}
                      description={`${station.district}, ${station.state}`}
                      pinColor="#0A84FF"
                      onPress={() => {
                        setCustomLocation({
                          latitude: station.latitude,
                          longitude: station.longitude,
                        });
                      }}
                    />
                  ))}

                {/* Show selected custom location */}
                {customLocation && (
                  <Marker
                    coordinate={customLocation}
                    title="Selected Location"
                    pinColor="#FF6B35"
                  />
                )}
              </MapView>

              <View style={styles.mapInstructions}>
                <Text
                  style={[
                    styles.instructionText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Tap on the map to select a location or tap on a station marker
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmLocationBtn,
                  {
                    backgroundColor: customLocation
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                disabled={!customLocation}
                onPress={() => {
                  if (customLocation) {
                    setShowLocationModal(false);
                  }
                }}
              >
                <Text
                  style={[
                    styles.confirmLocationText,
                    {
                      color: customLocation
                        ? "#ffffff"
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Confirm Location
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {useCurrentLocation && !userLocation && (
            <View style={styles.currentLocationContainer}>
              <Text
                style={[
                  styles.permissionText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Location permission is required to use current location
              </Text>
              <TouchableOpacity
                style={[
                  styles.permissionBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  requestLocationPermission();
                  setShowLocationModal(false);
                }}
              >
                <Text style={styles.permissionBtnText}>
                  Enable Location Permission
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationToggleBtn: {
    padding: 8,
    borderRadius: 8,
  },
  locationModeText: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 4,
  },
  locationOptions: {
    flexDirection: "row",
    gap: 12,
    margin: 16,
  },
  locationOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  locationOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  mapInstructions: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
  },
  confirmLocationBtn: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmLocationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  currentLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionActions: {
    flexDirection: "column",
    gap: 12,
    alignItems: "stretch",
    width: "100%",
  },
  customLocationBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  customLocationBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingChart: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  axisLabel: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
  noDataContainer: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 16,
    marginTop: 12,
  },
  kpiGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentLevelCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLOR_PRIMARY,
  },
  predictionCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#f97316",
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  kpiValueLarge: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  kpiSubtext: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertCardNormal: {
    backgroundColor: "#f0f9f4",
    borderColor: "#16a34a",
  },
  alertCardCritical: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  insightsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  insightBullet: {
    color: COLOR_PRIMARY,
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  scrollIndicatorText: {
    fontSize: 11,
    marginLeft: 6,
    fontStyle: "italic",
  },
  periodSelectorContainer: {
    marginBottom: 16,
  },
  periodSelectorContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  periodButtonActive: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  periodButtonTextActive: {
    fontWeight: "600",
  },
  aiToggleContainer: {
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: 16,
  },
  aiToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  aiToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weatherStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  weatherStatusText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  weatherSummary: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  weatherSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  weatherDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 8,
  },
  weatherDetail: {
    fontSize: 12,
    fontWeight: "500",
  },
  chartDescription: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: "italic",
    marginHorizontal: 8,
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "left",
    fontWeight: "500",
  },
  insightsFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  insightsFooterText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default PredictionsPage;
