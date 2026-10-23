import { render, screen } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { findUnlabelledInteractive } from "./a11yAudit";

it("reports pressables without a role or a name", async () => {
  await render(
    <View>
      <Pressable testID="no-role" accessibilityLabel="A" onPress={() => {}} />
      <Pressable
        testID="no-name"
        accessibilityRole="button"
        onPress={() => {}}
      />
      <Pressable
        testID="text-name"
        accessibilityRole="button"
        onPress={() => {}}
      >
        <Text>Today</Text>
      </Pressable>
      <Pressable
        testID="labelled"
        accessibilityRole="button"
        accessibilityLabel="Next"
        onLongPress={() => {}}
      />
      <Pressable testID="opted-out" accessible={false} onPress={() => {}} />
    </View>,
  );
  expect(findUnlabelledInteractive(screen.container)).toEqual([
    "no-role",
    "no-name",
  ]);
});
