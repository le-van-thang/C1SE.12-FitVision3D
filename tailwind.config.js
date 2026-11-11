/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./landing.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper-2)',
        },
        kraft: {
          DEFAULT: 'var(--kraft)',
          subtle: 'var(--kraft-subtle)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        vermilion: {
          DEFAULT: 'var(--vermilion)',
          hover: 'var(--vermilion-hover)',
        },
        moss: {
          DEFAULT: 'var(--moss)',
        },
        ochre: {
          DEFAULT: 'var(--ochre)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        control: '10px',
        card: '14px',
        modal: '20px',
        pill: '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(23, 21, 15, 0.04)',
        'card': '0 2px 8px -2px rgba(23, 21, 15, 0.05), 0 1px 3px 0 rgba(23, 21, 15, 0.03)',
        'modal': '0 12px 32px -4px rgba(23, 21, 15, 0.08), 0 4px 12px -2px rgba(23, 21, 15, 0.04)',
        'cta': '0 2px 6px -1px rgba(38, 53, 107, 0.16)',
        'cta-pressed': 'inset 0 1px 3px rgba(0, 0, 0, 0.18)',
      },
      maxWidth: {
        'content': '1200px',
        'prose-editorial': '68ch',
      },
      transitionDuration: {
        'smooth': '200ms',
      },
    },
  },
  plugins: [],
}
