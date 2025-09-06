
// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, Image } from "react-native";
// import { LineChart, BarChart } from 'react-native-chart-kit';
// import * as Location from 'expo-location';
// // For map visualization, you need to install react-native-webview
// import { WebView } from 'react-native-webview';

// const GOV_LOGO = { uri: 'https://i.pinimg.com/1200x/f7/f5/c4/f7f5c4ea5fbb290e269e193dfa6a3796.jpg' };

// const sampleWellData = {
//   currentLevel: 6.2,
//   trend: -2.4,
//   rechargeStatus: 'Moderate',
//   rechargeValue: 45,
//   rainfallForecast: 25,
//   alert: 'District XYZ showing critically low levels',
//   trendData: {
//     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
//     datasets: [
//       {
//         data: [8.5, 7.8, 7.2, 6.8, 6.5, 6.2],
//         color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
//         strokeWidth: 2
//       }
//     ]
//   },
//   rechargeData: {
//     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
//     datasets: [
//       {
//         data: [30, 35, 40, 45, 42, 45]
//       }
//     ]
//   },
//   regions: [
//     { id: '1', name: 'National', lat: 20.5937, lng: 78.9629, level: 5.8, status: 'normal', totalStations: 31574, monitoredStations: 16346 },
//     { id: '2', name: 'Maharashtra', lat: 19.7515, lng: 75.7139, level: 7.2, status: 'normal', totalStations: 2492, monitoredStations: 2180 },
//     { id: '3', name: 'Rajasthan', lat: 27.0238, lng: 74.2179, level: 3.1, status: 'critical', totalStations: 1875, monitoredStations: 1080 },
//     { id: '4', name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, level: 8.5, status: 'good', totalStations: 1586, monitoredStations: 1162 },
//     { id: '5', name: 'Punjab', lat: 31.1471, lng: 75.3412, level: 4.2, status: 'warning', totalStations: 1450, monitoredStations: 546 },
//   ]
// };

// const policyMetrics = {
//   currentYear: 72,
//   lastYear: 68,
//   target: 80,
//   improvements: ['15% increase in recharge', '20 new monitoring wells', '5 drought-resistant initiatives']
// };

// const farmerGuidance = {
//   waterAvailability: 'Moderate',
//   recommendedCrops: ['Millet', 'Sorghum', 'Pulses'],
//   advice: 'Consider drip irrigation for water efficiency',
//   weatherAlerts: ['Heat wave expected next week', 'Light rainfall predicted in 3 days']
// };

// export default function Dashboard() {
//   const [selectedRegion, setSelectedRegion] = useState('National');
//   const [selectedRole, setSelectedRole] = useState('Policymaker');
//   const [location, setLocation] = useState(null);
//   const [errorMsg, setErrorMsg] = useState(null);
//   const [wellData, setWellData] = useState(sampleWellData);

//   const roles = ['Policymaker', 'Researcher', 'Farmer'];

//   useEffect(() => {
//     (async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         setErrorMsg('Permission to access location was denied');
//         return;
//       }
//       let location = await Location.getCurrentPositionAsync({});
//       setLocation(location);
//     })();
//   }, []);

//   const handleRegionChange = (region) => {
//     setSelectedRegion(region);
//     Alert.alert('Region Changed', `Now viewing data for ${region}`);
//   };

//   const handleWellSelect = (well) => {
//     Alert.alert('Region Selected', `Region: ${well.name}\nLevel: ${well.level}m\nStatus: ${well.status}\nTotal Stations: ${well.totalStations}\nMonitored: ${well.monitoredStations}`);
//   };

//   const renderRegionStatus = (status) => {
//     switch (status) {
//       case 'critical': return { color: '#dc3545', label: 'Critical' };
//       case 'warning': return { color: '#ffc107', label: 'Warning' };
//       case 'good': return { color: '#28a745', label: 'Good' };
//       default: return { color: '#17a2b8', label: 'Normal' };
//     }
//   };

//   const chartConfig = {
//     backgroundColor: '#ffffff',
//     backgroundGradientFrom: '#f8f9fa',
//     backgroundGradientTo: '#f8f9fa',
//     decimalPlaces: 1,
//     color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
//     labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//     style: {
//       borderRadius: 16,
//     },
//     propsForDots: {
//       r: '4',
//       strokeWidth: '2',
//       stroke: '#007AFF'
//     }
//   };

