/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        mafatec: {
          red: {
            400: "#e0552e",
            500: "#c93b18",
            600: "#a82e12",
          },
          ink: {
            800: "#141832",
            850: "#0f1326",
            900: "#0b0e1d",
            950: "#070912",
          },
          navy: {
            500: "#5a5fb8",
            700: "#3a3f8f",
            800: "#2a2e72",
            900: "#191d49",
          },
          champagne: {
            DEFAULT: "#A82E12",
            soft: "#A82E12",
            deep: "#a8884a",
          },
          paper: {
            DEFAULT: "#ffffff",
            2: "#f5f5f7",
          },
          text: {
            DEFAULT: "#15172b",
            soft: "#454a63",
            muted: "#7a7e95",
          },
          line: {
            warm: "#e8e8ea",
          }
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        r_sm: "6px",
        r_md: "12px",
        r_lg: "18px",
        r_xl: "26px",
      },
      boxShadow: {
        sh_sm: "0 2px 14px rgba(11,14,29,.06)",
        sh_md: "0 18px 50px rgba(11,14,29,.12)",
        sh_lg: "0 40px 90px rgba(11,14,29,.22)",
      },
      transitionTimingFunction: {
        'lux': 'cubic-bezier(.16, 1, .3, 1)',
        'ease-lux': 'cubic-bezier(.16, 1, .3, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}