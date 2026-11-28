/**
 * Expo config: `app.json`, plus the web base path when `EXPO_BASE_URL` is
 * set. The live demo on GitHub Pages is served from `/CalendarSimple-Native/`,
 * so its export needs `experiments.baseUrl`; local runs and the Playwright
 * tests leave it unset and keep `/`.
 *
 * @param {{ config: import("expo/config").ExpoConfig }} context
 * @returns {import("expo/config").ExpoConfig}
 */
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
