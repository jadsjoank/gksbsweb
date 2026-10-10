import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ECLESIA design system — Swiss minimalist
        "surface":               "#f9f9f9",
        "surface-low":           "#f3f3f3",
        "surface-container":     "#eeeeee",
        "surface-high":          "#e8e8e8",
        "surface-highest":       "#e2e2e2",
        "surface-white":         "#ffffff",
        "surface-dim":           "#dadada",
        "outline":               "#e5e5e5",
        "outline-strong":        "#cfc4c5",
        "on-surface":            "#1a1c1c",
        "on-surface-muted":      "#5e5e5e",
        "on-surface-faint":      "#4c4546",
        "error":                 "#ba1a1a",
        "error-container":       "#ffdad6",
        // Keep legacy tokens so existing pages don't break immediately
        "gksbs-cream":           "#f9f9f9",
        "gksbs-brown":           "#1a1c1c",
        "gksbs-brown-medium":    "#5e5e5e",
        "gksbs-brown-accent":    "#000000",
        "gksbs-gold":            "#e2e2e2",
        "gksbs-card":            "#f3f3f3",
        "gksbs-border":          "#e5e5e5",
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        serif: ["Inter", "system-ui", "sans-serif"], // override serif → Inter
      },
      fontSize: {
        "display": ["clamp(3rem, 7vw, 5rem)", { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "700" }],
        "h1":      ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2":      ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h3":      ["clamp(1.5rem, 2.7vw, 2.25rem)", { lineHeight: "1.3", fontWeight: "600" }],
        "h4":      ["clamp(1.2rem, 2vw, 1.75rem)", { lineHeight: "1.35", fontWeight: "600" }],
        "label":   ["14px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body":    ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        // legacy aliases
        "h2-small": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.2", fontWeight: "700" }],
        "h3-size":  ["clamp(1.5rem, 2.7vw, 2.25rem)", { lineHeight: "1.3", fontWeight: "600" }],
      },
      borderRadius: {
        DEFAULT: "0px",
        sm:      "0px",
        md:      "0px",
        lg:      "0px",
        xl:      "0px",
        "2xl":   "0px",
        "3xl":   "0px",
        full:    "9999px",
      },
      spacing: {
        "gutter": "16px",
        "section": "80px",
      },
    },
  },
  plugins: [],
};

export default config;
