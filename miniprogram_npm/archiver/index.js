module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339231, function(require, module, exports) {
/**
 * Archiver Vending
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var Archiver = require('./lib/core');

var formats = {};

/**
 * Dispenses a new Archiver instance.
 *
 * @constructor
 * @param  {String} format The archive format to use.
 * @param  {Object} options See [Archiver]{@link Archiver}
 * @return {Archiver}
 */
var vending = function(format, options) {
  return vending.create(format, options);
};

/**
 * Creates a new Archiver instance.
 *
 * @param  {String} format The archive format to use.
 * @param  {Object} options See [Archiver]{@link Archiver}
 * @return {Archiver}
 */
vending.create = function(format, options) {
  if (formats[format]) {
    var instance = new Archiver(format, options);
    instance.setFormat(format);
    instance.setModule(new formats[format](options));

    return instance;
  } else {
    throw new Error('create(' + format + '): format not registered');
  }
};

/**
 * Registers a format for use with archiver.
 *
 * @param  {String} format The name of the format.
 * @param  {Function} module The function for archiver to interact with.
 * @return void
 */
vending.registerFormat = function(format, module) {
  if (formats[format]) {
    throw new Error('register(' + format + '): format already registered');
  }

  if (typeof module !== 'function') {
    throw new Error('register(' + format + '): format module invalid');
  }

  if (typeof module.prototype.append !== 'function' || typeof module.prototype.finalize !== 'function') {
    throw new Error('register(' + format + '): format module missing methods');
  }

  formats[format] = module;
};

vending.registerFormat('zip', require('./lib/plugins/zip'));
vending.registerFormat('tar', require('./lib/plugins/tar'));
vending.registerFormat('json', require('./lib/plugins/json'));

module.exports = vending;
}, function(modId) {var map = {"./lib/core":1654780339232,"./lib/plugins/zip":1654780339234,"./lib/plugins/tar":1654780339235,"./lib/plugins/json":1654780339236}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339232, function(require, module, exports) {
/**
 * Archiver Core
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var path = require('path');
var util = require('archiver-utils');

var inherits = require('util').inherits;
var ArchiverError = require('./error');
var Transform = require('readable-stream').Transform;

var win32 = process.platform === 'win32';

/**
 * @constructor
 * @param {String} format The archive format to use.
 * @param {(CoreOptions|TransformOptions)} options See also {@link ZipOptions} and {@link TarOptions}.
 */
var Archiver = function(format, options) {
  if (!(this instanceof Archiver)) {
    return new Archiver(format, options);
  }

  if (typeof format !== 'string') {
    options = format;
    format = 'zip';
  }

  options = this.options = util.defaults(options, {
    highWaterMark: 1024 * 1024,
    statConcurrency: 4
  });

  Transform.call(this, options);

  this._format = false;
  this._module = false;
  this._pending = 0;
  this._pointer = 0;

  this._entriesCount = 0;
  this._entriesProcessedCount = 0;
  this._fsEntriesTotalBytes = 0;
  this._fsEntriesProcessedBytes = 0;

  this._queue = async.queue(this._onQueueTask.bind(this), 1);
  this._queue.drain = this._onQueueDrain.bind(this);

  this._statQueue = async.queue(this._onStatQueueTask.bind(this), options.statConcurrency);

  this._state = {
    aborted: false,
    finalize: false,
    finalizing: false,
    finalized: false,
    modulePiped: false
  };

  this._streams = [];
};

inherits(Archiver, Transform);

/**
 * Internal logic for `abort`.
 *
 * @private
 * @return void
 */
Archiver.prototype._abort = function() {
  this._state.aborted = true;
  this._queue.kill();
  this._statQueue.kill();

  if (this._queue.idle()) {
    this._shutdown();
  }
};

/**
 * Internal helper for appending files.
 *
 * @private
 * @param  {String} filepath The source filepath.
 * @param  {EntryData} data The entry data.
 * @return void
 */
Archiver.prototype._append = function(filepath, data) {
  data = data || {};

  var task = {
    source: null,
    filepath: filepath
  };

  if (!data.name) {
    data.name = filepath;
  }

  data.sourcePath = filepath;
  task.data = data;
  this._entriesCount++;

  if (data.stats && data.stats instanceof fs.Stats) {
    task = this._updateQueueTaskWithStats(task, data.stats);
    if (task) {
      if (data.stats.size) {
        this._fsEntriesTotalBytes += data.stats.size;
      }

      this._queue.push(task);
    }
  } else {
    this._statQueue.push(task);
  }
};

/**
 * Internal logic for `finalize`.
 *
 * @private
 * @return void
 */
Archiver.prototype._finalize = function() {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    return;
  }

  this._state.finalizing = true;

  this._moduleFinalize();

  this._state.finalizing = false;
  this._state.finalized = true;
};

/**
 * Checks the various state variables to determine if we can `finalize`.
 *
 * @private
 * @return {Boolean}
 */
Archiver.prototype._maybeFinalize = function() {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    return false;
  }

  if (this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
    this._finalize();
    return true;
  }

  return false;
};

