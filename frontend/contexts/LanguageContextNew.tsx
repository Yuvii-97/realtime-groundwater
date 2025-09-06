import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages
export type Language = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'bn' | 'gu' | 'mr' | 'pa';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys - comprehensive coverage for all app content
const translations = {
  en: {
    // App Title
    appTitle: 'Groundwater Analytics',
    groundWater: 'Ground Water',
    analytics: 'Analytics',
    
    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    groundwaterMonitoring: 'Groundwater Monitoring',
    liveData: 'Live Data',
    maps: 'Maps',
    reports: 'Reports',
    settings: 'Settings',
    trendAnalysis: 'Trend Analysis',
    
    // Common UI
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    ok: 'OK',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    refresh: 'Refresh',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    select: 'Select',
    clear: 'Clear',
    
    // Settings
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    language: 'Language',
    notifications: 'Notifications',
    preferences: 'Preferences',
    
    // Home Screen
    welcome: 'Welcome to INGRES',
    subtitle: 'Your intelligent groundwater data companion',
    
    // Home Screen Content
    heroTitle: 'Groundwater Monitoring Made Simple',
    heroSubtitle: 'Real-time insights, AI predictions, and risk alerts to help manage water resources responsibly.',
    getStarted: 'Get Started',
    whyThisApp: 'Why This App?',
    whyThisAppDesc: 'Groundwater is the backbone of drinking water, agriculture, and industry. With growing demand and climate challenges, monitoring groundwater levels is critical. Our app provides real-time data and predictive insights to support smarter decisions.',
    keyFeatures: 'Key Features',
    realTimeData: 'Real-time Data',
    realTimeDataDesc: 'Track live groundwater levels from DWLR stations.',
    aiPredictions: 'AI Predictions',
    aiPredictionsDesc: 'Forecast future water levels with accuracy.',
    statusAlerts: 'Status & Alerts',
    statusAlertsDesc: 'Get notified about risks and warnings in your region.',
    interactiveMap: 'Interactive Map',
    interactiveMapDesc: 'Explore groundwater conditions across stations.',
    multilingualSupport: 'Multilingual Support',
    multilingualSupportDesc: 'Access the app in your preferred language.',
    howItWorks: 'How It Works',
    step1: 'Select your language & location.',
    step2: 'View current groundwater trends and AI forecasts.',
    step3: 'Receive alerts and recommendations to plan ahead.',
    whyUseIt: 'Why Use It?',
    forCitizens: 'For citizens',
    forCitizensDesc: 'Stay informed about water availability.',
    forFarmers: 'For farmers',
    forFarmersDesc: 'Plan irrigation wisely.',
    forPolicymakers: 'For policymakers',
    forPolicymakersDesc: 'Support sustainable groundwater management.',
    about: 'About',
    contact: 'Contact',
    credits: 'Credits',
    footerCredit: 'Powered by real-time DWLR data & AI technology',
    
    // Dashboard Content
    overview: 'Overview',
    currentLevel: 'Current Level',
    trend: 'Trend',
    forecast: 'Forecast',
    alerts: 'Alerts',
    monitoring: 'Real-time Monitoring',
    analysis: 'Data Analysis',
    comprehensiveReports: 'Comprehensive Reports',
    features: 'Features',
    waterLevel: 'Water Level',
    lastUpdated: 'Last Updated',
    meters: 'meters',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    
    // Map Content
    location: 'Location',
    station: 'Station',
    stations: 'Stations',
    region: 'Region',
    depth: 'Depth',
    quality: 'Quality',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    
    // Report Content
    generateReport: 'Generate Report',
    downloadReport: 'Download Report',
    shareReport: 'Share Report',
    reportType: 'Report Type',
    dateRange: 'Date Range',
    summary: 'Summary',
    details: 'Details',
    
    // Alerts
    warning: 'Warning',
    critical: 'Critical',
    normal: 'Normal',
    high: 'High',
    low: 'Low',
    moderate: 'Moderate',
  },
  hi: {
    // App Title
    appTitle: 'भूजल विश्लेषण',
    groundWater: 'भूजल',
    analytics: 'विश्लेषण',
    
    // Navigation
    home: 'होम',
    dashboard: 'डैशबोर्ड',
    groundwaterMonitoring: 'भूजल निगरानी',
    liveData: 'लाइव डेटा',
    maps: 'मानचित्र',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्स',
    trendAnalysis: 'ट्रेंड विश्लेषण',
    
    // Common UI
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    ok: 'ठीक है',
    save: 'सेव करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    close: 'बंद करें',
    back: 'वापस',
    next: 'अगला',
    previous: 'पिछला',
    refresh: 'ताज़ा करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    sort: 'क्रमबद्ध करें',
    select: 'चुनें',
    clear: 'साफ़ करें',
    
    // Settings
    appearance: 'रूप',
    darkMode: 'डार्क मोड',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    preferences: 'प्राथमिकताएं',
    
    // Home Screen
    welcome: 'INGRES में आपका स्वागत है',
    subtitle: 'आपका बुद्धिमान भूजल डेटा साथी',
    
    // Home Screen Content
    heroTitle: 'भूजल निगरानी सरल बनाई गई',
    heroSubtitle: 'पानी के संसाधनों को जिम्मेदारी से प्रबंधित करने के लिए रियल-टाइम अंतर्दृष्टि, AI भविष्यवाणियां और जोखिम अलर्ट।',
    getStarted: 'शुरू करें',
    whyThisApp: 'यह ऐप क्यों?',
    whyThisAppDesc: 'भूजल पीने के पानी, कृषि और उद्योग की रीढ़ है। बढ़ती मांग और जलवायु चुनौतियों के साथ, भूजल स्तर की निगरानी महत्वपूर्ण है। हमारा ऐप स्मार्ट निर्णयों का समर्थन करने के लिए रियल-टाइम डेटा और भविष्यसूचक अंतर्दृष्टि प्रदान करता है।',
    keyFeatures: 'मुख्य विशेषताएं',
    realTimeData: 'रियल-टाइम डेटा',
    realTimeDataDesc: 'DWLR स्टेशनों से लाइव भूजल स्तर ट्रैक करें।',
    aiPredictions: 'AI भविष्यवाणियां',
    aiPredictionsDesc: 'सटीकता के साथ भविष्य के पानी के स्तर का पूर्वानुमान लगाएं।',
    statusAlerts: 'स्थिति और अलर्ट',
    statusAlertsDesc: 'अपने क्षेत्र में जोखिमों और चेतावनियों के बारे में सूचित रहें।',
    interactiveMap: 'इंटरैक्टिव मानचित्र',
    interactiveMapDesc: 'स्टेशनों में भूजल स्थितियों का अन्वेषण करें।',
    multilingualSupport: 'बहुभाषी समर्थन',
    multilingualSupportDesc: 'अपनी पसंदीदा भाषा में ऐप का उपयोग करें।',
    howItWorks: 'यह कैसे काम करता है',
    step1: 'अपनी भाषा और स्थान का चयन करें।',
    step2: 'वर्तमान भूजल रुझान और AI पूर्वानुमान देखें।',
    step3: 'आगे की योजना बनाने के लिए अलर्ट और सिफारिशें प्राप्त करें।',
    whyUseIt: 'इसका उपयोग क्यों करें?',
    forCitizens: 'नागरिकों के लिए',
    forCitizensDesc: 'पानी की उपलब्धता के बारे में सूचित रहें।',
    forFarmers: 'किसानों के लिए',
    forFarmersDesc: 'सिंचाई की बुद्धिमानी से योजना बनाएं।',
    forPolicymakers: 'नीति निर्माताओं के लिए',
    forPolicymakersDesc: 'टिकाऊ भूजल प्रबंधन का समर्थन करें।',
    about: 'के बारे में',
    contact: 'संपर्क',
    credits: 'क्रेडिट',
    footerCredit: 'रियल-टाइम DWLR डेटा और AI तकनीक द्वारा संचालित',
    
    // Dashboard Content
    overview: 'अवलोकन',
    currentLevel: 'वर्तमान स्तर',
    trend: 'रुझान',
    forecast: 'पूर्वानुमान',
    alerts: 'अलर्ट',
    monitoring: 'रियल-टाइम निगरानी',
    analysis: 'डेटा विश्लेषण',
    comprehensiveReports: 'व्यापक रिपोर्ट',
    features: 'विशेषताएं',
    waterLevel: 'पानी का स्तर',
    lastUpdated: 'अंतिम अपडेट',
    meters: 'मीटर',
    today: 'आज',
    thisWeek: 'इस सप्ताह',
    thisMonth: 'इस महीने',
    thisYear: 'इस साल',
    
    // Map Content
    location: 'स्थान',
    station: 'स्टेशन',
    stations: 'स्टेशन',
    region: 'क्षेत्र',
    depth: 'गहराई',
    quality: 'गुणवत्ता',
    status: 'स्थिति',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    
    // Report Content
    generateReport: 'रिपोर्ट बनाएं',
    downloadReport: 'रिपोर्ट डाउनलोड करें',
    shareReport: 'रिपोर्ट साझा करें',
    reportType: 'रिपोर्ट प्रकार',
    dateRange: 'दिनांक सीमा',
    summary: 'सारांश',
    details: 'विवरण',
    
    // Alerts
    warning: 'चेतावनी',
    critical: 'गंभीर',
    normal: 'सामान्य',
    high: 'उच्च',
    low: 'कम',
    moderate: 'मध्यम',
  },
  te: {
    // App Title
    appTitle: 'భూగర్భజల విశ్లేషణ',
    groundWater: 'భూగర్భజలం',
    analytics: 'విశ్లేషణ',
    
    // Navigation
    home: 'హోమ్',
    dashboard: 'డాష్‌బోర్డ్',
    groundwaterMonitoring: 'భూగర్భజల పర్యవేక్షణ',
    liveData: 'లైవ్ డేటా',
    maps: 'మ్యాప్స్',
    reports: 'రిపోర్ట్స్',
    settings: 'సెట్టింగ్స్',
    trendAnalysis: 'ట్రెండ్ విశ్లేషణ',
    
    // Common UI
    loading: 'లోడవుతోంది...',
    error: 'లోపం',
    success: 'విజయం',
    cancel: 'రద్దు',
    ok: 'సరే',
    save: 'సేవ్',
    delete: 'తొలగించు',
    edit: 'సవరించు',
    close: 'మూసివేయి',
    back: 'వెనుకకు',
    next: 'తరువాత',
    previous: 'మునుపటి',
    refresh: 'రిఫ్రెష్',
    search: 'వెతుకు',
    filter: 'ఫిల్టర్',
    sort: 'క్రమంలో ఉంచు',
    select: 'ఎంచుకోండి',
    clear: 'క్లియర్',
    
    // Settings
    appearance: 'రూపం',
    darkMode: 'డార్క్ మోడ్',
    language: 'భాష',
    notifications: 'నోటిఫికేషన్స్',
    preferences: 'ప్రాధాన్యతలు',
    
    // Home Screen
    welcome: 'INGRES కు స్వాగతం',
    subtitle: 'మీ తెలివైన భూగర్భజల డేటా సహాయకుడు',
    
    // Home Screen Content
    heroTitle: 'భూగర్భజల పర్యవేక్షణ సులభంగా చేయబడింది',
    heroSubtitle: 'నీటి వనరులను బాధ్యతాయుతంగా నిర్వహించడానికి రియల్-టైమ్ అంతర్దృష్టులు, AI అంచనాలు మరియు రిస్క్ అలర్ట్లు.',
    getStarted: 'ప్రారంభించండి',
    whyThisApp: 'ఈ యాప్ ఎందుకు?',
    whyThisAppDesc: 'భూగర్భజలం త్రాగునీరు, వ్యవసాయం మరియు పరిశ్రమలకు వెన్నెముక. పెరుగుతున్న డిమాండ్ మరియు వాతావరణ సవాళ్లతో, భూగర్భజల స్థాయిలను పర్యవేక్షించడం కీలకం. మా యాప్ తెలివైన నిర్ణయాలకు మద్దతు ఇవ్వడానికి రియల్-టైమ్ డేటా మరియు అంచనా అంతర్దృష్టులను అందిస్తుంది.',
    keyFeatures: 'ముఖ్య లక్షణాలు',
    realTimeData: 'రియల్-టైమ్ డేటా',
    realTimeDataDesc: 'DWLR స్టేషన్ల నుండి లైవ్ భూగర్భజల స్థాయిలను ట్రాక్ చేయండి.',
    aiPredictions: 'AI అంచనాలు',
    aiPredictionsDesc: 'ఖచ్చితత్వంతో భవిష్యత్ నీటి స్థాయిలను అంచనా వేయండి.',
    statusAlerts: 'స్థితి & అలర్ట్లు',
    statusAlertsDesc: 'మీ ప్రాంతంలో రిస్క్లు మరియు హెచ్చరికల గురించి తెలుసుకోండి.',
    interactiveMap: 'ఇంటరాక్టివ్ మ్యాప్',
    interactiveMapDesc: 'స్టేషన్లలో భూగర్భజల పరిస్థితులను అన్వేషించండి.',
    multilingualSupport: 'బహుభాషా మద్దతు',
    multilingualSupportDesc: 'మీ ఇష్టపడే భాషలో యాప్‌ను యాక్సెస్ చేయండి.',
    howItWorks: 'ఇది ఎలా పని చేస్తుంది',
    step1: 'మీ భాష & స్థానాన్ని ఎంచుకోండి.',
    step2: 'ప్రస్తుత భూగర్భజల ట్రెండ్లు మరియు AI అంచనాలను చూడండి.',
    step3: 'ముందుగా ప్లాన్ చేయడానికి అలర్ట్లు మరియు సిఫార్సులను అందుకోండి.',
    whyUseIt: 'దీన్ని ఎందుకు ఉపయోగించాలి?',
    forCitizens: 'పౌరుల కోసం',
    forCitizensDesc: 'నీటి లభ్యత గురించి తెలిసి ఉండండి.',
    forFarmers: 'రైతుల కోసం',
    forFarmersDesc: 'నీటిపారుదలను తెలివిగా ప్లాన్ చేయండి.',
    forPolicymakers: 'పాలసీ మేకర్స్ కోసం',
    forPolicymakersDesc: 'స్థిరమైన భూగర్భజల నిర్వహణకు మద్దతు ఇవ్వండి.',
    about: 'గురించి',
    contact: 'సంప్రదించండి',
    credits: 'క్రెడిట్స్',
    footerCredit: 'రియల్-టైమ్ DWLR డేటా & AI టెక్నాలజీతో శక్తివంతం',
    
    // Dashboard Content  
    overview: 'అవలోకనం',
    currentLevel: 'ప్రస్తుత స్థాయి',
    trend: 'ట్రెండ్',
    forecast: 'అంచనా',
    alerts: 'అలర్ట్లు',
    monitoring: 'రియల్-టైమ్ పర్యవేక్షణ',
    analysis: 'డేటా విశ్లేషణ',
    comprehensiveReports: 'సమగ్ర రిపోర్ట్లు',
    features: 'లక్షణాలు',
    waterLevel: 'నీటి స్థాయి',
    lastUpdated: 'చివరిగా అప్‌డేట్ చేయబడింది',
    meters: 'మీటర్లు',
    today: 'ఈరోజు',
    thisWeek: 'ఈ వారం',
    thisMonth: 'ఈ నెల',
    thisYear: 'ఈ సంవత్సరం',
    
    // Map Content
    location: 'స్థానం',
    station: 'స్టేషన్',
    stations: 'స్టేషన్లు',
    region: 'ప్రాంతం',
    depth: 'లోతు',
    quality: 'నాణ్యత',
    status: 'స్థితి',
    active: 'క్రియాశీల',
    inactive: 'నిష్క్రియ',
    
    // Report Content
    generateReport: 'రిపోర్ట్ రూపొందించండి',
    downloadReport: 'రిపోర్ట్ డౌన్‌లోడ్ చేయండి',
    shareReport: 'రిపోర్ట్ భాగస్వామ్యం చేయండి',
    reportType: 'రిపోర్ట్ రకం',
    dateRange: 'తేదీ పరిధి',
    summary: 'సారాంశం',
    details: 'వివరాలు',
    
    // Alerts
    warning: 'హెచ్చరిక',
    critical: 'క్లిష్టం',
    normal: 'సాధారణ',
    high: 'అధిక',
    low: 'తక్కువ',
    moderate: 'మధ్యస్థ',
  },
  ta: {
    // App Title
    appTitle: 'நிலத்தடி நீர் பகுப்பாய்வு',
    groundWater: 'நிலத்தடி நீர்',
    analytics: 'பகுப்பாய்வு',
    
    // Navigation
    home: 'முகப்பு',
    dashboard: 'டாஷ்போர்டு',
    groundwaterMonitoring: 'நிலத்தடி நீர் கண்காணிப்பு',
    liveData: 'நேரடி தரவு',
    maps: 'வரைபடங்கள்',
    reports: 'அறிக்கைகள்',
    settings: 'அமைப்புகள்',
    trendAnalysis: 'போக்கு பகுப்பாய்வு',
    
    // Common UI
    loading: 'ஏற்றுகிறது...',
    error: 'பிழை',
    success: 'வெற்றி',
    cancel: 'ரத்து',
    ok: 'சரி',
    save: 'சேமி',
    delete: 'நீக்கு',
    edit: 'திருத்து',
    close: 'மூடு',
    back: 'பின்னால்',
    next: 'அடுத்து',
    previous: 'முந்தைய',
    refresh: 'புதுப்பி',
    search: 'தேடு',
    filter: 'வடிகட்டு',
    sort: 'வரிசைப்படுத்து',
    select: 'தேர்வு செய்',
    clear: 'அழி',
    
    // Settings
    appearance: 'தோற்றம்',
    darkMode: 'இருள் பயன்முறை',
    language: 'மொழி',
    notifications: 'அறிவிப்புகள்',
    preferences: 'விருப்பங்கள்',
    
    // Home Screen
    welcome: 'INGRES க்கு வரவேற்கிறோம்',
    subtitle: 'உங்கள் அறிவார்ந்த நிலத்தடி நீர் தரவு துணை',
    
    // Home Screen Content
    heroTitle: 'நிலத்தடி நீர் கண்காணிப்பு எளிதாக்கப்பட்டது',
    heroSubtitle: 'நீர் வளங்களை பொறுப்புடன் நிர்வகிக்க நேரடி நுண்ணறிவுகள், AI கணிப்புகள் மற்றும் அபாய எச்சரிக்கைகள்.',
    getStarted: 'தொடங்குங்கள்',
    whyThisApp: 'ஏன் இந்த ஆப்?',
    whyThisAppDesc: 'நிலத்தடி நீர் குடிநீர், விவசாயம் மற்றும் தொழில்துறையின் முதுகெலும்பு. அதிகரித்து வரும் தேவை மற்றும் காலநிலை சவால்களுடன், நிலத்தடி நீர் மட்டங்களை கண்காணிப்பது முக்கியமானது. எங்கள் ஆப் புத்திசாலித்தனமான முடிவுகளை ஆதரிக்க நேரடி தரவு மற்றும் கணிப்பு நுண்ணறிவுகளை வழங்குகிறது.',
    keyFeatures: 'முக்கிய அம்சங்கள்',
    realTimeData: 'நேரடி தரவு',
    realTimeDataDesc: 'DWLR நிலையங்களிலிருந்து நேரடி நிலத்தடி நீர் மட்டங்களை கண்காணிக்கவும்.',
    aiPredictions: 'AI கணிப்புகள்',
    aiPredictionsDesc: 'துல்லியத்துடன் எதிர்கால நீர் மட்டங்களை முன்னறிவிக்கவும்.',
    statusAlerts: 'நிலை & எச்சரிக்கைகள்',
    statusAlertsDesc: 'உங்கள் பகுதியில் அபாயங்கள் மற்றும் எச்சரிக்கைகளைப் பற்றி அறிந்து கொள்ளுங்கள்.',
    interactiveMap: 'ஊடாடும் வரைபடம்',
    interactiveMapDesc: 'நிலையங்களில் நிலத்தடி நீர் நிலைமைகளை ஆராயுங்கள்.',
    multilingualSupport: 'பல மொழி ஆதரவு',
    multilingualSupportDesc: 'உங்கள் விருப்பமான மொழியில் ஆப்ஸை அணுகவும்.',
    howItWorks: 'இது எவ்வாறு செயல்படுகிறது',
    step1: 'உங்கள் மொழி & இடத்தைத் தேர்ந்தெடுக்கவும்.',
    step2: 'தற்போதைய நிலத்தடி நீர் போக்குகள் மற்றும் AI கணிப்புகளைப் பார்க்கவும்.',
    step3: 'முன்னதாகவே திட்டமிட எச்சரிக்கைகள் மற்றும் பரிந்துரைகளைப் பெறுங்கள்.',
    whyUseIt: 'ஏன் பயன்படுத்த வேண்டும்?',
    forCitizens: 'குடிமக்களுக்கு',
    forCitizensDesc: 'நீர் கிடைக்கும் தன்மையைப் பற்றி தெரிந்து கொள்ளுங்கள்.',
    forFarmers: 'விவசாயிகளுக்கு',
    forFarmersDesc: 'நீர்ப்பாசனத்தை புத்திசாலித்தனமாக திட்டமிடுங்கள்.',
    forPolicymakers: 'கொள்கை வகுப்பாளர்களுக்கு',
    forPolicymakersDesc: 'நிலையான நிலத்தடி நீர் நிர்வாகத்தை ஆதரிக்கவும்.',
    about: 'பற்றி',
    contact: 'தொடர்பு',
    credits: 'வரவுகள்',
    footerCredit: 'நேரடி DWLR தரவு & AI தொழில்நுட்பத்தால் இயக்கப்படுகிறது',
    
    // Dashboard Content
    overview: 'கண்ணோட்டம்',
    currentLevel: 'தற்போதைய நிலை',
    trend: 'போக்கு',
    forecast: 'கணிப்பு',
    alerts: 'எச்சரிக்கைகள்',
    monitoring: 'நேரடி கண்காணிப்பு',
    analysis: 'தரவு பகுப்பாய்வு',
    comprehensiveReports: 'விரிவான அறிக்கைகள்',
    features: 'அம்சங்கள்',
    waterLevel: 'நீர் மட்டம்',
    lastUpdated: 'கடைசியாக புதுப்பிக்கப்பட்டது',
    meters: 'மீட்டர்கள்',
    today: 'இன்று',
    thisWeek: 'இந்த வாரம்',
    thisMonth: 'இந்த மாதம்',
    thisYear: 'இந்த ஆண்டு',
    
    // Map Content
    location: 'இடம்',
    station: 'நிலையம்',
    stations: 'நிலையங்கள்',
    region: 'பகுதி',
    depth: 'ஆழம்',
    quality: 'தரம்',
    status: 'நிலை',
    active: 'செயல்பாட்டில்',
    inactive: 'செயலற்ற',
    
    // Report Content
    generateReport: 'அறிக்கை உருவாக்கு',
    downloadReport: 'அறிக்கை பதிவிறக்கு',
    shareReport: 'அறிக்கை பகிர்',
    reportType: 'அறிக்கை வகை',
    dateRange: 'தேதி வரம்பு',
    summary: 'சுருக்கம்',
    details: 'விவரங்கள்',
    
    // Alerts
    warning: 'எச்சரிக்கை',
    critical: 'முக்கியமான',
    normal: 'சாதாரண',
    high: 'அதிக',
    low: 'குறைவு',
    moderate: 'மிதமான',
  },
  // Add basic translations for other languages
  kn: {
    appTitle: 'ಅಂತರ್ಜಲ ವಿಶ್ಲೇಷಣೆ',
    home: 'ಮುಖ್ಯಪುಟ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    language: 'ಭಾಷೆ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    error: 'ದೋಷ',
    success: 'ಯಶಸ್ಸು',
  },
  ml: {
    appTitle: 'ഭൂഗർഭജല വിശകലനം',
    home: 'ഹോം',
    dashboard: 'ഡാഷ്ബോർഡ്',
    settings: 'ക്രമീകരണങ്ങൾ',
    language: 'ഭാഷ',
    loading: 'ലോഡ് ചെയ്യുന്നു...',
    error: 'പിശക്',
    success: 'വിജയം',
  },
  bn: {
    appTitle: 'ভূগর্ভস্থ পানি বিশ্লেষণ',
    home: 'হোম',
    dashboard: 'ড্যাশবোর্ড',
    settings: 'সেটিংস',
    language: 'ভাষা',
    loading: 'লোড হচ্ছে...',
    error: 'ত্রুটি',
    success: 'সফলতা',
  },
  gu: {
    appTitle: 'ભૂગર્ભજળ વિશ્લેષણ',
    home: 'હોમ',
    dashboard: 'ડેશબોર્ડ',
    settings: 'સેટિંગ્સ',
    language: 'ભાષા',
    loading: 'લોડ થઈ રહ્યું છે...',
    error: 'ભૂલ',
    success: 'સફળતા',
  },
  mr: {
    appTitle: 'भूजल विश्लेषण',
    home: 'होम',
    dashboard: 'डॅशबोर्ड',
    settings: 'सेटिंग्ज',
    language: 'भाषा',
    loading: 'लोड होत आहे...',
    error: 'त्रुटी',
    success: 'यश',
  },
  pa: {
    appTitle: 'ਭੂਮੀਗਤ ਪਾਣੀ ਵਿਸ਼ਲੇਸ਼ਣ',
    home: 'ਘਰ',
    dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    settings: 'ਸੈਟਿੰਗਾਂ',
    language: 'ਭਾਸ਼ਾ',
    loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    error: 'ਗਲਤੀ',
    success: 'ਸਫਲਤਾ',
  }
};

// Language names with flags for the selector
export const languageOptions = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'te' as Language, name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta' as Language, name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn' as Language, name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml' as Language, name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn' as Language, name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu' as Language, name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr' as Language, name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'pa' as Language, name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load saved language on startup
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage && (Object.keys(translations) as Language[]).includes(savedLanguage as Language)) {
          setCurrentLanguage(savedLanguage as Language);
        }
      } catch (error) {
        console.log('Error loading language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  // Change language and save to storage
  const changeLanguage = async (language: Language) => {
    try {
      setCurrentLanguage(language);
      await AsyncStorage.setItem('app_language', language);
    } catch (error) {
      console.log('Error saving language preference:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const languageTranslations = translations[currentLanguage];
    const fallbackTranslations = translations.en;
    
    return (languageTranslations as any)[key] || (fallbackTranslations as any)[key] || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
