// jest-expo/universal ignores top-level options and adds a Node project that
// would pick up the Vitest files, so the platform projects are listed here.
// "web" is left out on purpose: @testing-library/react-native cannot render
// react-native-web's <div> hosts ("Text strings must be rendered within a
// <Text> component"), and jest-expo 58.0.12 maps `react-native` to native RN
// on web. Web is covered by the Playwright e2e instead.
const shared = {
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  testPathIgnorePatterns: ["<rootDir>/src/core/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Reanimated 4 / worklets run their JS implementation in Jest (gestures
  // entry tests); this resolver skips their native-only files.
  resolver: "react-native-reanimated/jest/resolver",
};

/** @type {import('jest').Config} */
export default {
  projects: ["ios", "android"].map((platform) => ({
    ...shared,
    displayName: platform,
    preset: `jest-expo/${platform}`,
  })),
};