/**
 * Appends an entry to the module.
 *
 * @private
 * @fires  Archiver#entry
 * @param  {(Buffer|Stream)} source
 * @param  {EntryData} data
 * @param  {Function} callback
 * @return void
 */
Archiver.prototype._moduleAppend = function(source, data, callback) {
  if (this._state.aborted) {
    callback();
    return;
  }

  this._module.append(source, data, function(err) {
    this._task = null;

    if (this._state.aborted) {
      this._shutdown();
      return;
    }

    if (err) {
      this.emit('error', err);
      setImmediate(callback);
      return;
    }

    /**
     * Fires when the entry's input has been processed and appended to the archive.
     *
     * @event Archiver#entry
     * @type {EntryData}
     */
    this.emit('entry', data);
    this._entriesProcessedCount++;

    if (data.stats && data.stats.size) {
      this._fsEntriesProcessedBytes += data.stats.size;
    }

    /**
     * @event Archiver#progress
     * @type {ProgressData}
     */
    this.emit('progress', {
      entries: {
        total: this._entriesCount,
        processed: this._entriesProcessedCount
      },
      fs: {
        totalBytes: this._fsEntriesTotalBytes,
        processedBytes: this._fsEntriesProcessedBytes
      }
    });

    setImmediate(callback);
  }.bind(this));
};

/**
 * Finalizes the module.
 *
 * @private
 * @return void
 */
Archiver.prototype._moduleFinalize = function() {
  if (typeof this._module.finalize === 'function') {
    this._module.finalize();
  } else if (typeof this._module.end === 'function') {
    this._module.end();
  } else {
    this.emit('error', new ArchiverError('NOENDMETHOD'));
  }
};

/**
 * Pipes the module to our internal stream with error bubbling.
 *
 * @private
 * @return void
 */
Archiver.prototype._modulePipe = function() {
  this._module.on('error', this._onModuleError.bind(this));
  this._module.pipe(this);
  this._state.modulePiped = true;
};

/**
 * Determines if the current module supports a defined feature.
 *
 * @private
 * @param  {String} key
 * @return {Boolean}
 */
Archiver.prototype._moduleSupports = function(key) {
  if (!this._module.supports || !this._module.supports[key]) {
    return false;
  }

  return this._module.supports[key];
};

/**
 * Unpipes the module from our internal stream.
 *
 * @private
 * @return void
 */
Archiver.prototype._moduleUnpipe = function() {
  this._module.unpipe(this);
  this._state.modulePiped = false;
};

/**
 * Normalizes entry data with fallbacks for key properties.
 *
 * @private
 * @param  {Object} data
 * @param  {fs.Stats} stats
 * @return {Object}
 */
Archiver.prototype._normalizeEntryData = function(data, stats) {
  data = util.defaults(data, {
    type: 'file',
    name: null,
    date: null,
    mode: null,
    prefix: null,
    sourcePath: null,
    stats: false
  });

  if (stats && data.stats === false) {
    data.stats = stats;
  }

  var isDir = data.type === 'directory';

  if (data.name) {
    if (typeof data.prefix === 'string' && '' !== data.prefix) {
      data.name = data.prefix + '/' + data.name;
      data.prefix = null;
    }

    data.name = util.sanitizePath(data.name);

    if (data.type !== 'symlink' && data.name.slice(-1) === '/') {
      isDir = true;
      data.type = 'directory';
    } else if (isDir) {
      data.name += '/';
    }
  }

  // 511 === 0777; 493 === 0755; 438 === 0666; 420 === 0644
  if (typeof data.mode === 'number') {
    if (win32) {
      data.mode &= 511;
    } else {
      data.mode &= 4095
    }
  } else if (data.stats && data.mode === null) {
    if (win32) {
      data.mode = data.stats.mode & 511;
    } else {
      data.mode = data.stats.mode & 4095;
    }

    // stat isn't reliable on windows; force 0755 for dir
    if (win32 && isDir) {
      data.mode = 493;
    }
  } else if (data.mode === null) {
    data.mode = isDir ? 493 : 420;
  }

  if (data.stats && data.date === null) {
    data.date = data.stats.mtime;
  } else {
    data.date = util.dateify(data.date);
  }

  return data;
};

