/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // LOAD-BEARING: darkMode "class" keeps the app pinned to light AND keeps
  // react-native-css-interop legal — in "media" (the default when absent)
  // any color-scheme set throws ("Cannot manually set color scheme...").
  // Nothing ever adds the `dark` class, so no dark: variants can activate.
  darkMode: "class",
  theme: { extend: {} },
  plugins: [],
};
