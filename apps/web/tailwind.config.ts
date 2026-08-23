import type { Config } from "tailwindcss";
import uiPreset from "@al-makan/ui/tailwind.preset.js";

const config: Config = {
  presets: [uiPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
