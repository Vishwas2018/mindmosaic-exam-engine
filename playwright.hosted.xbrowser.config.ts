import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.hosted.config";

// Cross-browser pass: same specs, engine chosen by XBROWSER (firefox | webkit). Project keeps the
// "desktop-1440" name because the specs gate on it.
const device = process.env.XBROWSER === "webkit" ? devices["Desktop Safari"] : devices["Desktop Firefox"];
export default defineConfig({
  ...base,
  projects: [{ name: "desktop-1440", use: { ...device, viewport: { width: 1440, height: 900 } } }],
});
