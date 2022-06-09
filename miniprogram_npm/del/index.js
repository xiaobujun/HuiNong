module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339501, function(require, module, exports) {

const {promisify} = require('util');
const path = require('path');
const globby = require('globby');
const isGlob = require('is-glob');
const slash = require('slash');
const gracefulFs = require('graceful-fs');
const isPathCwd = require('is-path-cwd');
const isPathInside = require('is-path-inside');
const rimraf = require('rimraf');
const pMap = require('p-map');

const rimrafP = promisify(rimraf);

const rimrafOptions = {
	glob: false,
	unlink: gracefulFs.unlink,
	unlinkSync: gracefulFs.unlinkSync,
	chmod: gracefulFs.chmod,
	chmodSync: gracefulFs.chmodSync,
	stat: gracefulFs.stat,
	statSync: gracefulFs.statSync,
	lstat: gracefulFs.lstat,
	lstatSync: gracefulFs.lstatSync,
	rmdir: gracefulFs.rmdir,
	rmdirSync: gracefulFs.rmdirSync,
	readdir: gracefulFs.readdir,
	readdirSync: gracefulFs.readdirSync
};

function safeCheck(file, cwd) {
	if (isPathCwd(file)) {
		throw new Error('Cannot delete the current working directory. Can be overridden with the `force` option.');
	}

	if (!isPathInside(file, cwd)) {
		throw new Error('Cannot delete files/directories outside the current working directory. Can be overridden with the `force` option.');
	}
}

function normalizePatterns(patterns) {
	patterns = Array.isArray(patterns) ? patterns : [patterns];

	patterns = patterns.map(pattern => {
		if (process.platform === 'win32' && isGlob(pattern) === false) {
			return slash(pattern);
		}

		return pattern;
	});

	return patterns;
}

module.exports = async (patterns, {force, dryRun, cwd = process.cwd(), ...options} = {}) => {
	options = {
		expandDirectories: false,
		onlyFiles: false,
		followSymbolicLinks: false,
		cwd,
		...options
	};

	patterns = normalizePatterns(patterns);

	const files = (await globby(patterns, options))
		.sort((a, b) => b.localeCompare(a));

	const mapper = async file => {
		file = path.resolve(cwd, file);

		if (!force) {
			safeCheck(file, cwd);
		}

		if (!dryRun) {
			await rimrafP(file, rimrafOptions);
		}

		return file;
	};

	const removedFiles = await pMap(files, mapper, options);

	removedFiles.sort((a, b) => a.localeCompare(b));

	return removedFiles;
};

module.exports.sync = (patterns, {force, dryRun, cwd = process.cwd(), ...options} = {}) => {
	options = {
		expandDirectories: false,
		onlyFiles: false,
		followSymbolicLinks: false,
		cwd,
		...options
	};

	patterns = normalizePatterns(patterns);

	const files = globby.sync(patterns, options)
		.sort((a, b) => b.localeCompare(a));

	const removedFiles = files.map(file => {
		file = path.resolve(cwd, file);

		if (!force) {
			safeCheck(file, cwd);
		}

		if (!dryRun) {
			rimraf.sync(file, rimrafOptions);
		}

		return file;
	});

	removedFiles.sort((a, b) => a.localeCompare(b));

	return removedFiles;
};

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339501);
})()
//miniprogram-npm-outsideDeps=["util","path","globby","is-glob","slash","graceful-fs","is-path-cwd","is-path-inside","rimraf","p-map"]
//# sourceMappingURL=index.js.map