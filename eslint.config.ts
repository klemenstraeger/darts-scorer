import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  ignores: [
    '.nuxt/**',
    '.output/**',
    'coverage/**',
    'server/db/migrations/**',
    'darts_scorer/**',
    'plans/**',
    '.github/**',
  ],
}, {
  rules: {
    'no-console': 'warn',
  },
})
