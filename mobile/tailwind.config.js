/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is light-only; 'class' also stops NativeWind on web from throwing when the html class changes.
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
