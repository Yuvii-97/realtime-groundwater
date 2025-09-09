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
  Modal,
  Pressable,
  Share,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LineChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

const COLOR_PRIMARY = "#0A84FF";
const COLOR_BG = "#ffffff";
const COLOR_CARD_BG = "#f8fafc";
const COLOR_TEXT = "#0f172a";
const COLOR_MUTED = "#475569";
const COLOR_BORDER = "#e2e8f0";
const WATER_GRADIENT_FROM = "#e6f4ff";
const WATER_GRADIENT_TO = "#f5fbff";

type RangeKey = "week" | "month" | "year" | "custom";

const GroundwaterMonitoring = () => {
  const router = useRouter();
  const theme = useTheme();

  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedStation, setSelectedStation] = useState("");

  const [loading, setLoading] = useState(false);

  // Chart/Data
  const [chartData, setChartData] = useState<any>(null);
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

    return [
      `Average Depth: ${avg.toFixed(2)} m`,
      `Lowest Depth: ${min.toFixed(2)} m`,
      `Highest Depth: ${max.toFixed(2)} m`,
      `Trend: ${
        trend > 0
          ? "Increasing (deeper)"
          : trend < 0
          ? "Decreasing (shallower)"
          : "Stable"
      }`,
      `On ${startLabel}, the depth was ${startValue.toFixed(
        2
      )} m, and now on ${endLabel}, it is ${endValue.toFixed(2)} m.`,
    ];
  }, [chartData]);

  // Date range
  const [range, setRange] = useState<RangeKey>("month");
  const [rangeMenuVisible, setRangeMenuVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Tooltip (simple overlay instead of in-chart)
  const [selectedPoint, setSelectedPoint] = useState<{
    label: string;
    value: number;
  } | null>(null);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    // Adjust dates on range change (except custom)
    if (range !== "custom") {
      const now = new Date();
      let start = new Date(now);

      if (range === "week") {
        start.setDate(start.getDate() - 7);
      } else if (range === "month") {
        start.setMonth(start.getMonth() - 1);
      } else if (range === "year") {
        start.setFullYear(start.getFullYear() - 1);
      }
      setStartDate(start);
      setEndDate(now);
    }
  }, [range]);

  useEffect(() => {
    // Refetch when station/range/dates change
    if (selectedState && selectedDistrict && selectedStation) {
      fetchGroundwaterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation, range, startDate, endDate]);

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
    } catch {
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

  const fetchStations = async (district_id: string) => {
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
      setStations(Array.isArray(data.data) ? data.data : []);
    } catch {
      Alert.alert("Error", "Failed to fetch telemetric stations");
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  const fetchGroundwaterData = async () => {
    // Require all filters
    if (!selectedState || !selectedDistrict || !selectedStation) {
      return;
    }
    try {
      setLoading(true);
      setSelectedPoint(null);
      const res = await fetch(
        "https://indiawris.gov.in/CommonDataSetMasterAPI/getCommonDataSetByStationCode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_code: selectedStation,
            starttime: toISO(startDate),
            endtime: toISO(endDate),
            dataset: "GWATERLVL",
          }),
        }
      );
      const data = await res.json();
      const records = Array.isArray(data.data) ? data.data : [];

      if (records.length > 0) {
        // Prepare and aggregate to keep X-axis readable (no scroll)
        const prepared = records
          .map((d: any) => ({
            t: new Date(d.dataTime),
            v: Math.abs(Number(d.dataValue) || 0),
          }))
          .filter((d: any) => !isNaN(d.t.getTime()));

        const bucketed = aggregateSeries(prepared, range);
        const labels = bucketed.map((b) =>
          b.t.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        const values: number[] = bucketed.map((b) => b.v);

        setChartData({
          labels,
          datasets: [
            {
              data: values,
              strokeWidth: 2,
              color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
            },
          ],
          legend: ["Depth Below Ground (m)"],
        });
      } else {
        setChartData(null);
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

  // Aggregate/Downsample helpers to keep axis readable and avoid scroll
  const aggregateSeries = (
    series: { t: Date; v: number }[],
    currentRange: RangeKey
  ): { t: Date; v: number }[] => {
    if (!series.length) return [];

    // Decide bucket size
    // week: keep hourly/dense -> limit to ~20 points
    // month: daily buckets
    // year: monthly buckets
    let buckets: Map<string, { sum: number; count: number; t: Date }> =
      new Map();

    const keyFor = (d: Date): string => {
      if (currentRange === "year") {
        return `${d.getFullYear()}-${d.getMonth()}`; // monthly
      }
      if (currentRange === "month") {
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; // daily
      }
      // week/custom: group by day but cap to ~20 evenly spaced afterwards
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };

    for (const p of series) {
      const k = keyFor(p.t);
      const bucket = buckets.get(k);
      if (bucket) {
        bucket.sum += p.v;
        bucket.count += 1;
      } else {
        buckets.set(k, { sum: p.v, count: 1, t: new Date(p.t) });
      }
    }

    let out = Array.from(buckets.values())
      .sort((a, b) => a.t.getTime() - b.t.getTime())
      .map((b) => ({ t: b.t, v: b.sum / b.count }));

    // Cap max points to keep labels readable
    const MAX_POINTS = 24;
    if (out.length > MAX_POINTS) {
      const step = Math.ceil(out.length / MAX_POINTS);
      out = out.filter((_, idx) => idx % step === 0);
    }
    return out;
  };

  // Derived KPIs for cards
  const kpis = useMemo(() => {
    if (!chartData?.datasets?.[0]?.data?.length) return null;
    const values: number[] = chartData.datasets[0].data;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values[values.length - 1] - values[0];
    return { avg, min, max, trend };
  }, [chartData]);

  const thresholdCritical = 10; // meters below ground (example)
  const isCritical = (kpis?.max || 0) >= thresholdCritical;

  // Date picker handlers
  const onStartDateChange = (event: any, selected?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selected) setStartDate(selected);
  };
  const onEndDateChange = (event: any, selected?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selected) setEndDate(selected);
  };

  const onShare = async () => {
    const lines = [
      `Station: ${selectedStation || "-"}`,
      `Range: ${range.toUpperCase()} (${toISO(startDate)} → ${toISO(endDate)})`,
      ...(insights || []),
    ];
    try {
      await Share.share({ message: lines.join("\n") });
    } catch {
      Alert.alert("Share", "Unable to share at this moment.");
    }
  };

  const RangeOption = ({
    value,
    label,
    icon,
  }: {
    value: RangeKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <Pressable
      onPress={() => {
        setRange(value);
        setRangeMenuVisible(false);
      }}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: "#eef6ff" },
        range === value && { borderColor: COLOR_PRIMARY },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={COLOR_PRIMARY}
        style={{ marginRight: 8 }}
      />
      <Text style={styles.menuItemText}>{label}</Text>
      {range === value && (
        <Ionicons
          name="checkmark"
          size={18}
          color={COLOR_PRIMARY}
          style={{ marginLeft: "auto" }}
        />
      )}
    </Pressable>
  );

  const filtersReady = !!(selectedState && selectedDistrict && selectedStation);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Controls Card */}
      <View style={[styles.controlsCard, { backgroundColor: theme.colors.surface }]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Range</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[styles.rangeSelect, { borderColor: theme.colors.border }]}
              onPress={() => setRangeMenuVisible(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.rangeSelectText}>
                {range === "week" && "Last 7 days"}
                {range === "month" && "Last 30 days"}
                {range === "year" && "Last 12 months"}
                {range === "custom" &&
                  `Custom: ${toISO(startDate)} → ${toISO(endDate)}`}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLOR_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={onShare}>
              <Ionicons
                name="share-social-outline"
                size={18}
                color={COLOR_PRIMARY}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom date range when 'custom' */}
        {range === "custom" && (
          <View style={styles.customRangeRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar" size={16} color={COLOR_PRIMARY} />
              <Text style={styles.dateText}>
                Start: {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar" size={16} color={COLOR_PRIMARY} />
              <Text style={styles.dateText}>
                End: {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
      </View>

      {/* Chart Card - Always visible at top */}
      <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Groundwater Depth</Text>
        </View>

        {loading && (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator size="large" color={COLOR_PRIMARY} />
          </View>
        )}

        {!loading && (
          <>
  
            {filtersReady && chartData?.datasets?.[0]?.data?.length ? (
              <LineChart
                data={chartData}
                width={Dimensions.get("window").width - 40}
                height={260}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                  labelColor: (opacity = 1) => theme.isDark ? `rgba(248, 250, 252, ${opacity})` : `rgba(15, 23, 42, ${opacity})`,
                  propsForDots: {
                    r: "3.5",
                    strokeWidth: "2",
                    stroke: "#0A84FF",
                  },
                  propsForBackgroundLines: { stroke: theme.isDark ? "#374151" : "#e5e7eb" },
                }}
                bezier
                yAxisSuffix=" m"
                fromZero
                style={styles.chart}
                verticalLabelRotation={30}
                onDataPointClick={(p) => {
                  const label = chartData.labels[p.index] || "";
                  const value = chartData.datasets[0].data[p.index];
                  setSelectedPoint({ label, value });
                }}
              />
            ) : (
              <View
                style={{
                  height: 260,
                  borderWidth: 1,
                  borderColor: COLOR_BORDER,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                  marginHorizontal: 8,
                }}
              >
                <Text style={{ color: COLOR_MUTED }}>
                  Select filters to view data
                </Text>
              </View>
            )}
            <Text style={styles.axisX}>Time</Text>

            {/* Tooltip below chart */}
            {selectedPoint && (
              <View style={styles.tooltip}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={COLOR_PRIMARY}
                />
                <Text style={styles.tooltipText}>
                  {selectedPoint.label} — {selectedPoint.value.toFixed(2)} m
                </Text>
                <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                  <Ionicons name="close" size={16} color={COLOR_MUTED} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Location Selectors (State/District/Station) */}
      <View style={[styles.selectorsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { marginLeft: 8, color: theme.colors.text }]}>
            Filter Location
          </Text>
        </View>

        <Text style={styles.label}>State</Text>
        <View style={styles.dropdownWrapper}>
          <Picker
            selectedValue={selectedState}
            onValueChange={(val) => {
              setSelectedState(val);
              setSelectedDistrict("");
              setSelectedStation("");
              setDistricts([]);
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

        <Text style={styles.label}>District</Text>
        <View style={styles.dropdownWrapper}>
          <Picker
            selectedValue={selectedDistrict}
            onValueChange={(val) => {
              setSelectedDistrict(val);
              setSelectedStation("");
              setStations([]);
              if (val) fetchStations(val);
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

        <Text style={styles.label}>Telemetric Station</Text>
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
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.kpiIcon}>
            <Ionicons name="water-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Average</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {kpis ? `${kpis.avg.toFixed(2)} m` : "--"}
          </Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.kpiIcon}>
            <Ionicons
              name="trending-down-outline"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Lowest</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {kpis ? `${kpis.min.toFixed(2)} m` : "--"}
          </Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.kpiIcon}>
            <Ionicons
              name="trending-up-outline"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Highest</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {kpis ? `${kpis.max.toFixed(2)} m` : "--"}
          </Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.kpiIcon}>
            <MaterialCommunityIcons
              name="chart-line"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Trend</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {kpis
              ? kpis.trend > 0
                ? "Increasing"
                : kpis.trend < 0
                ? "Decreasing"
                : "Stable"
              : "--"}
          </Text>
        </View>
      </View>

      {/* Alerts */}
      <View
        style={[
          styles.alertCard,
          isCritical ? styles.alertCardCritical : styles.alertCardNormal,
        ]}
      >
        <Ionicons
          name={isCritical ? "alert-circle" : "shield-checkmark"}
          size={18}
          color={isCritical ? "#ef4444" : "#16a34a"}
        />
        <Text
          style={[
            styles.alertText,
            { color: isCritical ? "#991b1b" : "#065f46" },
          ]}
        >
          {isCritical
            ? `Alert: Depth crossed ${thresholdCritical} m at some points in the selected range.`
            : "All readings are within the safe threshold."}
        </Text>
      </View>

      {/* Share/Export button below insights */}
      <View style={{ marginTop: 8, marginHorizontal: 16 }}>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color={COLOR_PRIMARY}
          />
        </TouchableOpacity>
      </View>


      {/* Range menu modal */}
      <Modal
        visible={rangeMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRangeMenuVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setRangeMenuVisible(false)}
        >
          <View />
        </Pressable>
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Select Range</Text>
          <RangeOption value="week" label="Last 7 Days" icon="calendar" />
          <RangeOption
            value="month"
            label="Last 30 Days"
            icon="calendar-number-outline"
          />
          <RangeOption
            value="year"
            label="Last 12 Months"
            icon="calendar-outline"
          />
          <View style={styles.menuDivider} />
          <RangeOption
            value="custom"
            label="Custom Range"
            icon="calendar-clear-outline"
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

export default GroundwaterMonitoring;

const styles = StyleSheet.create({
  controlsCard: {
    marginHorizontal: 16,
    backgroundColor: COLOR_CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  selectorsCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: COLOR_CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 14,
  },
  rangeSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rangeSelectText: {
    color: COLOR_TEXT,
    fontWeight: "600",
  },
  iconBtn: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLOR_BORDER,
  },
  customRangeRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    flex: 1,
  },
  dateText: {
    color: COLOR_PRIMARY,
    fontWeight: "700",
  },
  tooltip: {
    marginTop: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tooltipText: {
    color: COLOR_TEXT,
    fontWeight: "600",
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
    color: COLOR_MUTED,
  },
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  kpiGrid: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 14,
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiLabel: {
    color: COLOR_MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  kpiValue: {
    color: COLOR_TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  alertCard: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  alertCardCritical: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  alertCardNormal: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  alertText: {
    fontWeight: "600",
  },
  chartCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 12,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 6,
  },
  axisY: {
    position: "absolute",
    left: -80,
    top: "50%",
    transform: [{ rotate: "-90deg" }],
    width: 180,
    textAlign: "center",
    color: COLOR_MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  axisX: {
    textAlign: "center",
    color: COLOR_MUTED,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  insightsBox: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#cfe8ff",
  },
  insightsHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: COLOR_PRIMARY,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: COLOR_TEXT,
    marginBottom: 2,
  },
  quickNavGrid: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  quickNavBtn: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickNavText: {
    color: COLOR_TEXT,
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLOR_TEXT,
  },
  // Range modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuContainer: {
    position: "absolute",
    top: 110,
    right: 16,
    left: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  menuTitle: {
    fontWeight: "800",
    color: COLOR_TEXT,
    marginBottom: 8,
    marginLeft: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  menuItemText: {
    color: COLOR_TEXT,
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLOR_BORDER,
    marginVertical: 6,
  },
});
