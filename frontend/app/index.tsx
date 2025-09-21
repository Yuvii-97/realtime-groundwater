import { Image, StyleSheet, View, Text } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { scale, verticalScale } from "@/utils/styling";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/splashImage.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* Tagline at bottom */}
      <View
        style={styles.taglineBox}
        accessible
        accessibilityLabel="Groundwater monitoring tagline"
      >
        <Text style={styles.taglineTitle}>Real-Time Groundwater Insights</Text>
        <Text style={styles.taglineSub}>
          Live updates on groundwater levels, right at your fingertips.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: scale(450),
    height: verticalScale(450),
  },
  // New styles
  taglineBox: {
    position: "absolute",
    bottom: verticalScale(36),
    left: scale(20),
    right: scale(20),
    alignItems: "center",
  },
  taglineTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#102027",
    letterSpacing: 0.4,
  },
  taglineSub: {
    marginTop: 6,
    fontSize: scale(12.5),
    color: "#51636B",
    textAlign: "center",
  },
});
