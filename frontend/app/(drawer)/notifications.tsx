import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";
import {
  useNotifications,
  NotificationCategory,
  Notification,
} from "../../contexts/NotificationContext";
import { useTranslation } from "react-i18next"; // Changed from useLanguage
import { useTheme } from "../../hooks/useTheme";
import { scale, verticalScale } from "../../utils/styling";

const { width } = Dimensions.get("window");

const NotificationInsights = () => {
  const { notifications } = useNotifications();
  const { t } = useTranslation(); // Changed from useLanguage
  const theme = useTheme();

  // Analytics Data
  const last7Days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayNotifications = notifications.filter((notif: Notification) => {
      const notifDate = new Date(notif.timestamp);
      return notifDate.toDateString() === date.toDateString();
    });
    last7Days.push({
      day: date.toLocaleDateString("en", { weekday: "short" }),
      count: dayNotifications.length,
    });
  }

  const categoryData = [
    {
      name: t("notifications.waterLevels"),
      population: notifications.filter(
        (n: Notification) => n.category === "water_level"
      ).length,
      color: "#007AFF",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: t("notifications.predictions"),
      population: notifications.filter(
        (n: Notification) => n.category === "prediction"
      ).length,
      color: "#FF9500",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: t("notifications.system"),
      population: notifications.filter(
        (n: Notification) => n.category === "system"
      ).length,
      color: "#34C759",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: t("notifications.tips"),
      population: notifications.filter(
        (n: Notification) => n.category === "tip"
      ).length,
      color: "#AF52DE",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ].filter((item) => item.population > 0);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("notifications.overview")}</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title={t("notifications.totalNotifications")}
              value={notifications.length}
              icon="📧"
              color="#007AFF"
              subtitle={t("notifications.allTime")}
            />
            <StatCard
              title={t("notifications.unread")}
              value={notifications.filter((n: Notification) => !n.read).length}
              icon="🔔"
              color="#FF3B30"
              subtitle={t("notifications.needsAttention")}
            />
            <StatCard
              title={t("notifications.criticalAlerts")}
              value={
                notifications.filter((n: Notification) => n.type === "critical")
                  .length
              }
              icon="🚨"
              color="#FF3B30"
              subtitle={t("notifications.highPriority")}
            />
            <StatCard
              title={t("notifications.successUpdates")}
              value={
                notifications.filter((n: Notification) => n.type === "success")
                  .length
              }
              icon="✅"
              color="#34C759"
              subtitle={t("notifications.positiveNews")}
            />
          </View>
        </View>

        {/* Activity Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("notifications.weeklyActivity")}
          </Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: last7Days.map((d) => d.day),
                datasets: [
                  {
                    data: last7Days.map((d) => d.count),
                    strokeWidth: 3,
                  },
                ],
              }}
              width={width - scale(40)}
              height={scale(200)}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
            />
          </View>
        </View>

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("notifications.categoryBreakdown")}
            </Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={categoryData}
                width={width - scale(40)}
                height={scale(220)}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Recent Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("notifications.insights")}</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>
              {t("notifications.waterLevelMonitoring")}
            </Text>
            <Text style={styles.insightText}>
              {
                notifications.filter(
                  (n: Notification) => n.category === "water_level"
                ).length
              }{" "}
              {t("notifications.waterLevelAlertsInWeek")}.
              {notifications.filter(
                (n: Notification) =>
                  n.type === "critical" && n.category === "water_level"
              ).length > 0
                ? ` ${
                    notifications.filter(
                      (n: Notification) =>
                        n.type === "critical" && n.category === "water_level"
                    ).length
                  } ${t("notifications.areCritical")}.`
                : ` ${t("notifications.allLevelsNormal")}.`}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>
              {t("notifications.aiPredictions")}
            </Text>
            <Text style={styles.insightText}>
              {t("notifications.aiGenerated")}{" "}
              {
                notifications.filter(
                  (n: Notification) => n.category === "prediction"
                ).length
              }{" "}
              {t("notifications.predictiveAlerts")}.
              {t("notifications.helpPrepare")}.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>
              {t("notifications.performance")}
            </Text>
            <Text style={styles.insightText}>
              {t("notifications.systemOptimal")}.{" "}
              {t("notifications.averageResponseTime")}.
              {t("notifications.latestData")}{" "}
              {notifications.length > 0
                ? new Date(notifications[0].timestamp).toLocaleString()
                : "N/A"}
              .
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("notifications.quickActions")}
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: "#E5F3FF" }]}
            >
              <Text style={styles.actionIcon}>🔧</Text>
              <Text style={styles.actionTitle}>
                {t("notifications.settings")}
              </Text>
              <Text style={styles.actionSubtitle}>
                {t("notifications.configureAlerts")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: "#E5F7E5" }]}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>
                {t("notifications.reports")}
              </Text>
              <Text style={styles.actionSubtitle}>
                {t("notifications.generateAnalysis")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: "#FFF2E5" }]}
            >
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionTitle}>
                {t("notifications.filters")}
              </Text>
              <Text style={styles.actionSubtitle}>
                {t("notifications.customizeView")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: "#FFE5E5" }]}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionTitle}>
                {t("notifications.export")}
              </Text>
              <Text style={styles.actionSubtitle}>
                {t("notifications.shareData")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: scale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: scale(25),
  },
  sectionTitle: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#333333",
    marginHorizontal: scale(20),
    marginBottom: scale(15),
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: scale(10),
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    width: (width - scale(60)) / 2,
    margin: scale(10),
    padding: scale(15),
    borderRadius: scale(12),
    borderLeftWidth: scale(4),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    fontSize: scale(24),
    marginRight: scale(12),
  },
  statValue: {
    fontSize: scale(24),
    fontWeight: "bold",
    color: "#333333",
  },
  statTitle: {
    fontSize: scale(12),
    color: "#666666",
    marginTop: scale(2),
  },
  statSubtitle: {
    fontSize: scale(10),
    color: "#999999",
    marginTop: scale(1),
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(20),
    borderRadius: scale(12),
    padding: scale(10),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chart: {
    borderRadius: scale(12),
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(20),
    marginBottom: scale(12),
    padding: scale(16),
    borderRadius: scale(12),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#333333",
    marginBottom: scale(8),
  },
  insightText: {
    fontSize: scale(14),
    color: "#666666",
    lineHeight: scale(20),
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: scale(10),
  },
  actionCard: {
    width: (width - scale(60)) / 2,
    margin: scale(10),
    padding: scale(20),
    borderRadius: scale(12),
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: scale(32),
    marginBottom: scale(8),
  },
  actionTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#333333",
    marginBottom: scale(4),
  },
  actionSubtitle: {
    fontSize: scale(12),
    color: "#666666",
    textAlign: "center",
  },
});

export default NotificationInsights;