/**
 * Error listener that re-emits error on to our internal stream.
 *
 * @private
 * @param  {Error} err
 * @return void
 */
Archiver.prototype._onModuleError = function(err) {
  /**
   * @event Archiver#error
   * @type {ErrorData}
   */
  this.emit('error', err);
};

/**
 * Checks the various state variables after queue has drained to determine if
 * we need to `finalize`.
 *
 * @private
 * @return void
 */
Archiver.prototype._onQueueDrain = function() {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    return;
  }

  if (this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
    this._finalize();
  }
};

/**
 * Appends each queue task to the module.
 *
 * @private
 * @param  {Object} task
 * @param  {Function} callback
 * @return void
 */
Archiver.prototype._onQueueTask = function(task, callback) {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    callback();
    return;
  }

  this._task = task;
  this._moduleAppend(task.source, task.data, callback);
};

/**
 * Performs a file stat and reinjects the task back into the queue.
 *
 * @private
 * @param  {Object} task
 * @param  {Function} callback
 * @return void
 */
Archiver.prototype._onStatQueueTask = function(task, callback) {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    callback();
    return;
  }

  fs.lstat(task.filepath, function(err, stats) {
    if (this._state.aborted) {
      setImmediate(callback);
      return;
    }

    if (err) {
      this._entriesCount--;

      /**
       * @event Archiver#warning
       * @type {ErrorData}
       */
      this.emit('warning', err);
      setImmediate(callback);
      return;
    }

    task = this._updateQueueTaskWithStats(task, stats);

    if (task) {
      if (stats.size) {
        this._fsEntriesTotalBytes += stats.size;
      }

      this._queue.push(task);
    }

    setImmediate(callback);
  }.bind(this));
};

/**
 * Unpipes the module and ends our internal stream.
 *
 * @private
 * @return void
 */
Archiver.prototype._shutdown = function() {
  this._moduleUnpipe();
  this.end();
};

/**
 * Tracks the bytes emitted by our internal stream.
 *
 * @private
 * @param  {Buffer} chunk
 * @param  {String} encoding
 * @param  {Function} callback
 * @return void
 */
Archiver.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this._pointer += chunk.length;
  }

  callback(null, chunk);
};

/**
 * Updates and normalizes a queue task using stats data.
 *
 * @private
 * @param  {Object} task
 * @param  {fs.Stats} stats
 * @return {Object}
 */
Archiver.prototype._updateQueueTaskWithStats = function(task, stats) {
  if (stats.isFile()) {
    task.data.type = 'file';
    task.data.sourceType = 'stream';
    task.source = util.lazyReadStream(task.filepath);
  } else if (stats.isDirectory() && this._moduleSupports('directory')) {
    task.data.name = util.trailingSlashIt(task.data.name);
    task.data.type = 'directory';
    task.data.sourcePath = util.trailingSlashIt(task.filepath);
    task.data.sourceType = 'buffer';
    task.source = Buffer.concat([]);
  } else if (stats.isSymbolicLink() && this._moduleSupports('symlink')) {
    var linkPath = fs.readlinkSync(task.filepath);
    var dirName = path.dirname(task.filepath);
    task.data.type = 'symlink';
    task.data.linkname = path.relative(dirName, path.resolve(dirName, linkPath));
    task.data.sourceType = 'buffer';
    task.source = Buffer.concat([]);
  } else {
    if (stats.isDirectory()) {
      this.emit('warning', new ArchiverError('DIRECTORYNOTSUPPORTED', task.data));
    } else if (stats.isSymbolicLink()) {
      this.emit('warning', new ArchiverError('SYMLINKNOTSUPPORTED', task.data));
    } else {
      this.emit('warning', new ArchiverError('ENTRYNOTSUPPORTED', task.data));
    }

    return null;
  }

  task.data = this._normalizeEntryData(task.data, stats);

  return task;
};

/**
 * Aborts the archiving process, taking a best-effort approach, by:
 *
 * - removing any pending queue tasks
 * - allowing any active queue workers to finish
 * - detaching internal module pipes
 * - ending both sides of the Transform stream
 *
 * It will NOT drain any remaining sources.
 *
 * @return {this}
 */
Archiver.prototype.abort = function() {
  if (this._state.aborted || this._state.finalized) {
    return this;
  }

  this._abort();

  return this;
};

