import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          950: '#070912',
          900: '#0b0e1d',
          850: '#0f1326',
          800: '#141832',
        },
        navy: {
          900: '#191d49',
          800: '#2a2e72',
          700: '#3a3f8f',
          500: '#5a5fb8',
        },
        red: {
          600: '#a82e12',
          500: '#c93b18',
          400: '#e0552e',
        },
        'logo-blue': '#3a55b0',
        champagne: {
          DEFAULT: '#c9a96a',
          soft: '#e3cfa3',
          deep: '#a8884a',
        },
        paper: {
          DEFAULT: '#ffffff',
          2: '#f5f5f7',
        },
        'line-warm': '#e8e8ea',
        'text-luxe': '#15172b',
        'text-soft': '#454a63',
        muted: '#7a7e95',
        'on-dark': '#f3efe6',
        'on-dark-soft': 'rgba(243,239,230,0.62)',
        'on-dark-mute': 'rgba(243,239,230,0.40)',
      },
      borderRadius: {
        'r-sm': '6px',
        'r-md': '12px',
        'r-lg': '18px',
        'r-xl': '26px',
      },
      boxShadow: {
        'sh-sm': '0 2px 14px rgba(11,14,29,0.06)',
        'sh-md': '0 18px 50px rgba(11,14,29,0.12)',
        'sh-lg': '0 40px 90px rgba(11,14,29,0.22)',
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
}
export default config
