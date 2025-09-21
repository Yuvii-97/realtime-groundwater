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
// Add imports for new languages
import translationUr from "./locales/ur-IN/translation.json";
import translationDo from "./locales/do-IN/translation.json";
import translationSs from "./locales/ss-IN/translation.json";
import translationMn from "./locales/mn-IN/translation.json";
import translationAs from "./locales/as-IN/translation.json";
import translationMr from "./locales/mr-IN/translation.json";
import translationPn from "./locales/pn-IN/translation.json"
import translationBn from "./locales/bn-IN/translation.json";
import translationKn from "./locales/kn-IN/translation.json";

const resources = {
  "en-US": { translation: translationEn },
  "gu-IN": { translation: translationGu },
  "ta-IN": { translation: translationTa },
  "hi-IN": { translation: translationHi },
  "te-IN": { translation: translationTe },
  "ml-IN": { translation: translationMl },
  "ur-IN": { translation: translationUr },
  "do-IN": { translation: translationDo },
  "ss-IN": { translation: translationSs },
  "mn-IN": { translation: translationMn },
  "as-IN": { translation: translationAs },
  "mr-IN": { translation: translationMr },
  "pn-IN": { translation: translationPn },
  "bn-IN": { translation: translationBn },
  "kn-IN": { translation: translationKn },
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