/**
 * Appends an input source (text string, buffer, or stream) to the instance.
 *
 * When the instance has received, processed, and emitted the input, the `entry`
 * event is fired.
 *
 * @fires  Archiver#entry
 * @param  {(Buffer|Stream|String)} source The input source.
 * @param  {EntryData} data See also {@link ZipEntryData} and {@link TarEntryData}.
 * @return {this}
 */
Archiver.prototype.append = function(source, data) {
  if (this._state.finalize || this._state.aborted) {
    this.emit('error', new ArchiverError('QUEUECLOSED'));
    return this;
  }

  data = this._normalizeEntryData(data);

  if (typeof data.name !== 'string' || data.name.length === 0) {
    this.emit('error', new ArchiverError('ENTRYNAMEREQUIRED'));
    return this;
  }

  if (data.type === 'directory' && !this._moduleSupports('directory')) {
    this.emit('error', new ArchiverError('DIRECTORYNOTSUPPORTED', { name: data.name }));
    return this;
  }

  source = util.normalizeInputSource(source);

  if (Buffer.isBuffer(source)) {
    data.sourceType = 'buffer';
  } else if (util.isStream(source)) {
    data.sourceType = 'stream';
  } else {
    this.emit('error', new ArchiverError('INPUTSTEAMBUFFERREQUIRED', { name: data.name }));
    return this;
  }

  this._entriesCount++;
  this._queue.push({
    data: data,
    source: source
  });

  return this;
};

/**
 * Appends a directory and its files, recursively, given its dirpath.
 *
 * @param  {String} dirpath The source directory path.
 * @param  {String} destpath The destination path within the archive.
 * @param  {(EntryData|Function)} data See also [ZipEntryData]{@link ZipEntryData} and
 * [TarEntryData]{@link TarEntryData}.
 * @return {this}
 */
Archiver.prototype.directory = function(dirpath, destpath, data) {
  if (this._state.finalize || this._state.aborted) {
    this.emit('error', new ArchiverError('QUEUECLOSED'));
    return this;
  }

  if (typeof dirpath !== 'string' || dirpath.length === 0) {
    this.emit('error', new ArchiverError('DIRECTORYDIRPATHREQUIRED'));
    return this;
  }

  this._pending++;

  if (destpath === false) {
    destpath = '';
  } else if (typeof destpath !== 'string'){
    destpath = dirpath;
  }

  var dataFunction = false;
  if (typeof data === 'function') {
    dataFunction = data;
    data = {};
  } else if (typeof data !== 'object') {
    data = {};
  }

  var globOptions = {
    stat: false,
    dot: true,
    cwd: dirpath
  };

  function onGlobEnd() {
    this._pending--;
    this._maybeFinalize();
  }

  function onGlobError(err) {
    this.emit('error', err);
  }

  function onGlobMatch(match){
    var ignoreMatch = false;
    var entryData = Object.assign({}, data);
    entryData.name = match;
    entryData.prefix = destpath;
    match = globber._makeAbs(match);

    try {
      if (dataFunction) {
        entryData = dataFunction(entryData);

        if (entryData === false) {
          ignoreMatch = true;
        } else if (typeof entryData !== 'object') {
          throw new ArchiverError('DIRECTORYFUNCTIONINVALIDDATA', { dirpath: dirpath });
        }
      }
    } catch(e) {
      this.emit('error', e);
      return;
    }

    if (ignoreMatch) {
      return;
    }

    this._append(match, entryData);
  }

  var globber = glob('**', globOptions);
  globber.on('error', onGlobError.bind(this));
  globber.on('match', onGlobMatch.bind(this));
  globber.on('end', onGlobEnd.bind(this));

  return this;
};

/**
 * Appends a file given its filepath using a
 * [lazystream]{@link https://github.com/jpommerening/node-lazystream} wrapper to
 * prevent issues with open file limits.
 *
 * When the instance has received, processed, and emitted the file, the `entry`
 * event is fired.
 *
 * @param  {String} filepath The source filepath.
 * @param  {EntryData} data See also [ZipEntryData]{@link ZipEntryData} and
 * [TarEntryData]{@link TarEntryData}.
 * @return {this}
 */
Archiver.prototype.file = function(filepath, data) {
  if (this._state.finalize || this._state.aborted) {
    this.emit('error', new ArchiverError('QUEUECLOSED'));
    return this;
  }

  if (typeof filepath !== 'string' || filepath.length === 0) {
    this.emit('error', new ArchiverError('FILEFILEPATHREQUIRED'));
    return this;
  }

  this._append(filepath, data);

  return this;
};

