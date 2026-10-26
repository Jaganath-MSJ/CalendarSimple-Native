import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
it("renders on ios and android", async () => {
  await render(<Text>ready</Text>);
  expect(screen.getByText("ready")).toBeOnTheScreen();
});