//   const renderRoleSpecificContent = () => {
//     switch (selectedRole) {
//       case 'Policymaker':
//         return (
//           <View style={styles.roleContent}>
//             <Text style={styles.roleTitle}>Policy Metrics & Insights</Text>
//             <View style={styles.metricCard}>
//               <Text style={styles.metricTitle}>Groundwater Sustainability Index</Text>
//               <View style={styles.progressBar}>
//                 <View style={[styles.progressFill, { width: `${policyMetrics.currentYear}%` }]} />
//               </View>
//               <View style={styles.metricValues}>
//                 <Text style={styles.metricValue}>{policyMetrics.currentYear}%</Text>
//                 <Text style={styles.metricTarget}>Target: {policyMetrics.target}%</Text>
//               </View>
//               <Text style={styles.metricComparison}>Last year: {policyMetrics.lastYear}%</Text>
//             </View>
//             <Text style={styles.subtitle}>Recent Improvements:</Text>
//             {policyMetrics.improvements.map((item, index) => (
//               <View key={index} style={styles.improvementItem}>
//                 <View style={styles.bulletPoint} />
//                 <Text style={styles.improvementText}>{item}</Text>
//               </View>
//             ))}
//           </View>
//         );
//       case 'Researcher':
//         return (
//           <View style={styles.roleContent}>
//             <Text style={styles.roleTitle}>Data Analysis Tools</Text>
//             <View style={styles.dataTools}>
//               <TouchableOpacity style={styles.toolButton}>
//                 <Text style={styles.toolButtonText}>Export Data</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.toolButton}>
//                 <Text style={styles.toolButtonText}>Compare Regions</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.toolButton}>
//                 <Text style={styles.toolButtonText}>Generate Report</Text>
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.subtitle}>Historical Trends</Text>
//             <LineChart
//               data={wellData.trendData}
//               width={Dimensions.get('window').width - 32}
//               height={220}
//               chartConfig={chartConfig}
//               bezier
//               style={styles.chart}
//             />
//           </View>
//         );
//       case 'Farmer':
//         return (
//           <View style={styles.roleContent}>
//             <Text style={styles.roleTitle}>Farm Guidance</Text>
//             <View style={styles.guidanceCard}>
//               <Text style={styles.guidanceText}>Water Availability: <Text style={styles.guidanceValue}>{farmerGuidance.waterAvailability}</Text></Text>
//               <Text style={styles.subtitle}>Recommended Crops:</Text>
//               {farmerGuidance.recommendedCrops.map((crop, index) => (
//                 <View key={index} style={styles.cropItem}>
//                   <View style={styles.bulletPoint} />
//                   <Text style={styles.cropText}>{crop}</Text>
//                 </View>
//               ))}
//               <Text style={styles.advice}>{farmerGuidance.advice}</Text>
//             </View>
//             <Text style={styles.subtitle}>Weather Alerts:</Text>
//             {farmerGuidance.weatherAlerts.map((alert, index) => (
//               <View key={index} style={styles.alertItem}>
//                 <Text style={styles.alertIcon}>⚠️</Text>
//                 <Text style={styles.alertText}>{alert}</Text>
//               </View>
//             ))}
//           </View>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <View style={styles.headerLeft}>
//             <Image source={GOV_LOGO} style={styles.headerLogo} resizeMode="contain" />
//             <View>
//               <Text style={styles.headerMainTitle}>Ministry of Jal Shakti</Text>
//               <Text style={styles.headerSubTitle}>Groundwater Monitoring Dashboard</Text>
//             </View>
//           </View>
//           <View style={styles.headerRight}>
//             <TouchableOpacity
//               style={styles.regionSelector}
//               onPress={() => {
//                 Alert.alert(
//                   'Select Region',
//                   'Choose a region to view data',
//                   wellData.regions.map(region => ({
//                     text: region.name,
//                     onPress: () => handleRegionChange(region.name)
//                   }))
//                 );
//               }}
//             >
//               <Text style={styles.regionText}>{selectedRegion}</Text>
//               <Text style={styles.dropdownIcon}>▼</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.notificationButton}>
//               <Text style={styles.notificationIcon}>🔔</Text>
//               <View style={styles.notificationBadge} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       {/* Role Switcher */}
//       <View style={styles.roleSwitcher}>
//         {roles.map((role) => (
//           <TouchableOpacity
//             key={role}
//             style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
//             onPress={() => setSelectedRole(role)}
//           >
//             <Text style={[styles.roleText, selectedRole === role && styles.roleTextActive]}>
//               {role}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <ScrollView style={styles.content}>
//         {/* Snapshot Cards */}
//         <View style={styles.snapshotSection}>
//           <View style={styles.snapshotCard}>
//             <View style={styles.cardIconContainer}>
//               <Text style={styles.cardIcon}>📊</Text>
//             </View>
//             <Text style={styles.cardTitle}>Current Groundwater Level</Text>
//             <Text style={styles.cardValue}>{wellData.currentLevel} m</Text>
//             <Text style={[styles.cardTrend, wellData.trend < 0 ? styles.negativeTrend : styles.positiveTrend]}>
//               {wellData.trend > 0 ? '↑' : '↓'} {Math.abs(wellData.trend)}% this week
//             </Text>
//           </View>

