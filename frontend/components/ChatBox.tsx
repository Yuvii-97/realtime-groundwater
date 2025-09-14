import React, { useState, useRef } from "react";

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
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Picker } from "@react-native-picker/picker";
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

const locations = [
  { label: "Station 1 (Delhi)", value: "Delhi" },
  { label: "Station 2 (Mumbai)", value: "Mumbai" },
  { label: "Station 3 (Chennai)", value: "Chennai" },
];

const ChatBox = () => {
  const insets = useSafeAreaInsets();
  // Always visible, circle mode
  const [expanded, setExpanded] = useState(false);
  const [location, setLocation] = useState(locations[0].value);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Responsive dimensions based on device type
  const getModalDimensions = () => {
    if (isTablet) {
      return {
        width: Math.min(screenWidth * 0.6, 600),
        height: Math.min(screenHeight * 0.8, 700),
      };
    }

    if (isSmallScreen) {
      return {
        width: screenWidth - 20,
        height: screenHeight * 0.85,
      };
    }

    return {
      width: screenWidth * 0.9,
      height: Math.min(screenHeight * 0.75, 600),
    };
  };

  const { width: modalWidth, height: modalHeight } = getModalDimensions();
  const chatAreaHeight = modalHeight - (isTablet ? 160 : 140); // More space for tablets

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
      const result = await model.generateContent(input);
      const resp = await result.response;
      const reply = resp.text();
      setMessages((msgs) => [...msgs, { role: "assistant", content: reply }]);

      // Auto-scroll to bottom after adding assistant message
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    } catch (err: any) {
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content: String(err?.message || "Failed to get response."),
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
          💬
        </Text>
      </TouchableOpacity>
      <Modal
        visible={expanded}
        transparent
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            style={styles.modalBox}
          >
            <View
              style={[
                styles.expandedBox,
                {
                  width: modalWidth,
                  height: modalHeight,
                  marginTop: insets.top + 20,
                  marginBottom: insets.bottom + 20,
                },
              ]}
            >
              <View style={styles.expandedHeader}>
                <Text style={styles.title}>Groundwater Assistant</Text>
                <TouchableOpacity onPress={() => setExpanded(false)}>
                  <Text style={styles.minimize}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.label}>Location:</Text>
                <Picker
                  selectedValue={location}
                  style={styles.picker}
                  onValueChange={setLocation}
                >
                  {locations.map((loc) => (
                    <Picker.Item
                      key={loc.value}
                      label={loc.label}
                      value={loc.value}
                    />
                  ))}
                </Picker>
              </View>
              <ScrollView
                ref={scrollViewRef}
                style={[styles.chatArea, { maxHeight: chatAreaHeight }]}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
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
                {loading && <Text style={styles.loading}>Typing...</Text>}
                {error && <Text style={styles.error}>{error}</Text>}
              </ScrollView>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about groundwater data..."
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
            </View>
          </KeyboardAvoidingView>
        </View>
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontWeight: "600",
    marginRight: 8,
    fontSize: isTablet ? 16 : 14,
    color: "#374151",
  },
  picker: {
    flex: 1,
    height: 40,
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
    height: "100%",
  },
});

export default ChatBox;
