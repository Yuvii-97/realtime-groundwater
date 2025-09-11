import React, { useState, useRef } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
import { View, Text, TextInput, TouchableOpacity, StyleSheet, PanResponder, Dimensions, Modal, Platform, KeyboardAvoidingView } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Picker } from "@react-native-picker/picker";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model: any = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

const locations = [
  { label: "Station 1 (Delhi)", value: "Delhi" },
  { label: "Station 2 (Mumbai)", value: "Mumbai" },
  { label: "Station 3 (Chennai)", value: "Chennai" },
];

const ChatBox = () => {
  // Always visible, circle mode
  const [expanded, setExpanded] = useState(false);
  const [location, setLocation] = useState(locations[0].value);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fixed position: right bottom corner
  const fixedStyle = {
    position: "absolute" as const,
    right: 24,
    bottom: 32,
    zIndex: 9999,
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setMessages([...messages, { role: "user", content: input }]);
    try {
      if (!model) throw new Error("Gemini model not initialized");
      const result = await model.generateContent(input);
      const resp = await result.response;
      const reply = resp.text();
      setMessages((msgs) => [...msgs, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((msgs) => [...msgs, { role: "assistant", content: String(err?.message || "Failed to get response.") }]);
    }
    setInput("");
    setLoading(false);
  };

  return (
  <View style={[styles.circleContainer, fixedStyle]}>
      <TouchableOpacity style={styles.circle} activeOpacity={0.8} onPress={() => setExpanded(true)}>
        <Text style={styles.circleText}>C</Text>
      </TouchableOpacity>
      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            style={styles.modalBox}
          >
            <View style={styles.expandedBox16x9}>
              <View style={styles.expandedHeader}>
                <Text style={styles.title}>Hashtech</Text>
                <TouchableOpacity onPress={() => setExpanded(false)}>
                  <Text style={styles.minimize}>–</Text>
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
                    <Picker.Item key={loc.value} label={loc.label} value={loc.value} />
                  ))}
                </Picker>
              </View>
              <View style={styles.chatArea}>
                {messages.map((msg, idx) => (
                  <Text key={idx} style={msg.role === "user" ? styles.userMsg : styles.assistantMsg}>{msg.content}</Text>
                ))}
                {loading && <Text style={styles.loading}>...</Text>}
                {error && <Text style={styles.error}>{error}</Text>}
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your message..."
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
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
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  circleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 28,
  },
  expandedBox16x9: {
    width: 480,
    height: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#2563eb",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  minimize: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  locationRow: { flexDirection: "row", alignItems: "center", padding: 8 },
  label: { fontWeight: "600", marginRight: 8 },
  picker: { flex: 1, height: 32 },
  chatArea: { padding: 8, minHeight: 180, maxHeight: 240, overflow: "scroll" },
  userMsg: { alignSelf: "flex-end", backgroundColor: "#e0e7ff", padding: 6, borderRadius: 6, marginVertical: 2 },
  assistantMsg: { alignSelf: "flex-start", backgroundColor: "#f0fdf4", padding: 6, borderRadius: 6, marginVertical: 2 },
  loading: { color: "#2563eb" },
  error: { color: "red" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 6, marginRight: 8 },
  sendBtn: { backgroundColor: "#2563eb", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  sendText: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
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
