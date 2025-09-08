import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import translationEn from "./locales/en-US/translation.json";
import translationGu from "./locales/gu-IN/translation.json";
import translationTa from "./locales/ta-IN/translation.json";
import translationHi from "./locales/hi-IN/translation.json";
import translationTe from "./locales/te-IN/translation.json";
import translationMl from "./locales/ml-IN/translation.json";

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
    debug: true,
  });

  console.log("i18n initialized with language:", savedLanguage);
};

initI18n();

export default i18n;