/**
 * Appends multiple files that match a glob pattern.
 *
 * @param  {String} pattern The [glob pattern]{@link https://github.com/isaacs/node-glob#glob-primer} to match.
 * @param  {Object} options See [node-glob]{@link https://github.com/isaacs/node-glob#options}.
 * @param  {EntryData} data See also [ZipEntryData]{@link ZipEntryData} and
 * [TarEntryData]{@link TarEntryData}.
 * @return {this}
 */
Archiver.prototype.glob = function(pattern, options, data) {
  this._pending++;

  options = util.defaults(options, {
    stat: false
  });

  function onGlobEnd() {
    this._pending--;
    this._maybeFinalize();
  }

  function onGlobError(err) {
    this.emit('error', err);
  }

  function onGlobMatch(match){
    var entryData = Object.assign({}, data);

    if (options.cwd) {
      entryData.name = match;
      match = globber._makeAbs(match);
    }

    this._append(match, entryData);
  }

  var globber = glob(pattern, options);
  globber.on('error', onGlobError.bind(this));
  globber.on('match', onGlobMatch.bind(this));
  globber.on('end', onGlobEnd.bind(this));

  return this;
};

/**
 * Finalizes the instance and prevents further appending to the archive
 * structure (queue will continue til drained).
 *
 * The `end`, `close` or `finish` events on the destination stream may fire
 * right after calling this method so you should set listeners beforehand to
 * properly detect stream completion.
 *
 * @return {this}
 */
Archiver.prototype.finalize = function() {
  if (this._state.aborted) {
    this.emit('error', new ArchiverError('ABORTED'));
    return this;
  }

  if (this._state.finalize) {
    this.emit('error', new ArchiverError('FINALIZING'));
    return this;
  }

  this._state.finalize = true;

  if (this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
    this._finalize();
  }

  var self = this;

  return new Promise(function(resolve, reject) {
    var errored;

    self._module.on('end', function() {
      if (!errored) {
        resolve();
      }
    })

    self._module.on('error', function(err) {
      errored = true;
      reject(err);
    })
  })
};

/**
 * Sets the module format name used for archiving.
 *
 * @param {String} format The name of the format.
 * @return {this}
 */
Archiver.prototype.setFormat = function(format) {
  if (this._format) {
    this.emit('error', new ArchiverError('FORMATSET'));
    return this;
  }

  this._format = format;

  return this;
};

/**
 * Sets the module used for archiving.
 *
 * @param {Function} module The function for archiver to interact with.
 * @return {this}
 */
Archiver.prototype.setModule = function(module) {
  if (this._state.aborted) {
    this.emit('error', new ArchiverError('ABORTED'));
    return this;
  }

  if (this._state.module) {
    this.emit('error', new ArchiverError('MODULESET'));
    return this;
  }

  this._module = module;
  this._modulePipe();

  return this;
};

/**
 * Appends a symlink to the instance.
 *
 * This does NOT interact with filesystem and is used for programmatically creating symlinks.
 *
 * @param  {String} filepath The symlink path (within archive).
 * @param  {String} target The target path (within archive).
 * @return {this}
 */
Archiver.prototype.symlink = function(filepath, target) {
  if (this._state.finalize || this._state.aborted) {
    this.emit('error', new ArchiverError('QUEUECLOSED'));
    return this;
  }

  if (typeof filepath !== 'string' || filepath.length === 0) {
    this.emit('error', new ArchiverError('SYMLINKFILEPATHREQUIRED'));
    return this;
  }

  if (typeof target !== 'string' || target.length === 0) {
    this.emit('error', new ArchiverError('SYMLINKTARGETREQUIRED', { filepath: filepath }));
    return this;
  }

  if (!this._moduleSupports('symlink')) {
    this.emit('error', new ArchiverError('SYMLINKNOTSUPPORTED', { filepath: filepath }));
    return this;
  }

  var data = {};
  data.type = 'symlink';
  data.name = filepath.replace(/\\/g, '/');
  data.linkname = target.replace(/\\/g, '/');
  data.sourceType = 'buffer';

  this._entriesCount++;
  this._queue.push({
    data: data,
    source: Buffer.concat([])
  });

  return this;
};

/**
 * Returns the current length (in bytes) that has been emitted.
 *
 * @return {Number}
 */
Archiver.prototype.pointer = function() {
  return this._pointer;
};

/**
 * Middleware-like helper that has yet to be fully implemented.
 *
 * @private
 * @param  {Function} plugin
 * @return {this}
 */
Archiver.prototype.use = function(plugin) {
  this._streams.push(plugin);
  return this;
};

module.exports = Archiver;

