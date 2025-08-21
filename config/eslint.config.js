import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    js.configs.recommended,
    prettier,
    {
        files: ['*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                firebase: 'readonly',
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                performance: 'readonly',
                Date: 'readonly',
                JSON: 'readonly',
                Math: 'readonly',
                Object: 'readonly',
                Array: 'readonly',
                String: 'readonly',
                Number: 'readonly',
                Boolean: 'readonly',
                RegExp: 'readonly',
                Error: 'readonly',
                Promise: 'readonly',
                navigator: 'readonly',
                confirm: 'readonly',
                alert: 'readonly',
                event: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                FileReader: 'readonly',
                FormData: 'readonly',
                AbortController: 'readonly'
            }
        },
        plugins: {
            prettier: prettierPlugin
        },
        rules: {
            // Prettier 集成
            'prettier/prettier': 'error',

            // 代码质量规则
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern:
                        '^(closeEditModal|closeDeleteModal|confirmDelete|setWarrantyPeriod|resetEditForm)$'
                }
            ],
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-alert': 'warn',
            'no-var': 'error',
            'prefer-const': 'error',

            // 错误预防
            'no-undef': 'error',
            'no-redeclare': 'off',
            'no-use-before-define': 'off',

            // 最佳实践
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all']
        }
    }
];
