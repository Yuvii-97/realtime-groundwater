import { Image, StyleSheet, View } from "react-native";
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
});
