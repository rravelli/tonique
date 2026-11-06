import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import "./tonique.css";
import "./i18n";
import DownloadPage from "./DownloadPage";

const container = document.getElementById("root");
if (container) {
	ReactDOM.createRoot(container).render(
		<StrictMode>
			<DownloadPage />
		</StrictMode>
	);
}
