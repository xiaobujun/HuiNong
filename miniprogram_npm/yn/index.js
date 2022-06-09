module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780340023, function(require, module, exports) {

const lenient = require('./lenient');

const yn = (input, options) => {
	input = String(input).trim();

	options = Object.assign({
		lenient: false,
		default: null
	}, options);

	if (options.default !== null && typeof options.default !== 'boolean') {
		throw new TypeError(`Expected the \`default\` option to be of type \`boolean\`, got \`${typeof options.default}\``);
	}

	if (/^(?:y|yes|true|1)$/i.test(input)) {
		return true;
	}

	if (/^(?:n|no|false|0)$/i.test(input)) {
		return false;
	}

	if (options.lenient === true) {
		return lenient(input, options);
	}

	return options.default;
};

module.exports = yn;
// TODO: Remove this for the next major release
module.exports.default = yn;

}, function(modId) {var map = {"./lenient":1654780340024}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780340024, function(require, module, exports) {


const YES_MATCH_SCORE_THRESHOLD = 2;
const NO_MATCH_SCORE_THRESHOLD = 1.25;

const yMatch = new Map([
	[5, 0.25],
	[6, 0.25],
	[7, 0.25],
	['t', 0.75],
	['y', 1],
	['u', 0.75],
	['g', 0.25],
	['h', 0.25],
	['j', 0.25]
]);

const eMatch = new Map([
	[2, 0.25],
	[3, 0.25],
	[4, 0.25],
	['w', 0.75],
	['e', 1],
	['r', 0.75],
	['s', 0.25],
	['d', 0.25],
	['f', 0.25]
]);

const sMatch = new Map([
	['q', 0.25],
	['w', 0.25],
	['e', 0.25],
	['a', 0.75],
	['s', 1],
	['d', 0.75],
	['z', 0.25],
	['x', 0.25],
	['c', 0.25]
]);

const nMatch = new Map([
	['h', 0.25],
	['j', 0.25],
	['k', 0.25],
	['b', 0.75],
	['n', 1],
	['m', 0.75]
]);

const oMatch = new Map([
	[9, 0.25],
	[0, 0.25],
	['i', 0.75],
	['o', 1],
	['p', 0.75],
	['k', 0.25],
	['l', 0.25]
]);

function getYesMatchScore(value) {
	const [y, e, s] = value;
	let score = 0;

	if (yMatch.has(y)) {
		score += yMatch.get(y);
	}

	if (eMatch.has(e)) {
		score += eMatch.get(e);
	}

	if (sMatch.has(s)) {
		score += sMatch.get(s);
	}

	return score;
}

function getNoMatchScore(value) {
	const [n, o] = value;
	let score = 0;

	if (nMatch.has(n)) {
		score += nMatch.get(n);
	}

	if (oMatch.has(o)) {
		score += oMatch.get(o);
	}

	return score;
}

module.exports = (input, options) => {
	if (getYesMatchScore(input) >= YES_MATCH_SCORE_THRESHOLD) {
		return true;
	}

	if (getNoMatchScore(input) >= NO_MATCH_SCORE_THRESHOLD) {
		return false;
	}

	return options.default;
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780340023);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map