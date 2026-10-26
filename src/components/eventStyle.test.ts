import { pickEventStyle } from "./eventStyle";

it("#18: keeps only colour keys", () => {
  expect(
    pickEventStyle(
      { backgroundColor: "#000000", position: "absolute", top: 999 } as never,
      "#2563eb",
    ),
  ).toEqual({ backgroundColor: "#000000", color: "#FFFFFF" });
});

it("falls back to the default event colour", () =>
  expect(pickEventStyle(undefined, "#2563eb").backgroundColor).toBe("#2563eb"));

it("keeps an explicit text colour, border and opacity", () =>
  expect(
    pickEventStyle(
      { color: "#111111", borderColor: "#222222", opacity: 0.5 },
      "#2563eb",
    ),
  ).toEqual({
    backgroundColor: "#2563eb",
    color: "#111111",
    borderColor: "#222222",
    opacity: 0.5,
  }));