//           <View style={styles.snapshotCard}>
//             <View style={styles.cardIconContainer}>
//               <Text style={styles.cardIcon}>💦</Text>
//             </View>
//             <Text style={styles.cardTitle}>Recharge Status</Text>
//             <Text style={styles.cardValue}>{wellData.rechargeStatus}</Text>
//             <Text style={styles.cardTrend}>{wellData.rechargeValue}% capacity</Text>
//           </View>

//           <View style={styles.snapshotCard}>
//             <View style={styles.cardIconContainer}>
//               <Text style={styles.cardIcon}>🌧️</Text>
//             </View>
//             <Text style={styles.cardTitle}>Rainfall Forecast</Text>
//             <Text style={styles.cardValue}>{wellData.rainfallForecast} mm</Text>
//             <Text style={styles.cardTrend}>Next 48 hours</Text>
//           </View>
//         </View>

//         {/* Critical Alert */}
//         <View style={styles.alertCard}>
//           <View style={styles.alertHeader}>
//             <Text style={styles.alertIcon}>🚨</Text>
//             <Text style={styles.alertTitle}>Critical Region Alert</Text>
//           </View>
//           <Text style={styles.alertMessage}>{wellData.alert}</Text>
//           <TouchableOpacity style={styles.alertButton}>
//             <Text style={styles.alertButtonText}>View Details</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Region Status Overview */}
//         <View style={styles.regionSection}>
//           <Text style={styles.sectionTitle}>Region Status Overview</Text>
//           <View style={styles.mapChartRow}>
//             {/* Map using OpenStreetMap in WebView */}
//             <View style={styles.mapContainer}>
//               <WebView
//                 source={{ uri: 'https://www.openstreetmap.org/export/embed.html?bbox=67.0,7.5,97.0,37.0&layer=mapnik' }}
//                 style={styles.mapWebview}
//                 javaScriptEnabled
//                 domStorageEnabled
//                 scrollEnabled={false}
//               />
//             </View>
//             {/* Chart */}
//             <View style={styles.regionStatsPanel}>
//               <Text style={styles.statsPanelTitle}>State Wise Station Count</Text>
//               <BarChart
//                 data={{
//                   labels: wellData.regions.map(r => r.name),
//                   datasets: [
//                     {
//                       data: wellData.regions.map(r => r.totalStations),
//                       color: () => '#17a2b8',
//                     },
//                     {
//                       data: wellData.regions.map(r => r.monitoredStations),
//                       color: () => '#ffc107',
//                     }
//                   ],
//                   legend: ['Total Stations', 'Monitored Stations']
//                 }}
//                 width={Dimensions.get('window').width / 1.7}
//                 height={220}
//                 yAxisLabel=""
//                 yAxisSuffix=""
//                 fromZero
//                 chartConfig={{
//                   ...chartConfig,
//                   backgroundColor: '#fff',
//                   backgroundGradientFrom: '#fff',
//                   backgroundGradientTo: '#fff',
//                   color: (opacity = 1) => `rgba(0, 85, 165, ${opacity})`,
//                   labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
//                   propsForBackgroundLines: { stroke: "#e6e6e6" },
//                   barPercentage: 0.5,
//                 }}
//                 style={styles.chart}
//                 verticalLabelRotation={30}
//                 showBarTops={false}
//                 withInnerLines={true}
//               />
//             </View>
//           </View>
//           {/* Region List */}
//           <View style={styles.regionGrid}>
//             {wellData.regions.map(region => {
//               const status = renderRegionStatus(region.status);
//               return (
//                 <TouchableOpacity
//                   key={region.id}
//                   style={[styles.regionCard, { borderLeftColor: status.color }]}
//                   onPress={() => handleWellSelect(region)}
//                 >
//                   <Text style={styles.regionName}>{region.name}</Text>
//                   <Text style={styles.regionLevel}>{region.level}m</Text>
//                   <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
//                     <Text style={styles.statusText}>{status.label}</Text>
//                   </View>
//                   <Text style={styles.regionStations}>Total: {region.totalStations}</Text>
//                   <Text style={styles.regionStationsMon}>Monitored: {region.monitoredStations}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         </View>

//         {/* Trend Graph */}
//         <View style={styles.graphSection}>
//           <Text style={styles.sectionTitle}>Trend Analysis</Text>
//           <BarChart
//             data={wellData.rechargeData}
//             width={Dimensions.get('window').width - 32}
//             height={220}
//             yAxisLabel=""
//             yAxisSuffix="%"
//             chartConfig={chartConfig}
//             style={styles.chart}
//           />
//         </View>

//         {/* Role-specific content */}
//         {renderRoleSpecificContent()}

