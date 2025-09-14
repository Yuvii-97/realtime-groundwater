import React, { useState, useRef, useEffect } from "react";
import * as FileSystem from "expo-file-system";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Dimensions,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// Device type detection
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 400;

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model: any = genAI
  ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  : null;

const ChatBox = () => {
  const insets = useSafeAreaInsets();
  // Always visible, circle mode
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Groundwater Assistant. I can help you with information about groundwater data, monitoring, predictions, analytics, and guide you through the app.\nHow can I assist you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [contextData, setContextData] = useState<string>("");

  const scrollViewRef = useRef<ScrollView>(null);

  // Load context data on component mount
  useEffect(() => {
    const loadContextData = async () => {
      try {
        // Try to read the context file from the app bundle
        const contextPath = `${FileSystem.bundleDirectory}ChatBotContext.txt`;
        let contextContent = "";

        try {
          contextContent = await FileSystem.readAsStringAsync(contextPath);
        } catch (bundleError) {
          // Fallback: If bundle path doesn't work, try document directory
          const docPath = `${FileSystem.documentDirectory}ChatBotContext.txt`;
          try {
            contextContent = await FileSystem.readAsStringAsync(docPath);
          } catch (docError) {
            // If file not found, use embedded fallback context
            contextContent = `
# REALTIME GROUNDWATER MONITORING APP - CHATBOT CONTEXT

## APP OVERVIEW
App Name: Realtime Groundwater Analytics
Purpose: Comprehensive groundwater monitoring and analytics mobile application
Target Users: Government officials, water management authorities, farmers, researchers
Organization: Central Ground Water Board (CGWB), India

## MAIN FEATURES
- Real-time monitoring of 31,574+ groundwater stations across India
- Interactive maps with Google Maps integration
- AI-powered analytics and predictions
- Multi-language support (10+ Indian languages)
- Data export capabilities (CSV, JSON, PDF)
- Weather integration with OpenWeatherMap API

## APP SECTIONS
1. Home - Landing page with hero carousel
2. Dashboard - Real-time data overview and monitoring
3. Groundwater Monitoring - Detailed station-wise analysis
4. Analytics - AI-powered insights with weather integration
5. Maps - Interactive station mapping
6. Reports - Data export and report generation
7. Settings - Multilingual preferences and configuration

## DATA SOURCES
- Central Ground Water Board (CGWB) official data
- 31,574 total monitoring stations
- 16,346 actively monitored stations
- Real-time updates every 15-30 minutes

Always provide helpful guidance to users and direct them to appropriate app sections.
            `.trim();
          }
        }

        setContextData(contextContent);
      } catch (error) {
        console.error("Error loading context data:", error);
        // Set minimal fallback context
        setContextData(
          "Groundwater monitoring app with real-time data from 31,574+ stations across India. Features include Dashboard, Maps, Analytics, and Reports."
        );
      }
    };

    loadContextData();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        // Auto-scroll to bottom when keyboard opens and there are messages
        if (messages.length > 0) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [messages.length]);

  // Responsive dimensions based on device type and keyboard visibility
  const getModalDimensions = () => {
    const availableHeight = isKeyboardVisible
      ? screenHeight - keyboardHeight - insets.top - insets.bottom - 40
      : screenHeight - insets.top - insets.bottom - 80;

    if (isTablet) {
      return {
        width: Math.min(screenWidth * 0.6, 600),
        height: Math.min(
          availableHeight * 0.9,
          isKeyboardVisible ? availableHeight : 700
        ),
      };
    }

    if (isSmallScreen) {
      return {
        width: screenWidth - 20,
        height: Math.min(availableHeight * 0.95, availableHeight),
      };
    }

    return {
      width: screenWidth * 0.9,
      height: Math.min(
        availableHeight * 0.9,
        isKeyboardVisible ? availableHeight : 600
      ),
    };
  };

  const { width: modalWidth, height: modalHeight } = getModalDimensions();
  const headerHeight = isTablet ? 60 : 50; // Header with title and close button
  const inputHeight = isTablet ? 90 : 70; // Input row with padding
  const chatAreaHeight = modalHeight - headerHeight - inputHeight;

  // Fixed position: right bottom corner with safe area and responsive positioning
  const getFixedStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      zIndex: 9999,
    };

    if (isTablet) {
      return {
        ...baseStyle,
        right: 40,
        bottom: 40 + insets.bottom,
      };
    }

    return {
      ...baseStyle,
      right: isSmallScreen ? 16 : 24,
      bottom: (isSmallScreen ? 24 : 32) + insets.bottom,
    };
  };

  const fixedStyle = getFixedStyle();

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setMessages([...messages, { role: "user", content: input }]);

    // Auto-scroll to bottom after adding user message
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100
    );

    try {
      if (!model) throw new Error("Gemini model not initialized");

      // Create agentic prompt with context
      const agenticPrompt = `
You are an intelligent AI assistant for the Realtime Groundwater Monitoring App. Your role is to help users navigate the app, understand groundwater data, and provide accurate information based on the app's features and data sources.

CONTEXT ABOUT THE APP:
${contextData}

INSTRUCTIONS FOR YOUR RESPONSES:
1. Always be helpful, accurate, and professional
2. Guide users to appropriate app sections when relevant (Dashboard, Maps, Analytics, etc.)
3. Explain technical terms in simple language
4. If asked about specific data, mention it comes from CGWB (Central Ground Water Board)
5. For navigation questions, provide clear step-by-step directions
6. If you don't know something specific, acknowledge it and suggest where users might find the information
7. Prioritize user safety and data accuracy
8. Be concise but comprehensive in your responses
9. Use relevant emojis occasionally to make responses more engaging
10. Always maintain a helpful and friendly tone

USER QUESTION: ${input}

Respond based on the context provided and these instructions. If the user is asking about app features, guide them to the right section. If they need technical help, provide clear steps. If they want to understand data, explain it clearly with proper context.`;

      const result = await model.generateContent(agenticPrompt);
      const resp = await result.response;
      const reply = resp.text();
      setMessages((msgs) => [...msgs, { role: "assistant", content: reply }]);

      // Auto-scroll to bottom after adding assistant message
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    } catch (err: any) {
      const errorMessage = err?.message?.includes("API key")
        ? "I'm having trouble connecting to my AI services. Please check your internet connection or try again later."
        : err?.message?.includes("quota")
        ? "I'm currently experiencing high usage. Please try again in a few moments."
        : `I encountered an error: ${
            err?.message || "Unable to process your request"
          }. Please try rephrasing your question.`;

      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
    setInput("");
    setLoading(false);
  };

  return (
    <View style={[styles.circleContainer, fixedStyle]}>
      <TouchableOpacity
        style={[
          styles.circle,
          isTablet && styles.circleTablet,
          isSmallScreen && styles.circleSmall,
        ]}
        activeOpacity={0.8}
        onPress={() => setExpanded(true)}
      >
        <Text
          style={[
            styles.circleText,
            isTablet && styles.circleTextTablet,
            isSmallScreen && styles.circleTextSmall,
          ]}
        >
          🤖
        </Text>
      </TouchableOpacity>
      <Modal
        visible={expanded}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setExpanded(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {}}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={[
              styles.modalBox,
              isKeyboardVisible && {
                justifyContent: "flex-start",
                paddingTop: insets.top + 20,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when touching the modal content
              style={[
                styles.expandedBox,
                {
                  width: modalWidth,
                  height: modalHeight,
                  marginTop: isKeyboardVisible ? 0 : insets.top + 20,
                  marginBottom: isKeyboardVisible ? 0 : insets.bottom + 20,
                },
              ]}
            >
              <View style={styles.expandedHeader}>
                <Text style={styles.title}>Groundwater Assistant</Text>
                <TouchableOpacity
                  onPress={() => {
                    setExpanded(false);
                  }}
                >
                  <Text style={styles.minimize}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={scrollViewRef}
                style={[styles.chatArea, { height: chatAreaHeight }]}
                contentContainerStyle={[
                  styles.chatContent,
                  { minHeight: chatAreaHeight },
                ]}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                  autoscrollToTopThreshold: 10,
                }}
              >
                {messages.map((msg, idx) => (
                  <View
                    key={idx}
                    style={
                      msg.role === "user"
                        ? styles.userMsgContainer
                        : styles.assistantMsgContainer
                    }
                  >
                    <Text
                      style={
                        msg.role === "user"
                          ? styles.userMsg
                          : styles.assistantMsg
                      }
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loading}>
                      🤖 AI Assistant is thinking...
                    </Text>
                  </View>
                )}
                {error && <Text style={styles.error}>{error}</Text>}
              </ScrollView>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about app..."
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={sendMessage}
                  disabled={loading}
                >
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    position: "absolute",
    zIndex: 9999,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#075a7dff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  circleTablet: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  circleSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  circleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  circleTextTablet: {
    fontSize: 24,
  },
  circleTextSmall: {
    fontSize: 18,
  },
  expandedBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    maxWidth: screenWidth - 40,
    maxHeight: screenHeight - 100,
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#075a7dff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
    flex: 1,
  },
  minimize: {
    color: "#fff",
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
    padding: isTablet ? 6 : 4,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 8,
  },
  chatContent: {
    flexGrow: 1,
    paddingBottom: isTablet ? 12 : 8,
  },
  userMsgContainer: {
    alignItems: "flex-end",
    marginVertical: isTablet ? 6 : 4,
  },
  assistantMsgContainer: {
    alignItems: "flex-start",
    marginVertical: isTablet ? 6 : 4,
  },
  userMsg: {
    backgroundColor: "#075a7dff",
    color: "#fff",
    padding: isTablet ? 16 : 12,
    borderRadius: isTablet ? 20 : 16,
    borderBottomRightRadius: 4,
    maxWidth: "85%",
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 22 : 18,
  },
  assistantMsg: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    padding: isTablet ? 16 : 12,
    borderRadius: isTablet ? 20 : 16,
    borderBottomLeftRadius: 4,
    maxWidth: "85%",
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 22 : 18,
  },
  loading: {
    color: "#2563eb",
    fontStyle: "italic",
    padding: 12,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: isTablet ? 8 : 6,
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    margin: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: isTablet ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
    marginRight: isTablet ? 12 : 8,
    maxHeight: isTablet ? 100 : 80,
    fontSize: isTablet ? 16 : 14,
    backgroundColor: "#f9fafb",
  },
  sendBtn: {
    backgroundColor: "#075a7dff",
    borderRadius: isTablet ? 24 : 20,
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 24 : 20,
    minHeight: isTablet ? 56 : 48,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    flex: 1,
  },
});

export default ChatBox;
