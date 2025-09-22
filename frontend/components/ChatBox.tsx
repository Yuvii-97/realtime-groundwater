import React, { useState, useRef, useEffect } from "react";
import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

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
  Animated,
  Image,
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";

const ChatIcon = require("../assets/images/ChatIcon.png");

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// Device type detection
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 400;

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model: any = genAI
  ? genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
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
        "**Hello! I'm your Groundwater Assistant** 🤖\n\nI can help you with:\n- Information about **groundwater data** and monitoring\n- App navigation and features\n- **Predictions** and analytics\n- Understanding **CGWB data sources**\n\n*How can I assist you today?*",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [contextData, setContextData] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<{ [key: number]: boolean }>({});
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isListening, setIsListening] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Animation for recording pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const speakText = async (text: string, messageIndex: number) => {
    try {
      // Stop any current speech
      if (isSpeaking[messageIndex]) {
        await Speech.stop();
        setIsSpeaking((prev) => ({ ...prev, [messageIndex]: false }));
        return;
      }

      // Start speaking
      setIsSpeaking((prev) => ({ ...prev, [messageIndex]: true }));

      await Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          setIsSpeaking((prev) => ({ ...prev, [messageIndex]: false }));
        },
        onError: (error) => {
          console.error("Speech error:", error);
          setIsSpeaking((prev) => ({ ...prev, [messageIndex]: false }));
        },
        onStopped: () => {
          setIsSpeaking((prev) => ({ ...prev, [messageIndex]: false }));
        },
      });
    } catch (error) {
      console.error("Error in text-to-speech:", error);
      setIsSpeaking((prev) => ({ ...prev, [messageIndex]: false }));
    }
  };

  const transcribeAudioWithGemini = async (audioUri: string) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const audioPart = {
        inlineData: {
          mimeType: "audio/m4a",
          data: audioBase64,
        },
      };

      const result = await model.generateContent([
        "Please transcribe this audio. Only return the spoken text, without any additional sounds or noises like [breathing] or [background noise]. If no speech is detected, return an empty string.",
        audioPart,
      ]);

      const transcription = result.response.text().trim();
      if (transcription) {
        setInput((prev) => (prev ? `${prev} ${transcription}` : transcription));
      }
    } catch (err: any) {
      console.error("Error transcribing audio:", err);
      const errorMessage = err?.message?.includes("API key")
        ? "I'm having trouble connecting to my AI services. Please check your internet connection or try again later."
        : `Transcription failed: ${err?.message || "Unable to process audio"}.`;
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Web Speech API for browser testing (won't work on mobile)
  const startWebSpeechRecognition = () => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError("Speech recognition failed. Please try again.");
        setIsListening(false);
        setTimeout(() => setError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      return true;
    }
    return false;
  };

  const scrollViewRef = useRef<ScrollView>(null);

  // Function to simulate streaming text effect with optimized character batching
  const streamText = async (fullText: string) => {
    setIsStreaming(true);

    // Add empty assistant message first with fade-in animation
    const messageIndex = messages.length + 1; // +1 because we already added user message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Start with fade-in animation for the new message
    messageOpacity.setValue(0);
    Animated.timing(messageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Wait for fade-in to start before beginning text stream
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Stream text with optimized batching for smoother performance
    let currentText = "";
    let i = 0;

    while (i < fullText.length) {
      // Batch characters for better performance
      let batchSize = 1;
      let currentChar = fullText[i];

      // Batch alphanumeric characters together for smoother flow
      if (/[a-zA-Z0-9]/.test(currentChar)) {
        batchSize = Math.min(3, fullText.length - i); // Process up to 3 chars at once
      }

      // Add batch to current text
      for (let j = 0; j < batchSize && i + j < fullText.length; j++) {
        currentText += fullText[i + j];
      }
      i += batchSize;

      // Update the last message with current text using a more efficient update
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[messageIndex]) {
          newMessages[messageIndex] = {
            role: "assistant",
            content: currentText,
          };
        }
        return newMessages;
      });

      // Auto-scroll to bottom less frequently to reduce jitter
      if (i % 8 === 0 || i >= fullText.length) {
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        });
      }

      // Variable delay based on character type for natural feel
      let delay = 25; // Base delay for smooth streaming

      if (currentChar === ".") {
        delay = 250; // Long pause after periods
      } else if (currentChar === "!" || currentChar === "?") {
        delay = 200; // Medium-long pause after exclamation/question
      } else if (currentChar === "," || currentChar === ";") {
        delay = 80; // Short pause after commas
      } else if (currentChar === " ") {
        delay = 15; // Very short pause between words
      } else if (currentChar === "\n") {
        delay = 120; // Pause at line breaks
      }

      // Add minimal randomization for natural feel without jitter
      delay += Math.random() * 5;

      // Add subtle haptic feedback occasionally for typing feel (very light)
      if (i % 10 === 0 && Platform.OS !== "web") {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
          // Haptics not available, continue silently
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setIsStreaming(false);
  };

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

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording || isListening) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isListening, pulseAnim]);

  // Cursor blinking animation for streaming
  useEffect(() => {
    if (isStreaming) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();

      return () => {
        blinkAnimation.stop();
        cursorAnim.setValue(1);
      };
    } else {
      cursorAnim.setValue(1);
    }
  }, [isStreaming, cursorAnim]);

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

  const startRecording = async () => {
    try {
      // Try Web Speech API first (for web/browser testing)
      if (Platform.OS === "web" && startWebSpeechRecognition()) {
        return;
      }

      // Fallback to native recording for mobile
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      setError(
        "Failed to start recording. Please check microphone permissions."
      );
      setTimeout(() => setError(null), 3000);
    }
  };

  const stopRecording = async () => {
    // Handle Web Speech API stopping
    if (isListening && Platform.OS === "web") {
      setIsListening(false);
      // The onresult handler for Web Speech API already sets the input
      return;
    }

    // Handle native recording stopping
    console.log("Stopping recording..");
    if (!recording) return;

    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        console.log("Recording stopped and stored at", uri);
        // Transcribe the audio using Gemini
        await transcribeAudioWithGemini(uri);
      } else {
        throw new Error("Failed to get recording URI.");
      }
    } catch (err) {
      console.error("Failed to stop or transcribe recording", err);
      setError("Failed to process recording.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setRecording(null);
    }
  };

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

