import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B1A17",
        paper: "#F7F4EC",
        "paper-dim": "#EFEADC",
        plum: {
          DEFAULT: "#4B3869",
          light: "#6C5490",
          dark: "#332448"
        },
        marigold: {
          DEFAULT: "#E2A73E",
          light: "#F0C578",
          dark: "#B9822A"
        },
        moss: {
          DEFAULT: "#52734D",
          light: "#7A9C74"
        },
        rust: {
          DEFAULT: "#B54834"
        },
        // Seller Hub's accent, layered onto the shared MarketLoop palette.
        clay: {
          DEFAULT: "#A5573A",
          light: "#C97E5C",
          dark: "#7A3D26"
        },
        // Admin panel's accent.
        steel: {
          DEFAULT: "#2F5D62",
          light: "#4F8A8F",
          dark: "#1F3F43"
        },
        // "accent" is the current portal's brand color. It's driven by
        // CSS variables (see app/globals.css) which each portal layout
        // sets via data-portal="shop|seller|admin", so SHARED components
        // (Spinner, NotificationBell, .btn-primary, .input, ...) pick
        // up the right color without knowing which portal they're in.
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          light: "rgb(var(--accent-light) / <alpha-value>)",
          dark: "rgb(var(--accent-dark) / <alpha-value>)"
        },
        line: "#DED8C7"
      },
      fontFamily: {
        // Web-safe stacks (no external font fetch, so the build never
        // depends on network access to fonts.googleapis.com).
        display: ['"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      maxWidth: {
        prose: "68ch"
      }
    }
  },
  plugins: []
};

export default config;
