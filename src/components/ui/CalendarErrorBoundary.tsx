/**
 * @file Silent error boundary (TDD §8.1 step 7).
 */
import { Component, type ReactNode } from "react";
import { View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Renders `<View testID="calendar-error-boundary"/>` when a child throws; logs nothing. */
export class CalendarErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <View testID="calendar-error-boundary" />;
    return this.props.children;
  }
}
