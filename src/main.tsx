import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import "./tonique.css";
import "./i18n";
import ToniquePage from "./ToniquePage";

const container = document.getElementById("root");
if (container) {
	ReactDOM.createRoot(container).render(
		<StrictMode>
			<ToniquePage />
		</StrictMode>
	);
}
