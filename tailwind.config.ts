import type { Config } from "tailwindcss";

/**
 * Colours are driven by CSS variables so a single set of semantic class names
 * (`bg-paper`, `text-ink`, `bg-debit`) works in both the light and dark theme.
 * In dark mode the variables flip and every component follows automatically.
 */
const rgb = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: rgb("--paper"),
          card: rgb("--paper-card"),
          sunken: rgb("--paper-sunken"),
        },
        ink: {
          DEFAULT: rgb("--ink"),
          soft: rgb("--ink-soft"),
          muted: rgb("--ink-muted"),
        },
        line: rgb("--line"),
        gold: {
          DEFAULT: rgb("--gold"),
          soft: rgb("--gold-soft"),
          deep: rgb("--gold-deep"),
        },
        debit: {
          DEFAULT: rgb("--debit"),
          soft: rgb("--debit-soft"),
          deep: rgb("--debit-deep"),
        },
        credit: {
          DEFAULT: rgb("--credit"),
          soft: rgb("--credit-soft"),
          deep: rgb("--credit-deep"),
        },
        good: {
          DEFAULT: rgb("--good"),
          soft: rgb("--good-soft"),
        },
        bad: {
          DEFAULT: rgb("--bad"),
          soft: rgb("--bad-soft"),
        },
        brand: {
          yellow: "#FFD93D",
          orange: "#F58529",
          pink: "#E1306C",
          purple: "#9B30BF",
          blue: "#405DE6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        ig: "linear-gradient(45deg,#FFD93D 0%,#F58529 22%,#E1306C 52%,#9B30BF 76%,#405DE6 100%)",
        "ig-soft":
          "linear-gradient(135deg,rgba(255,217,61,0.25),rgba(245,133,41,0.25),rgba(225,48,108,0.25),rgba(155,48,191,0.25),rgba(64,93,230,0.25))",
        "ig-135":
          "linear-gradient(135deg,#F58529 0%,#E1306C 45%,#9B30BF 78%,#405DE6 100%)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 18px 40px -18px rgba(225,48,108,0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-6deg)" },
          "75%": { transform: "rotate(6deg)" },
        },
        "gradient-pan": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.94)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "55%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "ring-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(225,48,108,0.5)" },
          "100%": { boxShadow: "0 0 0 16px rgba(225,48,108,0)" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        rise: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(24px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(0.9)", opacity: "0" },
          "20%": { transform: "translateY(-6px) scale(1.06)", opacity: "1" },
          "100%": { transform: "translateY(-48px) scale(1)", opacity: "0" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        sweep: {
          "0%": { transform: "translateX(-10%)" },
          "60%,100%": { transform: "translateX(320%)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        pop: "pop 0.35s cubic-bezier(0.22,1,0.36,1) both",
        wiggle: "wiggle 0.4s ease-in-out",
        "gradient-pan": "gradient-pan 8s ease infinite",
        "slide-up": "slide-up 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.3s ease-out both",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "ring-pulse": "ring-pulse 1.6s ease-out infinite",
        confetti: "confetti 2.6s linear forwards",
        rise: "rise 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "float-up": "float-up 1.1s cubic-bezier(0.22,1,0.36,1) both",
        shake: "shake 0.4s ease-in-out",
        sweep: "sweep 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
