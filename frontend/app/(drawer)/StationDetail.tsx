import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native"; // ADD

type StationParam = {
  StationDetail: {
    station: {
      code: string;
      name: string;
      district: string;
      state: string;
      lat: number;
      lon: number;
      status: string;
    };
  };
};
type ScreenRoute = RouteProp<StationParam, "StationDetail">;

interface SeriesPoint {
  t: Date;
  v: number;
}

const PERIODS = [
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
];

const screenWidth = Dimensions.get("window").width;

export default function StationDetailScreen() {
  const route = useRoute<ScreenRoute>();
  const st = route.params?.station;
  const [range, setRange] = useState("90d");
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllRecs, setShowAllRecs] = useState(false);
  const navigation = useNavigation<any>(); // ADD

  const fetchData = useCallback(async () => {
    if (!st) return;
    setLoading(true);
    setError(null);
    try {
      const period = PERIODS.find((p) => p.key === range) || PERIODS[1];
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - period.days);
      const toISO = (d: Date) => d.toISOString().slice(0, 10);

      const res = await fetch(
        "https://indiawris.gov.in/CommonDataSetMasterAPI/getCommonDataSetByStationCode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_code: st.code,
            starttime: toISO(start),
            endtime: toISO(end),
            dataset: "GWATERLVL",
          }),
        }
      );
      const json = await res.json();
      const rows: any[] = Array.isArray(json?.data) ? json.data : [];
      const prepared: SeriesPoint[] = rows
        .map((r) => ({
          t: new Date(r.dataTime),
          v: Math.abs(Number(r.dataValue) || 0),
        }))
        .filter((p) => !isNaN(p.t.getTime()))
        .sort((a, b) => a.t.getTime() - b.t.getTime());
      setSeries(prepared);
    } catch {
      setError("Failed to load groundwater data");
    } finally {
      setLoading(false);
    }
  }, [st, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = useMemo(() => {
    if (!series.length) return null;
    const values = series.map((p) => p.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values[values.length - 1] - values[0];
    return { min, max, avg, trend };
  }, [series]);

  const alerts = useMemo(() => {
    if (!kpis) return [];
    const out: string[] = [];
    if (kpis.max >= 10) out.push("Critical depth reached (>=10 m).");
    if (kpis.trend > 1.5) out.push("Rapid decline over selected period.");
    if (!out.length) out.push("No critical alerts. Conditions stable.");
    return out;
  }, [kpis]);

  const insights = useMemo(() => {
    if (!kpis) return [];
    const list: string[] = [];
    if (kpis.trend > 0)
      list.push("Declining trend – evaluate recharge interventions.");
    else if (kpis.trend < 0)
      list.push(
        "Rising levels – recent recharge or reduced abstraction effective."
      );
    else list.push("Stable levels – maintain current management.");
    if (kpis.avg > 8)
      list.push("Average depth high: assess long-term sustainability.");
    if (kpis.min < 4)
      list.push("Shallow phases suggest recharge optimization potential.");
    return list;
  }, [kpis]);

  const recommendations = useMemo(
    () =>
      kpis
        ? [
            "Researchers: Correlate trends with rainfall & abstraction data.",
            "Planners: Prioritize recharge structures in vulnerable micro-watersheds.",
            "Policy Makers: Consider regulating extraction if decline persists.",
            "All: Promote efficient irrigation to reduce stress.",
          ]
        : [],
    [kpis]
  );

  const chartPoints = useMemo(() => series.slice(-120), [series]); // cap recent 120 points for clarity

  const dataValues = useMemo(() => chartPoints.map((p) => p.v), [chartPoints]);

  const labels = useMemo(() => {
    const MAX_LABELS = 6;
    if (!chartPoints.length) return [];
    const step = Math.max(1, Math.floor(chartPoints.length / MAX_LABELS));
    return chartPoints.map((p, idx) =>
      idx % step === 0
        ? p.t.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : ""
    );
  }, [chartPoints]);

  // Display subsets
  const displayedInsights = useMemo(
    () => (showAllInsights ? insights : insights.slice(0, 3)),
    [insights, showAllInsights]
  );
  const displayedRecs = useMemo(
    () => (showAllRecs ? recommendations : recommendations.slice(0, 3)),
    [recommendations, showAllRecs]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#075a7dff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{st?.name || st?.code}</Text>
          <Text style={styles.sub}>
            {st?.district}, {st?.state} • {st?.code}
          </Text>
        </View>
      </View>

      <View style={styles.rangeRow}>
        {PERIODS.map((p) => {
          const active = p.key === range;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.rangeChip, active && styles.rangeChipActive]}
              onPress={() => setRange(p.key)}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  active && styles.rangeChipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && (
        <View style={styles.loaderBox}>
          <ActivityIndicator color="#075a7dff" />
          <Text style={styles.loaderText}>Loading data...</Text>
        </View>
      )}

      {error && (
        <TouchableOpacity style={styles.errorBox} onPress={fetchData}>
          <Text style={styles.errorText}>{error} (tap to retry)</Text>
        </TouchableOpacity>
      )}

      {!loading && !error && !series.length && (
        <Text style={styles.noData}>No groundwater data for this range.</Text>
      )}

      {!!series.length && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Groundwater Level (m bgl)</Text>
          <LineChart
            data={{
              labels,
              datasets: [
                { data: dataValues, color: () => "#075a7dff", strokeWidth: 2 },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 2,
              color: (o) => `rgba(0,0,0,${o})`,
              propsForDots: { r: "3", stroke: "#075a7dff", strokeWidth: "1" },
            }}
            style={{ marginTop: 8, borderRadius: 12 }}
          />
        </View>
      )}

      <View style={styles.kpiScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          <View style={styles.kpiCard}>
            <Ionicons name="water-outline" size={16} color="#075a7dff" />
            <Text style={styles.kpiLabel}>Avg</Text>
            <Text style={styles.kpiValue}>
              {kpis ? kpis.avg.toFixed(2) : "--"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Ionicons
              name="trending-down-outline"
              size={16}
              color="#075a7dff"
            />
            <Text style={styles.kpiLabel}>Min</Text>
            <Text style={styles.kpiValue}>
              {kpis ? kpis.min.toFixed(2) : "--"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Ionicons name="trending-up-outline" size={16} color="#075a7dff" />
            <Text style={styles.kpiLabel}>Max</Text>
            <Text style={styles.kpiValue}>
              {kpis ? kpis.max.toFixed(2) : "--"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <MaterialCommunityIcons
              name="chart-line"
              size={16}
              color="#075a7dff"
            />
            <Text style={styles.kpiLabel}>Trend</Text>
            <Text style={styles.kpiValue}>
              {kpis
                ? kpis.trend < 0
                  ? "Decline"
                  : kpis.trend > 0
                  ? "Rise"
                  : "Stable"
                : "--"}
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.alertCard}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        {alerts.map((a, i) => (
          <View key={i} style={styles.alertLine}>
            <Ionicons
              name={
                a.startsWith("No ")
                  ? "checkmark-circle-outline"
                  : "alert-circle-outline"
              }
              size={16}
              color={a.startsWith("No ") ? "#16a34a" : "#dc2626"}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.alertText}>{a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Insights</Text>
        {displayedInsights.map((x, i) => (
          <Text key={i} style={styles.bullet}>
            • {x}
          </Text>
        ))}
        {insights.length > 3 && (
          <Pressable onPress={() => setShowAllInsights((s) => !s)}>
            <Text style={styles.toggleLink}>
              {showAllInsights ? "Show less" : `Show all (${insights.length})`}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Decision Support</Text>
        {displayedRecs.map((r, i) => (
          <Text key={i} style={styles.bullet}>
            • {r}
          </Text>
        ))}
        {recommendations.length > 3 && (
          <Pressable onPress={() => setShowAllRecs((s) => !s)}>
            <Text style={styles.toggleLink}>
              {showAllRecs
                ? "Show less"
                : `Show all (${recommendations.length})`}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: "700", marginTop: 20, color: "#0f172a" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  rangeRow: { flexDirection: "row", marginTop: 16, gap: 8 },
  rangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  rangeChipActive: { backgroundColor: "#075a7dff" },
  rangeChipText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  rangeChipTextActive: { color: "#fff" },
  loaderBox: { marginTop: 40, alignItems: "center" },
  loaderText: { marginTop: 8, color: "#475569" },
  errorBox: {
    marginTop: 40,
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
  },
  errorText: { color: "#b91c1c", textAlign: "center", fontSize: 13 },
  noData: { marginTop: 40, textAlign: "center", color: "#475569" },
  chartCard: {
    marginTop: 24,
    paddingTop: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  kpiScrollWrapper: { marginTop: 20 },
  kpiRow: { gap: 12, paddingRight: 8 },
  kpiCard: {
    width: 90,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 2,
  },
  kpiLabel: { fontSize: 10, color: "#475569" },
  kpiValue: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  alertCard: {
    marginTop: 28,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  alertLine: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  alertText: { fontSize: 12, color: "#7c2d12", flex: 1 },
  block: {
    marginTop: 28,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bullet: { fontSize: 12, color: "#334155", marginTop: 4, lineHeight: 18 },
  toggleLink: {
    marginTop: 10,
    fontSize: 12,
    color: "#075a7dff",
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef6fa",
    marginRight: 10,
  },
});
