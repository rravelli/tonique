import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	base: "/tonique",
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				download: resolve(__dirname, "download/index.html"),
			},
		},
	},
});
