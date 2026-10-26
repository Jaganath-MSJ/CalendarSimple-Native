import "@testing-library/react-native";

// The first render in a file warms up the calendar (Luxon, Intl, layouts) and
// can pass 5 s on a busy CI runner; give each test more room.
jest.setTimeout(20_000);
