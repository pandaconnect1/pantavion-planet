/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./core/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        pantavion: {
          night: "#06111f",
          deep: "#071a2d",
          ink: "#020814",
          gold: "#e8b94f",
          goldSoft: "#f4d37a",
          cyan: "#39d6ff"
        }
      },
      boxShadow: {
        sovereign: "0 30px 100px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
};
