/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mmh: {
          orange: "#F96100",        // Cadmium Orange (Vitality, Heart)
          "orange-warm": "#FF9E00",   // Warm Ochre / Orange Peel
          yellow: "#FFAC24",        // Clarity
          navy: "#130C76",          // Depth & Psychological Authority
          "blue-trust": "#0038A8",  // Philippine Blue (Clinical Calm)
          forest: "#2A4836",        // Somatic Grounding Sage
          linen: "#FBF9F5",         // Warm Sand / Neutral Canvas
          slate: "#1C2420",         // Deep Readable Body Charcoal
          border: "#E5DFD5",        // Soft Organic Border
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
