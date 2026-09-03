import { TextStyle } from "react-native";
import { colors } from "./colors";

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.darkText,
  } as TextStyle,
  h1: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.darkText,
  } as TextStyle,
  h2: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.darkText,
  } as TextStyle,
  h3: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.darkText,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.darkText,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.gray,
  } as TextStyle,
  small: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.gray,
  } as TextStyle,
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
  } as TextStyle,
  overline: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as TextStyle,
};
