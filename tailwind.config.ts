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
        serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      colors: {
        ink: {
          900: '#0B0E1D',
        },
        red: {
          500: '#C93B18',
        },
        'logo-blue': '#3A55B0',
        champagne: {
          DEFAULT: '#C9A96A',
          soft: '#E3CFA3',
          deep: '#A8884A',
        },
        
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#F5F5F7',
        },
        'text-luxe': '#15172B',
        'text-soft': '#454A63',
        '[#7a7e95]': '#7A7E95',
        'on-dark': '#F3EFE6',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
