import type { ComponentType } from "react";
import HeaderScreen from "./screens/HeaderScreen";
import IntlCheckScreen from "./screens/IntlCheckScreen";
import PagerProbeScreen from "./screens/PagerProbeScreen";

export const SCREENS: {
  key: string;
  title: string;
  component: ComponentType;
}[] = [
  { key: "intl", title: "Intl check", component: IntlCheckScreen },
  { key: "header", title: "Header", component: HeaderScreen },
  { key: "pager", title: "Pager probe", component: PagerProbeScreen },
];
