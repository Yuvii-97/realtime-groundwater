import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LineChart, BarChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ViewShot, { captureRef } from "react-native-view-shot"; // ✅ add captureRef
import { useTheme } from "@/hooks/useTheme";

import * as Print from "expo-print";
const { PDFDocument, PDFPage } = require("react-native-pdf-lib");

const screenWidth = Dimensions.get("window").width;

const Reports: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const [location, setLocation] = useState("Station 1");
  const [timePeriod, setTimePeriod] = useState("7days");
  const [modalVisible, setModalVisible] = useState(false);

  const groundwaterData = [12, 14, 13, 15, 16];
  const rainfallData = [10, 5, 20, 15, 30];
  const rechargeLevel = [12, 14, 13, 15, 16];
  const tempData = [32, 33, 31, 34, 35];
  const humidityData = [60, 58, 62, 55, 53];
  const actualData = [12, 14, 13, 15, 16];
  const predictedData = [12, 13, 14, 15, 16, 17, 18];
  const labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];

  const groundwaterRef = useRef<ViewShot | null>(null);
  const rainfallRef = useRef<ViewShot | null>(null);
  const tempRef = useRef<ViewShot | null>(null);
  const predictionRef = useRef<ViewShot | null>(null);

  // Chart configuration - will be moved inside component
  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Use hex primary
    labelColor: (opacity = 1) =>
      colors.text.includes("rgb")
        ? colors.text.replace("rgb", "rgba").replace(")", `, ${opacity})`)
        : `rgba(55, 65, 81, ${opacity})`, // Fallback for hex colors
  };

  const FILESYSTEM_DIR: string =
    ((FileSystem as any).documentDirectory as string | undefined) ??
    ((FileSystem as any).cacheDirectory as string | undefined) ??
    "";

  const exportCSV = async () => {
    const csv =
      "Day,Groundwater,Rainfall,Recharge,Temp,Humidity\n" +
      labels
        .map(
          (d, i) =>
            `${d},${groundwaterData[i] || ""},${rainfallData[i] || ""},${
              rechargeLevel[i] || ""
            },${tempData[i] || ""},${humidityData[i] || ""}`
        )
        .join("\n");

    const filename = "report.csv";
    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else {
      const fileUri = FILESYSTEM_DIR + filename;
      await FileSystem.writeAsStringAsync(fileUri, csv);
      await Sharing.shareAsync(fileUri);
    }
  };

  const exportJSON = async () => {
    const json = {
      location,
      timePeriod,
      groundwaterData,
      rainfallData,
      rechargeLevel,
      tempData,
      humidityData,
      actualData,
      predictedData,
    };
    const content = JSON.stringify(json, null, 2);
    const filename = "report.json";
    if (Platform.OS === "web") {
      const blob = new Blob([content], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else {
      const fileUri = FILESYSTEM_DIR + filename;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
    }
  };

  const exportPDF = async () => {
    try {
      const groundwaterUri = await captureRef(groundwaterRef, {
        result: "base64",
      });
      const rainfallUri = await captureRef(rainfallRef, { result: "base64" });
      const tempUri = await captureRef(tempRef, { result: "base64" });
      const predictionUri = await captureRef(predictionRef, {
        result: "base64",
      });

      if (!groundwaterUri || !rainfallUri || !tempUri || !predictionUri) {
        throw new Error("Failed to capture one or more charts.");
      }

      const html = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1 style="color:#2563eb;">Reports & Analysis</h1>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Period:</strong> ${timePeriod}</p>

          <h2>Groundwater Level Trend</h2>
          <img src="data:image/png;base64,${groundwaterUri}" style="width:100%; height:auto;"/>

          <h2>Rainfall vs Groundwater Recharge</h2>
          <img src="data:image/png;base64,${rainfallUri}" style="width:100%; height:auto;"/>

          <h2>Temperature & Humidity Trends</h2>
          <img src="data:image/png;base64,${tempUri}" style="width:100%; height:auto;"/>

          <h2>Prediction vs Actual</h2>
          <img src="data:image/png;base64,${predictionUri}" style="width:100%; height:auto;"/>

          <h2>Insights</h2>
          <ul>
            <li>📉 Groundwater dropped by 8%</li>
            <li>🌧 Recharge opportunity in next 2 days</li>
            <li>⚠ Rising temperature may cause stress</li>
          </ul>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html });
      console.log("PDF generated at:", uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert("Sharing not available on this device");
      }
    } catch (err) {
      console.error("PDF export error:", err);
    }
  };

  const handleDownload = (format: string) => {
    setModalVisible(false);
    if (format === "CSV") exportCSV();
    else if (format === "JSON") exportJSON();
    else if (format === "PDF") exportPDF();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        📊 Reports & Analysis
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Download detailed groundwater and weather insights for selected time
        periods.
      </Text>

      <View style={[styles.filterCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Select Location:
        </Text>
        <View
          style={[styles.pickerWrapper, { backgroundColor: colors.background }]}
        >
          <Picker
            selectedValue={location}
            onValueChange={setLocation}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor="#666"
          >
            <Picker.Item label="Station 1" value="Station 1" />
            <Picker.Item label="Station 2" value="Station 2" />
            <Picker.Item label="Station 3" value="Station 3" />
          </Picker>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Select Time Period:
        </Text>
        <View
          style={[styles.pickerWrapper, { backgroundColor: colors.background }]}
        >
          <Picker
            selectedValue={timePeriod}
            onValueChange={setTimePeriod}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor="#666"
          >
            <Picker.Item label="Last 7 days" value="7days" />
            <Picker.Item label="Last 30 days" value="30days" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.downloadMain, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="download" size={22} color="white" />
          <Text style={styles.buttonText}> Download Report</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Groundwater Level Trend
        </Text>
        <ViewShot ref={groundwaterRef} options={{ format: "png", quality: 1 }}>
          <LineChart
            data={{ labels, datasets: [{ data: groundwaterData }] }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </ViewShot>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Rainfall vs Groundwater Recharge
        </Text>
        <ViewShot ref={rainfallRef} options={{ format: "png", quality: 1 }}>
          <BarChart
            data={{ labels, datasets: [{ data: rainfallData }] }}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix="mm"
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </ViewShot>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Temperature & Humidity Trends
        </Text>
        <ViewShot ref={tempRef} options={{ format: "png", quality: 1 }}>
          <LineChart
            data={{
              labels,
              datasets: [
                { data: tempData, color: () => "orange" },
                { data: humidityData, color: () => "green" },
              ],
              legend: ["Temperature (°C)", "Humidity (%)"],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </ViewShot>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Prediction vs Actual
        </Text>
        <ViewShot ref={predictionRef} options={{ format: "png", quality: 1 }}>
          <LineChart
            data={{
              labels: [
                "Day 1",
                "Day 2",
                "Day 3",
                "Day 4",
                "Day 5",
                "Day 6",
                "Day 7",
              ],
              datasets: [
                { data: actualData, color: () => "#4f46e5" },
                { data: predictedData, color: () => "#22c55e" },
              ],
              legend: ["Actual", "Predicted"],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </ViewShot>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Insights & Recommendations
        </Text>
        <Text style={[styles.insight, { color: colors.textSecondary }]}>
          📉 Groundwater dropped by 8% compared to last week
        </Text>
        <Text style={[styles.insight, { color: colors.textSecondary }]}>
          🌧 High rainfall expected in next 2 days (Recharge opportunity)
        </Text>
        <Text style={[styles.insight, { color: colors.textSecondary }]}>
          ⚠ Rising temperature may cause water stress
        </Text>
      </View>

      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        Reports are auto-generated from DWLR station data & AI models.
      </Text>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Download As
            </Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.background },
              ]}
              onPress={() => handleDownload("CSV")}
            >
              <Text style={{ color: colors.text }}>📑 CSV </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.background },
              ]}
              onPress={() => handleDownload("JSON")}
            >
              <Text style={{ color: colors.text }}>🗂 JSON </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.background },
              ]}
              onPress={() => handleDownload("PDF")}
            >
              <Text style={{ color: colors.text }}>📊 PDF </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  filterCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
  },
  downloadMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: { fontWeight: "700", fontSize: 16, marginBottom: 10 },
  chart: { borderRadius: 8 },
  insight: { fontSize: 14, marginVertical: 4 },
  footer: { textAlign: "center", fontSize: 12, marginVertical: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  modalButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cancelText: { marginTop: 12, textAlign: "center", fontWeight: "600" },
});

export default Reports;
