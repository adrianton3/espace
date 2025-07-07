import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';


export default defineConfig([
    globalIgnores(['examples/lib', 'test/lib', 'build']),
    { files: ['**/*.{js,mjs}'], plugins: { js }, extends: ['js/recommended'], rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }] } },
    { files: ['**/*.{js,mjs}'], languageOptions: { globals: {...globals.browser } } },
    { files: ['test/unit/spec/**/*.{js,mjs}'], languageOptions: { globals: {...globals.browser, ...globals.jasmine } } },
    { files: ['examples/**/*.{js,mjs}'], languageOptions: { globals: {...globals.browser, ...{ 'ace': false } } } },
    { files: ['examples/node/**/*.{js,mjs}'], languageOptions: { globals: {...globals.browser, ...globals.node } } },
]);
