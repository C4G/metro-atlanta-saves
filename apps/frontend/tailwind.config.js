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
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
      },
      backgroundImage: {
        'page-glow': [
          'radial-gradient(36rem 36rem at 0% 12%, rgb(var(--mas-glow-a) / var(--mas-glow-a-alpha)), transparent 70%)',
          'radial-gradient(40rem 40rem at 100% 55%, rgb(var(--mas-glow-b) / var(--mas-glow-b-alpha)), transparent 70%)',
          'radial-gradient(32rem 32rem at 30% 100%, rgb(var(--mas-glow-a) / var(--mas-glow-a-alpha)), transparent 70%)',
        ].join(', '),
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
      },
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
        warn: {
          soft: 'rgb(var(--mas-warn-soft) / <alpha-value>)',
          ink: 'rgb(var(--mas-warn-ink) / <alpha-value>)',
        },
        review: {
          DEFAULT: 'rgb(var(--mas-review) / <alpha-value>)',
          soft: 'rgb(var(--mas-review-soft) / <alpha-value>)',
          ink: 'rgb(var(--mas-review-ink) / <alpha-value>)',
          on: 'rgb(var(--mas-on-review) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
