import type { ComponentType } from "react";
import IntlCheckScreen from "./screens/IntlCheckScreen";

export const SCREENS: {
  key: string;
  title: string;
  component: ComponentType;
}[] = [{ key: "intl", title: "Intl check", component: IntlCheckScreen }];
