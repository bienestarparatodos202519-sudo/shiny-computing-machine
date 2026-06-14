import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rutas.saltillo",
  appName: "Rutas Saltillo",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
