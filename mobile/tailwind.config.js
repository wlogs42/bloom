module.exports = {
  content: ['./index.ts', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F2',
        ink: '#20251F',
        muted: '#7A8177',
        accent: '#DDF69A',
        forest: '#253D32',
        line: '#E6E9E0',
        peach: '#F6DAC4',
      },
    },
  },
  plugins: [],
};
