module.exports = {
	"env": {
		"es6":true,
		"node":true,
		"browser":true
	},
	"parserOptions": {
		"ecmaVersion": 2019,
		"sourceType": "module"
	},
	"extends": [
		"eslint:recommended",
		"plugin:prettier/recommended"
	],
	"plugins": [
		"prettier"
	],
	"rules": {
		"no-console": 0,
		"curly": 1,
		"eqeqeq": ['error', 'smart'],
		'block-scoped-var': 1
		/*"no-undef": 0*/
	}
}
