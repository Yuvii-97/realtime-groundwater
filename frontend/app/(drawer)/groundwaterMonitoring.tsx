import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const GroundwaterMonitoring = () => {
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tehsils, setTehsils] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [telemetricStations, setTelemetricStations] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedTelemetricStation, setSelectedTelemetricStation] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);

  // Date range selection
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/masterState/StateList",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datasetcode: "GWATERLVL" }),
        }
      );
      const data = await res.json();
      setStates(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch states");
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (statecode: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/masterDistrict/getDistrictbyState",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statecode, datasetcode: "GWATERLVL" }),
        }
      );
      const data = await res.json();
      setDistricts(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert("Error", "Failed to fetch districts");
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTehsils = async (statecode: string, district_id: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/tehsil/getMasterTehsilList",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statecode,
            district_id,
            datasetcode: "GWATERLVL",
          }),
        }
      );
      const data = await res.json();
      setTehsils(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert("Error", "Failed to fetch tehsils");
      setTehsils([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async (
    statecode: string,
    district_id: string,
    tahsil_id: string
  ) => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/block/getMasterBlockList",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statecode,
            district_id,
            tahsil_id,
            datasetcode: "GWATERLVL",
          }),
        }
      );
      const data = await res.json();
      setBlocks(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert("Error", "Failed to fetch blocks");
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async (district_id: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/masterStation/getMasterStation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district_id,
            agencyid: 113,
            datasetcode: "GWATERLVL",
          }),
        }
      );
      const data = await res.json();
      setStations(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert("Error", "Failed to fetch stations");
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetricStations = async (district_id: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/masterStationDS/stationDSList",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district_id,
            agencyid: "113",
            datasetcode: "GWATERLVL",
            telemetric: "true",
          }),
        }
      );
      const data = await res.json();
      setTelemetricStations(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert("Error", "Failed to fetch telemetric stations");
      setTelemetricStations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroundwaterData = async () => {
    if (!selectedTelemetricStation) {
      Alert.alert("Validation", "Please select a telemetric station first");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        "https://indiawris.gov.in/CommonDataSetMasterAPI/getCommonDataSetByStationCode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_code: selectedTelemetricStation,
            starttime: startDate.toISOString().slice(0, 10),
            endtime: endDate.toISOString().slice(0, 10),
            dataset: "GWATERLVL",
          }),
        }
      );
      const data = await res.json();
      const records = Array.isArray(data.data) ? data.data : [];

      if (records.length > 0) {
        const labels = records.map((d: any) =>
          new Date(d.dataTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
          })
        );
        const values = records.map((d: any) => d.dataValue);

        setChartData({
          labels,
          datasets: [
            {
              data: values,
              strokeWidth: 2,
            },
          ],
        });

        // Key insights
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg =
          values.reduce((acc: number, val: number) => acc + val, 0) /
          values.length;
        setInsights([
          `Minimum Level: ${min.toFixed(2)} m`,
          `Maximum Level: ${max.toFixed(2)} m`,
          `Average Level: ${avg.toFixed(2)} m`,
        ]);
      } else {
        setChartData(null);
        setInsights([]);
        Alert.alert(
          "No Data",
          "No groundwater data available for this station and date range."
        );
      }
    } catch {
      Alert.alert("Error", "Failed to fetch groundwater data");
    } finally {
      setLoading(false);
    }
  };

  // Date picker handlers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) setStartDate(selectedDate);
  };
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Groundwater Monitoring</Text>

      {/* State Selection */}
      <Text style={styles.label}>Select State</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedState}
          onValueChange={(val) => {
            setSelectedState(val);
            setSelectedDistrict("");
            setSelectedTehsil("");
            setSelectedBlock("");
            setSelectedStation("");
            setDistricts([]);
            setTehsils([]);
            setBlocks([]);
            setStations([]);
            if (val) fetchDistricts(val);
          }}
        >
          <Picker.Item label="-- Select State --" value="" />
          {states.map((s) => (
            <Picker.Item
              key={s.statecode}
              label={s.state}
              value={s.statecode}
            />
          ))}
        </Picker>
      </View>

      {/* District Selection */}
      <Text style={styles.label}>Select District</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedDistrict}
          onValueChange={(val) => {
            setSelectedDistrict(val);
            setSelectedTehsil("");
            setSelectedBlock("");
            setSelectedStation("");
            setTehsils([]);
            setBlocks([]);
            setStations([]);
            if (val && selectedState) fetchTehsils(selectedState, val);
          }}
        >
          <Picker.Item label="-- Select District --" value="" />
          {districts.map((d) => (
            <Picker.Item
              key={d.district_id}
              label={d.districtname}
              value={d.district_id}
            />
          ))}
        </Picker>
      </View>

      {/* Tehsil Selection */}
      <Text style={styles.label}>Select Tehsil</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedTehsil}
          onValueChange={(val) => {
            setSelectedTehsil(val);
            setSelectedBlock("");
            setSelectedStation("");
            setBlocks([]);
            setStations([]);
            if (val && selectedState && selectedDistrict)
              fetchBlocks(selectedState, selectedDistrict, val);
          }}
        >
          <Picker.Item label="-- Select Tehsil --" value="" />
          {tehsils.map((t) => (
            <Picker.Item
              key={t.tahsil_id}
              label={t.tahsilname}
              value={t.tahsil_id}
            />
          ))}
        </Picker>
      </View>

      {/* Block Selection */}
      <Text style={styles.label}>Select Block</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedBlock}
          onValueChange={(val) => {
            setSelectedBlock(val);
            setSelectedStation("");
            setStations([]);
            setSelectedTelemetricStation("");
            setTelemetricStations([]);
            if (val && selectedDistrict) {
              fetchStations(selectedDistrict);
              fetchTelemetricStations(selectedDistrict);
            }
          }}
        >
          <Picker.Item label="-- Select Block --" value="" />
          {blocks.map((b) => (
            <Picker.Item
              key={b.block_id}
              label={b.blockname}
              value={b.block_id}
            />
          ))}
        </Picker>
      </View>

      {/* Station Selection */}
      <Text style={styles.label}>Select Station</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedStation}
          onValueChange={(val) => setSelectedStation(val)}
        >
          <Picker.Item label="-- Select Station --" value="" />
          {stations.map((st) => (
            <Picker.Item
              key={st.stationcode}
              label={st.stationname}
              value={st.stationcode}
            />
          ))}
        </Picker>
      </View>

      {/* Telemetric Station Selection */}
      <Text style={styles.label}>Select Telemetric Station</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedTelemetricStation}
          onValueChange={(val) => setSelectedTelemetricStation(val)}
        >
          <Picker.Item label="-- Select Telemetric Station --" value="" />
          {telemetricStations.map((st) => (
            <Picker.Item
              key={st.stationcode}
              label={st.stationname}
              value={st.stationcode}
            />
          ))}
        </Picker>
      </View>

      {/* Date Range Selection */}
      <Text style={styles.label}>Select Date Range</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={styles.dateText}>
            Start: {startDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={styles.dateText}>
            End: {endDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={new Date()}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          maximumDate={new Date()}
        />
      )}

      {loading && <ActivityIndicator size="large" color="#007AFF" />}

      {/* Chart Section */}
      {chartData && (
        <>
          <Text style={styles.label}>Groundwater Levels</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 40}
            height={220}
            yAxisSuffix=" m"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#f5f5f5",
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#007AFF",
              },
            }}
            style={styles.chart}
          />
          {/* Key Insights */}
          <View style={styles.insightsBox}>
            <Text style={styles.insightsHeading}>Key Insights</Text>
            {insights.map((ins, idx) => (
              <Text key={idx} style={styles.insightText}>
                {ins}
              </Text>
            ))}
          </View>
        </>
      )}

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={fetchGroundwaterData}>
        <Text style={styles.buttonText}>Fetch Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GroundwaterMonitoring;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#007AFF",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 10,
    color: "#333",
  },
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  chart: {
    marginVertical: 15,
    borderRadius: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: "#e6f0ff",
    padding: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  dateText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  insightsBox: {
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  insightsHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
});
