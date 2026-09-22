import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// ESLint 9 扁平配置（替代旧 .eslintrc + .eslintignore）
export default tseslint.config(
	// 忽略依赖目录与构建产物
	{ ignores: ['node_modules/', 'main.js'] },
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			// 构建脚本运行在 Node 环境
			globals: { ...globals.node }
		},
		rules: {
			// JS 层未用变量检查关闭，统一由 TS 规则接管
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off'
		}
	}
);
