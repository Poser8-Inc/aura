/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#07080F',
        surface: '#0F1020',
        text: '#F5F0F8',
        gold: '#C9A84C',
        'aura-red': '#E53E3E',
        'aura-orange': '#DD6B20',
        'aura-yellow': '#D69E2E',
        'aura-green': '#38A169',
        'aura-blue': '#3182CE',
        'aura-indigo': '#553C9A',
        'aura-violet': '#805AD5',
      },
    },
  },
  plugins: [],
}
