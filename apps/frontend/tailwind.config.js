const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, '../../(libs|apps)/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--mas-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--mas-surface) / <alpha-value>)',
          raised: 'rgb(var(--mas-surface-raised) / <alpha-value>)',
          subtle: 'rgb(var(--mas-surface-subtle) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--mas-ink) / <alpha-value>)',
          muted: 'rgb(var(--mas-ink-muted) / <alpha-value>)',
          subtle: 'rgb(var(--mas-ink-subtle) / <alpha-value>)',
        },
        outline: 'rgb(var(--mas-outline) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--mas-brand) / <alpha-value>)',
          strong: 'rgb(var(--mas-brand-strong) / <alpha-value>)',
          soft: 'rgb(var(--mas-brand-soft) / <alpha-value>)',
          on: 'rgb(var(--mas-on-brand) / <alpha-value>)',
        },
        danger: 'rgb(var(--mas-danger) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
