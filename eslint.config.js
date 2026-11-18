import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintReact from '@eslint-react/eslint-plugin'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'lib',
      '.tmp',
      'example',
      'node_modules',
      'e2e-web/test-results',
      'eslint.config.js',
      'babel.config.mjs',
      'jest.config.js',
      'commitlint.config.js',
      'release.config.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ...eslintReact.configs['recommended-type-checked'],
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    settings: {
      'react-x': {
        version: '19.2',
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        // The boundary test lints in-memory text for a path that does not
        // exist on disk; let that one path fall back to the default project.
        projectService: {
          allowDefaultProject: ['src/core/probe.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'warn',
      // Hooks are checked by eslint-plugin-react-hooks (above).
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/static-components': 'off',
      // Style rules the project has not adopted (React 19 APIs, ref names).
      '@eslint-react/no-use-context': 'off',
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/naming-convention-ref-name': 'off',
      '@eslint-react/no-unnecessary-use-prefix': 'off',
      // Positional lists (week rows, bar lanes, hour slots) never reorder.
      '@eslint-react/no-array-index-key': 'off',
      // Test probes are defined inside their tests on purpose.
      '@eslint-react/no-nested-component-definitions': 'off',
    },
  },
  {
    // The main entry stays free of the optional gesture peers; only
    // src/gestures (the calendar-simple-native/gestures entry) imports them.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/gestures/**', 'src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react-native-gesture-handler',
                'react-native-gesture-handler/*',
                'react-native-reanimated',
                'react-native-reanimated/*',
                'react-native-worklets',
                'react-native-worklets/*',
              ],
              message:
                'Only src/gestures may import the optional gesture peers',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-native', 'react-dom'].map((name) => ({
            name,
            message: 'src/core must stay platform-free (TDD §4.1)',
          })),
          patterns: [
            {
              group: ['react/*', 'react-native/*', 'react-dom/*'],
              message: 'src/core must stay platform-free (TDD §4.1)',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    // Plain Node scripts are not in the TS project; lint them without types.
    files: ['scripts/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { ...globals.node } },
  },
  eslintConfigPrettier,
)
