/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          tint: '#EEF0FF',
        },
        sidebar: {
          active: '#E0E3FF',
        },
        border: '#E6E8F5',
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        heading: '#111827',
        body: '#4B5563',
        muted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      backgroundImage: {
        'page-gradient': 'linear-gradient(135deg, #EEF1FF 0%, #F7F8FF 100%)',
      },
    },
  },
  plugins: [],
}
