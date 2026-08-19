import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Next.js 16 removed the `next lint` command in favour of the ESLint CLI.
// This flat config wraps the same shareable configs the project used under
// `.eslintrc.json` (next/core-web-vitals + next/typescript) via FlatCompat,
// so linting behaviour is unchanged while being ESLint 9 (flat) native.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      '.github/actions-artifacts/**',
      'playwright-reports/**',
      'playwright-screenshots/**',
      'coverage/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
