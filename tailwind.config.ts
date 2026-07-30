import type { Config } from "tailwindcss";
const config: Config = { 
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"], 
  darkMode: "class", 
  theme: { 
    extend: { 
      colors: { 
        ink: "var(--text-ink)", 
        page: "var(--bg-page)", 
        card: "var(--bg-card)", 
        line: "var(--border-line)", 
        muted: "var(--text-muted)", 
        faint: "var(--text-faint)", 
        accent: { DEFAULT: "var(--accent-primary)", hover: "var(--accent-hover)", subtle: "var(--accent-subtle)" },
        selected: "var(--bg-selected)", 
        hover: "var(--bg-hover)", 
        danger: { DEFAULT: "var(--danger)", subtle: "var(--danger-subtle)" },
        priority: { high: "var(--priority-high)", medium: "var(--priority-medium)", low: "var(--priority-low)" }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    } 
  }, 
  plugins: [] 
};
export default config;