//         {/* Quick Navigation */}
//         <View style={styles.navigationSection}>
//           <Text style={styles.sectionTitle}>Quick Access</Text>
//           <View style={styles.navCards}>
//             <TouchableOpacity style={styles.navCard}>
//               <Text style={styles.navCardIcon}>📊</Text>
//               <Text style={styles.navCardTitle}>Policy Insights</Text>
//               <Text style={styles.navCardDesc}>Forecasts and policy metrics</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.navCard}>
//               <Text style={styles.navCardIcon}>🔍</Text>
//               <Text style={styles.navCardTitle}>Data Explorer</Text>
//               <Text style={styles.navCardDesc}>Charts, exports, and filters</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.navCard}>
//               <Text style={styles.navCardIcon}>👨‍🌾</Text>
//               <Text style={styles.navCardTitle}>Farmer Guidance</Text>
//               <Text style={styles.navCardDesc}>Crop advisories and alerts</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Footer */}
//         <View style={styles.footer}>
//           <View style={styles.footerContent}>
//             <View style={styles.footerSection}>
//               <Image source={GOV_LOGO} style={styles.footerLogo} resizeMode="contain" />
//               <Text style={styles.footerTitle}>Ministry of Jal Shakti</Text>
//               <Text style={styles.footerText}>National Groundwater Management Program</Text>
//               <Text style={styles.footerText}>© 2023 Government of India</Text>
//             </View>
//             <View style={styles.footerSection}>
//               <Text style={styles.footerSubtitle}>Initiatives</Text>
//               <Text style={styles.footerLink}>• National Water Scheme</Text>
//               <Text style={styles.footerLink}>• Community support programs</Text>
//               <Text style={styles.footerLink}>• FAQ & Help center</Text>
//             </View>
//             <View style={styles.footerSection}>
//               <Text style={styles.footerSubtitle}>Support</Text>
//               <Text style={styles.footerText}>Supported by 5,260 DWLR stations across India</Text>
//               <Text style={styles.footerContact}>contact@jal-shakti.gov.in</Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   header: {
//     backgroundColor: '#003366',
//     borderBottomWidth: 2,
//     borderBottomColor: '#0055a5',
//     paddingVertical: 14,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerLogo: {
//     width: 48,
//     height: 48,
//     marginRight: 16,
//   },
//   headerMainTitle: {
//     color: '#fff',
//     fontSize: 22,
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   },
//   headerSubTitle: {
//     color: '#cce6ff',
//     fontSize: 14,
//     fontWeight: '500',
//     marginTop: 2,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 16,
//   },
//   regionSelector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e6f7ff',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#b3d8f7',
//   },
//   regionText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#003366',
//     marginRight: 4,
//   },
//   dropdownIcon: {
//     fontSize: 12,
//     color: '#0055a5',
//   },
//   notificationButton: {
//     position: 'relative',
//     padding: 8,
//   },
//   notificationIcon: {
//     fontSize: 22,
//     color: '#fff',
//   },
//   notificationBadge: {
//     position: 'absolute',
//     top: 6,
//     right: 6,
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#dc3545',
//   },
//   roleSwitcher: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     padding: 8,
//     marginHorizontal: 24,
//     marginTop: 18,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   roleButton: {
//     flex: 1,
//     padding: 12,
//     alignItems: 'center',
//     borderRadius: 6,
//   },
//   roleButtonActive: {
//     backgroundColor: '#0055a5',
//   },
//   roleText: {
//     color: '#003366',
//     fontWeight: '500',
//   },
//   roleTextActive: {
//     color: '#fff',
//     fontWeight: '600',
//   },
//   content: {
//     flex: 1,
//   },
//   snapshotSection: {
//     flexDirection: 'row',
//     padding: 24,
//     gap: 16,
//   },
//   snapshotCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 18,
//     borderRadius: 14,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//     alignItems: 'center',
//   },
//   cardIconContainer: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: '#e6f7ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   cardIcon: {
//     fontSize: 22,
//   },
//   cardTitle: {
//     fontSize: 13,
//     color: '#0055a5',
//     marginBottom: 8,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   cardValue: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#003366',
//     marginBottom: 4,
//   },
//   cardTrend: {
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   negativeTrend: {
//     color: '#dc3545',
//   },
//   positiveTrend: {
//     color: '#28a745',
//   },
//   alertCard: {
//     backgroundColor: '#fff3cd',
//     marginHorizontal: 24,
//     padding: 18,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: '#ffeaa7',
//     marginBottom: 18,
//   },
//   alertHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   alertIcon: {
//     fontSize: 22,
//     marginRight: 8,
//   },
//   alertTitle: {
//     fontWeight: '700',
//     color: '#856404',
//     fontSize: 16,
//   },
//   alertMessage: {
//     color: '#856404',
//     marginBottom: 12,
//     fontSize: 14,
//   },
//   alertButton: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 14,
//     paddingVertical: 7,
//     backgroundColor: '#ffc107',
//     borderRadius: 4,
//   },
//   alertButtonText: {
//     color: '#856404',
//     fontWeight: '500',
//     fontSize: 13,
//   },
//   regionSection: {
//     backgroundColor: '#fff',
//     padding: 24,
//     marginBottom: 18,
//     borderRadius: 14,
//     marginHorizontal: 24,
//   },
//   sectionTitle: {
//     fontSize: 19,
//     fontWeight: '700',
//     color: '#003366',
//     marginBottom: 18,
//   },
//   mapChartRow: {
//     flexDirection: 'row',
//     marginBottom: 18,
//     gap: 16,
//   },
//   mapContainer: {
//     flex: 1,
//     height: 220,
//     borderRadius: 10,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#e6e6e6',
//     marginRight: 8,
//   },
//   mapWebview: {
//     flex: 1,
//     height: 220,
//     borderRadius: 10,
//   },
//   regionStatsPanel: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minWidth: 220,
//     minHeight: 220,
//     borderWidth: 1,
//     borderColor: '#e6e6e6',
//   },
//   statsPanelTitle: {
//     color: '#003366',
//     fontWeight: '700',
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   chart: {
//     borderRadius: 10,
//     marginVertical: 8,
//   },
//   regionGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 16,
//     marginTop: 12,
//   },
//   regionCard: {
//     width: '30%',
//     backgroundColor: '#f8f9fa',
//     padding: 18,
//     borderRadius: 10,
//     borderLeftWidth: 5,
//     marginBottom: 10,
//     marginRight: 10,
//   },
//   regionName: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#003366',
//     marginBottom: 4,
//   },
//   regionLevel: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#0055a5',
//     marginBottom: 8,
//   },
//   regionStations: {
//     fontSize: 13,
//     color: '#17a2b8',
//     fontWeight: '600',
//   },
//   regionStationsMon: {
//     fontSize: 13,
//     color: '#ffc107',
//     fontWeight: '600',
//   },
//   statusBadge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 12,
//     marginTop: 2,
//   },
//   statusText: {
//     fontSize: 11,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   graphSection: {
//     backgroundColor: '#fff',
//     padding: 24,
//     marginBottom: 18,
//     borderRadius: 14,
//     marginHorizontal: 24,
//   },
//   roleContent: {
//     backgroundColor: '#fff',
//     padding: 24,
//     marginBottom: 18,
//     borderRadius: 14,
//     marginHorizontal: 24,
//   },
//   roleTitle: {
//     fontSize: 19,
//     fontWeight: '700',
//     color: '#003366',
//     marginBottom: 18,
//   },
//   metricCard: {
//     backgroundColor: '#f8f9fa',
//     padding: 18,
//     borderRadius: 10,
//     marginBottom: 18,
//   },
//   metricTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#0055a5',
//     marginBottom: 12,
//   },
//   progressBar: {
//     height: 10,
//     backgroundColor: '#e9ecef',
//     borderRadius: 5,
//     marginBottom: 12,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#0055a5',
//     borderRadius: 5,
//   },
//   metricValues: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   metricValue: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#003366',
//   },
//   metricTarget: {
//     fontSize: 15,
//     color: '#6c757d',
//   },
//   metricComparison: {
//     fontSize: 13,
//     color: '#6c757d',
//   },
//   improvementItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   bulletPoint: {
//     width: 7,
//     height: 7,
//     borderRadius: 3.5,
//     backgroundColor: '#0055a5',
//     marginRight: 8,
//   },
//   improvementText: {
//     fontSize: 15,
//     color: '#495057',
//   },
//   dataTools: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   toolButton: {
//     backgroundColor: '#e6f7ff',
//     padding: 14,
//     borderRadius: 8,
//     flex: 1,
//     marginHorizontal: 4,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#b3d8f7',
//   },
//   toolButtonText: {
//     fontSize: 13,
//     fontWeight: '500',
//     color: '#0055a5',
//   },
//   guidanceCard: {
//     backgroundColor: '#f8f9fa',
//     padding: 18,
//     borderRadius: 10,
//     marginBottom: 18,
//   },
//   guidanceText: {
//     fontSize: 15,
//     color: '#495057',
//     marginBottom: 12,
//   },
//   guidanceValue: {
//     fontWeight: '600',
//     color: '#0055a5',
//   },
//   cropItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   cropText: {
//     fontSize: 15,
//     color: '#495057',
//   },
//   advice: {
//     fontSize: 15,
//     fontStyle: 'italic',
//     color: '#6c757d',
//     marginTop: 12,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#dee2e6',
//   },
//   alertItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//     backgroundColor: '#fff3cd',
//     padding: 8,
//     borderRadius: 4,
//   },
//   alertText: {
//     fontSize: 15,
//     color: '#856404',
//     flex: 1,
//   },
//   navigationSection: {
//     backgroundColor: '#fff',
//     padding: 24,
//     marginBottom: 18,
//     borderRadius: 14,
//     marginHorizontal: 24,
//   },
//   navCards: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   navCard: {
//     flex: 1,
//     backgroundColor: '#e6f7ff',
//     padding: 18,
//     borderRadius: 10,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#b3d8f7',
//   },
//   navCardIcon: {
//     fontSize: 26,
//     marginBottom: 8,
//   },
//   navCardTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#003366',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   navCardDesc: {
//     fontSize: 13,
//     color: '#0055a5',
//     textAlign: 'center',
//   },
//   footer: {
//     backgroundColor: '#003366',
//     padding: 32,
//     borderTopWidth: 2,
//     borderTopColor: '#0055a5',
//     marginTop: 24,
//   },
//   footerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     flexWrap: 'wrap',
//   },
//   footerSection: {
//     width: '30%',
//     marginBottom: 16,
//     alignItems: 'flex-start',
//   },
//   footerLogo: {
//     width: 38,
//     height: 38,
//     marginBottom: 8,
//   },
//   footerTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   footerSubtitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#cce6ff',
//     marginBottom: 8,
//   },
//   footerText: {
//     fontSize: 12,
//     color: '#cce6ff',
//     marginBottom: 4,
//   },
//   footerLink: {
//     fontSize: 12,
//     color: '#ffd93d',
//     marginBottom: 4,
//   },
//   footerContact: {
//     fontSize: 12,
//     color: '#cce6ff',
//     marginTop: 8,
//   },
// });





import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, Image } from "react-native";
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

// Replace with your actual logo path
//import JalShaktiLogo from '../../../assets/jalshakti-logo.png'; // <-- update this path

const sampleWellData = {
  currentLevel: 6.2,
  trend: -2.4,
  rechargeStatus: 'Moderate',
  rechargeValue: 45,
  rainfallForecast: 25,
  alert: 'District XYZ showing critically low levels',
  trendData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [8.5, 7.8, 7.2, 6.8, 6.5, 6.2],
        color: (opacity = 1) => `rgba(0, 180, 216, ${opacity})`,
        strokeWidth: 2
      }
    ]
  },
  rechargeData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [30, 35, 40, 45, 42, 45]
      }
    ]
  },
  regions: [
    { id: '1', name: 'National', lat: 20.5937, lng: 78.9629, level: 5.8, status: 'normal', totalStations: 31574, monitoredStations: 16346 },
    { id: '2', name: 'Maharashtra', lat: 19.7515, lng: 75.7139, level: 7.2, status: 'normal', totalStations: 2492, monitoredStations: 2180 },
    { id: '3', name: 'Rajasthan', lat: 27.0238, lng: 74.2179, level: 3.1, status: 'critical', totalStations: 1875, monitoredStations: 1080 },
    { id: '4', name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, level: 8.5, status: 'good', totalStations: 1586, monitoredStations: 1162 },
    { id: '5', name: 'Punjab', lat: 31.1471, lng: 75.3412, level: 4.2, status: 'warning', totalStations: 1450, monitoredStations: 546 },
  ]
};

