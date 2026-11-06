import i18n from "i18next";

import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n.use(LanguageDetector)
	// http backend for multiple translations
	.use(Backend)
	// pass the i18n instance to react-i18next
	.use(initReactI18next)
	// init i18next
	.init({
		debug: import.meta.env.DEV,
		fallbackLng: "en",
		load: "languageOnly",
		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
		backend: {
			loadPath: "/tonique/locales/{{lng}}/{{ns}}.json",
		},
	});

// Tells browsers and screen readers which language the page is in.
i18n.on("languageChanged", (language) => {
	document.documentElement.lang = language;
});

export default i18n;
