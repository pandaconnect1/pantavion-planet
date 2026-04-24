/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./core/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pantavion: {
          black: "#03060B",
          night: "#06111F",
          navy: "#071426",
          royal: "#0B1E3A",
          blue: "#123A66",
          cyan: "#39D6FF",
          gold: "#D6A84A",
          goldDeep: "#9E7427",
          white: "#F5F1E7",
          slate: "#8A96A8",
          danger: "#D9534F",
        },
      },
      boxShadow: {
        pantavion: "0 0 60px rgba(57, 214, 255, 0.14), 0 0 120px rgba(214, 168, 74, 0.08)",
        gold: "0 0 40px rgba(214, 168, 74, 0.25)",
      },
      backgroundImage: {
        "pantavion-grid":
          "radial-gradient(circle at 20% 20%, rgba(57,214,255,.14), transparent 28%), radial-gradient(circle at 80% 10%, rgba(214,168,74,.13), transparent 26%), linear-gradient(135deg, #03060B 0%, #071426 48%, #0B1E3A 100%)",
      },
    },
  },
  plugins: [],
};