const policyMetrics = {
  currentYear: 72,
  lastYear: 68,
  target: 80,
  improvements: ['15% increase in recharge', '20 new monitoring wells', '5 drought-resistant initiatives']
};

const farmerGuidance = {
  waterAvailability: 'Moderate',
  recommendedCrops: ['Millet', 'Sorghum', 'Pulses'],
  advice: 'Consider drip irrigation for water efficiency',
  weatherAlerts: ['Heat wave expected next week', 'Light rainfall predicted in 3 days']
};

export default function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState('National');
  const [selectedRole, setSelectedRole] = useState('Policymaker');
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [wellData, setWellData] = useState(sampleWellData);

  const roles = ['Policymaker', 'Researcher', 'Farmer'];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    Alert.alert('Region Changed', `Now viewing data for ${region}`);
  };

  const handleWellSelect = (well) => {
    Alert.alert('Region Selected', `Region: ${well.name}\nLevel: ${well.level}m\nStatus: ${well.status}\nTotal Stations: ${well.totalStations}\nMonitored: ${well.monitoredStations}`);
  };

  const renderRegionStatus = (status) => {
    switch (status) {
      case 'critical': return { color: '#ff4d6d', label: 'Critical' };
      case 'warning': return { color: '#ffd166', label: 'Warning' };
      case 'good': return { color: '#06d6a0', label: 'Good' };
      default: return { color: '#00b4d8', label: 'Normal' };
    }
  };

  const chartConfig = {
    backgroundColor: '#f6fbfd',
    backgroundGradientFrom: '#f6fbfd',
    backgroundGradientTo: '#f6fbfd',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 180, 216, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(30, 42, 61, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#00b4d8'
    }
  };

  const renderRoleSpecificContent = () => {
    switch (selectedRole) {
      case 'Policymaker':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>Policy Metrics & Insights</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Groundwater Index</Text>
                <Text style={styles.metricValue}>{policyMetrics.currentYear}%</Text>
                <Text style={styles.metricSub}>Target: {policyMetrics.target}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Last Year</Text>
                <Text style={styles.metricValue}>{policyMetrics.lastYear}%</Text>
              </View>
            </View>
            <Text style={styles.roleSubTitle}>Recent Improvements</Text>
            <View style={styles.improvementsList}>
              {policyMetrics.improvements.map((item, idx) => (
                <Text key={idx} style={styles.improvementItem}>• {item}</Text>
              ))}
            </View>
          </View>
        );
      case 'Researcher':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>Data Analysis Tools</Text>
            <View style={styles.metricsRow}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Export Data</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Compare Regions</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Generate Report</Text></TouchableOpacity>
            </View>
            <Text style={styles.roleSubTitle}>Historical Trends</Text>
            <LineChart
              data={wellData.trendData}
              width={Dimensions.get('window').width - 48}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        );
      case 'Farmer':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>Farm Guidance</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Water Availability</Text>
                <Text style={styles.metricValue}>{farmerGuidance.waterAvailability}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Advice</Text>
                <Text style={styles.metricValue}>{farmerGuidance.advice}</Text>
              </View>
            </View>
            <Text style={styles.roleSubTitle}>Recommended Crops</Text>
            <View style={styles.improvementsList}>
              {farmerGuidance.recommendedCrops.map((crop, idx) => (
                <Text key={idx} style={styles.improvementItem}>• {crop}</Text>
              ))}
            </View>
            <Text style={styles.roleSubTitle}>Weather Alerts</Text>
            <View style={styles.improvementsList}>
              {farmerGuidance.weatherAlerts.map((alert, idx) => (
                <Text key={idx} style={styles.improvementItem}>⚠️ {alert}</Text>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          {/*<Image source={JalShaktiLogo} style={styles.logoImg} resizeMode="contain" />*/}
        </View>
        <View>
          <Text style={styles.headerTitle}>JAL SHAKTI</Text>
          <Text style={styles.headerSubTitle}>Groundwater Monitoring Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.regionSelector}
            onPress={() => {
              Alert.alert(
                'Select Region',
                'Choose a region to view data',
                wellData.regions.map(region => ({
                  text: region.name,
                  onPress: () => handleRegionChange(region.name)
                }))
              );
            }}
          >
            <Text style={styles.regionText}>{selectedRegion}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Switcher */}
      <View style={styles.roleSwitcher}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.roleBtn, selectedRole === role && styles.roleBtnActive]}
            onPress={() => setSelectedRole(role)}
          >
            <Text style={[styles.roleBtnText, selectedRole === role && styles.roleBtnTextActive]}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Top Stats */}
        <View style={styles.topStatsRow}>
          <View style={styles.topStatBox}>
            <Text style={styles.topStatLabel}>Current Level</Text>
            <Text style={styles.topStatValue}>{wellData.currentLevel} m</Text>
            <Text style={[styles.topStatTrend, wellData.trend < 0 ? styles.negativeTrend : styles.positiveTrend]}>
              {wellData.trend > 0 ? '↑' : '↓'} {Math.abs(wellData.trend)}% this week
            </Text>
          </View>
          <View style={styles.topStatBox}>
            <Text style={styles.topStatLabel}>Recharge Status</Text>
            <Text style={styles.topStatValue}>{wellData.rechargeStatus}</Text>
            <Text style={styles.topStatSub}>{wellData.rechargeValue}% capacity</Text>
          </View>
          <View style={styles.topStatBox}>
            <Text style={styles.topStatLabel}>Rainfall Forecast</Text>
            <Text style={styles.topStatValue}>{wellData.rainfallForecast} mm</Text>
            <Text style={styles.topStatSub}>Next 48 hours</Text>
          </View>
        </View>

        {/* Alert */}
        <View style={styles.alertSection}>
          <Text style={styles.alertIcon}>🚨</Text>
          <Text style={styles.alertText}>{wellData.alert}</Text>
          <TouchableOpacity style={styles.alertBtn}>
            <Text style={styles.alertBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Region Status Overview */}
        <View style={styles.regionOverviewRow}>
          <View style={styles.regionStatsCol}>
            <Text style={styles.regionStatsTitle}>State Wise Station Count</Text>
            <BarChart
              data={{
                labels: wellData.regions.map(r => r.name),
                datasets: [
                  {
                    data: wellData.regions.map(r => r.totalStations),
                    color: () => '#00b4d8',
                  },
                  {
                    data: wellData.regions.map(r => r.monitoredStations),
                    color: () => '#48cae4',
                  }
                ],
                legend: ['Total Stations', 'Monitored Stations']
              }}
              width={Dimensions.get('window').width * 0.48}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              chartConfig={{
                ...chartConfig,
                backgroundColor: '#f6fbfd',
                backgroundGradientFrom: '#f6fbfd',
                backgroundGradientTo: '#f6fbfd',
                color: (opacity = 1) => `rgba(0, 180, 216, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(30,42,61,${opacity})`,
                propsForBackgroundLines: { stroke: "#e6e6e6" },
                barPercentage: 0.5,
              }}
              style={styles.chart}
              verticalLabelRotation={30}
              showBarTops={false}
              withInnerLines={true}
            />
            <View style={styles.regionList}>
              {wellData.regions.map(region => {
                const status = renderRegionStatus(region.status);
                return (
                  <TouchableOpacity
                    key={region.id}
                    style={styles.regionListItem}
                    onPress={() => handleWellSelect(region)}
                  >
                    <View style={[styles.regionStatusDot, { backgroundColor: status.color }]} />
                    <Text style={styles.regionListName}>{region.name}</Text>
                    <Text style={styles.regionListLevel}>{region.level}m</Text>
                    <Text style={styles.regionListStations}>{region.monitoredStations}/{region.totalStations}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.regionMapCol}>
            <Text style={styles.regionStatsTitle}>Map Overview</Text>
            <View style={styles.mapContainer}>
              <WebView
                source={{ uri: 'https://www.openstreetmap.org/export/embed.html?bbox=67.0,7.5,97.0,37.0&layer=mapnik' }}
                style={styles.mapWebview}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
              />
            </View>
          </View>
        </View>

        {/* Trend Graph */}
        <View style={styles.trendSection}>
          <Text style={styles.regionStatsTitle}>Recharge Trend</Text>
          <BarChart
            data={wellData.rechargeData}
            width={Dimensions.get('window').width - 48}
            height={180}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Role-specific content */}
        {renderRoleSpecificContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Jal Shakti | National Groundwater Management Program</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbfd" },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    justifyContent: 'space-between',
    gap: 18,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#00b4d8',
  },
  logoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b4d8',
    letterSpacing: 1,
  },
  headerSubTitle: {
    fontSize: 14,
    color: '#22223b',
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  regionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b3e0f7',
    marginRight: 8,
  },
  regionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00b4d8',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#00b4d8',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 22,
    color: '#00b4d8',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d6d',
  },
  roleSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#e0f7fa',
    padding: 8,
    marginHorizontal: 32,
    marginTop: 18,
    borderRadius: 8,
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  roleBtnActive: {
    backgroundColor: '#00b4d8',
  },
  roleBtnText: {
    color: '#00b4d8',
    fontWeight: '500',
    fontSize: 15,
  },
  roleBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollArea: { flex: 1, paddingHorizontal: 24, paddingTop: 18 },
  topStatsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  topStatBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    alignItems: 'flex-start',
    shadowColor: '#00b4d8',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    minWidth: 110,
  },
  topStatLabel: {
    fontSize: 13,
    color: '#22223b',
    fontWeight: '600',
    marginBottom: 6,
  },
  topStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00b4d8',
    marginBottom: 4,
  },
  topStatTrend: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  topStatSub: {
    fontSize: 13,
    color: '#48cae4',
    fontWeight: '500',
    marginTop: 2,
  },
  positiveTrend: { color: '#06d6a0' },
  negativeTrend: { color: '#ff4d6d' },
  alertSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    gap: 12,
  },
  alertIcon: { fontSize: 22, color: '#ff4d6d' },
  alertText: { flex: 1, fontSize: 15, color: '#22223b', fontWeight: '600' },
  alertBtn: {
    backgroundColor: '#00b4d8',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  alertBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  regionOverviewRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  regionStatsCol: {
    flex: 1.2,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    minWidth: 220,
  },
  regionStatsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00b4d8',
    marginBottom: 10,
  },
  regionList: {
    marginTop: 10,
    gap: 6,
  },
  regionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 2,
  },
  regionListName: {
    flex: 1,
    fontSize: 14,
    color: '#22223b',
    fontWeight: '600',
  },
  regionListLevel: {
    fontSize: 13,
    color: '#00b4d8',
    fontWeight: '600',
    marginRight: 8,
  },
  regionListStations: {
    fontSize: 13,
    color: '#48cae4',
    fontWeight: '600',
  },
  regionMapCol: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    minWidth: 220,
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    marginTop: 8,
  },
  mapWebview: {
    flex: 1,
    height: 220,
    borderRadius: 10,
  },
  trendSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  chart: {
    borderRadius: 10,
    marginVertical: 8,
  },
  roleSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00b4d8',
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b3e0f7',
  },
  metricLabel: {
    fontSize: 13,
    color: '#22223b',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00b4d8',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 12,
    color: '#48cae4',
    fontWeight: '500',
  },
  roleSubTitle: {
    fontSize: 14,
    color: '#22223b',
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  improvementsList: {
    gap: 2,
    marginBottom: 6,
  },
  improvementItem: {
    fontSize: 13,
    color: '#22223b',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionBtn: {
    backgroundColor: '#00b4d8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    marginTop: 18,
  },
  footerText: {
    color: '#00b4d8',
    fontSize: 13,
    fontWeight: '600',
  },
});