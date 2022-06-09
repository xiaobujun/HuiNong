module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339257, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFileSync = exports.writeFile = exports.readFileSync = exports.readFile = void 0;
const path = require("path");
const consts_1 = require("./consts");
const fs_1 = require("./utils/fs");
const lang_1 = require("./utils/lang");
const scheduler_1 = require("./utils/scheduler");
const temp_1 = require("./utils/temp");
function readFile(filePath, options = consts_1.DEFAULT_READ_OPTIONS) {
    var _a;
    if (lang_1.default.isString(options))
        return readFile(filePath, { encoding: options });
    const timeout = Date.now() + ((_a = options.timeout) !== null && _a !== void 0 ? _a : consts_1.DEFAULT_TIMEOUT_ASYNC);
    return fs_1.default.readFileRetry(timeout)(filePath, options);
}
exports.readFile = readFile;
;
function readFileSync(filePath, options = consts_1.DEFAULT_READ_OPTIONS) {
    var _a;
    if (lang_1.default.isString(options))
        return readFileSync(filePath, { encoding: options });
    const timeout = Date.now() + ((_a = options.timeout) !== null && _a !== void 0 ? _a : consts_1.DEFAULT_TIMEOUT_SYNC);
    return fs_1.default.readFileSyncRetry(timeout)(filePath, options);
}
exports.readFileSync = readFileSync;
;
const writeFile = (filePath, data, options, callback) => {
    if (lang_1.default.isFunction(options))
        return writeFile(filePath, data, consts_1.DEFAULT_WRITE_OPTIONS, options);
    const promise = writeFileAsync(filePath, data, options);
    if (callback)
        promise.then(callback, callback);
    return promise;
};
exports.writeFile = writeFile;
const writeFileAsync = async (filePath, data, options = consts_1.DEFAULT_WRITE_OPTIONS) => {
    var _a;
    if (lang_1.default.isString(options))
        return writeFileAsync(filePath, data, { encoding: options });
    const timeout = Date.now() + ((_a = options.timeout) !== null && _a !== void 0 ? _a : consts_1.DEFAULT_TIMEOUT_ASYNC);
    let schedulerCustomDisposer = null, schedulerDisposer = null, tempDisposer = null, tempPath = null, fd = null;
    try {
        if (options.schedule)
            schedulerCustomDisposer = await options.schedule(filePath);
        schedulerDisposer = await scheduler_1.default.schedule(filePath);
        filePath = await fs_1.default.realpathAttempt(filePath) || filePath;
        [tempPath, tempDisposer] = temp_1.default.get(filePath, options.tmpCreate || temp_1.default.create, !(options.tmpPurge === false));
        const useStatChown = consts_1.IS_POSIX && lang_1.default.isUndefined(options.chown), useStatMode = lang_1.default.isUndefined(options.mode);
        if (useStatChown || useStatMode) {
            const stat = await fs_1.default.statAttempt(filePath);
            if (stat) {
                options = { ...options };
                if (useStatChown)
                    options.chown = { uid: stat.uid, gid: stat.gid };
                if (useStatMode)
                    options.mode = stat.mode;
            }
        }
        const parentPath = path.dirname(filePath);
        await fs_1.default.mkdirAttempt(parentPath, {
            mode: consts_1.DEFAULT_FOLDER_MODE,
            recursive: true
        });
        fd = await fs_1.default.openRetry(timeout)(tempPath, 'w', options.mode || consts_1.DEFAULT_FILE_MODE);
        if (options.tmpCreated)
            options.tmpCreated(tempPath);
        if (lang_1.default.isString(data)) {
            await fs_1.default.writeRetry(timeout)(fd, data, 0, options.encoding || consts_1.DEFAULT_ENCODING);
        }
        else if (!lang_1.default.isUndefined(data)) {
            await fs_1.default.writeRetry(timeout)(fd, data, 0, data.length, 0);
        }
        if (options.fsync !== false) {
            if (options.fsyncWait !== false) {
                await fs_1.default.fsyncRetry(timeout)(fd);
            }
            else {
                fs_1.default.fsyncAttempt(fd);
            }
        }
        await fs_1.default.closeRetry(timeout)(fd);
        fd = null;
        if (options.chown)
            await fs_1.default.chownAttempt(tempPath, options.chown.uid, options.chown.gid);
        if (options.mode)
            await fs_1.default.chmodAttempt(tempPath, options.mode);
        try {
            await fs_1.default.renameRetry(timeout)(tempPath, filePath);
        }
        catch (error) {
            if (error.code !== 'ENAMETOOLONG')
                throw error;
            await fs_1.default.renameRetry(timeout)(tempPath, temp_1.default.truncate(filePath));
        }
        tempDisposer();
        tempPath = null;
    }
    finally {
        if (fd)
            await fs_1.default.closeAttempt(fd);
        if (tempPath)
            temp_1.default.purge(tempPath);
        if (schedulerCustomDisposer)
            schedulerCustomDisposer();
        if (schedulerDisposer)
            schedulerDisposer();
    }
};
const writeFileSync = (filePath, data, options = consts_1.DEFAULT_WRITE_OPTIONS) => {
    var _a;
    if (lang_1.default.isString(options))
        return writeFileSync(filePath, data, { encoding: options });
    const timeout = Date.now() + ((_a = options.timeout) !== null && _a !== void 0 ? _a : consts_1.DEFAULT_TIMEOUT_SYNC);
    let tempDisposer = null, tempPath = null, fd = null;
    try {
        filePath = fs_1.default.realpathSyncAttempt(filePath) || filePath;
        [tempPath, tempDisposer] = temp_1.default.get(filePath, options.tmpCreate || temp_1.default.create, !(options.tmpPurge === false));
        const useStatChown = consts_1.IS_POSIX && lang_1.default.isUndefined(options.chown), useStatMode = lang_1.default.isUndefined(options.mode);
        if (useStatChown || useStatMode) {
            const stat = fs_1.default.statSyncAttempt(filePath);
            if (stat) {
                options = { ...options };
                if (useStatChown)
                    options.chown = { uid: stat.uid, gid: stat.gid };
                if (useStatMode)
                    options.mode = stat.mode;
            }
        }
        const parentPath = path.dirname(filePath);
        fs_1.default.mkdirSyncAttempt(parentPath, {
            mode: consts_1.DEFAULT_FOLDER_MODE,
            recursive: true
        });
        fd = fs_1.default.openSyncRetry(timeout)(tempPath, 'w', options.mode || consts_1.DEFAULT_FILE_MODE);
        if (options.tmpCreated)
            options.tmpCreated(tempPath);
        if (lang_1.default.isString(data)) {
            fs_1.default.writeSyncRetry(timeout)(fd, data, 0, options.encoding || consts_1.DEFAULT_ENCODING);
        }
        else if (!lang_1.default.isUndefined(data)) {
            fs_1.default.writeSyncRetry(timeout)(fd, data, 0, data.length, 0);
        }
        if (options.fsync !== false) {
            if (options.fsyncWait !== false) {
                fs_1.default.fsyncSyncRetry(timeout)(fd);
            }
            else {
                fs_1.default.fsyncAttempt(fd);
            }
        }
        fs_1.default.closeSyncRetry(timeout)(fd);
        fd = null;
        if (options.chown)
            fs_1.default.chownSyncAttempt(tempPath, options.chown.uid, options.chown.gid);
        if (options.mode)
            fs_1.default.chmodSyncAttempt(tempPath, options.mode);
        try {
            fs_1.default.renameSyncRetry(timeout)(tempPath, filePath);
        }
        catch (error) {
            if (error.code !== 'ENAMETOOLONG')
                throw error;
            fs_1.default.renameSyncRetry(timeout)(tempPath, temp_1.default.truncate(filePath));
        }
        tempDisposer();
        tempPath = null;
    }
    finally {
        if (fd)
            fs_1.default.closeSyncAttempt(fd);
        if (tempPath)
            temp_1.default.purge(tempPath);
    }
};
exports.writeFileSync = writeFileSync;

}, function(modId) {var map = {"./consts":1654780339258,"./utils/fs":1654780339259,"./utils/lang":1654780339264,"./utils/scheduler":1654780339265,"./utils/temp":1654780339266}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339258, function(require, module, exports) {

/* CONSTS */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOOP = exports.LIMIT_FILES_DESCRIPTORS = exports.LIMIT_BASENAME_LENGTH = exports.IS_USER_ROOT = exports.IS_POSIX = exports.DEFAULT_TIMEOUT_SYNC = exports.DEFAULT_TIMEOUT_ASYNC = exports.DEFAULT_WRITE_OPTIONS = exports.DEFAULT_READ_OPTIONS = exports.DEFAULT_FOLDER_MODE = exports.DEFAULT_FILE_MODE = exports.DEFAULT_ENCODING = void 0;
const DEFAULT_ENCODING = 'utf8';
exports.DEFAULT_ENCODING = DEFAULT_ENCODING;
const DEFAULT_FILE_MODE = 0o666;
exports.DEFAULT_FILE_MODE = DEFAULT_FILE_MODE;
const DEFAULT_FOLDER_MODE = 0o777;
exports.DEFAULT_FOLDER_MODE = DEFAULT_FOLDER_MODE;
const DEFAULT_READ_OPTIONS = {};
exports.DEFAULT_READ_OPTIONS = DEFAULT_READ_OPTIONS;
const DEFAULT_WRITE_OPTIONS = {};
exports.DEFAULT_WRITE_OPTIONS = DEFAULT_WRITE_OPTIONS;
const DEFAULT_TIMEOUT_ASYNC = 5000;
exports.DEFAULT_TIMEOUT_ASYNC = DEFAULT_TIMEOUT_ASYNC;
const DEFAULT_TIMEOUT_SYNC = 100;
exports.DEFAULT_TIMEOUT_SYNC = DEFAULT_TIMEOUT_SYNC;
const IS_POSIX = !!process.getuid;
exports.IS_POSIX = IS_POSIX;
const IS_USER_ROOT = process.getuid ? !process.getuid() : false;
exports.IS_USER_ROOT = IS_USER_ROOT;
const LIMIT_BASENAME_LENGTH = 128; //TODO: fetch the real limit from the filesystem //TODO: fetch the whole-path length limit too
exports.LIMIT_BASENAME_LENGTH = LIMIT_BASENAME_LENGTH;
const LIMIT_FILES_DESCRIPTORS = 10000; //TODO: fetch the real limit from the filesystem
exports.LIMIT_FILES_DESCRIPTORS = LIMIT_FILES_DESCRIPTORS;
const NOOP = () => { };
exports.NOOP = NOOP;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339259, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const util_1 = require("util");
const attemptify_1 = require("./attemptify");
const fs_handlers_1 = require("./fs_handlers");
const retryify_1 = require("./retryify");
/* FS */
const FS = {
    chmodAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.chmod), fs_handlers_1.default.onChangeError),
    chownAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.chown), fs_handlers_1.default.onChangeError),
    closeAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.close)),
    fsyncAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.fsync)),
    mkdirAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.mkdir)),
    realpathAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.realpath)),
    statAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.stat)),
    unlinkAttempt: attemptify_1.attemptifyAsync(util_1.promisify(fs.unlink)),
    closeRetry: retryify_1.retryifyAsync(util_1.promisify(fs.close), fs_handlers_1.default.isRetriableError),
    fsyncRetry: retryify_1.retryifyAsync(util_1.promisify(fs.fsync), fs_handlers_1.default.isRetriableError),
    openRetry: retryify_1.retryifyAsync(util_1.promisify(fs.open), fs_handlers_1.default.isRetriableError),
    readFileRetry: retryify_1.retryifyAsync(util_1.promisify(fs.readFile), fs_handlers_1.default.isRetriableError),
    renameRetry: retryify_1.retryifyAsync(util_1.promisify(fs.rename), fs_handlers_1.default.isRetriableError),
    statRetry: retryify_1.retryifyAsync(util_1.promisify(fs.stat), fs_handlers_1.default.isRetriableError),
    writeRetry: retryify_1.retryifyAsync(util_1.promisify(fs.write), fs_handlers_1.default.isRetriableError),
    chmodSyncAttempt: attemptify_1.attemptifySync(fs.chmodSync, fs_handlers_1.default.onChangeError),
    chownSyncAttempt: attemptify_1.attemptifySync(fs.chownSync, fs_handlers_1.default.onChangeError),
    closeSyncAttempt: attemptify_1.attemptifySync(fs.closeSync),
    mkdirSyncAttempt: attemptify_1.attemptifySync(fs.mkdirSync),
    realpathSyncAttempt: attemptify_1.attemptifySync(fs.realpathSync),
    statSyncAttempt: attemptify_1.attemptifySync(fs.statSync),
    unlinkSyncAttempt: attemptify_1.attemptifySync(fs.unlinkSync),
    closeSyncRetry: retryify_1.retryifySync(fs.closeSync, fs_handlers_1.default.isRetriableError),
    fsyncSyncRetry: retryify_1.retryifySync(fs.fsyncSync, fs_handlers_1.default.isRetriableError),
    openSyncRetry: retryify_1.retryifySync(fs.openSync, fs_handlers_1.default.isRetriableError),
    readFileSyncRetry: retryify_1.retryifySync(fs.readFileSync, fs_handlers_1.default.isRetriableError),
    renameSyncRetry: retryify_1.retryifySync(fs.renameSync, fs_handlers_1.default.isRetriableError),
    statSyncRetry: retryify_1.retryifySync(fs.statSync, fs_handlers_1.default.isRetriableError),
    writeSyncRetry: retryify_1.retryifySync(fs.writeSync, fs_handlers_1.default.isRetriableError)
};
/* EXPORT */
exports.default = FS;

}, function(modId) { var map = {"fs":1654780339259,"./attemptify":1654780339260,"./fs_handlers":1654780339261,"./retryify":1654780339262}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339260, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attemptifySync = exports.attemptifyAsync = void 0;
const consts_1 = require("../consts");
/* ATTEMPTIFY */
//TODO: Maybe publish this as a standalone package
//FIXME: The type castings here aren't exactly correct
const attemptifyAsync = (fn, onError = consts_1.NOOP) => {
    return function () {
        return fn.apply(undefined, arguments).catch(onError);
    };
};
exports.attemptifyAsync = attemptifyAsync;
const attemptifySync = (fn, onError = consts_1.NOOP) => {
    return function () {
        try {
            return fn.apply(undefined, arguments);
        }
        catch (error) {
            return onError(error);
        }
    };
};
exports.attemptifySync = attemptifySync;

}, function(modId) { var map = {"../consts":1654780339258}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339261, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const consts_1 = require("../consts");
/* FS HANDLERS */
const Handlers = {
    isChangeErrorOk: (error) => {
        const { code } = error;
        if (code === 'ENOSYS')
            return true;
        if (!consts_1.IS_USER_ROOT && (code === 'EINVAL' || code === 'EPERM'))
            return true;
        return false;
    },
    isRetriableError: (error) => {
        const { code } = error;
        if (code === 'EMFILE' || code === 'ENFILE' || code === 'EAGAIN' || code === 'EBUSY' || code === 'EACCESS' || code === 'EACCS' || code === 'EPERM')
            return true;
        return false;
    },
    onChangeError: (error) => {
        if (Handlers.isChangeErrorOk(error))
            return;
        throw error;
    }
};
/* EXPORT */
exports.default = Handlers;

}, function(modId) { var map = {"../consts":1654780339258}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339262, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryifySync = exports.retryifyAsync = void 0;
const retryify_queue_1 = require("./retryify_queue");
/* RETRYIFY */
const retryifyAsync = (fn, isRetriableError) => {
    return function (timestamp) {
        return function attempt() {
            return retryify_queue_1.default.schedule().then(cleanup => {
                return fn.apply(undefined, arguments).then(result => {
                    cleanup();
                    return result;
                }, error => {
                    cleanup();
                    if (Date.now() >= timestamp)
                        throw error;
                    if (isRetriableError(error)) {
                        const delay = Math.round(100 + (400 * Math.random())), delayPromise = new Promise(resolve => setTimeout(resolve, delay));
                        return delayPromise.then(() => attempt.apply(undefined, arguments));
                    }
                    throw error;
                });
            });
        };
    };
};
exports.retryifyAsync = retryifyAsync;
const retryifySync = (fn, isRetriableError) => {
    return function (timestamp) {
        return function attempt() {
            try {
                return fn.apply(undefined, arguments);
            }
            catch (error) {
                if (Date.now() > timestamp)
                    throw error;
                if (isRetriableError(error))
                    return attempt.apply(undefined, arguments);
                throw error;
            }
        };
    };
};
exports.retryifySync = retryifySync;

}, function(modId) { var map = {"./retryify_queue":1654780339263}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339263, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const consts_1 = require("../consts");
/* RETRYIFY QUEUE */
const RetryfyQueue = {
    interval: 25,
    intervalId: undefined,
    limit: consts_1.LIMIT_FILES_DESCRIPTORS,
    queueActive: new Set(),
    queueWaiting: new Set(),
    init: () => {
        if (RetryfyQueue.intervalId)
            return;
        RetryfyQueue.intervalId = setInterval(RetryfyQueue.tick, RetryfyQueue.interval);
    },
    reset: () => {
        if (!RetryfyQueue.intervalId)
            return;
        clearInterval(RetryfyQueue.intervalId);
        delete RetryfyQueue.intervalId;
    },
    add: (fn) => {
        RetryfyQueue.queueWaiting.add(fn);
        if (RetryfyQueue.queueActive.size < (RetryfyQueue.limit / 2)) { // Active queue not under preassure, executing immediately
            RetryfyQueue.tick();
        }
        else {
            RetryfyQueue.init();
        }
    },
    remove: (fn) => {
        RetryfyQueue.queueWaiting.delete(fn);
        RetryfyQueue.queueActive.delete(fn);
    },
    schedule: () => {
        return new Promise(resolve => {
            const cleanup = () => RetryfyQueue.remove(resolver);
            const resolver = () => resolve(cleanup);
            RetryfyQueue.add(resolver);
        });
    },
    tick: () => {
        if (RetryfyQueue.queueActive.size >= RetryfyQueue.limit)
            return;
        if (!RetryfyQueue.queueWaiting.size)
            return RetryfyQueue.reset();
        for (const fn of RetryfyQueue.queueWaiting) {
            if (RetryfyQueue.queueActive.size >= RetryfyQueue.limit)
                break;
            RetryfyQueue.queueWaiting.delete(fn);
            RetryfyQueue.queueActive.add(fn);
            fn();
        }
    }
};
/* EXPORT */
exports.default = RetryfyQueue;

}, function(modId) { var map = {"../consts":1654780339258}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339264, function(require, module, exports) {

/* LANG */
Object.defineProperty(exports, "__esModule", { value: true });
const Lang = {
    isFunction: (x) => {
        return typeof x === 'function';
    },
    isString: (x) => {
        return typeof x === 'string';
    },
    isUndefined: (x) => {
        return typeof x === 'undefined';
    }
};
/* EXPORT */
exports.default = Lang;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339265, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
/* VARIABLES */
const Queues = {};
/* SCHEDULER */
//TODO: Maybe publish this as a standalone package
const Scheduler = {
    next: (id) => {
        const queue = Queues[id];
        if (!queue)
            return;
        queue.shift();
        const job = queue[0];
        if (job) {
            job(() => Scheduler.next(id));
        }
        else {
            delete Queues[id];
        }
    },
    schedule: (id) => {
        return new Promise(resolve => {
            let queue = Queues[id];
            if (!queue)
                queue = Queues[id] = [];
            queue.push(resolve);
            if (queue.length > 1)
                return;
            resolve(() => Scheduler.next(id));
        });
    }
};
/* EXPORT */
exports.default = Scheduler;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339266, function(require, module, exports) {

/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const consts_1 = require("../consts");
const fs_1 = require("./fs");
/* TEMP */
//TODO: Maybe publish this as a standalone package
const Temp = {
    store: {},
    create: (filePath) => {
        const randomness = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), // 6 random-enough hex characters
        timestamp = Date.now().toString().slice(-10), // 10 precise timestamp digits
        prefix = 'tmp-', suffix = `.${prefix}${timestamp}${randomness}`, tempPath = `${filePath}${suffix}`;
        return tempPath;
    },
    get: (filePath, creator, purge = true) => {
        const tempPath = Temp.truncate(creator(filePath));
        if (tempPath in Temp.store)
            return Temp.get(filePath, creator, purge); // Collision found, try again
        Temp.store[tempPath] = purge;
        const disposer = () => delete Temp.store[tempPath];
        return [tempPath, disposer];
    },
    purge: (filePath) => {
        if (!Temp.store[filePath])
            return;
        delete Temp.store[filePath];
        fs_1.default.unlinkAttempt(filePath);
    },
    purgeSync: (filePath) => {
        if (!Temp.store[filePath])
            return;
        delete Temp.store[filePath];
        fs_1.default.unlinkSyncAttempt(filePath);
    },
    purgeSyncAll: () => {
        for (const filePath in Temp.store) {
            Temp.purgeSync(filePath);
        }
    },
    truncate: (filePath) => {
        const basename = path.basename(filePath);
        if (basename.length <= consts_1.LIMIT_BASENAME_LENGTH)
            return filePath; //FIXME: Rough and quick attempt at detecting ok lengths
        const truncable = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(basename);
        if (!truncable)
            return filePath; //FIXME: No truncable part detected, can't really do much without also changing the parent path, which is unsafe, hoping for the best here
        const truncationLength = basename.length - consts_1.LIMIT_BASENAME_LENGTH;
        return `${filePath.slice(0, -basename.length)}${truncable[1]}${truncable[2].slice(0, -truncationLength)}${truncable[3]}`; //FIXME: The truncable part might be shorter than needed here
    }
};
/* INIT */
process.on('exit', Temp.purgeSyncAll); // Ensuring purgeable temp files are purged on exit
/* EXPORT */
exports.default = Temp;

}, function(modId) { var map = {"../consts":1654780339258,"./fs":1654780339259}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339257);
})()
//miniprogram-npm-outsideDeps=["path","util"]
//# sourceMappingURL=index.js.map