/**
 * @typedef {Object} CoreOptions
 * @global
 * @property {Number} [statConcurrency=4] Sets the number of workers used to
 * process the internal fs stat queue.
 */

/**
 * @typedef {Object} TransformOptions
 * @property {Boolean} [allowHalfOpen=true] If set to false, then the stream
 * will automatically end the readable side when the writable side ends and vice
 * versa.
 * @property {Boolean} [readableObjectMode=false] Sets objectMode for readable
 * side of the stream. Has no effect if objectMode is true.
 * @property {Boolean} [writableObjectMode=false] Sets objectMode for writable
 * side of the stream. Has no effect if objectMode is true.
 * @property {Boolean} [decodeStrings=true] Whether or not to decode strings
 * into Buffers before passing them to _write(). `Writable`
 * @property {String} [encoding=NULL] If specified, then buffers will be decoded
 * to strings using the specified encoding. `Readable`
 * @property {Number} [highWaterMark=16kb] The maximum number of bytes to store
 * in the internal buffer before ceasing to read from the underlying resource.
 * `Readable` `Writable`
 * @property {Boolean} [objectMode=false] Whether this stream should behave as a
 * stream of objects. Meaning that stream.read(n) returns a single value instead
 * of a Buffer of size n. `Readable` `Writable`
 */

/**
 * @typedef {Object} EntryData
 * @property {String} name Sets the entry name including internal path.
 * @property {(String|Date)} [date=NOW()] Sets the entry date.
 * @property {Number} [mode=D:0755/F:0644] Sets the entry permissions.
 * @property {String} [prefix] Sets a path prefix for the entry name. Useful
 * when working with methods like `directory` or `glob`.
 * @property {fs.Stats} [stats] Sets the fs stat data for this entry allowing
 * for reduction of fs stat calls when stat data is already known.
 */

/**
 * @typedef {Object} ErrorData
 * @property {String} message The message of the error.
 * @property {String} code The error code assigned to this error.
 * @property {String} data Additional data provided for reporting or debugging (where available).
 */