FORMATTING INSTRUCTIONS:
- Use **bold** for important terms and headings
- Use *italics* for emphasis
- Use \`inline code\` for technical terms, settings, or menu items
- Use numbered lists (1. 2. 3.) for step-by-step instructions
- Use bullet points (-) for feature lists or options
- Use > blockquotes for important notes or warnings
- Use ### headings to organize longer responses
- Use code blocks (\`\`\`) for any technical examples

USER QUESTION: ${input}

Respond based on the context provided and these instructions. If the user is asking about app features, guide them to the right section. If they need technical help, provide clear steps. If they want to understand data, explain it clearly with proper context. Format your response using markdown for better readability.`;

      const result = await model.generateContent(agenticPrompt);
      const resp = await result.response;
      const reply = resp.text();

      setLoading(false);

      // Use streaming effect for the response
      await streamText(reply);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err?.message?.includes("API key")
        ? "I'm having trouble connecting to my AI services. Please check your internet connection or try again later."
        : err?.message?.includes("quota")
        ? "I'm currently experiencing high usage. Please try again in a few moments."
        : `I encountered an error: ${
            err?.message || "Unable to process your request"
          }. Please try rephrasing your question.`;

      // Stream error message as well
      await streamText(errorMessage);
    }
    setInput("");
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
        <Image
          source={ChatIcon}
          style={[
            styles.chatIcon,
            isTablet && styles.chatIconTablet,
            isSmallScreen && styles.chatIconSmall,
          ]}
        />
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
                    {msg.role === "assistant" && (
                      <Animated.View
                        style={[
                          styles.assistantMsgWrapper,
                          isStreaming &&
                            messages.indexOf(msg) === messages.length - 1 && {
                              opacity: messageOpacity,
                            },
                        ]}
                      >
                        <View style={styles.assistantMsg}>
                          <Markdown style={markdownStyles}>
                            {msg.content}
                          </Markdown>
                          {isStreaming &&
                            messages.indexOf(msg) === messages.length - 1 && (
                              <Animated.Text
                                style={[styles.cursor, { opacity: cursorAnim }]}
                              >
                                |
                              </Animated.Text>
                            )}
                        </View>
                        <TouchableOpacity
                          style={styles.speakerButton}
                          onPress={() => speakText(msg.content, idx)}
                          activeOpacity={0.7}
                          disabled={
                            isStreaming &&
                            messages.indexOf(msg) === messages.length - 1
                          }
                        >
                          <Text style={styles.speakerIcon}>
                            {isSpeaking[idx] ? "🔊" : "🔇"}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                    {msg.role === "user" && (
                      <Text style={styles.userMsg}>{msg.content}</Text>
                    )}
                  </View>
                ))}
                {(loading || isStreaming) && !isTranscribing && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loading}>
                      🤖{" "}
                      {loading
                        ? "AI Assistant is thinking..."
                        : "AI Assistant is responding..."}
                    </Text>
                  </View>
                )}
                {isTranscribing && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loading}>🎤 Transcribing audio...</Text>
                  </View>
                )}
                {(isRecording || isListening) && !isTranscribing && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.recording}>
                      🎤{" "}
                      {isListening
                        ? "Listening... Speak now!"
                        : "Recording... Tap the stop button to finish"}
                    </Text>
                  </View>
                )}
                {error && <Text style={styles.error}>{error}</Text>}
              </ScrollView>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask about app..."
                    placeholderTextColor="#999"
                    multiline
                    editable={!loading && !isStreaming}
                  />
                  <Animated.View
                    style={[
                      { transform: [{ scale: pulseAnim }] },
                      (isRecording || isListening) && {
                        shadowColor: "#dc2626",
                        shadowOpacity: 0.5,
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 8,
                        elevation: 8,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.micButton,
                        (isRecording || isListening) &&
                          styles.micButtonRecording,
                      ]}
                      onPress={
                        isRecording || isListening
                          ? stopRecording
                          : startRecording
                      }
                      disabled={loading || isStreaming}
                    >
                      <MaterialIcons
                        name={
                          isRecording || isListening
                            ? "fiber-manual-record"
                            : "mic"
                        }
                        size={isTablet ? 28 : 24}
                        color={
                          isRecording || isListening ? "#ffffff" : "#075a7dff"
                        }
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (loading || isStreaming) && styles.sendBtnDisabled,
                  ]}
                  onPress={sendMessage}
                  disabled={loading || isStreaming}
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
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 36,
  },
  circleTablet: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  circleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  chatIcon: {
    width: 68,
    height: 68,
    resizeMode: "contain",
  },
  chatIconTablet: {
    width: 80,
    height: 80,
  },
  chatIconSmall: {
    width: 60,
    height: 60,
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
    maxWidth: screenWidth - 5,
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
    paddingHorizontal: isTablet ? 20 : 12,
    paddingVertical: isTablet ? 12 : 6,
  },
  chatContent: {
    flexGrow: 1,
    paddingBottom: isTablet ? 12 : 6,
  },
  userMsgContainer: {
    alignItems: "flex-end",
    marginVertical: isTablet ? 6 : 3,
  },
  assistantMsgContainer: {
    alignItems: "flex-start",
    marginVertical: isTablet ? 6 : 3,
  },
  assistantMsgWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "85%",
  },
  userMsg: {
    backgroundColor: "#075a7dff",
    color: "#fff",
    padding: isTablet ? 16 : 10,
    borderRadius: isTablet ? 20 : 16,
    borderBottomRightRadius: 4,
    maxWidth: "85%",
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 22 : 18,
  },
  assistantMsg: {
    backgroundColor: "#f3f4f6",
    padding: isTablet ? 16 : 10,
    borderRadius: isTablet ? 20 : 16,
    borderBottomLeftRadius: 4,
    flex: 1,
    // Remove default text styling since markdown handles it
  },
  speakerButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: isTablet ? 4 : 2,
  },
  speakerIcon: {
    fontSize: isTablet ? 16 : 14,
  },
  cursor: {
    color: "#075a7dff",
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
    opacity: 0.9,
  },
  loading: {
    color: "#2563eb",
    fontStyle: "italic",
    padding: 12,
    textAlign: "center",
  },
  recording: {
    color: "#dc2626",
    fontStyle: "italic",
    padding: 12,
    textAlign: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    margin: 8,
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
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: isTablet ? 24 : 20,
    marginRight: isTablet ? 12 : 8,
    backgroundColor: "#f9fafb",
  },
  input: {
    flex: 1,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
    maxHeight: isTablet ? 100 : 80,
    fontSize: isTablet ? 16 : 14,
  },
  micButton: {
    padding: isTablet ? 12 : 8,
  },
  micButtonRecording: {
    backgroundColor: "#dc2626",
    borderRadius: isTablet ? 20 : 16,
    shadowColor: "#dc2626",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
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
  sendBtnDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
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

// Markdown styles optimized for mobile - reduced padding and spacing
const markdownStyles = {
  body: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 22 : 18,
    color: "#374151",
    margin: 0,
    padding: 0,
  },
  heading1: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: "bold" as const,
    color: "#075a7dff",
    marginTop: isTablet ? 12 : 8,
    marginBottom: isTablet ? 6 : 4,
  },
  heading2: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold" as const,
    color: "#075a7dff",
    marginTop: isTablet ? 10 : 6,
    marginBottom: isTablet ? 4 : 3,
  },
  heading3: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: "bold" as const,
    color: "#075a7dff",
    marginTop: isTablet ? 8 : 5,
    marginBottom: isTablet ? 3 : 2,
  },
  paragraph: {
    marginBottom: isTablet ? 6 : 4,
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 22 : 18,
    marginTop: 0,
  },
  strong: {
    fontWeight: "bold" as const,
    color: "#1f2937",
  },
  em: {
    fontStyle: "italic" as const,
  },
  code_inline: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: isTablet ? 4 : 3,
    paddingVertical: isTablet ? 2 : 1,
    borderRadius: 3,
    fontSize: isTablet ? 13 : 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  code_block: {
    backgroundColor: "#f3f4f6",
    padding: isTablet ? 10 : 8,
    borderRadius: 6,
    marginVertical: isTablet ? 6 : 4,
    fontSize: isTablet ? 13 : 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  fence: {
    backgroundColor: "#f3f4f6",
    padding: isTablet ? 10 : 8,
    borderRadius: 6,
    marginVertical: isTablet ? 6 : 4,
    fontSize: isTablet ? 13 : 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  blockquote: {
    backgroundColor: "#f9fafb",
    borderLeftWidth: 3,
    borderLeftColor: "#075a7dff",
    paddingLeft: isTablet ? 10 : 8,
    paddingVertical: isTablet ? 6 : 4,
    marginVertical: isTablet ? 6 : 4,
    fontStyle: "italic" as const,
  },
  list_item: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: isTablet ? 3 : 2,
  },
  bullet_list: {
    marginVertical: isTablet ? 6 : 4,
    paddingLeft: 0,
  },
  ordered_list: {
    marginVertical: isTablet ? 6 : 4,
    paddingLeft: 0,
  },
  bullet_list_icon: {
    marginRight: isTablet ? 6 : 5,
    marginTop: 1,
    fontSize: isTablet ? 14 : 13,
    minWidth: isTablet ? 12 : 10,
  },
  ordered_list_icon: {
    marginRight: isTablet ? 6 : 5,
    marginTop: 1,
    fontSize: isTablet ? 13 : 12,
    fontWeight: "bold" as const,
    minWidth: isTablet ? 16 : 14,
  },
  link: {
    color: "#075a7dff",
    textDecorationLine: "underline" as const,
  },
  // Additional mobile-specific styles
  text: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 22 : 18,
    color: "#374151",
  },
  // Reduce spacing between list items and content
  list_item_content: {
    flex: 1,
    marginTop: 0,
  },
};

export default ChatBox;
