import { Image, StyleSheet, View } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/splashImage.png")}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral900,
  },
  logo: {
    width: 200,
    height: 200,
  },
});
