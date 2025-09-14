import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next'; // Changed from useLanguage

export type NotificationType = 'critical' | 'warning' | 'info' | 'success';
export type NotificationCategory = 'water_level' | 'prediction' | 'system' | 'tip';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  location?: string;
  source?: string;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showNotificationPanel: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getNotificationsByCategory: (category: NotificationCategory) => Notification[];
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Sample realistic notifications based on actual DWLR patterns
const generateSampleNotifications = (): Notification[] => {
  const now = new Date();
  const locations = [
    'Pune District DWLR-23',
    'Mumbai Suburban DWLR-15',
    'Nashik DWLR-08',
    'Aurangabad DWLR-31',
    'Solapur DWLR-12'
  ];

  return [
    {
      id: 'sample-1-' + Math.random().toString(36).substr(2, 9),
      title: 'Critical Water Level Alert',
      message: `Water level at ${locations[0]} dropped to 2.8m, below critical threshold of 3.0m. Immediate conservation measures recommended.`,
      type: 'critical',
      category: 'water_level',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionable: true,
      location: locations[0],
      source: 'Maharashtra Water Board',
      icon: '🚨'
    },
    {
      id: 'sample-2-' + Math.random().toString(36).substr(2, 9),
      title: 'AI Prediction Update',
      message: 'Based on 5-year analysis, water levels may decline by 25% in the next 30 days. Confidence: 87%',
      type: 'warning',
      category: 'prediction',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: false,
      actionable: true,
      location: 'Maharashtra Region',
      source: 'INGRES AI Model',
      icon: '🤖'
    },
    {
      id: 'sample-3-' + Math.random().toString(36).substr(2, 9),
      title: 'Water Conservation Tip',
      message: 'With current levels at 4.2m, consider implementing drip irrigation to reduce water usage by 30%.',
      type: 'info',
      category: 'tip',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      read: false,
      actionable: false,
      location: 'General',
      source: 'Conservation Guide',
      icon: '💡'
    },
    {
      id: 'sample-4-' + Math.random().toString(36).substr(2, 9),
      title: 'Recharge Opportunity Detected',
      message: 'Heavy rainfall forecasted for next 48 hours. Excellent conditions for groundwater recharge expected.',
      type: 'success',
      category: 'prediction',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      read: false,
      actionable: true,
      location: 'Western Maharashtra',
      source: 'IMD Weather + AI',
      icon: '🌧️'
    },
    {
      id: 'sample-5-' + Math.random().toString(36).substr(2, 9),
      title: 'New Monitoring Station Online',
      message: `New DWLR station ${locations[4]} is now active and providing real-time data for your area.`,
      type: 'success',
      category: 'system',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      read: true,
      actionable: false,
      location: locations[4],
      source: 'CGWB Network',
      icon: '📡'
    },
    {
      id: 'sample-6-' + Math.random().toString(36).substr(2, 9),
      title: 'Water Level Improving',
      message: `Good news! Water level at ${locations[1]} increased by 0.5m in last week due to recent rainfall.`,
      type: 'success',
      category: 'water_level',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      read: false,
      actionable: false,
      location: locations[1],
      source: 'Mumbai Water Board',
      icon: '✅'
    }
  ];
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const { t } = useTranslation(); // Changed from useLanguage
  
  // Add a counter for unique IDs
  const notificationCounter = React.useRef(0);

  // Load notifications on startup
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Force clear old data to fix duplicate ID issue
        await AsyncStorage.removeItem('app_notifications');
        
        // Start fresh with new sample notifications
        const sampleNotifications = generateSampleNotifications();
        setNotifications(sampleNotifications);
        await AsyncStorage.setItem('app_notifications', JSON.stringify(sampleNotifications));
        
        console.log('Notifications refreshed with unique IDs');
      } catch (error) {
        console.log('Error loading notifications:', error);
        // Fallback to sample notifications
        const sampleNotifications = generateSampleNotifications();
        setNotifications(sampleNotifications);
      }
    };

    loadNotifications();
  }, []);

  // Save notifications when they change
  useEffect(() => {
    const saveNotifications = async () => {
      try {
        await AsyncStorage.setItem('app_notifications', JSON.stringify(notifications));
      } catch (error) {
        console.log('Error saving notifications:', error);
      }
    };

    if (notifications.length > 0) {
      saveNotifications();
    }
  }, [notifications]);

  // Real-time notification generators for each category
  const generateWaterLevelNotification = (): { title: string; message: string; type: NotificationType; icon: string } => {
    const locations = ['Pune DWLR-23', 'Mumbai DWLR-15', 'Nashik DWLR-08', 'Aurangabad DWLR-31', 'Solapur DWLR-12'];
    const levels = ['2.1m', '2.8m', '3.5m', '4.2m', '5.1m', '6.3m'];
    const statuses = [t('notifications.dropped'), t('notifications.increased'), t('notifications.stabilized')];
    const notifications = [
      {
        title: t('notifications.waterLevelAlerts'),
        message: `${locations[Math.floor(Math.random() * locations.length)]} ${t('notifications.waterLevel')} ${statuses[Math.floor(Math.random() * statuses.length)]} to ${levels[Math.floor(Math.random() * levels.length)]}`,
        type: Math.random() > 0.7 ? 'critical' as NotificationType : (Math.random() > 0.5 ? 'warning' as NotificationType : 'success' as NotificationType),
        icon: Math.random() > 0.5 ? '💧' : '📊'
      },
      {
        title: t('notifications.realTimeReading'),
        message: `${t('notifications.livedata')} ${t('notifications.from')} ${locations[Math.floor(Math.random() * locations.length)]}: ${t('notifications.currentLevel')} ${levels[Math.floor(Math.random() * levels.length)]}, ${t('notifications.trending')} ${Math.random() > 0.5 ? t('notifications.upward') : t('notifications.stable')}`,
        type: 'info' as NotificationType,
        icon: '📈'
      },
      {
        title: t('notifications.waterQualityUpdate'),
        message: `${t('notifications.waterQuality')} ${t('notifications.at')} ${locations[Math.floor(Math.random() * locations.length)]}: pH ${(6.5 + Math.random() * 2).toFixed(1)}, TDS ${Math.floor(200 + Math.random() * 300)}ppm - ${Math.random() > 0.8 ? t('notifications.excellent') : t('notifications.good')} ${t('notifications.quality')}`,
        type: 'success' as NotificationType,
        icon: '✅'
      }
    ];
    return notifications[Math.floor(Math.random() * notifications.length)];
  };

  const generatePredictionNotification = (): { title: string; message: string; type: NotificationType; icon: string } => {
    const predictions = [
      {
        title: t('notifications.aiForecastAlert'),
        message: `Machine learning model predicts ${Math.floor(15 + Math.random() * 30)}% water level change in next ${Math.floor(7 + Math.random() * 30)} days. Confidence: ${Math.floor(75 + Math.random() * 20)}%`,
        type: Math.random() > 0.6 ? 'warning' as NotificationType : 'info' as NotificationType,
        icon: '🤖'
      },
      {
        title: t('notifications.weatherImpactPrediction'),
        message: `Expected rainfall: ${Math.floor(10 + Math.random() * 50)}mm. Predicted groundwater recharge: ${Math.floor(5 + Math.random() * 25)}%. Best recharge areas identified.`,
        type: 'success' as NotificationType,
        icon: '🌧️'
      },
      {
        title: t('notifications.seasonalTrendAnalysis'),
        message: `Historical data shows ${Math.random() > 0.5 ? 'declining' : 'improving'} trend for this period. Current levels are ${Math.floor(80 + Math.random() * 40)}% of seasonal average.`,
        type: Math.random() > 0.5 ? 'warning' as NotificationType : 'info' as NotificationType,
        icon: '📊'
      },
      {
        title: t('notifications.demandPrediction'),
        message: `AI forecasts ${Math.floor(10 + Math.random() * 30)}% ${Math.random() > 0.5 ? t('notifications.increased') : 'decrease'} in water demand next week. Prepare conservation measures accordingly.`,
        type: 'warning' as NotificationType,
        icon: '🔮'
      }
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
  };

  const generateSystemNotification = (): { title: string; message: string; type: NotificationType; icon: string } => {
    const systems = [
      {
        title: t('notifications.systemStatusUpdate'),
        message: `${Math.floor(15 + Math.random() * 10)} DWLR ${t('notifications.stations')} online. Network uptime: ${(95 + Math.random() * 5).toFixed(1)}%. All sensors functioning optimally.`,
        type: 'success' as NotificationType,
        icon: '📡'
      },
      {
        title: t('notifications.dataSync'),
        message: `Latest readings synchronized ${t('notifications.from')} ${Math.floor(20 + Math.random() * 30)} monitoring points. Data accuracy: ${(98 + Math.random() * 2).toFixed(1)}%. No transmission errors.`,
        type: 'info' as NotificationType,
        icon: '🔄'
      },
      {
        title: t('notifications.maintenanceAlert'),
        message: `Scheduled maintenance for DWLR ${t('notifications.station')} ${Math.floor(1 + Math.random() * 50)} completed successfully. All systems restored to full operation.`,
        type: 'success' as NotificationType,
        icon: '🔧'
      },
      {
        title: t('notifications.networkExpansion'),
        message: `New monitoring ${t('notifications.station')} DWLR-${Math.floor(51 + Math.random() * 49)} added to network. Enhanced coverage for your ${t('notifications.region')} now available.`,
        type: 'success' as NotificationType,
        icon: '📍'
      }
    ];
    return systems[Math.floor(Math.random() * systems.length)];
  };

  const generateTipNotification = (): { title: string; message: string; type: NotificationType; icon: string } => {
    const tips = [
      {
        title: t('notifications.smartIrrigationTip'),
        message: `💡 ${t('notifications.tip')}: Use drip irrigation during early morning (5-7 AM) to reduce water loss by up to 40%. Current weather is perfect for efficient watering.`,
        type: 'info' as NotificationType,
        icon: '💡'
      },
      {
        title: t('notifications.rainwaterHarvesting'),
        message: `🌧️ Pro ${t('notifications.tip')}: With monsoon approaching, set up rainwater harvesting systems. Every 1mm rainfall on 100m² can collect 100 liters of water!`,
        type: 'info' as NotificationType,
        icon: '☔'
      },
      {
        title: t('notifications.waterConservation'),
        message: `🚿 Daily ${t('notifications.tip')}: Fix that leaky tap! A single drop per second wastes 5 liters daily. Check your fixtures for potential water savings.`,
        type: 'info' as NotificationType,
        icon: '🔧'
      },
      {
        title: t('notifications.optimalUsage'),
        message: `⏰ Best Practice: Use washing machines and dishwashers during off-peak ${t('notifications.hours')} (10 PM - 6 AM) to reduce strain on water supply systems.`,
        type: 'info' as NotificationType,
        icon: '⏰'
      },
      {
        title: t('notifications.gardenWaterWisdom'),
        message: `🌱 Green ${t('notifications.tip')}: Water your plants with rice water or pasta water (after cooling). These provide nutrients while conserving fresh water.`,
        type: 'info' as NotificationType,
        icon: '🌱'
      },
      {
        title: t('notifications.monsoonPreparation'),
        message: `🏠 Seasonal ${t('notifications.tip')}: Clean your roof gutters before monsoon. Proper drainage prevents water logging and maximizes groundwater recharge.`,
        type: 'info' as NotificationType,
        icon: '🏠'
      },
      {
        title: t('notifications.smartMonitoring'),
        message: `📱 Tech ${t('notifications.tip')}: Check your water meter monthly. Unusual spikes might indicate hidden leaks. Early detection saves water and money!`,
        type: 'info' as NotificationType,
        icon: '📱'
      },
      {
        title: t('notifications.soilHealth'),
        message: `🌾 Agriculture ${t('notifications.tip')}: Mulching reduces soil water evaporation by 50%. Use organic matter around plants to retain moisture longer.`,
        type: 'info' as NotificationType,
        icon: '🌾'
      }
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  // Enhanced real-time notification system with category-specific timing
  useEffect(() => {
    // Water Level notifications - every 2 minutes
    const waterLevelInterval = setInterval(() => {
      const notification = generateWaterLevelNotification();
      addNotification({
        ...notification,
        category: 'water_level',
        actionable: notification.type === 'critical',
        location: 'Maharashtra Region',
        source: 'Live DWLR Network'
      });
    }, 2 * 60 * 1000); // 2 minutes

    // Prediction notifications - every 70 seconds  
    const predictionInterval = setInterval(() => {
      const notification = generatePredictionNotification();
      addNotification({
        ...notification,
        category: 'prediction',
        actionable: notification.type === 'warning',
        location: 'Regional Analysis',
        source: 'INGRES AI System'
      });
    }, 70 * 1000); // 70 seconds

    // System notifications - every 3 minutes
    const systemInterval = setInterval(() => {
      const notification = generateSystemNotification();
      addNotification({
        ...notification,
        category: 'system',
        actionable: false,
        location: 'Network Wide',
        source: 'CGWB Monitoring'
      });
    }, 3 * 60 * 1000); // 3 minutes

    // Tips notifications - every 60 seconds
    const tipsInterval = setInterval(() => {
      const notification = generateTipNotification();
      addNotification({
        ...notification,
        category: 'tip',
        actionable: false,
        location: 'General',
        source: 'Conservation Guide'
      });
    }, 60 * 1000); // 60 seconds

    return () => {
      clearInterval(waterLevelInterval);
      clearInterval(predictionInterval);
      clearInterval(systemInterval);
      clearInterval(tipsInterval);
    };
  }, [t]); // Added t as dependency

  // Simulate new notifications periodically (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Add a new realistic notification every 2 minutes (for demo)
      const newNotifications = [
        {
          title: 'Real-time Data Update',
          message: 'Latest readings show water levels stable across 5 monitoring stations in your area.',
          type: 'info' as NotificationType,
          category: 'system' as NotificationCategory,
          actionable: false,
          location: 'Your Area',
          source: 'Live DWLR Network',
          icon: '📈'
        },
        {
          title: 'AI Trend Alert',
          message: 'Unusual water consumption pattern detected. Consider reviewing usage in your sector.',
          type: 'warning' as NotificationType,
          category: 'prediction' as NotificationCategory,
          actionable: true,
          location: 'Your Sector',
          source: 'INGRES AI Monitor',
          icon: '🔍'
        },
        {
          title: 'Conservation Success',
          message: 'Great job! Your area showed 8% reduction in water usage compared to last month.',
          type: 'success' as NotificationType,
          category: 'water_level' as NotificationCategory,
          actionable: false,
          location: 'Your Area',
          source: 'Usage Analytics',
          icon: '🏆'
        }
      ];

      const randomNotification = newNotifications[Math.floor(Math.random() * newNotifications.length)];
      addNotification(randomNotification);
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(interval);
  }, [t]); // Added t as dependency

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Safety check for notification data
    if (!notification || !notification.title || !notification.message) {
      console.warn('Invalid notification data provided');
      return;
    }

    // Generate truly unique ID using timestamp + random + counter
    notificationCounter.current += 1;
    const uniqueId = `notif-${Date.now()}-${notificationCounter.current}-${Math.random().toString(36).substr(2, 9)}`;

    const newNotification: Notification = {
      ...notification,
      id: uniqueId,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await AsyncStorage.removeItem('app_notifications');
    } catch (error) {
      console.log('Error clearing notifications:', error);
    }
  };

  const forceRefreshNotifications = async () => {
    try {
      // Clear existing storage
      await AsyncStorage.removeItem('app_notifications');
      // Generate fresh sample notifications
      const freshSampleNotifications = generateSampleNotifications();
      setNotifications(freshSampleNotifications);
      await AsyncStorage.setItem('app_notifications', JSON.stringify(freshSampleNotifications));
    } catch (error) {
      console.log('Error refreshing notifications:', error);
    }
  };

  const getNotificationsByCategory = (category: NotificationCategory) => {
    return notifications.filter(notif => notif.category === category);
  };

  const openNotificationPanel = () => {
    setShowNotificationPanel(true);
  };

  const closeNotificationPanel = () => {
    setShowNotificationPanel(false);
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    showNotificationPanel,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByCategory,
    openNotificationPanel,
    closeNotificationPanel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};