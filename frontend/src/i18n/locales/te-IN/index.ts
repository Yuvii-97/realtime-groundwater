import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import translationEn from "../en-US/translation.json"; // Ensure this folder exists as "en-US"
import translationGu from "../gu-IN/translation.json";
import translationTa from "../ta-IN/translation.json";
import translationHi from "../hi-IN/translation.json";
import translationTe from "./translation.json";
import translationMl from "../ml-IN/translation.json";

const resources = {
  "en-US": { translation: translationEn },
  "gu-IN": { translation: translationGu },
  "ta-IN": { translation: translationTa },
  "hi-IN": { translation: translationHi },
  "te-IN": { translation: translationTe },
  "ml-IN": { translation: translationMl },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem("language");

  if (!savedLanguage) {
    const locales = Localization.getLocales();
    savedLanguage = locales[0]?.languageTag || "en-US";
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en-US",
    interpolation: {
      escapeValue: false,
    },
    debug: true, // Add this to see logs in console
  });

  console.log("i18n initialized with language:", savedLanguage); // Add log
};

initI18n();

export default i18n;