/**
 * @typedef {Object} ProgressData
 * @property {Object} entries
 * @property {Number} entries.total Number of entries that have been appended.
 * @property {Number} entries.processed Number of entries that have been processed.
 * @property {Object} fs
 * @property {Number} fs.totalBytes Number of bytes that have been appended. Calculated asynchronously and might not be accurate: it growth while entries are added. (based on fs.Stats)
 * @property {Number} fs.processedBytes Number of bytes that have been processed. (based on fs.Stats)
 */

}, function(modId) { var map = {"./error":1654780339233}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339233, function(require, module, exports) {
/**
 * Archiver Core
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */

var util = require('util');

const ERROR_CODES = {
  'ABORTED': 'archive was aborted',
  'DIRECTORYDIRPATHREQUIRED': 'diretory dirpath argument must be a non-empty string value',
  'DIRECTORYFUNCTIONINVALIDDATA': 'invalid data returned by directory custom data function',
  'ENTRYNAMEREQUIRED': 'entry name must be a non-empty string value',
  'FILEFILEPATHREQUIRED': 'file filepath argument must be a non-empty string value',
  'FINALIZING': 'archive already finalizing',
  'QUEUECLOSED': 'queue closed',
  'NOENDMETHOD': 'no suitable finalize/end method defined by module',
  'DIRECTORYNOTSUPPORTED': 'support for directory entries not defined by module',
  'FORMATSET': 'archive format already set',
  'INPUTSTEAMBUFFERREQUIRED': 'input source must be valid Stream or Buffer instance',
  'MODULESET': 'module already set',
  'SYMLINKNOTSUPPORTED': 'support for symlink entries not defined by module',
  'SYMLINKFILEPATHREQUIRED': 'symlink filepath argument must be a non-empty string value',
  'SYMLINKTARGETREQUIRED': 'symlink target argument must be a non-empty string value',
  'ENTRYNOTSUPPORTED': 'entry not supported'
};

function ArchiverError(code, data) {
  Error.captureStackTrace(this, this.constructor);
  //this.name = this.constructor.name;
  this.message = ERROR_CODES[code] || code;
  this.code = code;
  this.data = data;
}

util.inherits(ArchiverError, Error);

exports = module.exports = ArchiverError;
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339234, function(require, module, exports) {
/**
 * ZIP Format Plugin
 *
 * @module plugins/zip
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var engine = require('zip-stream');
var util = require('archiver-utils');

/**
 * @constructor
 * @param {ZipOptions} [options]
 * @param {String} [options.comment] Sets the zip archive comment.
 * @param {Boolean} [options.forceLocalTime=false] Forces the archive to contain local file times instead of UTC.
 * @param {Boolean} [options.forceZip64=false] Forces the archive to contain ZIP64 headers.
 * @param {Boolean} [options.store=false] Sets the compression method to STORE.
 * @param {Object} [options.zlib] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
 */
var Zip = function(options) {
  if (!(this instanceof Zip)) {
    return new Zip(options);
  }

  options = this.options = util.defaults(options, {
    comment: '',
    forceUTC: false,
    store: false
  });

  this.supports = {
    directory: true,
    symlink: true
  };

  this.engine = new engine(options);
};

/**
 * @param  {(Buffer|Stream)} source
 * @param  {ZipEntryData} data
 * @param  {String} data.name Sets the entry name including internal path.
 * @param  {(String|Date)} [data.date=NOW()] Sets the entry date.
 * @param  {Number} [data.mode=D:0755/F:0644] Sets the entry permissions.
 * @param  {String} [data.prefix] Sets a path prefix for the entry name. Useful
 * when working with methods like `directory` or `glob`.
 * @param  {fs.Stats} [data.stats] Sets the fs stat data for this entry allowing
 * for reduction of fs stat calls when stat data is already known.
 * @param  {Boolean} [data.store=ZipOptions.store] Sets the compression method to STORE.
 * @param  {Function} callback
 * @return void
 */
Zip.prototype.append = function(source, data, callback) {
  this.engine.entry(source, data, callback);
};

/**
 * @return void
 */
Zip.prototype.finalize = function() {
  this.engine.finalize();
};

/**
 * @return this.engine
 */
Zip.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};

/**
 * @return this.engine
 */
Zip.prototype.pipe = function() {
  return this.engine.pipe.apply(this.engine, arguments);
};

/**
 * @return this.engine
 */
Zip.prototype.unpipe = function() {
  return this.engine.unpipe.apply(this.engine, arguments);
};

module.exports = Zip;

/**
 * @typedef {Object} ZipOptions
 * @global
 * @property {String} [comment] Sets the zip archive comment.
 * @property {Boolean} [forceLocalTime=false] Forces the archive to contain local file times instead of UTC.
 * @property {Boolean} [forceZip64=false] Forces the archive to contain ZIP64 headers.
 * @property {Boolean} [store=false] Sets the compression method to STORE.
 * @property {Object} [zlib] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
 * to control compression.
 * @property {*} [*] See [zip-stream]{@link https://archiverjs.com/zip-stream/ZipStream.html} documentation for current list of properties.
 */

/**
 * @typedef {Object} ZipEntryData
 * @global
 * @property {String} name Sets the entry name including internal path.
 * @property {(String|Date)} [date=NOW()] Sets the entry date.
 * @property {Number} [mode=D:0755/F:0644] Sets the entry permissions.
 * @property {String} [prefix] Sets a path prefix for the entry name. Useful
 * when working with methods like `directory` or `glob`.
 * @property {fs.Stats} [stats] Sets the fs stat data for this entry allowing
 * for reduction of fs stat calls when stat data is already known.
 * @property {Boolean} [store=ZipOptions.store] Sets the compression method to STORE.
 */

/**
 * ZipStream Module
 * @external ZipStream
 * @see {@link https://www.archiverjs.com/zip-stream/ZipStream.html}
 */

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339235, function(require, module, exports) {
/**
 * TAR Format Plugin
 *
 * @module plugins/tar
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var zlib = require('zlib');

var engine = require('tar-stream');
var util = require('archiver-utils');

/**
 * @constructor
 * @param {TarOptions} options
 */
var Tar = function(options) {
  if (!(this instanceof Tar)) {
    return new Tar(options);
  }

  options = this.options = util.defaults(options, {
    gzip: false
  });

  if (typeof options.gzipOptions !== 'object') {
    options.gzipOptions = {};
  }

  this.supports = {
    directory: true,
    symlink: true
  };

  this.engine = engine.pack(options);
  this.compressor = false;

  if (options.gzip) {
    this.compressor = zlib.createGzip(options.gzipOptions);
    this.compressor.on('error', this._onCompressorError.bind(this));
  }
};

/**
 * [_onCompressorError description]
 *
 * @private
 * @param  {Error} err
 * @return void
 */
Tar.prototype._onCompressorError = function(err) {
  this.engine.emit('error', err);
};

/**
 * [append description]
 *
 * @param  {(Buffer|Stream)} source
 * @param  {TarEntryData} data
 * @param  {Function} callback
 * @return void
 */
Tar.prototype.append = function(source, data, callback) {
  var self = this;

  data.mtime = data.date;

  function append(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }

    self.engine.entry(data, sourceBuffer, function(err) {
      callback(err, data);
    });
  }

  if (data.sourceType === 'buffer') {
    append(null, source);
  } else if (data.sourceType === 'stream' && data.stats) {
    data.size = data.stats.size;

    var entry = self.engine.entry(data, function(err) {
      callback(err, data);
    });

    source.pipe(entry);
  } else if (data.sourceType === 'stream') {
    util.collectStream(source, append);
  }
};

/**
 * [finalize description]
 *
 * @return void
 */
Tar.prototype.finalize = function() {
  this.engine.finalize();
};

/**
 * [on description]
 *
 * @return this.engine
 */
Tar.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};

/**
 * [pipe description]
 *
 * @param  {String} destination
 * @param  {Object} options
 * @return this.engine
 */
Tar.prototype.pipe = function(destination, options) {
  if (this.compressor) {
    return this.engine.pipe.apply(this.engine, [this.compressor]).pipe(destination, options);
  } else {
    return this.engine.pipe.apply(this.engine, arguments);
  }
};

/**
 * [unpipe description]
 *
 * @return this.engine
 */
Tar.prototype.unpipe = function() {
  if (this.compressor) {
    return this.compressor.unpipe.apply(this.compressor, arguments);
  } else {
    return this.engine.unpipe.apply(this.engine, arguments);
  }
};

module.exports = Tar;

/**
 * @typedef {Object} TarOptions
 * @global
 * @property {Boolean} [gzip=false] Compress the tar archive using gzip.
 * @property {Object} [gzipOptions] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
 * to control compression.
 * @property {*} [*] See [tar-stream]{@link https://github.com/mafintosh/tar-stream} documentation for additional properties.
 */

/**
 * @typedef {Object} TarEntryData
 * @global
 * @property {String} name Sets the entry name including internal path.
 * @property {(String|Date)} [date=NOW()] Sets the entry date.
 * @property {Number} [mode=D:0755/F:0644] Sets the entry permissions.
 * @property {String} [prefix] Sets a path prefix for the entry name. Useful
 * when working with methods like `directory` or `glob`.
 * @property {fs.Stats} [stats] Sets the fs stat data for this entry allowing
 * for reduction of fs stat calls when stat data is already known.
 */

/**
 * TarStream Module
 * @external TarStream
 * @see {@link https://github.com/mafintosh/tar-stream}
 */

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339236, function(require, module, exports) {
/**
 * JSON Format Plugin
 *
 * @module plugins/json
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;

var crc32 = require('buffer-crc32');
var util = require('archiver-utils');

/**
 * @constructor
 * @param {(JsonOptions|TransformOptions)} options
 */
var Json = function(options) {
  if (!(this instanceof Json)) {
    return new Json(options);
  }

  options = this.options = util.defaults(options, {});

  Transform.call(this, options);

  this.supports = {
    directory: true,
    symlink: true
  };

  this.files = [];
};

inherits(Json, Transform);

/**
 * [_transform description]
 *
 * @private
 * @param  {Buffer}   chunk
 * @param  {String}   encoding
 * @param  {Function} callback
 * @return void
 */
Json.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};

/**
 * [_writeStringified description]
 *
 * @private
 * @return void
 */
Json.prototype._writeStringified = function() {
  var fileString = JSON.stringify(this.files);
  this.write(fileString);
};

/**
 * [append description]
 *
 * @param  {(Buffer|Stream)}   source
 * @param  {EntryData}   data
 * @param  {Function} callback
 * @return void
 */
Json.prototype.append = function(source, data, callback) {
  var self = this;

  data.crc32 = 0;

  function onend(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }

    data.size = sourceBuffer.length || 0;
    data.crc32 = crc32.unsigned(sourceBuffer);

    self.files.push(data);

    callback(null, data);
  }

  if (data.sourceType === 'buffer') {
    onend(null, source);
  } else if (data.sourceType === 'stream') {
    util.collectStream(source, onend);
  }
};

/**
 * [finalize description]
 *
 * @return void
 */
Json.prototype.finalize = function() {
  this._writeStringified();
  this.end();
};

module.exports = Json;

/**
 * @typedef {Object} JsonOptions
 * @global
 */

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339231);
})()
//miniprogram-npm-outsideDeps=["fs","glob","async","path","archiver-utils","util","readable-stream","zip-stream","zlib","tar-stream","buffer-crc32"]
//# sourceMappingURL=index.js.map