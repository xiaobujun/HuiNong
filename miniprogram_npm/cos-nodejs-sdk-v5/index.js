module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339455, function(require, module, exports) {
/**
 * 提供 npm 包引用的入口
 */
var COS = require('./sdk/cos');
module.exports = COS;
}, function(modId) {var map = {"./sdk/cos":1654780339456}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339456, function(require, module, exports) {


var util = require('./util');
var event = require('./event');
var task = require('./task');
var base = require('./base');
var advance = require('./advance');
var pkg = require('../package.json');

var defaultOptions = {
    AppId: '', // AppId 已废弃，请拼接到 Bucket 后传入，例如：test-1250000000
    SecretId: '',
    SecretKey: '',
    SecurityToken: '', // 使用临时密钥需要注意自行刷新 Token
    ChunkRetryTimes: 2,
    FileParallelLimit: 3,
    ChunkParallelLimit: 3,
    ChunkSize: 1024 * 1024,
    SliceSize: 1024 * 1024,
    CopyChunkParallelLimit: 20,
    CopyChunkSize: 1024 * 1024 * 10,
    CopySliceSize: 1024 * 1024 * 10,
    MaxPartNumber: 10000,
    ProgressInterval: 1000,
    UploadQueueSize: 1000,
    Domain: '',
    ServiceDomain: '',
    Protocol: '',
    CompatibilityMode: false,
    ForcePathStyle: false,
    UseRawKey: false,
    Timeout: 0, // 单位毫秒，0 代表不设置超时时间
    CorrectClockSkew: true,
    SystemClockOffset: 0, // 单位毫秒，ms
    UploadCheckContentMd5: false,
    UploadIdCacheLimit: 500,
    Proxy: '',
    Ip: '',
    StrictSsl: true,
    KeepAlive: true,
    UserAgent: '',
    ConfCwd: '',
};

// 对外暴露的类
var COS = function (options) {
    this.options = util.extend(util.clone(defaultOptions), options || {});
    this.options.FileParallelLimit = Math.max(1, this.options.FileParallelLimit);
    this.options.ChunkParallelLimit = Math.max(1, this.options.ChunkParallelLimit);
    this.options.ChunkRetryTimes = Math.max(0, this.options.ChunkRetryTimes);
    this.options.ChunkSize = Math.max(1024 * 1024, this.options.ChunkSize);
    this.options.CopyChunkParallelLimit = Math.max(1, this.options.CopyChunkParallelLimit);
    this.options.CopyChunkSize = Math.max(1024 * 1024, this.options.CopyChunkSize);
    this.options.CopySliceSize = Math.max(0, this.options.CopySliceSize);
    this.options.MaxPartNumber = Math.max(1024, Math.min(10000, this.options.MaxPartNumber));
    this.options.Timeout = Math.max(0, this.options.Timeout);
    if (this.options.AppId) {
        console.warn('warning: AppId has been deprecated, Please put it at the end of parameter Bucket(E.g: "test-1250000000").');
    }
    event.init(this);
    task.init(this);
};

base.init(COS, task);
advance.init(COS, task);

COS.getAuthorization = util.getAuth;
COS.version = pkg.version;

module.exports = COS;

}, function(modId) { var map = {"./util":1654780339457,"./event":1654780339458,"./task":1654780339459,"./base":1654780339461,"./advance":1654780339464,"../package.json":1654780339462}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339457, function(require, module, exports) {


var fs = require('fs');
var crypto = require('crypto');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false, ignoreAttrs: true});
var xmlBuilder = new xml2js.Builder();

function camSafeUrlEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

//测试用的key后面可以去掉
var getAuth = function (opt) {
    opt = opt || {};

    var SecretId = opt.SecretId;
    var SecretKey = opt.SecretKey;
    var KeyTime = opt.KeyTime;
    var method = (opt.method || opt.Method || 'get').toLowerCase();
    var queryParams = clone(opt.Query || opt.params || {});
    var headers = clone(opt.Headers || opt.headers || {});

    var Key = opt.Key || '';
    var pathname;
    if (opt.UseRawKey) {
        pathname = opt.Pathname || opt.pathname || '/' + Key;
    } else {
        pathname = opt.Pathname || opt.pathname || Key;
        pathname.indexOf('/') !== 0 && (pathname = '/' + pathname);
    }

    if (!SecretId) throw new Error('missing param SecretId');
    if (!SecretKey) throw new Error('missing param SecretKey');

    var getObjectKeys = function (obj, forKey) {
        var list = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                list.push(forKey ? camSafeUrlEncode(key).toLowerCase() : key);
            }
        }
        return list.sort(function (a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            return a === b ? 0 : (a > b ? 1 : -1);
        });
    };

    var obj2str = function (obj) {
        var i, key, val;
        var list = [];
        var keyList = getObjectKeys(obj);
        for (i = 0; i < keyList.length; i++) {
            key = keyList[i];
            val = (obj[key] === undefined || obj[key] === null) ? '' : ('' + obj[key]);
            key = camSafeUrlEncode(key).toLowerCase();
            val = camSafeUrlEncode(val) || '';
            list.push(key + '=' + val)
        }
        return list.join('&');
    };

    // 签名有效起止时间
    var now = Math.round(getSkewTime(opt.SystemClockOffset) / 1000) - 1;
    var exp = now;

    var Expires = opt.Expires || opt.expires;
    if (Expires === undefined) {
        exp += 900; // 签名过期时间为当前 + 900s
    } else {
        exp += (Expires * 1) || 0;
    }

    // 要用到的 Authorization 参数列表
    var qSignAlgorithm = 'sha1';
    var qAk = SecretId;
    var qSignTime = KeyTime || now + ';' + exp;
    var qKeyTime = KeyTime || now + ';' + exp;
    var qHeaderList = getObjectKeys(headers, true).join(';').toLowerCase();
    var qUrlParamList = getObjectKeys(queryParams, true).join(';').toLowerCase();

    // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
    // 步骤一：计算 SignKey
    var signKey = crypto.createHmac('sha1', SecretKey).update(qKeyTime).digest('hex');

    // 步骤二：构成 FormatString
    var formatString = [method, pathname, obj2str(queryParams), obj2str(headers), ''].join('\n');
    formatString = Buffer.from(formatString, 'utf8');

    // 步骤三：计算 StringToSign
    var res = crypto.createHash('sha1').update(formatString).digest('hex');
    var stringToSign = ['sha1', qSignTime, res, ''].join('\n');

    // 步骤四：计算 Signature
    var qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

    // 步骤五：构造 Authorization
    var authorization = [
        'q-sign-algorithm=' + qSignAlgorithm,
        'q-ak=' + qAk,
        'q-sign-time=' + qSignTime,
        'q-key-time=' + qKeyTime,
        'q-header-list=' + qHeaderList,
        'q-url-param-list=' + qUrlParamList,
        'q-signature=' + qSignature
    ].join('&');

    return authorization;

};

var getV4Auth = function (opt) {

    if (!opt.SecretId) return console.error('missing param SecretId');
    if (!opt.SecretKey) return console.error('missing param SecretKey');
    if (!opt.Bucket) return console.error('missing param Bucket');

    var longBucket = opt.Bucket;
    var ShortBucket = longBucket.substr(0, longBucket.lastIndexOf('-'));
    var AppId = longBucket.substr(longBucket.lastIndexOf('-') + 1);
    var random = Math.round(Math.random() * Math.pow(2, 32));
    var now = Math.round(Date.now() / 1000);
    var e = now + (opt.Expires === undefined ? 900 : opt.Expires);
    var path = '/' + AppId + '/' + ShortBucket + '/' + encodeURIComponent((opt.Key || '').replace(/(^\/*)/g, '')).replace(/%2F/g, '/');
    var plainText = 'a=' + AppId + '&b=' + ShortBucket + '&k=' + opt.SecretId + '&t=' + now + '&e=' + e + '&r=' + random + '&f=' + path;
    var signKey = crypto.createHmac("sha1", opt.SecretKey).update(plainText).digest();
    var sign = Buffer.concat([signKey, Buffer.from(plainText)]).toString("base64");
    return sign;
};

var noop = function () {

};

// 清除对象里值为的 undefined 或 null 的属性
var clearKey = function (obj) {
    var retObj = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
            retObj[key] = obj[key];
        }
    }
    return retObj;
};

// XML 对象转 JSON 对象
var xml2json = function (bodyStr) {
    var d = {};
    xmlParser.parseString(bodyStr, function (err, result) {
        d = result;
    });

    return d;
};

// JSON 对象转 XML 对象
var json2xml = function (json) {
    var xml = xmlBuilder.buildObject(json);
    return xml;
};

// 计算 MD5
var md5 = function (str, encoding) {
    return crypto.createHash('md5').update(str).digest(encoding || 'hex');
};

// 获取文件分片
var fileSlice = function (FilePath, start, end, callback) {
    if (FilePath) {
        var readStream = fs.createReadStream(FilePath, {start: start, end: end - 1});
        readStream.isSdkCreated = true;
        callback(readStream);
    } else {
        callback(null);
    }
};

// 获取文件内容的 MD5
var getBodyMd5 = function (UploadCheckContentMd5, Body, callback) {
    callback = callback || noop;
    if (UploadCheckContentMd5) {
        if (Body instanceof Buffer || typeof Body === 'string') {
            callback(util.md5(Body));
        } else {
            callback();
        }
    } else {
        callback();
    }
};

// 获取文件 md5 值
var getFileMd5 = function (readStream, callback) {
    var md5 = crypto.createHash('md5');
    readStream.on('data', function (chunk) {
        md5.update(chunk);
    });
    readStream.on('error', function (err) {
        callback(util.error(err));
    });
    readStream.on('end', function () {
        var hash = md5.digest('hex');
        callback(null, hash);
    });
};

function clone(obj) {
    return map(obj, function (v) {
        return typeof v === 'object' ? clone(v) : v;
    });
}

function extend(target, source) {
    each(source, function (val, key) {
        target[key] = source[key];
    });
    return target;
}

function isArray(arr) {
    return arr instanceof Array;
}

function isInArray(arr, item) {
    var flag = false;
    for (var i = 0; i < arr.length; i++) {
        if (item === arr[i]) {
            flag = true;
            break;
        }
    }
    return flag;
}

function makeArray(arr) {
    return isArray(arr) ? arr : [arr];
}

function each(obj, fn) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            fn(obj[i], i);
        }
    }
}

function map(obj, fn) {
    var o = isArray(obj) ? [] : {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            o[i] = fn(obj[i], i);
        }
    }
    return o;
}

function filter(obj, fn) {
    var iaArr = isArray(obj);
    var o = iaArr ? [] : {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            if (fn(obj[i], i)) {
                if (iaArr) {
                    o.push(obj[i]);
                } else {
                    o[i] = obj[i];
                }
            }
        }
    }
    return o;
}

var binaryBase64 = function (str) {
    var i, len, char, arr = [];
    for (i = 0, len = str.length / 2; i < len; i++) {
        char = parseInt(str[i * 2] + str[i * 2 + 1], 16);
        arr.push(char);
    }
    return Buffer.from(arr).toString('base64');
};
var uuid = function () {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

var hasMissingParams = function (apiName, params) {
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    if (apiName.indexOf('Bucket') > -1 || apiName === 'deleteMultipleObject' || apiName === 'multipartList' || apiName === 'listObjectVersions') {
        if (!Bucket) return 'Bucket';
        if (!Region) return 'Region';
    } else if (apiName.indexOf('Object') > -1 || apiName.indexOf('multipart') > -1 || apiName === 'sliceUploadFile' || apiName === 'abortUploadTask') {
        if (!Bucket) return 'Bucket';
        if (!Region) return 'Region';
        if (!Key) return 'Key';
    }
    return false;
};

var formatParams = function (apiName, params) {

    // 复制参数对象
    params = extend({}, params);

    // 统一处理 Headers
    if (apiName !== 'getAuth' && apiName !== 'getV4Auth' && apiName !== 'getObjectUrl') {
        var Headers = params.Headers || {};
        if (params && typeof params === 'object') {
            (function () {
                for (var key in params) {
                    if (params.hasOwnProperty(key) && key.indexOf('x-cos-') > -1) {
                        Headers[key] = params[key];
                    }
                }
            })();

            var headerMap = {
                // params headers
                'x-cos-mfa': 'MFA',
                'Content-MD5': 'ContentMD5',
                'Content-Length': 'ContentLength',
                'Content-Type': 'ContentType',
                'Expect': 'Expect',
                'Expires': 'Expires',
                'Cache-Control': 'CacheControl',
                'Content-Disposition': 'ContentDisposition',
                'Content-Encoding': 'ContentEncoding',
                'Range': 'Range',
                'If-Modified-Since': 'IfModifiedSince',
                'If-Unmodified-Since': 'IfUnmodifiedSince',
                'If-Match': 'IfMatch',
                'If-None-Match': 'IfNoneMatch',
                'x-cos-copy-source': 'CopySource',
                'x-cos-copy-source-Range': 'CopySourceRange',
                'x-cos-metadata-directive': 'MetadataDirective',
                'x-cos-copy-source-If-Modified-Since': 'CopySourceIfModifiedSince',
                'x-cos-copy-source-If-Unmodified-Since': 'CopySourceIfUnmodifiedSince',
                'x-cos-copy-source-If-Match': 'CopySourceIfMatch',
                'x-cos-copy-source-If-None-Match': 'CopySourceIfNoneMatch',
                'x-cos-acl': 'ACL',
                'x-cos-grant-read': 'GrantRead',
                'x-cos-grant-write': 'GrantWrite',
                'x-cos-grant-full-control': 'GrantFullControl',
                'x-cos-grant-read-acp': 'GrantReadAcp',
                'x-cos-grant-write-acp': 'GrantWriteAcp',
                'x-cos-storage-class': 'StorageClass',
                'x-cos-traffic-limit': 'TrafficLimit',
                // SSE-C
                'x-cos-server-side-encryption-customer-algorithm': 'SSECustomerAlgorithm',
                'x-cos-server-side-encryption-customer-key': 'SSECustomerKey',
                'x-cos-server-side-encryption-customer-key-MD5': 'SSECustomerKeyMD5',
                // SSE-COS、SSE-KMS
                'x-cos-server-side-encryption': 'ServerSideEncryption',
                'x-cos-server-side-encryption-cos-kms-key-id': 'SSEKMSKeyId',
                'x-cos-server-side-encryption-context': 'SSEContext',
            };
            util.each(headerMap, function (paramKey, headerKey) {
                if (params[paramKey] !== undefined) {
                    Headers[headerKey] = params[paramKey];
                }
            });

            params.Headers = clearKey(Headers);
        }
    }

    return params;
};

var apiWrapper = function (apiName, apiFn) {
    return function (params, callback) {

        var self = this;

        // 处理参数
        if (typeof params === 'function') {
            callback = params;
            params = {};
        }

        // 整理参数格式
        params = formatParams(apiName, params);

        // 代理回调函数
        var formatResult = function (result) {
            if (result && result.headers) {
                result.headers['x-cos-version-id'] && (result.VersionId = result.headers['x-cos-version-id']);
                result.headers['x-cos-delete-marker'] && (result.DeleteMarker = result.headers['x-cos-delete-marker']);
            }
            return result;
        };
        var _callback = function (err, data) {
            callback && callback(formatResult(err), formatResult(data));
        };

        var checkParams = function () {
            if (apiName !== 'getService' && apiName !== 'abortUploadTask') {
                // 判断参数是否完整
                var missingResult = hasMissingParams(apiName, params)
                if (missingResult) {
                    return 'missing param ' + missingResult;
                }
                // 判断 region 格式
                if (params.Region) {
                    if (params.Region.indexOf('cos.') > -1) {
                        return 'param Region should not be start with "cos."';
                    } else if (!/^([a-z\d-]+)$/.test(params.Region)) {
                        return 'Region format error.';
                    }
                    // 判断 region 格式
                    if (!self.options.CompatibilityMode && params.Region.indexOf('-') === -1 && params.Region !== 'yfb' && params.Region !== 'default') {
                        console.warn('warning: param Region format error, find help here: https://cloud.tencent.com/document/product/436/6224');
                    }
                }
                // 兼容不带 AppId 的 Bucket
                if (params.Bucket) {
                    if (!/^([a-z\d-]+)-(\d+)$/.test(params.Bucket)) {
                        if (params.AppId) {
                            params.Bucket = params.Bucket + '-' + params.AppId;
                        } else if (self.options.AppId) {
                            params.Bucket = params.Bucket + '-' + self.options.AppId;
                        } else {
                            return 'Bucket should format as "test-1250000000".';
                        }
                    }
                    if (params.AppId) {
                        console.warn('warning: AppId has been deprecated, Please put it at the end of parameter Bucket(E.g Bucket:"test-1250000000" ).');
                        delete params.AppId;
                    }
                }
                // 如果 Key 是 / 开头，强制去掉第一个 /
                if (!self.options.UseRawKey && params.Key && params.Key.substr(0, 1) === '/') {
                    params.Key = params.Key.substr(1);
                }
            }
        };

        var errMsg = checkParams();
        var isSync = apiName === 'getAuth' || apiName === 'getV4Auth' || apiName === 'getObjectUrl'
            || apiName.indexOf('Stream') > -1;
        var Promise = global.Promise;
        if (!isSync && Promise && !callback) {
            return new Promise(function (resolve, reject) {
                callback = function (err, data) {
                    err ? reject(err) : resolve(data);
                };
                if (errMsg) return _callback(util.error(new Error(errMsg)));
                apiFn.call(self, params, _callback);
            });
        } else {
            if (errMsg) return _callback(util.error(new Error(errMsg)));
            var res = apiFn.call(self, params, _callback);
            if (isSync) return res;
        }
    }
};

var throttleOnProgress = function (total, onProgress) {
    var self = this;
    var size0 = 0;
    var size1 = 0;
    var time0 = Date.now();
    var time1;
    var timer;

    function update() {
        timer = 0;
        if (onProgress && (typeof onProgress === 'function')) {
            time1 = Date.now();
            var speed = Math.max(0, Math.round((size1 - size0) / ((time1 - time0) / 1000) * 100) / 100) || 0;
            var percent;
            if (size1 === 0 && total === 0) {
                percent = 1;
            } else {
                percent = Math.floor(size1 / total * 100) / 100 || 0;
            }
            time0 = time1;
            size0 = size1;
            try {
                onProgress({loaded: size1, total: total, speed: speed, percent: percent});
            } catch (e) {
            }
        }
    }

    return function (info, immediately) {
        if (info) {
            size1 = info.loaded;
            total = info.total;
        }
        if (immediately) {
            clearTimeout(timer);
            update();
        } else {
            if (timer) return;
            timer = setTimeout(update, self.options.ProgressInterval);
        }
    };
};

var getFileSize = function (api, params, callback) {
    var size;
    if (api === 'sliceUploadFile') {
        if (params.FilePath) {
            fs.stat(params.FilePath, function (err, fileStats) {
                if (err) {
                    if (params.ContentLength !== undefined) {
                        size = params.ContentLength;
                    } else {
                        return callback(err);
                    }
                } else {
                    params.FileStat = fileStats;
                    params.FileStat.FilePath = params.FilePath;
                    size = fileStats.isDirectory() ? 0 : fileStats.size;
                }
                params.ContentLength = size = size || 0;
                callback(null, size);
            });
            return;
        } else {
            callback(util.error(new Error('missing param FilePath')));
            return;
        }
    } else {
        if (params.Body !== undefined) {
            if (typeof params.Body === 'string') {
                params.Body = global.Buffer.from(params.Body);
            }
            if (params.Body instanceof global.Buffer) {
                size = params.Body.length;
            } else if (typeof params.Body.pipe === 'function') {
                if (params.ContentLength === undefined) {
                    size = undefined;
                } else {
                    size = params.ContentLength;
                }
            } else {
                callback(util.error(new Error('params Body format error, Only allow Buffer|Stream|String.')));
                return;
            }
        } else {
            callback(util.error(new Error('missing param Body')));
            return;
        }
    }
    params.ContentLength = size;
    callback(null, size);
};

// 获取调正的时间戳
var getSkewTime = function (offset) {
    return Date.now() + (offset || 0);
};

// 重写 callback，等待流结束后才 callback
var callbackAfterStreamFinish = function (stream, callback) {
    if (!stream) return callback;
    var err, data, count = 2;
    var cb = function (e, d) {
        // 如果有数据，且没有错误，清理 设置错误
        if (d && !data || e || err) {
            data = d;
        }
        if (e && !err) {
            err = e;
            data = null;
        }
        --count === 0 && callback(err, data);
    };
    stream.on('error', function (err) {
        cb(err);
    });
    stream.on('finish', function () {
        cb();
    });
    return cb;
};

var error = function (err, opt) {
    var sourceErr = err;
    err.message = err.message || null;

    if (typeof opt === 'string') {
        err.error = opt;
        err.message = opt;
    } else if (typeof opt === 'object' && opt !== null) {
        extend(err, opt);
        if (opt.code || opt.name) err.code = opt.code || opt.name;
        if (opt.message) err.message = opt.message;
        if (opt.stack) err.stack = opt.stack;
    }

    if (typeof Object.defineProperty === 'function') {
        Object.defineProperty(err, 'name', {writable: true, enumerable: false});
        Object.defineProperty(err, 'message', {enumerable: true});
    }

    err.name = opt && opt.name || err.name || err.code || 'Error';
    if (!err.code) err.code = err.name;
    if (!err.error) err.error = clone(sourceErr); // 兼容老的错误格式

    return err;
}

var util = {
    noop: noop,
    formatParams: formatParams,
    apiWrapper: apiWrapper,
    xml2json: xml2json,
    json2xml: json2xml,
    md5: md5,
    clearKey: clearKey,
    fileSlice: fileSlice,
    getBodyMd5: getBodyMd5,
    getFileMd5: getFileMd5,
    binaryBase64: binaryBase64,
    extend: extend,
    isArray: isArray,
    isInArray: isInArray,
    makeArray: makeArray,
    each: each,
    map: map,
    filter: filter,
    clone: clone,
    uuid: uuid,
    camSafeUrlEncode: camSafeUrlEncode,
    throttleOnProgress: throttleOnProgress,
    getFileSize: getFileSize,
    getSkewTime: getSkewTime,
    callbackAfterStreamFinish: callbackAfterStreamFinish,
    error: error,
    getAuth: getAuth,
    getV4Auth: getV4Auth,
    isBrowser: false,
};

module.exports = util;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339458, function(require, module, exports) {
var initEvent = function (cos) {
    var listeners = {};
    var getList = function (action) {
        !listeners[action] && (listeners[action] = []);
        return listeners[action];
    };
    cos.on = function (action, callback) {
        if (action === 'task-list-update') {
            console.warn('warning: Event "' + action + '" has been deprecated. Please use "list-update" instead.');
        }
        getList(action).push(callback);
    };
    cos.off = function (action, callback) {
        var list = getList(action);
        for (var i = list.length - 1; i >= 0; i--) {
            callback === list[i] && list.splice(i, 1);
        }
    };
    cos.emit = function (action, data) {
        var list = getList(action).map(function (cb) {
            return cb;
        });
        for (var i = 0; i < list.length; i++) {
            list[i](data);
        }
    };
};

var EventProxy = function () {
    initEvent(this);
};

module.exports.init = initEvent;
module.exports.EventProxy = EventProxy;
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339459, function(require, module, exports) {
var session = require('./session');
var util = require('./util');

var originApiMap = {};
var transferToTaskMethod = function (apiMap, apiName) {
    originApiMap[apiName] = apiMap[apiName];
    apiMap[apiName] = function (params, callback) {
        if (params.SkipTask) {
            originApiMap[apiName].call(this, params, callback);
        } else {
            this._addTask(apiName, params, callback);
        }
    };
};

var initTask = function (cos) {

    var queue = [];
    var tasks = {};
    var uploadingFileCount = 0;
    var nextUploadIndex = 0;

    // 接口返回简略的任务信息
    var formatTask = function (task) {
        var t = {
            id: task.id,
            Bucket: task.Bucket,
            Region: task.Region,
            Key: task.Key,
            FilePath: task.FilePath,
            state: task.state,
            loaded: task.loaded,
            size: task.size,
            speed: task.speed,
            percent: task.percent,
            hashPercent: task.hashPercent,
            error: task.error,
        };
        if (task.FilePath) t.FilePath = task.FilePath;
        return t;
    };

    var emitListUpdate = (function () {
        var timer;
        var emit = function () {
            timer = 0;
            cos.emit('task-list-update', {list: util.map(queue, formatTask)});
            cos.emit('list-update', {list: util.map(queue, formatTask)});
        };
        return function () {
            if (!timer) timer = setTimeout(emit);
        }
    })();

    var clearQueue = function () {
        if (queue.length <= cos.options.UploadQueueSize) return;
        for (var i = 0;
             i < nextUploadIndex && // 小于当前操作的 index 才清理
             i < queue.length && // 大于队列才清理
             queue.length > cos.options.UploadQueueSize // 如果还太多，才继续清理
            ;) {
            var isActive = queue[i].state === 'waiting' || queue[i].state === 'checking' || queue[i].state === 'uploading';
            if (!queue[i] || !isActive) {
                tasks[queue[i].id] && (delete tasks[queue[i].id]);
                queue.splice(i, 1);
                nextUploadIndex--;
            } else {
                i++;
            }
        }
        emitListUpdate();
    };

    var startNextTask = function () {
        // 检查是否允许增加执行进程
        if (uploadingFileCount >= cos.options.FileParallelLimit) return;
        // 跳过不可执行的任务
        while (queue[nextUploadIndex] && queue[nextUploadIndex].state !== 'waiting') nextUploadIndex++;
        // 检查是否已遍历结束
        if (nextUploadIndex >= queue.length) return;
        // 上传该遍历到的任务
        var task = queue[nextUploadIndex];
        nextUploadIndex++;
        uploadingFileCount++;
        task.state = 'checking';
        task.params.onTaskStart && task.params.onTaskStart(formatTask(task));
        !task.params.UploadData && (task.params.UploadData = {});
        var apiParams = util.formatParams(task.api, task.params);
        originApiMap[task.api].call(cos, apiParams, function (err, data) {
            if (!cos._isRunningTask(task.id)) return;
            if (task.state === 'checking' || task.state === 'uploading') {
                task.state = err ? 'error' : 'success';
                err && (task.error = err);
                uploadingFileCount--;
                emitListUpdate();
                startNextTask();
                task.callback && task.callback(err, data);
                if (task.state === 'success') {
                    if (task.params) {
                        delete task.params.UploadData;
                        delete task.params.Body;
                        delete task.params;
                    }
                    delete task.callback;
                }
            }
            clearQueue();
        });
        emitListUpdate();
        // 异步执行下一个任务
        setTimeout(startNextTask);
    };

    var killTask = function (id, switchToState) {
        var task = tasks[id];
        if (!task) return;
        var waiting = task && task.state === 'waiting';
        var running = task && (task.state === 'checking' || task.state === 'uploading');
        if (switchToState === 'canceled' && task.state !== 'canceled' ||
            switchToState === 'paused' && waiting ||
            switchToState === 'paused' && running) {
            if (switchToState === 'paused' && task.params.Body && typeof task.params.Body.pipe === 'function') {
                console.error('stream not support pause');
                return;
            }
            task.state = switchToState;
            cos.emit('inner-kill-task', {TaskId: id, toState: switchToState});
            try {
                var UploadId = task && task.params && task.params.UploadData.UploadId
            } catch(e) {}
            if (switchToState === 'canceled' && UploadId) session.removeUsing(UploadId)
            emitListUpdate();
            if (running) {
                uploadingFileCount--;
                startNextTask();
            }
            if (switchToState === 'canceled') {
                if (task.params) {
                    delete task.params.UploadData;
                    delete task.params.Body;
                    delete task.params;
                }
                delete task.callback;
            }
        }
        clearQueue();
    };

    cos._addTasks = function (taskList) {
        util.each(taskList, function (task) {
            cos._addTask(task.api, task.params, task.callback, true);
        });
        emitListUpdate();
    };

    var isTaskReadyWarning = true;
    cos._addTask = function (api, params, callback, ignoreAddEvent) {

        // 复制参数对象
        params = util.formatParams(api, params);

        // 生成 id
        var id = util.uuid();
        params.TaskId = id;
        params.onTaskReady && params.onTaskReady(id);
        if (params.TaskReady) {
            params.TaskReady(id);
            isTaskReadyWarning && console.warn('warning: Param "TaskReady" has been deprecated. Please use "onTaskReady" instead.');
            isTaskReadyWarning = false;
        }

        var task = {
            // env
            params: params,
            callback: callback,
            api: api,
            index: queue.length,
            // task
            id: id,
            Bucket: params.Bucket,
            Region: params.Region,
            Key: params.Key,
            FilePath: params.FilePath || '',
            state: 'waiting',
            loaded: 0,
            size: 0,
            speed: 0,
            percent: 0,
            hashPercent: 0,
            error: null,
        };
        var onHashProgress = params.onHashProgress;
        params.onHashProgress = function (info) {
            if (!cos._isRunningTask(task.id)) return;
            task.hashPercent = info.percent;
            onHashProgress && onHashProgress(info);
            emitListUpdate();
        };
        var onProgress = params.onProgress;
        params.onProgress = function (info) {
            if (!cos._isRunningTask(task.id)) return;
            task.state === 'checking' && (task.state = 'uploading');
            task.loaded = info.loaded;
            task.speed = info.speed;
            task.percent = info.percent;
            onProgress && onProgress(info);
            emitListUpdate();
        };

        // 异步获取 filesize
        util.getFileSize(api, params, function (err, size) {
            // 开始处理上传
            if (err) return callback(util.error(err)); // 如果获取大小出错，不加入队列
            // 获取完文件大小再把任务加入队列
            tasks[id] = task;
            queue.push(task);
            task.size = size;
            !ignoreAddEvent && emitListUpdate();
            startNextTask();
            clearQueue();
        });
        return id;
    };
    cos._isRunningTask = function (id) {
        var task = tasks[id];
        return !!(task && (task.state === 'checking' || task.state === 'uploading'));
    };
    cos.getTaskList = function () {
        return util.map(queue, formatTask);
    };
    cos.cancelTask = function (id) {
        killTask(id, 'canceled');
    };
    cos.pauseTask = function (id) {
        killTask(id, 'paused');
    };
    cos.restartTask = function (id) {
        var task = tasks[id];
        if (task && (task.state === 'paused' || task.state === 'error')) {
            task.state = 'waiting';
            emitListUpdate();
            nextUploadIndex = Math.min(nextUploadIndex, task.index);
            startNextTask();
        }
    };
    cos.isUploadRunning = function () {
        return uploadingFileCount || nextUploadIndex < queue.length;
    };

};

module.exports.transferToTaskMethod = transferToTaskMethod;
module.exports.init = initTask;

}, function(modId) { var map = {"./session":1654780339460,"./util":1654780339457}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339460, function(require, module, exports) {
var Conf = require('conf');
var util = require('./util');

// 按照文件特征值，缓存 UploadId
var cacheKey = 'cos_sdk_upload_cache';
var expires = 30 * 24 * 3600;
var store;
var cache;
var timer;

var getCache = function () {
    var val, opt = {configName: 'cos-nodejs-sdk-v5-storage'};
    if (this.options.ConfCwd) opt.cwd = this.options.ConfCwd;
    try {
        store = new Conf(opt);
        val = store.get(cacheKey);
    } catch (e) {}
    if (!val || !(val instanceof Array)) val = [];
    cache = val;
};
var setCache = function () {
    try {
        localStorage.setItem(cacheKey, JSON.stringify(cache))
    } catch (e) {
    }
};

var init = function () {
    if (cache) return;
    getCache.call(this);
    // 清理太老旧的数据
    var changed = false;
    var now = Math.round(Date.now() / 1000);
    for (var i = cache.length - 1; i >= 0; i--) {
        var mtime = cache[i][2];
        if (!mtime || mtime + expires < now) {
            cache.splice(i, 1);
            changed = true;
        }
    }
    changed && setCache();
};

// 把缓存存到本地
var save = function () {
    if (timer) return;
    timer = setTimeout(function () {
        setCache();
        timer = null;
    }, 400);
};

var mod = {
    using: {},
    // 标记 UploadId 正在使用
    setUsing: function (uuid) {
        mod.using[uuid] = true;
    },
    // 标记 UploadId 已经没在使用
    removeUsing: function (uuid) {
        delete mod.using[uuid];
    },
    // 用上传参数生成哈希值
    getFileId: function (FileStat, ChunkSize, Bucket, Key) {
        if (FileStat && FileStat.FilePath && FileStat.size && FileStat.ctime && FileStat.mtime && ChunkSize) {
            return util.md5([FileStat.FilePath].join('::')) + '-' + util.md5([FileStat.size, FileStat.ctime, FileStat.mtime, ChunkSize, Bucket, Key].join('::'));
        } else {
            return null;
        }
    },
    // 获取文件对应的 UploadId 列表
    getUploadIdList: function (uuid) {
        if (!uuid) return null;
        init.call(this);
        var list = [];
        for (var i = 0; i < cache.length; i++) {
            if (cache[i][0] === uuid)
                list.push(cache[i][1]);
        }
        return list.length ? list : null;
    },
    // 缓存 UploadId
    saveUploadId: function (uuid, UploadId, limit) {
        init.call(this);
        if (!uuid) return;
        // 清理没用的 UploadId
        var part1 = uuid.substr(0, uuid.indexOf('-') + 1);
        for (var i = cache.length - 1; i >= 0; i--) {
            var item = cache[i];
            if (item[0] === uuid && item[1] === UploadId) {
                cache.splice(i, 1);
            } else if (uuid !== item[0] && item[0].indexOf(part1) === 0) { // 文件路径相同，但其他信息不同，说明文件改变了或上传参数（存储桶、路径、分片大小）变了，直接清理掉
                cache.splice(i, 1);
            }
        }
        cache.unshift([uuid, UploadId, Math.round(Date.now() / 1000)]);
        if (cache.length > limit) cache.splice(limit);
        save();
    },
    // UploadId 已用完，移除掉
    removeUploadId: function (UploadId) {
        init.call(this);
        delete mod.using[UploadId];
        for (var i = cache.length - 1; i >= 0; i--) {
            if (cache[i][1] === UploadId) cache.splice(i, 1)
        }
        save();
    },
};

module.exports = mod;

}, function(modId) { var map = {"./util":1654780339457}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339461, function(require, module, exports) {
var pkg = require('../package.json');
var REQUEST = require('request');
var mime = require('mime-types');
var Stream = require('stream');
var util = require('./util');
var fs = require('fs');


// Bucket 相关

/**
 * 获取用户的 bucket 列表
 * @param  {Object}  params         回调函数，必须，下面为参数列表
 * 无特殊参数
 * @param  {Function}  callback     回调函数，必须
 */
function getService(params, callback) {

    if (typeof params === 'function') {
        callback = params;
        params = {};
    }
    var protocol = this.options.Protocol || (util.isBrowser && location.protocol === 'http:' ? 'http:' : 'https:');
    var domain = this.options.ServiceDomain;
    var appId = params.AppId || this.options.appId;
    var region = params.Region;
    if (domain) {
        domain = domain.replace(/\{\{AppId\}\}/ig, appId || '')
            .replace(/\{\{Region\}\}/ig, region || '').replace(/\{\{.*?\}\}/ig, '');
        if (!/^[a-zA-Z]+:\/\//.test(domain)) {
            domain = protocol + '//' + domain;
        }
        if (domain.slice(-1) === '/') {
            domain = domain.slice(0, -1);
        }
    } else if (region) {
        domain = protocol + '//cos.' + region + '.myqcloud.com';
    } else {
        domain = protocol + '//service.cos.myqcloud.com';
    }

    submitRequest.call(this, {
        Action: 'name/cos:GetService',
        url: domain,
        method: 'GET',
        headers: params.Headers,
    }, function (err, data) {
        if (err) return callback(err);
        var buckets = (data && data.ListAllMyBucketsResult && data.ListAllMyBucketsResult.Buckets
            && data.ListAllMyBucketsResult.Buckets.Bucket) || [];
        buckets = util.isArray(buckets) ? buckets : [buckets];
        var owner = (data && data.ListAllMyBucketsResult && data.ListAllMyBucketsResult.Owner) || {};
        callback(null, {
            Buckets: buckets,
            Owner: owner,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 创建 Bucket，并初始化访问权限
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 *     @param  {String}  params.ACL                 用户自定义文件权限，可以设置：private，public-read；默认值：private，非必须
 *     @param  {String}  params.GrantRead           赋予被授权者读的权限，格式x-cos-grant-read: uin=" ",uin=" "，非必须
 *     @param  {String}  params.GrantWrite          赋予被授权者写的权限，格式x-cos-grant-write: uin=" ",uin=" "，非必须
 *     @param  {String}  params.GrantFullControl    赋予被授权者读写权限，格式x-cos-grant-full-control: uin=" ",uin=" "，非必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          返回的数据
 *     @return  {String}  data.Location             操作地址
 */
function putBucket(params, callback) {

    var self = this;

    var xml = '';
    if(params['BucketAZConfig']){
        var CreateBucketConfiguration = {
            BucketAZConfig: params.BucketAZConfig
        };
        xml = util.json2xml({CreateBucketConfiguration: CreateBucketConfiguration});
    }

    submitRequest.call(this, {
        Action: 'name/cos:PutBucket',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        body: xml,
    }, function (err, data) {
        if (err) return callback(err);
        var url = getUrl({
            protocol: self.options.Protocol,
            domain: self.options.Domain,
            bucket: params.Bucket,
            region: params.Region,
            isLocation: true,
        });
        callback(null, {
            Location: url,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 查看是否存在该Bucket，是否有权限访问
 * @param  {Object}  params                     参数对象，必须
 *     @param  {String}  params.Bucket          Bucket名称，必须
 *     @param  {String}  params.Region          地域名称，必须
 * @param  {Function}  callback                 回调函数，必须
 * @return  {Object}  err                       请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                      返回的数据
 *     @return  {Boolean}  data.BucketExist     Bucket是否存在
 *     @return  {Boolean}  data.BucketAuth      是否有 Bucket 的访问权限
 */
function headBucket(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:HeadBucket',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        method: 'HEAD',
    }, callback);
}

/**
 * 获取 Bucket 下的 object 列表
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 *     @param  {String}  params.Prefix              前缀匹配，用来规定返回的文件前缀地址，非必须
 *     @param  {String}  params.Delimiter           定界符为一个符号，如果有Prefix，则将Prefix到delimiter之间的相同路径归为一类，非必须
 *     @param  {String}  params.Marker              默认以UTF-8二进制顺序列出条目，所有列出条目从marker开始，非必须
 *     @param  {String}  params.MaxKeys             单次返回最大的条目数量，默认1000，非必须
 *     @param  {String}  params.EncodingType        规定返回值的编码方式，非必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          返回的数据
 *     @return  {Object}  data.ListBucketResult     返回的 object 列表信息
 */
function getBucket(params, callback) {
    var reqParams = {};
    reqParams['prefix'] = params['Prefix'] || '';
    reqParams['delimiter'] = params['Delimiter'];
    reqParams['marker'] = params['Marker'];
    reqParams['max-keys'] = params['MaxKeys'];
    reqParams['encoding-type'] = params['EncodingType'];

    submitRequest.call(this, {
        Action: 'name/cos:GetBucket',
        ResourceKey: reqParams['prefix'],
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        qs: reqParams,
    }, function (err, data) {
        if (err) return callback(err);
        var ListBucketResult = data.ListBucketResult || {};
        var Contents = ListBucketResult.Contents || [];
        var CommonPrefixes = ListBucketResult.CommonPrefixes || [];

        Contents = util.isArray(Contents) ? Contents : [Contents];
        CommonPrefixes = util.isArray(CommonPrefixes) ? CommonPrefixes : [CommonPrefixes];

        var result = util.clone(ListBucketResult);
        util.extend(result, {
            Contents: Contents,
            CommonPrefixes: CommonPrefixes,
            statusCode: data.statusCode,
            headers: data.headers,
        });

        callback(null, result);
    });
}

/**
 * 删除 Bucket
 * @param  {Object}  params                 参数对象，必须
 *     @param  {String}  params.Bucket      Bucket名称，必须
 *     @param  {String}  params.Region      地域名称，必须
 * @param  {Function}  callback             回调函数，必须
 * @return  {Object}  err                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                  返回的数据
 *     @return  {String}  data.Location     操作地址
 */
function deleteBucket(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucket',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        method: 'DELETE',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 的 权限列表
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 *     @param  {String}  params.ACL                 用户自定义文件权限，可以设置：private，public-read；默认值：private，非必须
 *     @param  {String}  params.GrantRead           赋予被授权者读的权限，格式x-cos-grant-read: uin=" ",uin=" "，非必须
 *     @param  {String}  params.GrantWrite          赋予被授权者写的权限，格式x-cos-grant-write: uin=" ",uin=" "，非必须
 *     @param  {String}  params.GrantFullControl    赋予被授权者读写权限，格式x-cos-grant-full-control: uin=" ",uin=" "，非必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          返回的数据
 */
function putBucketAcl(params, callback) {
    var headers = params.Headers;

    var xml = '';
    if (params['AccessControlPolicy']) {
        var AccessControlPolicy = util.clone(params['AccessControlPolicy'] || {});
        var Grants = AccessControlPolicy.Grants || AccessControlPolicy.Grant;
        Grants = util.isArray(Grants) ? Grants : [Grants];
        delete AccessControlPolicy.Grant;
        delete AccessControlPolicy.Grants;
        AccessControlPolicy.AccessControlList = {Grant: Grants};
        xml = util.json2xml({AccessControlPolicy: AccessControlPolicy});

        headers['Content-Type'] = 'application/xml';
        headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
    }

    // Grant Header 去重
    util.each(headers, function (val, key) {
        if (key.indexOf('x-cos-grant-') === 0) {
            headers[key] = uniqGrant(headers[key]);
        }
    });

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketACL',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: headers,
        action: 'acl',
        body: xml,
    }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的 权限列表
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          返回的数据
 *     @return  {Object}  data.AccessControlPolicy  访问权限信息
 */
function getBucketAcl(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketACL',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'acl',
    }, function (err, data) {
        if (err) return callback(err);
        var AccessControlPolicy = data.AccessControlPolicy || {};
        var Owner = AccessControlPolicy.Owner || {};
        var Grant = AccessControlPolicy.AccessControlList.Grant || [];
        Grant = util.isArray(Grant) ? Grant : [Grant];
        var result = decodeAcl(AccessControlPolicy);
        if (data.headers && data.headers['x-cos-acl']) {
            result.ACL = data.headers['x-cos-acl'];
        }
        result = util.extend(result, {
            Owner: Owner,
            Grants: Grant,
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

/**
 * 设置 Bucket 的 跨域设置
 * @param  {Object}  params                             参数对象，必须
 *     @param  {String}  params.Bucket                  Bucket名称，必须
 *     @param  {String}  params.Region                  地域名称，必须
 *     @param  {Object}  params.CORSConfiguration       相关的跨域设置，必须
 * @param  {Array}  params.CORSConfiguration.CORSRules  对应的跨域规则
 * @param  {Function}  callback                         回调函数，必须
 * @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                              返回的数据
 */
function putBucketCors(params, callback) {

    var CORSConfiguration = params['CORSConfiguration'] || {};
    var CORSRules = CORSConfiguration['CORSRules'] || params['CORSRules'] || [];
    CORSRules = util.clone(util.isArray(CORSRules) ? CORSRules : [CORSRules]);
    util.each(CORSRules, function (rule) {
        util.each(['AllowedOrigin', 'AllowedHeader', 'AllowedMethod', 'ExposeHeader'], function (key, k) {
            var sKey = key + 's';
            var val = rule[sKey] || rule[key] || [];
            delete rule[sKey];
            rule[key] = util.isArray(val) ? val : [val];
        });
    });

    var xml = util.json2xml({CORSConfiguration: {CORSRule: CORSRules}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketCORS',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'cors',
        headers: headers,
    }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的 跨域设置
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          返回的数据
 *     @return  {Object}  data.CORSRules            Bucket的跨域设置
 */
function getBucketCors(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketCORS',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'cors',
    }, function (err, data) {
        if (err) {
            if (err.statusCode === 404 && err.error && err.error.Code === 'NoSuchCORSConfiguration') {
                var result = {
                    CORSRules: [],
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }
        var CORSConfiguration = data.CORSConfiguration || {};
        var CORSRules = CORSConfiguration.CORSRules || CORSConfiguration.CORSRule || [];
        CORSRules = util.clone(util.isArray(CORSRules) ? CORSRules : [CORSRules]);

        util.each(CORSRules, function (rule) {
            util.each(['AllowedOrigin', 'AllowedHeader', 'AllowedMethod', 'ExposeHeader'], function (key, j) {
                var sKey = key + 's';
                var val = rule[sKey] || rule[key] || [];
                delete rule[key];
                rule[sKey] = util.isArray(val) ? val : [val];
            });
        });

        callback(null, {
            CORSRules: CORSRules,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Bucket 的 跨域设置
 * @param  {Object}  params                 参数对象，必须
 *     @param  {String}  params.Bucket      Bucket名称，必须
 *     @param  {String}  params.Region      地域名称，必须
 * @param  {Function}  callback             回调函数，必须
 * @return  {Object}  err                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                  返回的数据
 */
function deleteBucketCors(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketCORS',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'cors',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode || err.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的 地域信息
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据，包含地域信息 LocationConstraint
 */
function getBucketLocation(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketLocation',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'location',
    }, callback);
}

function putBucketPolicy(params, callback) {
    var Policy = params['Policy'];
    try {
        if (typeof Policy === 'string') Policy = JSON.parse(Policy);
    } catch (e) {
    }
    if (!Policy || typeof Policy === 'string') return callback(util.error(new Error('Policy format error')));
    var PolicyStr = JSON.stringify(Policy);
    if (!Policy.version) Policy.version = '2.0';

    var headers = params.Headers;
    headers['Content-Type'] = 'application/json';
    headers['Content-MD5'] = util.binaryBase64(util.md5(PolicyStr));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketPolicy',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        action: 'policy',
        body: PolicyStr,
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的读取权限策略
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketPolicy(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketPolicy',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'policy',
        rawBody: true,
    }, function (err, data) {
        if (err) {
            if (err.statusCode && err.statusCode === 403) {
                return callback(util.error(err, {ErrorStatus: 'Access Denied'}));
            }
            if (err.statusCode && err.statusCode === 405) {
                return callback(util.error(err, {ErrorStatus: 'Method Not Allowed'}));
            }
            if (err.statusCode && err.statusCode === 404) {
                return callback(util.error(err, {ErrorStatus: 'Policy Not Found'}));
            }
            return callback(err);
        }
        var Policy = {};
        try {
            Policy = JSON.parse(data.body);
        } catch (e) {
        }
        callback(null, {
            Policy: Policy,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Bucket 的 跨域设置
 * @param  {Object}  params                 参数对象，必须
 *     @param  {String}  params.Bucket      Bucket名称，必须
 *     @param  {String}  params.Region      地域名称，必须
 * @param  {Function}  callback             回调函数，必须
 * @return  {Object}  err                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                  返回的数据
 */
function deleteBucketPolicy(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketPolicy',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'policy',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode || err.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 的标签
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 *     @param  {Array}   params.TagSet  标签设置，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function putBucketTagging(params, callback) {

    var Tagging = params['Tagging'] || {};
    var Tags = Tagging.TagSet || Tagging.Tags || params['Tags'] || [];
    Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
    var xml = util.json2xml({Tagging: {TagSet: {Tag: Tags}}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketTagging',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'tagging',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的标签设置
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketTagging(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketTagging',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'tagging',
    }, function (err, data) {
        if (err) {
            if (err.statusCode === 404 && err.error && (err.error === "Not Found" || err.error.Code === 'NoSuchTagSet')) {
                var result = {
                    Tags: [],
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }
        var Tags = [];
        try {
            Tags = data.Tagging.TagSet.Tag || [];
        } catch (e) {
        }
        Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
        callback(null, {
            Tags: Tags,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Bucket 的 标签设置
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回的数据
 */
function deleteBucketTagging(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketTagging',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'tagging',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function putBucketLifecycle(params, callback) {

    var LifecycleConfiguration = params['LifecycleConfiguration'] || {};
    var Rules = LifecycleConfiguration.Rules || params.Rules || [];
    Rules = util.clone(Rules);
    var xml = util.json2xml({LifecycleConfiguration: {Rule: Rules}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketLifecycle',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'lifecycle',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function getBucketLifecycle(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketLifecycle',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'lifecycle',
    }, function (err, data) {
        if (err) {
            if (err.statusCode === 404 && err.error && err.error.Code === 'NoSuchLifecycleConfiguration') {
                var result = {
                    Rules: [],
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }
        var Rules = [];
        try {
            Rules = data.LifecycleConfiguration.Rule || [];
        } catch (e) {
        }
        Rules = util.clone(util.isArray(Rules) ? Rules : [Rules]);
        callback(null, {
            Rules: Rules,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function deleteBucketLifecycle(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketLifecycle',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'lifecycle',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function putBucketVersioning(params, callback) {

    if (!params['VersioningConfiguration']) {
        callback(util.error(new Error('missing param VersioningConfiguration')));
        return;
    }
    var VersioningConfiguration = params['VersioningConfiguration'] || {};
    var xml = util.json2xml({VersioningConfiguration: VersioningConfiguration});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketVersioning',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'versioning',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function getBucketVersioning(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketVersioning',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'versioning',
    }, function (err, data) {
        if (!err) {
            !data.VersioningConfiguration && (data.VersioningConfiguration = {});
        }
        callback(err, data);
    });
}

function putBucketReplication(params, callback) {
    var ReplicationConfiguration = util.clone(params.ReplicationConfiguration);
    var xml = util.json2xml({ReplicationConfiguration: ReplicationConfiguration});
    xml = xml.replace(/<(\/?)Rules>/ig, '<$1Rule>');
    xml = xml.replace(/<(\/?)Tags>/ig, '<$1Tag>');

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketReplication',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'replication',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function getBucketReplication(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketReplication',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'replication',
    }, function (err, data) {
        if (err) {
            if (err.statusCode === 404 && err.error && (err.error === 'Not Found' || err.error.Code === 'ReplicationConfigurationnotFoundError')) {
                var result = {
                    ReplicationConfiguration: {Rules: []},
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }
        if (!err) {
            !data.ReplicationConfiguration && (data.ReplicationConfiguration = {});
        }
        if (data.ReplicationConfiguration.Rule) {
            data.ReplicationConfiguration.Rules = util.makeArray(data.ReplicationConfiguration.Rule);
            delete data.ReplicationConfiguration.Rule;
        }
        callback(err, data);
    });
}

function deleteBucketReplication(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketReplication',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'replication',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 静态网站配置信息
 * @param  {Object}  params                                                 参数对象，必须
 *     @param  {String}  params.Bucket                                      Bucket名称，必须
 *     @param  {String}  params.Region                                      地域名称，必须
 *     @param  {Object}  params.WebsiteConfiguration                        地域名称，必须
 *         @param  {Object}   WebsiteConfiguration.IndexDocument            索引文档，必须
 *         @param  {Object}   WebsiteConfiguration.ErrorDocument            错误文档，非必须
 *         @param  {Object}   WebsiteConfiguration.RedirectAllRequestsTo    重定向所有请求，非必须
 *         @param  {Array}   params.RoutingRules                            重定向规则，非必须
 * @param  {Function}  callback                                             回调函数，必须
 * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                                  返回数据
 */
function putBucketWebsite(params, callback) {

    if (!params['WebsiteConfiguration']) {
        callback(util.error(new Error('missing param WebsiteConfiguration')));
        return;
    }

    var WebsiteConfiguration = util.clone(params['WebsiteConfiguration'] || {});
    var RoutingRules = WebsiteConfiguration['RoutingRules'] || WebsiteConfiguration['RoutingRule'] || [];
    RoutingRules = util.isArray(RoutingRules) ? RoutingRules : [RoutingRules];
    delete WebsiteConfiguration.RoutingRule;
    delete WebsiteConfiguration.RoutingRules;
    if (RoutingRules.length) WebsiteConfiguration.RoutingRules = { RoutingRule: RoutingRules };
    var xml = util.json2xml({ WebsiteConfiguration: WebsiteConfiguration });

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketWebsite',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'website',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的静态网站配置信息
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketWebsite(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketWebsite',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'website',
    }, function (err, data) {
        if (err) {
            if(err.statusCode === 404 && err.error.Code === 'NoSuchWebsiteConfiguration'){
                var result = {
                    WebsiteConfiguration: {},
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }

        var WebsiteConfiguration = data.WebsiteConfiguration || {};
        if (WebsiteConfiguration['RoutingRules']) {
            var RoutingRules = util.clone(WebsiteConfiguration['RoutingRules'].RoutingRule || []);
            RoutingRules = util.makeArray(RoutingRules);
            WebsiteConfiguration.RoutingRules = RoutingRules;
        }

        callback(null, {
            WebsiteConfiguration: WebsiteConfiguration,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Bucket 的静态网站配置
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function deleteBucketWebsite(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketWebsite',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'website',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 的防盗链白名单或者黑名单
 * @param  {Object}  params                                                 参数对象，必须
 *     @param  {String}  params.Bucket                                      Bucket名称，必须
 *     @param  {String}  params.Region                                      地域名称，必须
 *     @param  {Object}  params.RefererConfiguration                        地域名称，必须
 *         @param  {String}   RefererConfiguration.Status                   是否开启防盗链，枚举值：Enabled、Disabled
 *         @param  {String}   RefererConfiguration.RefererType              防盗链类型，枚举值：Black-List、White-List，必须
 *         @param  {Array}   RefererConfiguration.DomianList.Domain         生效域名，必须
 *         @param  {String}   RefererConfiguration.EmptyReferConfiguration  ，非必须
 * @param  {Function}  callback                                             回调函数，必须
 * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                                  返回数据
 */
function putBucketReferer(params, callback) {

    if (!params['RefererConfiguration']) {
        callback(util.error(new Error('missing param RefererConfiguration')));
        return;
    }

    var RefererConfiguration = util.clone(params['RefererConfiguration'] || {});
    var DomainList = RefererConfiguration['DomainList'] || {};
    var Domains = DomainList['Domains'] || DomainList['Domain'] || [];
    Domains = util.isArray(Domains) ? Domains : [Domains];
    if (Domains.length) RefererConfiguration.DomainList = {Domain: Domains};
    var xml = util.json2xml({ RefererConfiguration: RefererConfiguration });

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketReferer',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'referer',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的防盗链白名单或者黑名单
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketReferer(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketReferer',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'referer',
    }, function (err, data) {
        if (err) {
            if(err.statusCode === 404 && err.error.Code === 'NoSuchRefererConfiguration'){
                var result = {
                    WebsiteConfiguration: {},
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }

        var RefererConfiguration = data.RefererConfiguration || {};
        if (RefererConfiguration['DomainList']) {
            var Domains = util.clone(RefererConfiguration['DomainList'].Domain || []);
            Domains = util.makeArray(Domains);
            RefererConfiguration.DomainList = {Domains: Domains};
        }

        callback(null, {
            RefererConfiguration: RefererConfiguration,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 自定义域名
 * @param  {Object}  params                                                 参数对象，必须
 *     @param  {String}  params.Bucket                                      Bucket名称，必须
 *     @param  {String}  params.Region                                      地域名称，必须
 * @param  {Function}  callback                                             回调函数，必须
 * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                                  返回数据
 */
function putBucketDomain(params, callback) {

    var DomainConfiguration = params['DomainConfiguration'] || {};
    var DomainRule = DomainConfiguration.DomainRule || params.DomainRule || [];
    DomainRule = util.clone(DomainRule);
    var xml = util.json2xml({DomainConfiguration: {DomainRule: DomainRule}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketDomain',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'domain',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的自定义域名
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketDomain(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketDomain',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'domain',
    }, function (err, data) {
        if (err) return callback(err);

        var DomainRule = [];
        try {
            DomainRule = data.DomainConfiguration.DomainRule || [];
        } catch (e) {
        }
        DomainRule = util.clone(util.isArray(DomainRule) ? DomainRule : [DomainRule]);
        callback(null, {
            DomainRule: DomainRule,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Bucket 自定义域名
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function deleteBucketDomain(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketDomain',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'domain',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 的回源
 * @param  {Object}  params                                                 参数对象，必须
 *     @param  {String}  params.Bucket                                      Bucket名称，必须
 *     @param  {String}  params.Region                                      地域名称，必须
 * @param  {Function}  callback                                             回调函数，必须
 * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                                  返回数据
 */
function putBucketOrigin(params, callback){
    var OriginConfiguration = params['OriginConfiguration'] || {};
    var OriginRule = OriginConfiguration.OriginRule || params.OriginRule || [];
    OriginRule = util.clone(OriginRule);
    var xml = util.json2xml({OriginConfiguration: {OriginRule: OriginRule}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketOrigin',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'origin',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的回源
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketOrigin(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketOrigin',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'origin',
    }, function (err, data) {
        if (err) return callback(err);

        var OriginRule = [];
        try {
            OriginRule = data.OriginConfiguration.OriginRule || [];
        } catch (e) {
        }
        OriginRule = util.clone(util.isArray(OriginRule) ? OriginRule : [OriginRule]);
        callback(null, {
            OriginRule: OriginRule,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Bucket 的回源
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function deleteBucketOrigin(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketOrigin',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'origin',
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 设置 Bucket 的日志记录
 * @param  {Object}  params                                                 参数对象，必须
 *     @param  {String}  params.Bucket                                      Bucket名称，必须
 *     @param  {String}  params.Region                                      地域名称，必须
 *     @param  {(Object|String)}  params.BucketLoggingStatus                         说明日志记录配置的状态，如果无子节点信息则意为关闭日志记录，必须
 * @param  {Function}  callback                                             回调函数，必须
 * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                                  返回数据
 */
function putBucketLogging(params, callback) {
    var xml = util.json2xml({
        BucketLoggingStatus: params['BucketLoggingStatus'] || ''
    });

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketLogging',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'logging',
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的日志记录
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketLogging(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketLogging',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'logging',
    }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
            BucketLoggingStatus: data.BucketLoggingStatus,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 创建/编辑 Bucket 的清单任务
 * @param  {Object}  params                                                 参数对象，必须
 *     @param  {String}  params.Bucket                                      Bucket名称，必须
 *     @param  {String}  params.Region                                      地域名称，必须
 *     @param  {String}  params.Id                                          清单任务的名称，必须
 *     @param  {Object}  params.InventoryConfiguration                      包含清单的配置参数，必须
 * @param  {Function}  callback                                             回调函数，必须
 * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                                  返回数据
 */
function putBucketInventory(params, callback) {
    var InventoryConfiguration = util.clone(params['InventoryConfiguration']);

    if (InventoryConfiguration.OptionalFields) {
        var Field = InventoryConfiguration.OptionalFields || [];
        InventoryConfiguration.OptionalFields = {
            Field: Field
        };
    }

    if (InventoryConfiguration.Destination
        && InventoryConfiguration.Destination.COSBucketDestination
        && InventoryConfiguration.Destination.COSBucketDestination.Encryption
    ) {
        var Encryption = InventoryConfiguration.Destination.COSBucketDestination.Encryption;
        if (Object.keys(Encryption).indexOf('SSECOS') > -1) {
            Encryption['SSE-COS'] = Encryption['SSECOS'];
            delete Encryption['SSECOS'];
        }
    }

    var xml = util.json2xml({
        InventoryConfiguration: InventoryConfiguration
    });

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:PutBucketInventory',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'inventory',
        qs: {
            id: params['Id']
        },
        headers: headers,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的清单任务信息
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 *     @param  {String}  params.Id      清单任务的名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function getBucketInventory(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:GetBucketInventory',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'inventory',
        qs: {
            id: params['Id']
        }
    }, function (err, data) {
        if (err) return callback(err);

        var InventoryConfiguration = data['InventoryConfiguration'];
        if (InventoryConfiguration && InventoryConfiguration.OptionalFields && InventoryConfiguration.OptionalFields.Field) {
            var Field = InventoryConfiguration.OptionalFields.Field;
            if (!util.isArray(Field)) {
                Field = [Field];
            }
            InventoryConfiguration.OptionalFields = Field;
        }
        if (InventoryConfiguration.Destination
            && InventoryConfiguration.Destination.COSBucketDestination
            && InventoryConfiguration.Destination.COSBucketDestination.Encryption
        ) {
            var Encryption = InventoryConfiguration.Destination.COSBucketDestination.Encryption;
            if (Object.keys(Encryption).indexOf('SSE-COS') > -1) {
                Encryption['SSECOS'] = Encryption['SSE-COS'];
                delete Encryption['SSE-COS'];
            }
        }

        callback(null, {
            InventoryConfiguration: InventoryConfiguration,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Bucket 的清单任务信息
 * @param  {Object}  params                             参数对象，必须
 *     @param  {String}  params.Bucket                  Bucket名称，必须
 *     @param  {String}  params.Region                  地域名称，必须
 *     @param  {String}  params.ContinuationToken       当 COS 响应体中 IsTruncated 为 true，且 NextContinuationToken 节点中存在参数值时，您可以将这个参数作为 continuation-token 参数值，以获取下一页的清单任务信息，非必须
 * @param  {Function}  callback                         回调函数，必须
 * @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                              返回数据
 */
function listBucketInventory(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:ListBucketInventory',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'inventory',
        qs: {
            'continuation-token': params['ContinuationToken']
        }
    }, function (err, data) {
        if (err) return callback(err);
        var ListInventoryConfigurationResult = data['ListInventoryConfigurationResult'];
        var InventoryConfigurations = ListInventoryConfigurationResult.InventoryConfiguration || [];
        InventoryConfigurations = util.isArray(InventoryConfigurations) ? InventoryConfigurations : [InventoryConfigurations];
        delete ListInventoryConfigurationResult['InventoryConfiguration'];
        util.each(InventoryConfigurations, function (InventoryConfiguration) {
            if (InventoryConfiguration && InventoryConfiguration.OptionalFields && InventoryConfiguration.OptionalFields.Field) {
                var Field = InventoryConfiguration.OptionalFields.Field;
                if (!util.isArray(Field)) {
                    Field = [Field];
                }
                InventoryConfiguration.OptionalFields = Field;
            }

            if (InventoryConfiguration.Destination
                && InventoryConfiguration.Destination.COSBucketDestination
                && InventoryConfiguration.Destination.COSBucketDestination.Encryption
            ) {
                var Encryption = InventoryConfiguration.Destination.COSBucketDestination.Encryption;
                if (Object.keys(Encryption).indexOf('SSE-COS') > -1) {
                    Encryption['SSECOS'] = Encryption['SSE-COS'];
                    delete Encryption['SSE-COS'];
                }
            }
        });
        ListInventoryConfigurationResult.InventoryConfigurations = InventoryConfigurations;
        util.extend(ListInventoryConfigurationResult, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, ListInventoryConfigurationResult);
    });
}

/**
 * 删除 Bucket 的清单任务
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 *     @param  {String}  params.Id      清单任务的名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回数据
 */
function deleteBucketInventory(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketInventory',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'inventory',
        qs: {
            id: params['Id']
        }
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/* 全球加速 */
function putBucketAccelerate(params, callback) {

    if (!params['AccelerateConfiguration']) {
        callback(util.error(new Error('missing param AccelerateConfiguration')));
        return;
    }

    var configuration = { AccelerateConfiguration: params.AccelerateConfiguration || {} };

    var xml = util.json2xml(configuration);

    var headers = {};
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Interface: 'putBucketAccelerate',
        Action: 'name/cos:PutBucketAccelerate',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'accelerate',
        headers: headers,
    }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

function getBucketAccelerate(params, callback) {
    submitRequest.call(this, {
        Interface: 'getBucketAccelerate',
        Action: 'name/cos:GetBucketAccelerate',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        action: 'accelerate',
    }, function (err, data) {
        if (!err) {
            !data.AccelerateConfiguration && (data.AccelerateConfiguration = {});
        }
        callback(err, data);
    });
}

// Object 相关

/**
 * 取回对应Object的元数据，Head的权限与Get的权限一致
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 *     @param  {String}  params.Key                 文件名称，必须
 *     @param  {String}  params.IfModifiedSince     当Object在指定时间后被修改，则返回对应Object元信息，否则返回304，非必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          为指定 object 的元数据，如果设置了 IfModifiedSince ，且文件未修改，则返回一个对象，NotModified 属性为 true
 *     @return  {Boolean}  data.NotModified         是否在 IfModifiedSince 时间点之后未修改该 object，则为 true
 */
function headObject(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:HeadObject',
        method: 'HEAD',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        headers: params.Headers,
    }, function (err, data) {
        if (err) {
            var statusCode = err.statusCode;
            if (params.Headers['If-Modified-Since'] && statusCode && statusCode === 304) {
                return callback(null, {
                    NotModified: true,
                    statusCode: statusCode,
                });
            }
            return callback(err);
        }
        if (data.headers && data.headers.etag) {
            data.ETag = data.headers && data.headers.etag;
        }
        callback(null, data);
    });
}


function listObjectVersions(params, callback) {
    var reqParams = {};
    reqParams['prefix'] = params['Prefix'] || '';
    reqParams['delimiter'] = params['Delimiter'];
    reqParams['key-marker'] = params['KeyMarker'];
    reqParams['version-id-marker'] = params['VersionIdMarker'];
    reqParams['max-keys'] = params['MaxKeys'];
    reqParams['encoding-type'] = params['EncodingType'];

    submitRequest.call(this, {
        Action: 'name/cos:GetBucketObjectVersions',
        ResourceKey: reqParams['prefix'],
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        qs: reqParams,
        action: 'versions',
    }, function (err, data) {
        if (err) return callback(err);
        var ListVersionsResult = data.ListVersionsResult || {};
        var DeleteMarkers = ListVersionsResult.DeleteMarker || [];
        DeleteMarkers = util.isArray(DeleteMarkers) ? DeleteMarkers : [DeleteMarkers];
        var Versions = ListVersionsResult.Version || [];
        Versions = util.isArray(Versions) ? Versions : [Versions];

        var result = util.clone(ListVersionsResult);
        delete result.DeleteMarker;
        delete result.Version;
        util.extend(result, {
            DeleteMarkers: DeleteMarkers,
            Versions: Versions,
            statusCode: data.statusCode,
            headers: data.headers,
        });

        callback(null, result);
    });
}

/**
 * 下载 object
 * @param  {Object}  params                                 参数对象，必须
 *     @param  {String}  params.Bucket                      Bucket名称，必须
 *     @param  {String}  params.Region                      地域名称，必须
 *     @param  {String}  params.Key                         文件名称，必须
 *     @param  {WriteStream}  params.Output                 文件写入流，非必须
 *     @param  {String}  params.IfModifiedSince             当Object在指定时间后被修改，则返回对应Object元信息，否则返回304，非必须
 *     @param  {String}  params.IfUnmodifiedSince           如果文件修改时间早于或等于指定时间，才返回文件内容。否则返回 412 (precondition failed)，非必须
 *     @param  {String}  params.IfMatch                     当 ETag 与指定的内容一致，才返回文件。否则返回 412 (precondition failed)，非必须
 *     @param  {String}  params.IfNoneMatch                 当 ETag 与指定的内容不一致，才返回文件。否则返回304 (not modified)，非必须
 *     @param  {String}  params.ResponseContentType         设置返回头部中的 Content-Type 参数，非必须
 *     @param  {String}  params.ResponseContentLanguage     设置返回头部中的 Content-Language 参数，非必须
 *     @param  {String}  params.ResponseExpires             设置返回头部中的 Content-Expires 参数，非必须
 *     @param  {String}  params.ResponseCacheControl        设置返回头部中的 Cache-Control 参数，非必须
 *     @param  {String}  params.ResponseContentDisposition  设置返回头部中的 Content-Disposition 参数，非必须
 *     @param  {String}  params.ResponseContentEncoding     设置返回头部中的 Content-Encoding 参数，非必须
 * @param  {Function}  callback                             回调函数，必须
 * @param  {Object}  err                                    请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @param  {Object}  data                                   为对应的 object 数据，包括 body 和 headers
 */
function getObject(params, callback) {
    var reqParams = params.Query || {};

    reqParams['response-content-type'] = params['ResponseContentType'];
    reqParams['response-content-language'] = params['ResponseContentLanguage'];
    reqParams['response-expires'] = params['ResponseExpires'];
    reqParams['response-cache-control'] = params['ResponseCacheControl'];
    reqParams['response-content-disposition'] = params['ResponseContentDisposition'];
    reqParams['response-content-encoding'] = params['ResponseContentEncoding'];

    var BodyType;

    var self = this;
    var outputStream = params.Output;
    if (params.ReturnStream) {
        outputStream = new Stream.PassThrough();
        BodyType = 'stream';
    } else if (outputStream && typeof outputStream === 'string') {
        outputStream = fs.createWriteStream(outputStream);
        BodyType = 'stream';
    } else if (outputStream && typeof outputStream.pipe === 'function') {
        BodyType = 'stream';
    } else {
        BodyType = 'buffer';
    }

    var onProgress = params.onProgress;
    var onDownloadProgress = (function () {
        var time0 = Date.now();
        var size0 = 0;
        var FinishSize = 0;
        var FileSize = 0;
        var progressTimer;
        var update = function () {
            progressTimer = 0;
            if (onProgress && (typeof onProgress === 'function')) {
                var time1 = Date.now();
                var speed = parseInt((FinishSize - size0) / ((time1 - time0) / 1000) * 100) / 100 || 0;
                var percent = parseInt(FinishSize / FileSize * 100) / 100 || 0;
                time0 = time1;
                size0 = FinishSize;
                try {
                    onProgress({
                        loaded: FinishSize,
                        total: FileSize,
                        speed: speed,
                        percent: percent
                    });
                } catch (e) {
                }
            }
        };
        return function (info, immediately) {
            if (info && info.loaded) {
                FinishSize = info.loaded;
                FileSize = info.total;
            }
            if (immediately) {
                clearTimeout(progressTimer);
                update();
            } else {
                if (progressTimer) return;
                progressTimer = setTimeout(update, self.options.ProgressInterval || 1000);
            }
        };
    })();

    // 如果用户自己传入了 output
    submitRequest.call(this, {
        Action: 'name/cos:GetObject',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        headers: params.Headers,
        qs: reqParams,
        rawBody: true,
        outputStream: outputStream,
        onDownloadProgress: onDownloadProgress,
    }, function (err, data) {
        onDownloadProgress(null, true);
        if (err) {
            var statusCode = err.statusCode;
            if (params.Headers['If-Modified-Since'] && statusCode && statusCode === 304) {
                return callback(null, {NotModified: true});
            }
            if (outputStream) outputStream.emit('error', err);
            return callback(err);
        }
        var result = {};
        if (data.body) {
            if (BodyType === 'buffer') {
                result.Body = Buffer.from(data.body);
            } else if (BodyType === 'string') {
                result.Body = data.body;
            }
        }
        if (data.headers && data.headers.etag) {
            result.ETag = data.headers && data.headers.etag;
        }
        util.extend(result, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
    if (params.ReturnStream) return outputStream;
}

function getObjectStream(params, callback) {
    params.ReturnStream = true;
    return getObject.call(this, params, callback);
}

/**
 * 上传 object
 * @param  {Object} params                                          参数对象，必须
 *     @param  {String}  params.Bucket                              Bucket名称，必须
 *     @param  {String}  params.Region                              地域名称，必须
 *     @param  {String}  params.Key                                 文件名称，必须
 *     @param  {Buffer || ReadStream || String}  params.Body        上传文件的内容或流或字符串
 *     @param  {String}  params.CacheControl                        RFC 2616 中定义的缓存策略，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ContentDisposition                  RFC 2616 中定义的文件名称，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ContentEncoding                     RFC 2616 中定义的编码格式，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ContentLength                       RFC 2616 中定义的 HTTP 请求内容长度（字节），必须
 *     @param  {String}  params.ContentType                         RFC 2616 中定义的内容类型（MIME），将作为 Object 元数据保存，非必须
 *     @param  {String}  params.Expect                              当使用 Expect: 100-continue 时，在收到服务端确认后，才会发送请求内容，非必须
 *     @param  {String}  params.Expires                             RFC 2616 中定义的过期时间，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ACL                                 允许用户自定义文件权限，有效值：private | public-read，非必须
 *     @param  {String}  params.GrantRead                           赋予被授权者读取对象的权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
 *     @param  {String}  params.GrantReadAcp                        赋予被授权者读取对象的访问控制列表（ACL）的权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
 *     @param  {String}  params.GrantWriteAcp                       赋予被授权者写入对象的访问控制列表（ACL）的权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
 *     @param  {String}  params.GrantFullControl                    赋予被授权者操作对象的所有权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
 *     @param  {String}  params.StorageClass                        设置对象的存储级别，枚举值：STANDARD、STANDARD_IA、ARCHIVE，默认值：STANDARD，非必须
 *     @param  {String}  params.x-cos-meta-*                        允许用户自定义的头部信息，将作为对象的元数据保存。大小限制2KB，非必须
 *     @param  {String}  params.ContentSha1                         RFC 3174 中定义的 160-bit 内容 SHA-1 算法校验，非必须
 *     @param  {String}  params.ServerSideEncryption                支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
 *     @param  {Function}  params.onProgress                        上传进度回调函数
 * @param  {Function}  callback                                     回调函数，必须
 * @return  {Object}  err                                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                          为对应的 object 数据
 *     @return  {String}  data.ETag                                 为对应上传文件的 ETag 值
 */
function putObject(params, callback) {
    var self = this;
    var FileSize = params.ContentLength;
    var onProgress = util.throttleOnProgress.call(self, FileSize, params.onProgress);

    // 特殊处理 Cache-Control
    var headers = params.Headers;
    if (!headers['Cache-Control'] && !headers['cache-control']) headers['Cache-Control'] = '';

    util.getBodyMd5(self.options.UploadCheckContentMd5, params.Body, function (md5) {
        if (md5) (params.Headers['Content-MD5'] = util.binaryBase64(md5));
        if (params.ContentLength !== undefined) {
            params.Headers['Content-Length'] = params.ContentLength;
        }
        onProgress(null, true); // 任务状态开始 uploading
        submitRequest.call(self, {
            Action: 'name/cos:PutObject',
            TaskId: params.TaskId,
            method: 'PUT',
            Bucket: params.Bucket,
            Region: params.Region,
            Key: params.Key,
            headers: params.Headers,
            qs: params.Query,
            body: params.Body,
            onProgress: onProgress,
        }, function (err, data) {
            if (err) {
                onProgress(null, true);
                return callback(err);
            }
            onProgress({loaded: FileSize, total: FileSize}, true);
            if (data) {
                var url = getUrl({
                    ForcePathStyle: self.options.ForcePathStyle,
                    protocol: self.options.Protocol,
                    domain: self.options.Domain,
                    bucket: params.Bucket,
                    region: params.Region,
                    object: params.Key,
                });
                url = url.substr(url.indexOf('://') + 3);
                data.Location = url;
                if (data.headers && data.headers.etag) data.ETag = data.headers.etag;
                return callback(null, data);
            }
            callback(null, data);
        });
    });
}

/**
 * 删除 object
 * @param  {Object}  params                     参数对象，必须
 *     @param  {String}  params.Bucket          Bucket名称，必须
 *     @param  {String}  params.Region          地域名称，必须
 *     @param  {String}  params.Key             object名称，必须
 * @param  {Function}  callback                 回调函数，必须
 * @param  {Object}  err                        请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @param  {Object}  data                       删除操作成功之后返回的数据
 */
function deleteObject(params, callback) {
    submitRequest.call(this, {
        Action: 'name/cos:DeleteObject',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        VersionId: params.VersionId,
    }, function (err, data) {
        if (err) {
            var statusCode = err.statusCode;
            if (statusCode && statusCode === 204) {
                return callback(null, {statusCode: statusCode});
            } else if (statusCode && statusCode === 404) {
                return callback(null, {BucketNotFound: true, statusCode: statusCode,});
            } else {
                return callback(err);
            }
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 object 的 权限列表
 * @param  {Object}  params                         参数对象，必须
 *     @param  {String}  params.Bucket              Bucket名称，必须
 *     @param  {String}  params.Region              地域名称，必须
 *     @param  {String}  params.Key                 object名称，必须
 * @param  {Function}  callback                     回调函数，必须
 * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                          返回的数据
 *     @return  {Object}  data.AccessControlPolicy  权限列表
 */
function getObjectAcl(params, callback) {

    submitRequest.call(this, {
        Action: 'name/cos:GetObjectACL',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'acl',
    }, function (err, data) {
        if (err) return callback(err);
        var AccessControlPolicy = data.AccessControlPolicy || {};
        var Owner = AccessControlPolicy.Owner || {};
        var Grant = AccessControlPolicy.AccessControlList && AccessControlPolicy.AccessControlList.Grant || [];
        Grant = util.isArray(Grant) ? Grant : [Grant];
        var result = decodeAcl(AccessControlPolicy);
        delete result.GrantWrite;
        if (data.headers && data.headers['x-cos-acl']) {
            result.ACL = data.headers['x-cos-acl'];
        }
        result = util.extend(result, {
            Owner: Owner,
            Grants: Grant,
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

/**
 * 设置 object 的 权限列表
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 *     @param  {String}  params.Key     object名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回的数据
 */
function putObjectAcl(params, callback) {
    var headers = params.Headers;

    var xml = '';
    if (params['AccessControlPolicy']) {
        var AccessControlPolicy = util.clone(params['AccessControlPolicy'] || {});
        var Grants = AccessControlPolicy.Grants || AccessControlPolicy.Grant;
        Grants = util.isArray(Grants) ? Grants : [Grants];
        delete AccessControlPolicy.Grant;
        delete AccessControlPolicy.Grants;
        AccessControlPolicy.AccessControlList = {Grant: Grants};
        xml = util.json2xml({AccessControlPolicy: AccessControlPolicy});

        headers['Content-Type'] = 'application/xml';
        headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
    }

    // Grant Header 去重
    util.each(headers, function (val, key) {
        if (key.indexOf('x-cos-grant-') === 0) {
            headers[key] = uniqGrant(headers[key]);
        }
    });

    submitRequest.call(this, {
        Action: 'name/cos:PutObjectACL',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        action: 'acl',
        headers: headers,
        body: xml,
    }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * Options Object请求实现跨域访问的预请求。即发出一个 OPTIONS 请求给服务器以确认是否可以进行跨域操作。
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 *     @param  {String}  params.Key     object名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data              返回的数据
 */
function optionsObject(params, callback) {

    var headers = params.Headers;
    headers['Origin'] = params['Origin'];
    headers['Access-Control-Request-Method'] = params['AccessControlRequestMethod'];
    headers['Access-Control-Request-Headers'] = params['AccessControlRequestHeaders'];

    submitRequest.call(this, {
        Action: 'name/cos:OptionsObject',
        method: 'OPTIONS',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: headers,
    }, function (err, data) {
        if (err) {
            if (err.statusCode && err.statusCode === 403) {
                return callback(null, {
                    OptionsForbidden: true,
                    statusCode: err.statusCode
                });
            }
            return callback(err);
        }

        var headers = data.headers || {};
        callback(null, {
            AccessControlAllowOrigin: headers['access-control-allow-origin'],
            AccessControlAllowMethods: headers['access-control-allow-methods'],
            AccessControlAllowHeaders: headers['access-control-allow-headers'],
            AccessControlExposeHeaders: headers['access-control-expose-headers'],
            AccessControlMaxAge: headers['access-control-max-age'],
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * @param  {Object}                                     参数列表
 *     @param  {String}  Bucket                         Bucket 名称
 *     @param  {String}  Region                         地域名称
 *     @param  {String}  Key                            文件名称
 *     @param  {String}  CopySource                     源文件URL绝对路径，可以通过versionid子资源指定历史版本
 *     @param  {String}  ACL                            允许用户自定义文件权限。有效值：private，public-read默认值：private。
 *     @param  {String}  GrantRead                      赋予被授权者读的权限，格式 x-cos-grant-read: uin=" ",uin=" "，当需要给子账户授权时，uin="RootAcountID/SubAccountID"，当需要给根账户授权时，uin="RootAcountID"。
 *     @param  {String}  GrantWrite                     赋予被授权者写的权限，格式 x-cos-grant-write: uin=" ",uin=" "，当需要给子账户授权时，uin="RootAcountID/SubAccountID"，当需要给根账户授权时，uin="RootAcountID"。
 *     @param  {String}  GrantFullControl               赋予被授权者读写权限，格式 x-cos-grant-full-control: uin=" ",uin=" "，当需要给子账户授权时，uin="RootAcountID/SubAccountID"，当需要给根账户授权时，uin="RootAcountID"。
 *     @param  {String}  MetadataDirective              是否拷贝元数据，枚举值：Copy, Replaced，默认值Copy。假如标记为Copy，忽略Header中的用户元数据信息直接复制；假如标记为Replaced，按Header信息修改元数据。当目标路径和原路径一致，即用户试图修改元数据时，必须为Replaced
 *     @param  {String}  CopySourceIfModifiedSince      当Object在指定时间后被修改，则执行操作，否则返回412。可与x-cos-copy-source-If-None-Match一起使用，与其他条件联合使用返回冲突。
 *     @param  {String}  CopySourceIfUnmodifiedSince    当Object在指定时间后未被修改，则执行操作，否则返回412。可与x-cos-copy-source-If-Match一起使用，与其他条件联合使用返回冲突。
 *     @param  {String}  CopySourceIfMatch              当Object的Etag和给定一致时，则执行操作，否则返回412。可与x-cos-copy-source-If-Unmodified-Since一起使用，与其他条件联合使用返回冲突。
 *     @param  {String}  CopySourceIfNoneMatch          当Object的Etag和给定不一致时，则执行操作，否则返回412。可与x-cos-copy-source-If-Modified-Since一起使用，与其他条件联合使用返回冲突。
 *     @param  {String}  StorageClass                   存储级别，枚举值：存储级别，枚举值：Standard, Standard_IA，Archive；默认值：Standard
 *     @param  {String}  CacheControl                   指定所有缓存机制在整个请求/响应链中必须服从的指令。
 *     @param  {String}  ContentDisposition             MIME 协议的扩展，MIME 协议指示 MIME 用户代理如何显示附加的文件
 *     @param  {String}  ContentEncoding                HTTP 中用来对「采用何种编码格式传输正文」进行协定的一对头部字段
 *     @param  {String}  ContentLength                  设置响应消息的实体内容的大小，单位为字节
 *     @param  {String}  ContentType                    RFC 2616 中定义的 HTTP 请求内容类型（MIME），例如text/plain
 *     @param  {String}  Expect                         请求的特定的服务器行为
 *     @param  {String}  Expires                        响应过期的日期和时间
 *     @param  {String}  params.ServerSideEncryption   支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
 *     @param  {String}  ContentLanguage                指定内容语言
 *     @param  {String}  x-cos-meta-*                   允许用户自定义的头部信息，将作为 Object 元数据返回。大小限制2K。
 */
function putObjectCopy(params, callback) {

    // 特殊处理 Cache-Control
    var headers = params.Headers;
    if (!headers['Cache-Control'] && !headers['cache-control']) headers['Cache-Control'] = '';

    var CopySource = params.CopySource || '';
    var m = CopySource.match(/^([^.]+-\d+)\.cos(v6)?\.([^.]+)\.[^/]+\/(.+)$/);
    if (!m) {
        callback(util.error(new Error('CopySource format error')));
        return;
    }

    var SourceBucket = m[1];
    var SourceRegion = m[3];
    var SourceKey = decodeURIComponent(m[4]);

    submitRequest.call(this, {
        Scope: [{
            action: 'name/cos:GetObject',
            bucket: SourceBucket,
            region: SourceRegion,
            prefix: SourceKey,
        }, {
            action: 'name/cos:PutObject',
            bucket: params.Bucket,
            region: params.Region,
            prefix: params.Key,
        }],
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        headers: params.Headers,
    }, function (err, data) {
        if (err) return callback(err);
        var result = util.clone(data.CopyObjectResult || {});
        util.extend(result, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

function uploadPartCopy(params, callback) {

    var CopySource = params.CopySource || '';
    var m = CopySource.match(/^([^.]+-\d+)\.cos(v6)?\.([^.]+)\.[^/]+\/(.+)$/);
    if (!m) {
        callback(util.error(new Error('CopySource format error')));
        return;
    }

    var SourceBucket = m[1];
    var SourceRegion = m[3];
    var SourceKey = decodeURIComponent(m[4]);

    submitRequest.call(this, {
        Scope: [{
            action: 'name/cos:GetObject',
            bucket: SourceBucket,
            region: SourceRegion,
            prefix: SourceKey,
        }, {
            action: 'name/cos:PutObject',
            bucket: params.Bucket,
            region: params.Region,
            prefix: params.Key,
        }],
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        qs: {
            partNumber: params['PartNumber'],
            uploadId: params['UploadId'],
        },
        headers: params.Headers,
    }, function (err, data) {
        if (err) return callback(err);
        var result = util.clone(data.CopyPartResult || {});
        util.extend(result, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

function deleteMultipleObject(params, callback) {
    var Objects = params.Objects || [];
    var Quiet = params.Quiet;
    Objects = util.isArray(Objects) ? Objects : [Objects];

    var xml = util.json2xml({Delete: {Object: Objects, Quiet: Quiet || false}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    var Scope = util.map(Objects, function (v) {
        return {
            action: 'name/cos:DeleteObject',
            bucket: params.Bucket,
            region: params.Region,
            prefix: v.Key,
        };
    });

    submitRequest.call(this, {
        Scope: Scope,
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'delete',
        headers: headers,
    }, function (err, data) {
        if (err) return callback(err);
        var DeleteResult = data.DeleteResult || {};
        var Deleted = DeleteResult.Deleted || [];
        var Errors = DeleteResult.Error || [];

        Deleted = util.isArray(Deleted) ? Deleted : [Deleted];
        Errors = util.isArray(Errors) ? Errors : [Errors];

        var result = util.clone(DeleteResult);
        util.extend(result, {
            Error: Errors,
            Deleted: Deleted,
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

function restoreObject(params, callback) {
    var headers = params.Headers;
    if (!params['RestoreRequest']) {
        callback(util.error(new Error('missing param RestoreRequest')));
        return;
    }

    var RestoreRequest = params.RestoreRequest || {};
    var xml = util.json2xml({RestoreRequest: RestoreRequest});

    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:RestoreObject',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        body: xml,
        action: 'restore',
        headers: headers,
    }, callback);
}

/**
 * 设置 Object 的标签
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Object名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 *     @param  {Array}   params.TagSet  标签设置，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
 * @return  {Object}  data              返回数据
 */
function putObjectTagging(params, callback) {

    var Tagging = params['Tagging'] || {};
    var Tags = Tagging.TagSet || Tagging.Tags || params['Tags'] || [];
    Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
    var xml = util.json2xml({Tagging: {TagSet: {Tag: Tags}}});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Interface: 'putObjectTagging',
        Action: 'name/cos:PutObjectTagging',
        method: 'PUT',
        Bucket: params.Bucket,
        Key: params.Key,
        Region: params.Region,
        body: xml,
        action: 'tagging',
        headers: headers,
        VersionId: params.VersionId,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取 Object 的标签设置
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Bucket名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
 * @return  {Object}  data              返回数据
 */
function getObjectTagging(params, callback) {

    submitRequest.call(this, {
        Interface: 'getObjectTagging',
        Action: 'name/cos:GetObjectTagging',
        method: 'GET',
        Key: params.Key,
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'tagging',
        VersionId: params.VersionId,
    }, function (err, data) {
        if (err) {
            if (err.statusCode === 404 && err.error && (err.error === "Not Found" || err.error.Code === 'NoSuchTagSet')) {
                var result = {
                    Tags: [],
                    statusCode: err.statusCode,
                };
                err.headers && (result.headers = err.headers);
                callback(null, result);
            } else {
                callback(err);
            }
            return;
        }
        var Tags = [];
        try {
            Tags = data.Tagging.TagSet.Tag || [];
        } catch (e) {
        }
        Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
        callback(null, {
            Tags: Tags,
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 删除 Object 的 标签设置
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Bucket  Object名称，必须
 *     @param  {String}  params.Region  地域名称，必须
 * @param  {Function}  callback         回调函数，必须
 * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
 * @return  {Object}  data              返回的数据
 */
function deleteObjectTagging(params, callback) {
    submitRequest.call(this, {
        Interface: 'deleteObjectTagging',
        Action: 'name/cos:DeleteObjectTagging',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'tagging',
        VersionId: params.VersionId,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            return callback(err);
        }
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 使用 SQL 语句从指定对象（CSV 格式或者 JSON 格式）中检索内容
 * @param  {Object}  params                   参数对象，必须
 *     @param  {String}  params.Bucket        Object名称，必须
 *     @param  {String}  params.Region        地域名称，必须
 *     @param  {Object}  params.SelectRequest 地域名称，必须
 * @param  {Function}  callback               回调函数，必须
 * @return  {Object}  err                     请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
 * @return  {Object}  data                    返回的数据
 */
function selectObjectContent(params, callback) {
    var SelectType = params['SelectType'];
    if (!SelectType) return callback(util.error(new Error('missing param SelectType')));

    var SelectRequest = params['SelectRequest'] || {};
    var xml = util.json2xml({SelectRequest: SelectRequest});

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    var outputStream;
    var selectResult = {};
    var SelectStream = require('./select-stream');
    if (params.ReturnStream && params.DataType === 'raw') { // 流 && raw 直接原样数据吐回
        outputStream = new Stream.PassThrough();
    } else { // 包含 params.ReturnStream || !params.ReturnStream
        outputStream = new SelectStream();
        outputStream.on('message:progress', function (progress) {
            if (typeof params.onProgress === 'function') params.onProgress(progress);
        });
        outputStream.on('message:stats', function (stats) {
            selectResult.stats = stats;
        });
        outputStream.on('message:error', function (error) {
            selectResult.error = error;
        });
    }
    submitRequest.call(this, {
        Interface: 'selectObjectContent',
        Action: 'name/cos:GetObject',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'select',
        qs: {
            'select-type': params['SelectType'],
        },
        VersionId: params.VersionId,
        body: xml,
        rawBody: true,
        outputStream: outputStream,
    }, function (err, data) {
        if (err && err.statusCode === 204) {
            return callback(null, {statusCode: err.statusCode});
        } else if (err) {
            if (outputStream) outputStream.emit('error', err);
            return callback(err);
        } else if (selectResult.error) {
            return callback(util.extend(selectResult.error, {
                statusCode: data.statusCode,
                headers: data.headers,
            }));
        }
        var result = {
            statusCode: data.statusCode,
            headers: data.headers,
        };
        // 只要流里有解析出 stats，就返回 Stats
        if (selectResult.stats) result.Stats = selectResult.stats;
        // 只要有 records，就返回 Payload
        if (selectResult.records) result.Payload = Buffer.concat(selectResult.records);
        callback(null, result);
    });
    if (!params.ReturnStream && params.DataType !== 'raw') {
        selectResult.records = [];
        outputStream.pipe(new Stream.Writable({
            write: function (chunk, encoding, callback) {
                selectResult.records.push(chunk);
                callback();
            },
            writev: function (chunks, encoding, callback) {
                chunks.forEach(function (item) {
                    selectResult.records.push(chunks);
                });
                callback();
            },
        }));
        outputStream.pipe(outputStream);
    }
    if (params.ReturnStream) return outputStream;
}

/**
 * 使用 SQL 语句从指定对象（CSV 格式或者 JSON 格式）中检索内容
 * @param  {Object}  params                   参数对象，必须
 *     @param  {String}  params.Bucket        Object名称，必须
 *     @param  {String}  params.Region        地域名称，必须
 *     @param  {Object}  params.SelectRequest 地域名称，必须
 * @param  {Function}  callback               回调函数，必须
 * @return  {Object}  err                     请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
 * @return  {Object}  data                    返回的数据
 * @return  {Object}  Stream                  返回值
 */
function selectObjectContentStream(params, callback) {
    params.ReturnStream = true;
    return selectObjectContent.call(this, params, callback);
}


// 分块上传


/**
 * 初始化分块上传
 * @param  {Object}  params                                     参数对象，必须
 *     @param  {String}  params.Bucket                          Bucket名称，必须
 *     @param  {String}  params.Region                          地域名称，必须
 *     @param  {String}  params.Key                             object名称，必须
 *     @param  {String}  params.UploadId                        object名称，必须
 *     @param  {String}  params.CacheControl                    RFC 2616 中定义的缓存策略，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ContentDisposition              RFC 2616 中定义的文件名称，将作为 Object 元数据保存    ，非必须
 *     @param  {String}  params.ContentEncoding                 RFC 2616 中定义的编码格式，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ContentType                     RFC 2616 中定义的内容类型（MIME），将作为 Object 元数据保存，非必须
 *     @param  {String}  params.Expires                         RFC 2616 中定义的过期时间，将作为 Object 元数据保存，非必须
 *     @param  {String}  params.ACL                             允许用户自定义文件权限，非必须
 *     @param  {String}  params.GrantRead                       赋予被授权者读的权限 ，非必须
 *     @param  {String}  params.GrantWrite                      赋予被授权者写的权限 ，非必须
 *     @param  {String}  params.GrantFullControl                赋予被授权者读写权限 ，非必须
 *     @param  {String}  params.StorageClass                    设置Object的存储级别，枚举值：Standard，Standard_IA，Archive，非必须
 *     @param  {String}  params.ServerSideEncryption           支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
 * @param  {Function}  callback                                 回调函数，必须
 * @return  {Object}  err                                       请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                      返回的数据
 */
function multipartInit(params, callback) {

    // 特殊处理 Cache-Control
    var headers = params.Headers;
    if (!headers['Cache-Control'] && !headers['cache-control']) headers['Cache-Control'] = '';

    submitRequest.call(this, {
        Action: 'name/cos:InitiateMultipartUpload',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        action: 'uploads',
        headers: params.Headers,
        qs: params.Query,
    }, function (err, data) {
        if (err) return callback(err);
        data = util.clone(data || {});
        if (data && data.InitiateMultipartUploadResult) {
            return callback(null, util.extend(data.InitiateMultipartUploadResult, {
                statusCode: data.statusCode,
                headers: data.headers,
            }));
        }
        callback(null, data);
    });
}

/**
 * 分块上传
 * @param  {Object}  params                                 参数对象，必须
 *     @param  {String}  params.Bucket                      Bucket名称，必须
 *     @param  {String}  params.Region                      地域名称，必须
 *     @param  {String}  params.Key                         object名称，必须
 *     @param  {Buffer || Stream || String}  params.Body    上传文件对象或字符串
 *     @param  {String} params.ContentLength                RFC 2616 中定义的 HTTP 请求内容长度（字节），非必须
 *     @param  {String} params.Expect                       当使用 Expect: 100-continue 时，在收到服务端确认后，才会发送请求内容，非必须
 *     @param  {String} params.ServerSideEncryption         支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
 *     @param  {String} params.ContentSha1                  RFC 3174 中定义的 160-bit 内容 SHA-1 算法校验值，非必须
 * @param  {Function}  callback                             回调函数，必须
 *     @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 *     @return  {Object}  data                              返回的数据
 *     @return  {Object}  data.ETag                         返回的文件分块 sha1 值
 */
function multipartUpload(params, callback) {

    var self = this;
    util.getFileSize('multipartUpload', params, function () {
        util.getBodyMd5(self.options.UploadCheckContentMd5, params.Body, function (md5) {
            if (md5) params.Headers['Content-MD5'] = util.binaryBase64(md5);
            submitRequest.call(self, {
                Action: 'name/cos:UploadPart',
                TaskId: params.TaskId,
                method: 'PUT',
                Bucket: params.Bucket,
                Region: params.Region,
                Key: params.Key,
                qs: {
                    partNumber: params['PartNumber'],
                    uploadId: params['UploadId'],
                },
                headers: params.Headers,
                onProgress: params.onProgress,
                body: params.Body || null
            }, function (err, data) {
                if (err) {
                    return callback(err);
                }
                data['headers'] = data['headers'] || {};
                callback(null, {
                    ETag: data['headers']['etag'] || '',
                    statusCode: data.statusCode,
                    headers: data.headers,
                });
            });
        });
    });

}

/**
 * 完成分块上传
 * @param  {Object}  params                             参数对象，必须
 *     @param  {String}  params.Bucket                  Bucket名称，必须
 *     @param  {String}  params.Region                  地域名称，必须
 *     @param  {String}  params.Key                     object名称，必须
 *     @param  {Array}   params.Parts                   分块信息列表，必须
 *     @param  {String}  params.Parts[i].PartNumber     块编号，必须
 *     @param  {String}  params.Parts[i].ETag           分块的 sha1 校验值
 * @param  {Function}  callback                         回调函数，必须
 * @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                              返回的数据
 *     @return  {Object}  data.CompleteMultipartUpload  完成分块上传后的文件信息，包括Location, Bucket, Key 和 ETag
 */
function multipartComplete(params, callback) {
    var self = this;

    var UploadId = params.UploadId;

    var Parts = params['Parts'];

    for (var i = 0, len = Parts.length; i < len; i++) {
        if (Parts[i]['ETag'].indexOf('"') === 0) {
            continue;
        }
        Parts[i]['ETag'] = '"' + Parts[i]['ETag'] + '"';
    }

    var xml = util.json2xml({CompleteMultipartUpload: {Part: Parts}});
    // CSP/ceph CompleteMultipartUpload 接口 body 写死了限制 1MB，这里醉倒 10000 片时，xml 字符串去掉空格853KB
    xml = xml.replace(/\n\s*/g, '');

    var headers = params.Headers;
    headers['Content-Type'] = 'application/xml';
    headers['Content-MD5'] = util.binaryBase64(util.md5(xml));

    submitRequest.call(this, {
        Action: 'name/cos:CompleteMultipartUpload',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        qs: {
            uploadId: UploadId
        },
        body: xml,
        headers: headers,
    }, function (err, data) {
        if (err) return callback(err);
        var url = getUrl({
            ForcePathStyle: self.options.ForcePathStyle,
            protocol: self.options.Protocol,
            domain: self.options.Domain,
            bucket: params.Bucket,
            region: params.Region,
            object: params.Key,
            isLocation: true,
        });
        var CompleteMultipartUploadResult = data.CompleteMultipartUploadResult || {};
        var result = util.extend(CompleteMultipartUploadResult, {
            Location: url,
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

/**
 * 分块上传任务列表查询
 * @param  {Object}  params                                 参数对象，必须
 *     @param  {String}  params.Bucket                      Bucket名称，必须
 *     @param  {String}  params.Region                      地域名称，必须
 *     @param  {String}  params.Delimiter                   定界符为一个符号，如果有Prefix，则将Prefix到delimiter之间的相同路径归为一类，定义为Common Prefix，然后列出所有Common Prefix。如果没有Prefix，则从路径起点开始，非必须
 *     @param  {String}  params.EncodingType                规定返回值的编码方式，非必须
 *     @param  {String}  params.Prefix                      前缀匹配，用来规定返回的文件前缀地址，非必须
 *     @param  {String}  params.MaxUploads                  单次返回最大的条目数量，默认1000，非必须
 *     @param  {String}  params.KeyMarker                   与upload-id-marker一起使用 </Br>当upload-id-marker未被指定时，ObjectName字母顺序大于key-marker的条目将被列出 </Br>当upload-id-marker被指定时，ObjectName字母顺序大于key-marker的条目被列出，ObjectName字母顺序等于key-marker同时UploadId大于upload-id-marker的条目将被列出，非必须
 *     @param  {String}  params.UploadIdMarker              与key-marker一起使用 </Br>当key-marker未被指定时，upload-id-marker将被忽略 </Br>当key-marker被指定时，ObjectName字母顺序大于key-marker的条目被列出，ObjectName字母顺序等于key-marker同时UploadId大于upload-id-marker的条目将被列出，非必须
 * @param  {Function}  callback                             回调函数，必须
 * @return  {Object}  err                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                  返回的数据
 *     @return  {Object}  data.ListMultipartUploadsResult   分块上传任务信息
 */
function multipartList(params, callback) {
    var reqParams = {};

    reqParams['delimiter'] = params['Delimiter'];
    reqParams['encoding-type'] = params['EncodingType'];
    reqParams['prefix'] = params['Prefix'] || '';

    reqParams['max-uploads'] = params['MaxUploads'];

    reqParams['key-marker'] = params['KeyMarker'];
    reqParams['upload-id-marker'] = params['UploadIdMarker'];

    reqParams = util.clearKey(reqParams);

    submitRequest.call(this, {
        Action: 'name/cos:ListMultipartUploads',
        ResourceKey: reqParams['prefix'],
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        qs: reqParams,
        action: 'uploads',
    }, function (err, data) {
        if (err) return callback(err);

        if (data && data.ListMultipartUploadsResult) {
            var Upload = data.ListMultipartUploadsResult.Upload || [];
            Upload = util.isArray(Upload) ? Upload : [Upload];
            data.ListMultipartUploadsResult.Upload = Upload;
        }
        var result = util.clone(data.ListMultipartUploadsResult || {});
        util.extend(result, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

/**
 * 上传的分块列表查询
 * @param  {Object}  params                                 参数对象，必须
 *     @param  {String}  params.Bucket                      Bucket名称，必须
 *     @param  {String}  params.Region                      地域名称，必须
 *     @param  {String}  params.Key                         object名称，必须
 *     @param  {String}  params.UploadId                    标示本次分块上传的ID，必须
 *     @param  {String}  params.EncodingType                规定返回值的编码方式，非必须
 *     @param  {String}  params.MaxParts                    单次返回最大的条目数量，默认1000，非必须
 *     @param  {String}  params.PartNumberMarker            默认以UTF-8二进制顺序列出条目，所有列出条目从marker开始，非必须
 * @param  {Function}  callback                             回调函数，必须
 * @return  {Object}  err                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 * @return  {Object}  data                                  返回的数据
 *     @return  {Object}  data.ListMultipartUploadsResult   分块信息
 */
function multipartListPart(params, callback) {
    var reqParams = {};

    reqParams['uploadId'] = params['UploadId'];
    reqParams['encoding-type'] = params['EncodingType'];
    reqParams['max-parts'] = params['MaxParts'];
    reqParams['part-number-marker'] = params['PartNumberMarker'];

    submitRequest.call(this, {
        Action: 'name/cos:ListParts',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        qs: reqParams,
    }, function (err, data) {
        if (err) return callback(err);
        var ListPartsResult = data.ListPartsResult || {};
        var Part = ListPartsResult.Part || [];
        Part = util.isArray(Part) ? Part : [Part];

        ListPartsResult.Part = Part;
        var result = util.clone(ListPartsResult);
        util.extend(result, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
        callback(null, result);
    });
}

/**
 * 抛弃分块上传
 * @param  {Object}  params                 参数对象，必须
 *     @param  {String}  params.Bucket      Bucket名称，必须
 *     @param  {String}  params.Region      地域名称，必须
 *     @param  {String}  params.Key         object名称，必须
 *     @param  {String}  params.UploadId    标示本次分块上传的ID，必须
 * @param  {Function}  callback             回调函数，必须
 *     @return  {Object}    err             请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 *     @return  {Object}    data            返回的数据
 */
function multipartAbort(params, callback) {
    var reqParams = {};

    reqParams['uploadId'] = params['UploadId'];
    submitRequest.call(this, {
        Action: 'name/cos:AbortMultipartUpload',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        qs: reqParams,
    }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
            statusCode: data.statusCode,
            headers: data.headers,
        });
    });
}

/**
 * 获取签名
 * @param  {Object}  params             参数对象，必须
 *     @param  {String}  params.Method  请求方法，必须
 *     @param  {String}  params.Key     object名称，必须
 *     @param  {String}  params.Expires 名超时时间，单位秒，可选
 * @return  {String}  data              返回签名字符串
 */
function getAuth(params) {
    var self = this;
    return util.getAuth({
        SecretId: params.SecretId || this.options.SecretId || '',
        SecretKey: params.SecretKey || this.options.SecretKey || '',
        Method: params.Method,
        Key: params.Key,
        Query: params.Query,
        Headers: params.Headers,
        Expires: params.Expires,
        UseRawKey: self.options.UseRawKey,
        SystemClockOffset: self.options.SystemClockOffset,
    });
}

function getV4Auth(params) {
    return util.getV4Auth({
        SecretId: params.SecretId || this.options.SecretId || '',
        SecretKey: params.SecretKey || this.options.SecretKey || '',
        Bucket: params.Bucket,
        Key: params.Key,
        Expires: params.Expires,
    });
}

/**
 * 获取文件下载链接
 * @param  {Object}  params                 参数对象，必须
 *     @param  {String}  params.Bucket      Bucket名称，必须
 *     @param  {String}  params.Region      地域名称，必须
 *     @param  {String}  params.Key         object名称，必须
 *     @param  {String}  params.Method      请求的方法，可选
 *     @param  {String}  params.Expires     签名超时时间，单位秒，可选
 * @param  {Function}  callback             回调函数，必须
 *     @return  {Object}    err             请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
 *     @return  {Object}    data            返回的数据
 */
function getObjectUrl(params, callback) {
    var self = this;
    var url = getUrl({
        ForcePathStyle: self.options.ForcePathStyle,
        protocol: params.Protocol || self.options.Protocol,
        domain: params.Domain || self.options.Domain,
        bucket: params.Bucket,
        region: params.Region,
        object: params.Key,
    });
    if (params.Sign !== undefined && !params.Sign) {
        callback(null, {Url: url});
        return url;
    }
    var AuthData = getAuthorizationAsync.call(this, {
        Action: ((params.Method || '').toUpperCase() === 'PUT' ? 'name/cos:PutObject' : 'name/cos:GetObject'),
        Bucket: params.Bucket || '',
        Region: params.Region || '',
        Method: params.Method || 'get',
        Key: params.Key,
        Expires: params.Expires,
    }, function (err, AuthData) {
        if (!callback) return;
        if (err) {
            callback(err);
            return;
        }
        var signUrl = url;
        signUrl += '?' + (AuthData.Authorization.indexOf('q-signature') > -1 ?
            AuthData.Authorization : 'sign=' + encodeURIComponent(AuthData.Authorization));
        AuthData.SecurityToken && (signUrl += '&x-cos-security-token=' + AuthData.SecurityToken);
        AuthData.ClientIP && (signUrl += '&clientIP=' + AuthData.ClientIP);
        AuthData.ClientUA && (signUrl += '&clientUA=' + AuthData.ClientUA);
        AuthData.Token && (signUrl += '&token=' + AuthData.Token);
        setTimeout(function () {
            callback(null, {Url: signUrl});
        });
    });
    if (AuthData) {
        return url + '?' + AuthData.Authorization +
            (AuthData.SecurityToken ? '&x-cos-security-token=' + AuthData.SecurityToken : '');
    } else {
        return url;
    }
}


/**
 * 私有方法
 */
function decodeAcl(AccessControlPolicy) {
    var result = {
        GrantFullControl: [],
        GrantWrite: [],
        GrantRead: [],
        GrantReadAcp: [],
        GrantWriteAcp: [],
        ACL: '',
    };
    var GrantMap = {
        'FULL_CONTROL': 'GrantFullControl',
        'WRITE': 'GrantWrite',
        'READ': 'GrantRead',
        'READ_ACP': 'GrantReadAcp',
        'WRITE_ACP': 'GrantWriteAcp',
    };
    var AccessControlList = AccessControlPolicy && AccessControlPolicy.AccessControlList || {};
    var Grant = AccessControlList.Grant;
    if (Grant) {
        Grant = util.isArray(Grant) ? Grant : [Grant];
    }
    var PublicAcl = {READ: 0, WRITE: 0, FULL_CONTROL: 0};
    Grant && Grant.length && util.each(Grant, function (item) {
        if (item.Grantee.ID === 'qcs::cam::anyone:anyone' || item.Grantee.URI === 'http://cam.qcloud.com/groups/global/AllUsers') {
            PublicAcl[item.Permission] = 1;
        } else if (item.Grantee.ID !== AccessControlPolicy.Owner.ID) {
            result[GrantMap[item.Permission]].push('id="' + item.Grantee.ID + '"');
        }
    });
    if (PublicAcl.FULL_CONTROL || (PublicAcl.WRITE && PublicAcl.READ)) {
        result.ACL = 'public-read-write';
    } else if (PublicAcl.READ) {
        result.ACL = 'public-read';
    } else {
        result.ACL = 'private';
    }
    util.each(GrantMap, function (item) {
        result[item] = uniqGrant(result[item].join(','));
    });
    return result;
}

// Grant 去重
function uniqGrant(str) {
    var arr = str.split(',');
    var exist = {};
    var i, item;
    for (i = 0; i < arr.length; ) {
        item = arr[i].trim();
        if (exist[item]) {
            arr.splice(i, 1);
        } else {
            exist[item] = true;
            arr[i] = item;
            i++;
        }
    }
    return arr.join(',');
}

// 生成操作 url
function getUrl(params) {
    var longBucket = params.bucket;
    var shortBucket = longBucket.substr(0, longBucket.lastIndexOf('-'));
    var appId = longBucket.substr(longBucket.lastIndexOf('-') + 1);
    var domain = params.domain;
    var region = params.region;
    var object = params.object;
    var protocol = params.protocol || (util.isBrowser && location.protocol === 'http:' ? 'http:' : 'https:');
    if (!domain) {
        if (['cn-south', 'cn-south-2', 'cn-north', 'cn-east', 'cn-southwest', 'sg'].indexOf(region) > -1) {
            domain = '{Region}.myqcloud.com';
        } else {
            domain = 'cos.{Region}.myqcloud.com';
        }
        if (!params.ForcePathStyle) {
            domain = '{Bucket}.' + domain;
        }
    }
    domain = domain.replace(/\{\{AppId\}\}/ig, appId)
        .replace(/\{\{Bucket\}\}/ig, shortBucket)
        .replace(/\{\{Region\}\}/ig, region)
        .replace(/\{\{.*?\}\}/ig, '');
    domain = domain.replace(/\{AppId\}/ig, appId)
        .replace(/\{BucketName\}/ig, shortBucket)
        .replace(/\{Bucket\}/ig, longBucket)
        .replace(/\{Region\}/ig, region)
        .replace(/\{.*?\}/ig, '');
    if (!/^[a-zA-Z]+:\/\//.test(domain)) {
        domain = protocol + '//' + domain;
    }

    // 去掉域名最后的斜杆
    if (domain.slice(-1) === '/') {
        domain = domain.slice(0, -1);
    }
    var url = domain;

    if (params.ForcePathStyle) {
        url += '/' + longBucket;
    }
    url += '/';
    if (object) {
        url += util.camSafeUrlEncode(object).replace(/%2F/g, '/');
    }

    if (params.isLocation) {
        url = url.replace(/^https?:\/\//, '');
    }
    return url;
}

// 异步获取签名
function getAuthorizationAsync(params, callback) {

    var headers = util.clone(params.Headers);
    util.each(headers, function (v, k) {
        (v === '' || ['content-type', 'cache-control', 'expires'].indexOf(k.toLowerCase())) && delete headers[k];
    });

    // 获取凭证的回调，避免用户 callback 多次
    var cbDone = false;
    var cb = function (err, AuthData) {
        if (cbDone) return;
        cbDone = true;
        callback && callback(err, AuthData);
    };

    var self = this;
    var Bucket = params.Bucket || '';
    var Region = params.Region || '';

    // PathName
    var KeyName = params.Key || '';
    if (self.options.ForcePathStyle && Bucket) {
        KeyName = Bucket + '/' + KeyName;
    }
    var Pathname = '/' + KeyName;

    // Action、ResourceKey
    var StsData = {};
    var Scope = params.Scope;
    if (!Scope) {
        var Action = params.Action || '';
        var ResourceKey = params.ResourceKey || params.Key || '';
        Scope = params.Scope || [{
            action: Action,
            bucket: Bucket,
            region: Region,
            prefix: ResourceKey,
        }];
    }
    var ScopeKey  = util.md5(JSON.stringify(Scope));

    // STS
    self._StsCache = self._StsCache ||[];
    (function () {
        var i, AuthData;
        for (i = self._StsCache.length - 1; i >= 0; i--) {
            AuthData = self._StsCache[i];
            var compareTime = Math.round(util.getSkewTime(self.options.SystemClockOffset) / 1000) + 30;
            if (AuthData.StartTime && compareTime < AuthData.StartTime || compareTime >= AuthData.ExpiredTime) {
                self._StsCache.splice(i, 1);
                continue;
            }
            if (!AuthData.ScopeLimit || AuthData.ScopeLimit && AuthData.ScopeKey === ScopeKey) {
                StsData = AuthData;
                break;
            }
        }
    })();

    var calcAuthByTmpKey = function () {
        var KeyTime = StsData.StartTime && StsData.ExpiredTime ? StsData.StartTime + ';' + StsData.ExpiredTime : '';
        var Authorization = util.getAuth({
            SecretId: StsData.TmpSecretId,
            SecretKey: StsData.TmpSecretKey,
            Method: params.Method,
            Pathname: Pathname,
            Query: params.Query,
            Headers: headers,
            Expires: params.Expires,
            UseRawKey: self.options.UseRawKey,
            SystemClockOffset: self.options.SystemClockOffset,
            KeyTime: KeyTime
        });
        var AuthData = {
            Authorization: Authorization,
            SecurityToken: StsData.SecurityToken || StsData.XCosSecurityToken || '',
            Token: StsData.Token || '',
            ClientIP: StsData.ClientIP || '',
            ClientUA: StsData.ClientUA || '',
        };
        cb(null, AuthData);
    };
    var checkAuthError = function (AuthData) {
        if (AuthData.Authorization) {
            // 检查签名格式
            var formatAllow = false;
            var auth = AuthData.Authorization;
            if (auth) {
                if (auth.indexOf(' ') > -1) {
                    formatAllow = false;
                } else if (auth.indexOf('q-sign-algorithm=') > -1 &&
                    auth.indexOf('q-ak=') > -1 &&
                    auth.indexOf('q-sign-time=') > -1 &&
                    auth.indexOf('q-key-time=') > -1 &&
                    auth.indexOf('q-url-param-list=') > -1) {
                    formatAllow = true;
                } else {
                    try {
                        auth = Buffer.from(auth, 'base64').toString();
                        if (auth.indexOf('a=') > -1 &&
                            auth.indexOf('k=') > -1 &&
                            auth.indexOf('t=') > -1 &&
                            auth.indexOf('r=') > -1 &&
                            auth.indexOf('b=') > -1) {
                            formatAllow = true;
                        }
                    } catch (e) {}
                }
            }
            if (!formatAllow) return util.error(new Error('getAuthorization callback params format error'));
        } else {
            if (!AuthData.TmpSecretId) return util.error(new Error('getAuthorization callback params missing "TmpSecretId"'));
            if (!AuthData.TmpSecretKey) return util.error(new Error('getAuthorization callback params missing "TmpSecretKey"'));
            if (!AuthData.SecurityToken && !AuthData.XCosSecurityToken) return util.error(new Error('getAuthorization callback params missing "SecurityToken"'));
            if (!AuthData.ExpiredTime) return util.error(new Error('getAuthorization callback params missing "ExpiredTime"'));
            if (AuthData.ExpiredTime && AuthData.ExpiredTime.toString().length !== 10) return util.error(new Error('getAuthorization callback params "ExpiredTime" should be 10 digits'));
            if (AuthData.StartTime && AuthData.StartTime.toString().length !== 10) return util.error(new Error('getAuthorization callback params "StartTime" should be 10 StartTime'));
        }
        return false;
    };

    // 先判断是否有临时密钥
    if (StsData.ExpiredTime && StsData.ExpiredTime - (util.getSkewTime(self.options.SystemClockOffset) / 1000) > 60) { // 如果缓存的临时密钥有效，并还有超过60秒有效期就直接使用
        calcAuthByTmpKey();
    } else if (self.options.getAuthorization) { // 外部计算签名或获取临时密钥
        self.options.getAuthorization.call(self, {
            Bucket: Bucket,
            Region: Region,
            Method: params.Method,
            Key: KeyName,
            Pathname: Pathname,
            Query: params.Query,
            Headers: headers,
            Scope: Scope,
            SystemClockOffset: self.options.SystemClockOffset,
        }, function (AuthData) {
            if (typeof AuthData === 'string') AuthData = {Authorization: AuthData};
            var AuthError = checkAuthError(AuthData);
            if (AuthError) return cb(AuthError);
            if (AuthData.Authorization) {
                cb(null, AuthData);
            } else {
                StsData = AuthData || {};
                StsData.Scope = Scope;
                StsData.ScopeKey = ScopeKey;
                self._StsCache.push(StsData);
                calcAuthByTmpKey();
            }
        });
    } else if (self.options.getSTS) { // 外部获取临时密钥
        self.options.getSTS.call(self, {
            Bucket: Bucket,
            Region: Region,
        }, function (data) {
            StsData = data || {};
            StsData.Scope = Scope;
            StsData.ScopeKey = ScopeKey;
            if (!StsData.TmpSecretId) StsData.TmpSecretId = StsData.SecretId;
            if (!StsData.TmpSecretKey) StsData.TmpSecretKey = StsData.SecretKey;
            var AuthError = checkAuthError(StsData);
            if (AuthError) return cb(AuthError);
            self._StsCache.push(StsData);
            calcAuthByTmpKey();
        });
    } else { // 内部计算获取签名
        return (function () {
            var Authorization = util.getAuth({
                SecretId: params.SecretId || self.options.SecretId,
                SecretKey: params.SecretKey || self.options.SecretKey,
                Method: params.Method,
                Pathname: Pathname,
                Query: params.Query,
                Headers: headers,
                Expires: params.Expires,
                UseRawKey: self.options.UseRawKey,
                SystemClockOffset: self.options.SystemClockOffset,
            });
            var AuthData = {
                Authorization: Authorization,
                SecurityToken: self.options.SecurityToken || self.options.XCosSecurityToken,
            };
            cb(null, AuthData);
            return AuthData;
        })();
    }
    return '';
}

// 调整时间偏差
function allowRetry(err) {
    var allowRetry = false;
    var isTimeError = false;
    var serverDate = (err.headers && (err.headers.date || err.headers.Date)) || (err.error && err.error.ServerTime);
    try {
        var errorCode = err.error.Code;
        var errorMessage = err.error.Message;
        if (errorCode === 'RequestTimeTooSkewed' ||
            (errorCode === 'AccessDenied' && errorMessage === 'Request has expired')) {
            isTimeError = true;
        }
    } catch (e) {
    }
    if (err) {
        if (isTimeError && serverDate) {
            var serverTime = Date.parse(serverDate);
            if (this.options.CorrectClockSkew && Math.abs(util.getSkewTime(this.options.SystemClockOffset) - serverTime) >= 30000) {
                console.error('error: Local time is too skewed.');
                this.options.SystemClockOffset = serverTime - Date.now();
                allowRetry = true;
            }
        } else if (Math.floor(err.statusCode / 100) === 5) {
            allowRetry = true;
        }
    }
    return allowRetry;
}

// 获取签名并发起请求
function submitRequest(params, callback) {
    var self = this;

    // 处理 headers
    !params.headers && (params.headers = {});
    params.headers['User-Agent'] = self.options.UserAgent || ('cos-nodejs-sdk-v5-' + pkg.version);

    // 处理 query
    !params.qs && (params.qs = {});
    params.VersionId && (params.qs.versionId = params.VersionId);
    params.qs = util.clearKey(params.qs);

    // 清理 undefined 和 null 字段
    params.headers && (params.headers = util.clearKey(params.headers));
    params.qs && (params.qs = util.clearKey(params.qs));

    var Query = util.clone(params.qs);
    params.action && (Query[params.action] = '');

    var next = function (tryTimes) {
        var oldClockOffset = self.options.SystemClockOffset;
        getAuthorizationAsync.call(self, {
            Bucket: params.Bucket || '',
            Region: params.Region || '',
            Method: params.method,
            Key: params.Key,
            Query: Query,
            Headers: params.headers,
            Action: params.Action,
            ResourceKey: params.ResourceKey,
            Scope: params.Scope,
        }, function (err, AuthData) {
            if (err) {
                callback(err);
                return;
            }
            params.AuthData = AuthData;
            _submitRequest.call(self, params, function (err, data) {
                if (err &&
                    !params.outputStream &&
                    tryTimes < 2 &&
                    (oldClockOffset !== self.options.SystemClockOffset || allowRetry.call(self, err))) {
                    if (params.headers) {
                        delete params.headers.Authorization;
                        delete params.headers['token'];
                        delete params.headers['clientIP'];
                        delete params.headers['clientUA'];
                        delete params.headers['x-cos-security-token'];
                    }
                    next(tryTimes + 1);
                } else {
                    callback(err, data);
                }
            });
        });
    };
    next(1);

}

// 发起请求
function _submitRequest(params, callback) {
    var self = this;
    var TaskId = params.TaskId;
    if (TaskId && !self._isRunningTask(TaskId)) return;

    var bucket = params.Bucket;
    var region = params.Region;
    var object = params.Key;
    var method = params.method || 'GET';
    var url = params.url;
    var body = params.body;
    var json = params.json;
    var rawBody = params.rawBody;

    // 处理 readStream and body
    var readStream;
    if (body && typeof body.pipe === 'function') {
        readStream = body;
        body = null;
    }

    // url
    url = url || getUrl({
        ForcePathStyle: self.options.ForcePathStyle,
        protocol: self.options.Protocol,
        domain: self.options.Domain,
        bucket: bucket,
        region: region,
        object: object,
    });
    if (params.action) {
        url = url + '?' + params.action;
    }

    var opt = {
        method: method,
        url: url,
        headers: params.headers,
        qs: params.qs,
        body: body,
        json: json,
    };

    // 获取签名
    opt.headers.Authorization = params.AuthData.Authorization;
    params.AuthData.Token && (opt.headers['token'] = params.AuthData.Token);
    params.AuthData.ClientIP && (opt.headers['clientIP'] = params.AuthData.ClientIP);
    params.AuthData.ClientUA && (opt.headers['clientUA'] = params.AuthData.ClientUA);
    params.AuthData.SecurityToken && (opt.headers['x-cos-security-token'] = params.AuthData.SecurityToken);

    // 清理 undefined 和 null 字段
    opt.headers && (opt.headers = util.clearKey(opt.headers));
    opt = util.clearKey(opt);

    var Ip = this.options.Ip;
    if (Ip) {
        opt.url = opt.url.replace(/^(https?:\/\/)([^\/]+)/, function (str, pre, Host) {
            opt.headers.Host = Host;
            return pre + Ip;
        });
    }
    if (this.options.StrictSsl !== true) {
        opt.strictSSL = this.options.StrictSsl;
    }
    if (this.options.Proxy) {
        opt.proxy = this.options.Proxy;
    }
    if (this.options.Timeout) {
        opt.timeout = this.options.Timeout;
    }
    if (this.options.KeepAlive) {
        opt.forever = true;
    }

    // 修复 Content-Type: false 的 Bug，原因 request 模块会获取 request('mime-types).lookup(readStream.path) 作为 Content-Type
    // 问题代码位置：https://github.com/request/request/blob/v2.88.1/request.js#L500
    if (readStream) {
        var hasContentType = false;
        util.each(opt.headers, function (val, key) {
            if (key.toLowerCase() === 'content-type') hasContentType = true;
        });
        if (
            !hasContentType && // 1. not set Content-Type
            readStream.readable && readStream.path && readStream.mode && // 2. isFileReadStream
            !mime.lookup(readStream.path) // 3. mime return false
        ) {
            opt.headers['Content-Type'] = 'application/octet-stream';
        }
    }

    // 特殊处理内容到写入流的情况，等待流 finish 后才 callback
    if (params.outputStream) callback = util.callbackAfterStreamFinish(params.outputStream, callback);

    self.emit('before-send', opt);
    var sender = REQUEST(opt);
    var retResponse;
    var hasReturned;
    var cb = function (err, data) {
        TaskId && self.off('inner-kill-task', killTask);
        if (hasReturned) return;
        hasReturned = true;
        var attrs = {};
        retResponse && retResponse.statusCode && (attrs.statusCode = retResponse.statusCode);
        retResponse && retResponse.headers && (attrs.headers = retResponse.headers);
        if (err) {
            err = util.extend(err || {}, attrs);
            callback(err, null);
        } else {
            data = util.extend(data || {}, attrs);
            callback(null, data);
        }
        if (sender) {
            sender.removeAllListeners && sender.removeAllListeners();
            sender = null;
        }
    };
    var xml2json = function (body) {
        try {
            json = util.xml2json(body) || {};
        } catch (e) {
            json = body || {};
        }
        return json;
    };
    // 在 request 分配的 socket 上挂载 _lastBytesWritten 属性，记录该 socket 已经发送的字节数
    var markLastBytesWritten = function() {
        try {
            Object.defineProperty(sender.req.connection, '_lastBytesWritten', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: sender.req.connection.bytesWritten
            });
        } catch(e) {
        }
    };

    sender.on('error', function (err) {
        markLastBytesWritten();
        cb(util.error(err));
    });
    sender.on('response', function (response) {
        retResponse = response;
        var responseContentLength = response.headers['content-length'] || 0;
        var chunkList = [];
        var statusCode = response.statusCode;
        var statusSuccess = Math.floor(statusCode / 100) === 2; // 200 202 204 206
        if (statusSuccess && params.outputStream) {
            sender.on('end', function () {
                cb(null, {});
            });
        } else if (responseContentLength >= process.binding('buffer').kMaxLength && opt.method !== 'HEAD') {
            cb(util.error(new Error('file size large than ' + process.binding('buffer').kMaxLength + ', please use "Output" Stream to getObject.')));
        } else {
            var dataHandler = function (chunk) {
                chunkList.push(chunk);
            };
            var endHandler = function () {
                var json;
                try {
                    var body = Buffer.concat(chunkList);
                } catch (e) {
                    cb(util.error(e));
                    return;
                }
                var bodyStr = body.toString();
                var createBodyError = function (err, json) {
                    var cosError = json && json.Error;
                    if (cosError) {
                        cosError = util.error(err, {
                            code: cosError.Code,
                            message: cosError.Message,
                            error: cosError,
                            RequestId: cosError.RequestId,
                            Scope: params.Scope,
                        });
                    } else if (response.statusCode) {
                        cosError = util.error(err, {
                            code: response.statusCode,
                            message: response.statusMessage
                        });
                    } else {
                        cosError = util.error(err, {
                            message: response.statusMessage || 'statusCode error'
                        });
                    }
                    return cosError;
                };
                if (statusSuccess) {
                    if (rawBody) { // 不对 body 进行转换，body 直接挂载返回
                        cb(null, {body: body});
                    } else if (body.length) {
                        json = xml2json(body.toString());
                        if (json && json.Error) {
                            cb(createBodyError(new Error(), json));
                        } else {
                            cb(null, json);
                        }
                    } else {
                        cb(null, {});
                    }
                } else {
                    bodyStr && (json = xml2json(bodyStr));
                    cb(createBodyError(new Error(), json))
                }
                chunkList = null;
            };
            sender.on('data', dataHandler);
            sender.on('end', endHandler);
        }
    });

    // kill task
    var killTask = function (data) {
        if (data.TaskId === TaskId) {
            readStream && readStream.isSdkCreated && readStream.close && readStream.close(); // 如果是 SDK 里从 FilePath 创建的读流，要主动取消
            sender && sender.abort && sender.abort();
            self.off('inner-kill-task', killTask);
        }
    };
    TaskId && self.on('inner-kill-task', killTask);

    // 请求结束时，在 request 分配的 socket 上挂载 _lastBytesWritten 属性，记录该 socket 已经发送的字节数
    sender.once('end', function() {
        markLastBytesWritten();
    });

    // upload progress
    if (params.onProgress && typeof params.onProgress === 'function') {
        var contentLength = opt.headers['Content-Length'];
        var time0 = Date.now();
        var size0 = 0;
        sender.on('drain', function () {
            var time1 = Date.now();
            var loaded = 0;
            try {
                // 已经上传的字节数 = socket当前累计发送的字节数 - 头部长度 - socket以前发送的字节数
                loaded = sender.req.connection.bytesWritten - sender.req._header.length - (sender.req.connection._lastBytesWritten || 0);
            } catch (e) {
            }
            var total = contentLength;
            var speed = parseInt((loaded - size0) / ((time1 - time0) / 1000) * 100) / 100 || 0;
            var percent = parseInt(loaded / total * 100) / 100 || 0;
            time0 = time1;
            size0 = loaded;
            params.onProgress({
                loaded: loaded,
                total: total,
                speed: speed,
                percent: percent,
            });
        });
    }
    // download progress
    if (params.onDownloadProgress && typeof params.onDownloadProgress === 'function') {
        var time0 = Date.now();
        var size0 = 0;
        var loaded = 0;
        var total = 0;
        sender.on('response', function (res) {
            total = res.headers['content-length'];
            sender.on('data', function (chunk) {
                loaded += chunk.length;
                var time1 = Date.now();
                var speed = parseInt((loaded - size0) / ((time1 - time0) / 1000) * 100) / 100 || 0;
                var percent = parseInt(loaded / total * 100) / 100 || 0;
                time0 = time1;
                size0 = loaded;
                params.onDownloadProgress({
                    loaded: loaded,
                    total: total,
                    speed: speed,
                    percent: percent,
                });
            });
        });
    }

    // pipe 输入
    if (readStream) {
        readStream.on('error', function (err) {
            sender && sender.abort && sender.abort();
            cb(err);
        });
        readStream.pipe(sender);
    }
    // pipe 输出
    if (params.outputStream) {
        params.outputStream.on('error', function (err) {
            sender && sender.abort && sender.abort();
            cb(err)
        });
        sender.pipe(params.outputStream);
    }

    return sender;

}


var API_MAP = {
    // Bucket 相关方法
    getService: getService,                      // Bucket
    putBucket: putBucket,
    headBucket: headBucket,                      // Bucket
    getBucket: getBucket,
    deleteBucket: deleteBucket,
    putBucketAcl: putBucketAcl,                  // BucketACL
    getBucketAcl: getBucketAcl,
    putBucketCors: putBucketCors,                // BucketCors
    getBucketCors: getBucketCors,
    deleteBucketCors: deleteBucketCors,
    getBucketLocation: getBucketLocation,        // BucketLocation
    getBucketPolicy: getBucketPolicy,            // BucketPolicy
    putBucketPolicy: putBucketPolicy,
    deleteBucketPolicy: deleteBucketPolicy,
    putBucketTagging: putBucketTagging,          // BucketTagging
    getBucketTagging: getBucketTagging,
    deleteBucketTagging: deleteBucketTagging,
    putBucketLifecycle: putBucketLifecycle,      // BucketLifecycle
    getBucketLifecycle: getBucketLifecycle,
    deleteBucketLifecycle: deleteBucketLifecycle,
    putBucketVersioning: putBucketVersioning,    // BucketVersioning
    getBucketVersioning: getBucketVersioning,
    putBucketReplication: putBucketReplication,  // BucketReplication
    getBucketReplication: getBucketReplication,
    deleteBucketReplication: deleteBucketReplication,
    putBucketWebsite: putBucketWebsite,          // BucketWebsite
    getBucketWebsite: getBucketWebsite,
    deleteBucketWebsite: deleteBucketWebsite,
    putBucketReferer: putBucketReferer,          // BucketReferer
    getBucketReferer: getBucketReferer,
    putBucketDomain: putBucketDomain,            // BucketDomain
    getBucketDomain: getBucketDomain,
    deleteBucketDomain: deleteBucketDomain,
    putBucketOrigin: putBucketOrigin,            // BucketOrigin
    getBucketOrigin: getBucketOrigin,
    deleteBucketOrigin: deleteBucketOrigin,
    putBucketLogging: putBucketLogging,             // BucketLogging
    getBucketLogging: getBucketLogging,
    putBucketInventory: putBucketInventory,         // BucketInventory
    getBucketInventory: getBucketInventory,
    listBucketInventory: listBucketInventory,
    deleteBucketInventory: deleteBucketInventory,
    putBucketAccelerate: putBucketAccelerate,
    getBucketAccelerate: getBucketAccelerate,

    // Object 相关方法
    getObject: getObject,
    getObjectStream: getObjectStream,
    headObject: headObject,
    listObjectVersions: listObjectVersions,
    putObject: putObject,
    deleteObject: deleteObject,
    getObjectAcl: getObjectAcl,
    putObjectAcl: putObjectAcl,
    optionsObject: optionsObject,
    putObjectCopy: putObjectCopy,
    deleteMultipleObject: deleteMultipleObject,
    restoreObject: restoreObject,
    putObjectTagging: putObjectTagging,
    getObjectTagging: getObjectTagging,
    deleteObjectTagging: deleteObjectTagging,
    selectObjectContent: selectObjectContent,
    selectObjectContentStream: selectObjectContentStream,

    // 分块上传相关方法
    uploadPartCopy: uploadPartCopy,
    multipartInit: multipartInit,
    multipartUpload: multipartUpload,
    multipartComplete: multipartComplete,
    multipartList: multipartList,
    multipartListPart: multipartListPart,
    multipartAbort: multipartAbort,

    // 工具方法
    getObjectUrl: getObjectUrl,
    getAuth: getAuth,
    getV4Auth: getV4Auth,
};

function warnOldApi(apiName, fn, proto) {
    util.each(['Cors', 'Acl'], function (suffix) {
        if (apiName.slice(-suffix.length) === suffix) {
            var oldName = apiName.slice(0, -suffix.length) + suffix.toUpperCase();
            var apiFn = util.apiWrapper(apiName, fn);
            var warned = false;
            proto[oldName] = function () {
                !warned && console.warn('warning: cos.' + oldName + ' has been deprecated. Please Use cos.' + apiName + ' instead.');
                warned = true;
                apiFn.apply(this, arguments);
            };
        }
    });
}

module.exports.init = function (COS, task) {
    task.transferToTaskMethod(API_MAP, 'putObject');
    util.each(API_MAP, function (fn, apiName) {
        COS.prototype[apiName] = util.apiWrapper(apiName, fn);
        warnOldApi(apiName, fn, COS.prototype);
    });
};

}, function(modId) { var map = {"../package.json":1654780339462,"./util":1654780339457,"./select-stream":1654780339463}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339462, function(require, module, exports) {
module.exports = {
  "name": "cos-nodejs-sdk-v5",
  "version": "2.9.0",
  "description": "cos nodejs sdk v5",
  "main": "index.js",
  "types": "types",
  "scripts": {
    "demo": "node demo/demo.js",
    "demo-sts": "node demo/demo-sts.js",
    "demo-sts-scope": "node demo/demo-sts-scope.js",
    "test": "mocha test/test.js",
    "csp": "mocha test/csp.js"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/tencentyun/cos-nodejs-sdk-v5.git"
  },
  "keywords": [
    "tencent",
    "tencent cloud",
    "qcloud",
    "cos",
    "cos-sdk"
  ],
  "author": "carsonxu",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/tencentyun/cos-nodejs-sdk-v5/issues"
  },
  "homepage": "https://github.com/tencentyun/cos-nodejs-sdk-v5#readme",
  "dependencies": {
    "@types/node": "^14.14.20",
    "conf": "^7.1.2",
    "mime-types": "^2.1.24",
    "request": "^2.88.2",
    "xml2js": "^0.4.19"
  },
  "devDependencies": {
    "mocha": "^4.0.1",
    "qcloud-cos-sts": "^3.0.0"
  }
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339463, function(require, module, exports) {
var { Transform } = require('stream');
var sysUtil = require('util');
var util = require('./util');

function SelectStream(options) {
    if (!(this instanceof SelectStream)) return new SelectStream(options);
    Transform.call(this, options);
    Object.assign(this, {
        totalLength: 0, // current message block's total length
        headerLength: 0, // current message block's header length
        payloadRestLength: 0, // current message block's rest payload length
        header: null, // current message block's header
        chunk: Buffer.alloc(0), // the data chunk being parsed
        callback: null, // current _transform function's callback
    });
}
SelectStream.prototype = {
    /**
     * process data chunk
     * concat the last chunk and current chunk
     * try to parse current message block's totalLength and headerLength
     * try to parse current message block's header
     * try to parse current message block's payload
     */
    processChunk(chunk, encoding, callback) {
        Object.assign(this, {
            chunk: Buffer.concat(
                [this.chunk, chunk],
                this.chunk.length + chunk.length,
            ),
            encoding,
            callback,
        });

        this.parseLength();
        this.parseHeader();
        this.parsePayload();
    },

    /**
     * try to parse current message block's totalLength and headerLength
     */
    parseLength() {
        if (!this.callback) {
            return;
        }

        if (this.totalLength && this.headerLength) {
            return;
        }

        if (this.chunk.length >= 12) {
            this.totalLength = this.chunk.readInt32BE(0);
            this.headerLength = this.chunk.readInt32BE(4);
            this.payloadRestLength = this.totalLength - this.headerLength - 16;
            this.chunk = this.chunk.slice(12);
        } else {
            this.callback();
            this.callback = null;
        }
    },

    /**
     * try to parse current message block's header
     * if header[':message-type'] is error, callback the error, emit error to next stream
     */
    parseHeader() {
        if (!this.callback) {
            return;
        }

        if (!this.headerLength || this.header) {
            return;
        }

        if (this.chunk.length >= this.headerLength) {
            var header = {};
            var offset = 0;
            while (offset < this.headerLength) {
                var headerNameLength = this.chunk[offset] * 1;
                var headerName = this.chunk.toString(
                    'ascii',
                    offset + 1,
                    offset + 1 + headerNameLength,
                );
                var headerValueLength = this.chunk.readInt16BE(offset + headerNameLength + 2);
                var headerValue = this.chunk.toString(
                    'ascii',
                    offset + headerNameLength + 4,
                    offset + headerNameLength + 4 + headerValueLength,
                );
                header[headerName] = headerValue;
                offset += headerNameLength + 4 + headerValueLength;
            }
            this.header = header;
            this.chunk = this.chunk.slice(this.headerLength);
            this.checkErrorHeader();
        } else {
            this.callback();
            this.callback = null;
        }
    },

    /**
     * try to parse current message block's payload
     */
    parsePayload() {
        var self = this;
        if (!this.callback) {
            return;
        }

        if (this.chunk.length <= this.payloadRestLength) {
            this.payloadRestLength -= this.chunk.length;
            this.pushData(this.chunk);
            this.chunk = Buffer.alloc(0);
        } else if (this.chunk.length < this.payloadRestLength + 4) {
            this.pushData(this.chunk.slice(0, this.payloadRestLength));
            this.chunk = this.chunk.slice(this.payloadRestLength);
            this.payloadRestLength = 0;
        } else {
            this.pushData(this.chunk.slice(0, this.payloadRestLength));
            this.chunk = this.chunk.slice(this.payloadRestLength + 4);
            this.totalLength = 0;
            this.headerLength = 0;
            this.payloadRestLength = 0;
            this.header = null;
        }

        if (
            this.chunk.length
            && !(this.payloadRestLength === 0 && this.chunk.length < 4)
        ) {
            process.nextTick(function () {
                self.processChunk(Buffer.alloc(0), self.encoding, self.callback);
            });
        } else {
            this.callback();
            this.callback = null;
        }
    },

    /**
     * if header[':event-type'] is Records, pipe payload to next stream
     */
    pushData(content) {
        if (this.header[':event-type'] === 'Records') {
            this.push(content);
            this.emit('message:records', content);
        } else if (this.header[':event-type'] === 'Progress') {
            var progress = util.xml2json(content.toString()).Progress;
            this.emit('message:progress', progress);
        } else if (this.header[':event-type'] === 'Stats') {
            var stats = util.xml2json(content.toString()).Stats;
            this.emit('message:stats', stats);
        } else if (this.header[':event-type'] === 'error') {
            var errCode = this.header[':error-code'];
            var errMessage = this.header[':error-message'];
            var err = new Error(errMessage);
            err.message = errMessage;
            err.name = err.code = errCode;
            this.emit('message:error', err);
        } else { // 'Continuation', 'End'
            this.emit('message:' + this.header[':event-type'].toLowerCase());
        }
    },

    /**
     * if header[':message-type'] is error, callback the error, emit error to next stream
     */
    checkErrorHeader() {
        if (this.header[':message-type'] === 'error') {
            this.callback(this.header);
            this.callback = null;
        }
    },

    /**
     * Transform Stream's implementations
     */
    _transform(chunk, encoding, callback) {
        this.processChunk(chunk, encoding, callback);
    },
    _flush(callback) {
        this.processChunk(Buffer.alloc(0), this.encoding, callback);
    },
};
sysUtil.inherits(SelectStream, Transform);

SelectStream.parseBody = function (chunk) {
    var header = {};
    var result = {records:[]};
    while (chunk.length) {
        var totalLength = chunk.readInt32BE(0);
        var headerLength = chunk.readInt32BE(4);
        var payloadRestLength = totalLength - headerLength - 16;
        var offset = 0;
        var content;
        chunk = chunk.slice(12);
        // 获取 Message 的 header 信息
        while (offset < headerLength) {
            var headerNameLength = chunk[offset] * 1;
            var headerName = chunk.toString(
                'ascii',
                offset + 1,
                offset + 1 + headerNameLength,
            );
            var headerValueLength = chunk.readInt16BE(offset + headerNameLength + 2);
            var headerValue = chunk.toString(
                'ascii',
                offset + headerNameLength + 4,
                offset + headerNameLength + 4 + headerValueLength,
            );
            header[headerName] = headerValue;
            offset += headerNameLength + 4 + headerValueLength;
        }
        if (header[':event-type'] === 'Records') {
            content = chunk.slice(offset, offset + payloadRestLength);
            result.records.push(content);
        } else if (header[':event-type'] === 'Stats') {
            content = chunk.slice(offset, offset + payloadRestLength);
            result.stats = util.xml2json(content.toString()).Stats;
        } else if (header[':event-type'] === 'error') {
            var errCode = header[':error-code'];
            var errMessage = header[':error-message'];
            var err = new Error(errMessage);
            err.message = errMessage;
            err.name = err.code = errCode;
            result.error = err;
        } else if (['Progress', 'Continuation', 'End'].includes(header[':event-type'])) {
            // do nothing
        }
        chunk = chunk.slice(offset + payloadRestLength + 4);
    }
    return result;
};

module.exports = SelectStream;

}, function(modId) { var map = {"util":1654780339457,"./util":1654780339457}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339464, function(require, module, exports) {
var session = require('./session');
var fs = require('fs');
var Async = require('./async');
var EventProxy = require('./event').EventProxy;
var util = require('./util');

// 文件分块上传全过程，暴露的分块上传接口
function sliceUploadFile(params, callback) {
    var self = this;
    var ep = new EventProxy();
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var FilePath = params.FilePath;
    var ChunkSize = params.ChunkSize || params.SliceSize || self.options.ChunkSize;
    var AsyncLimit = params.AsyncLimit;
    var StorageClass = params.StorageClass;
    var ServerSideEncryption = params.ServerSideEncryption;
    var FileSize;

    var onProgress;
    var onHashProgress = params.onHashProgress;

    // 上传过程中出现错误，返回错误
    ep.on('error', function (err) {
        if (!self._isRunningTask(TaskId)) return;
        return callback(err);
    });

    // 上传分块完成，开始 uploadSliceComplete 操作
    ep.on('upload_complete', function (UploadCompleteData) {
        callback(null, UploadCompleteData);
    });

    // 上传分块完成，开始 uploadSliceComplete 操作
    ep.on('upload_slice_complete', function (UploadData) {
        uploadSliceComplete.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadData.UploadId,
            SliceList: UploadData.SliceList,
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            session.removeUsing(UploadData.UploadId);
            if (err) {
                onProgress(null, true);
                return ep.emit('error', err);
            }
            session.removeUploadId.call(self, UploadData.UploadId);
            onProgress({loaded: FileSize, total: FileSize}, true);
            ep.emit('upload_complete', data);
        });
    });

    // 获取 UploadId 完成，开始上传每个分片
    ep.on('get_upload_data_finish', function (UploadData) {

        // 处理 UploadId 缓存
        var uuid = session.getFileId(params.FileStat, params.ChunkSize, Bucket, Key);
        uuid && session.saveUploadId.call(self, uuid, UploadData.UploadId, self.options.UploadIdCacheLimit); // 缓存 UploadId
        session.setUsing(UploadData.UploadId); // 标记 UploadId 为正在使用

        // 获取 UploadId
        onProgress(null, true); // 任务状态开始 uploading
        uploadSliceList.call(self, {
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            FilePath: FilePath,
            FileSize: FileSize,
            SliceSize: ChunkSize,
            AsyncLimit: AsyncLimit,
            ServerSideEncryption: ServerSideEncryption,
            UploadData: UploadData,
            onProgress: onProgress
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
                onProgress(null, true);
                return ep.emit('error', err);
            }
            ep.emit('upload_slice_complete', data);
        });
    });

    // 开始获取文件 UploadId，里面会视情况计算 ETag，并比对，保证文件一致性，也优化上传
    ep.on('get_file_size_finish', function () {

        onProgress = util.throttleOnProgress.call(self, FileSize, params.onProgress);

        if (params.UploadData.UploadId) {
            ep.emit('get_upload_data_finish', params.UploadData);
        } else {
            var _params = util.extend({
                TaskId: TaskId,
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                Headers: params.Headers,
                StorageClass: StorageClass,
                FilePath: FilePath,
                FileSize: FileSize,
                SliceSize: ChunkSize,
                onHashProgress: onHashProgress,
            }, params);
            getUploadIdAndPartList.call(self, _params, function (err, UploadData) {
                if (!self._isRunningTask(TaskId)) return;
                if (err) return ep.emit('error', err);
                params.UploadData.UploadId = UploadData.UploadId;
                params.UploadData.PartList = UploadData.PartList;
                ep.emit('get_upload_data_finish', params.UploadData);
            });
        }
    });

    // 获取上传文件大小
    FileSize = params.ContentLength;
    delete params.ContentLength;
    !params.Headers && (params.Headers = {});
    util.each(params.Headers, function (item, key) {
        if (key.toLowerCase() === 'content-length') {
            delete params.Headers[key];
        }
    });

    // 控制分片大小
    (function () {
        var SIZE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1024 * 2, 1024 * 4, 1024 * 5];
        var AutoChunkSize = 1024 * 1024;
        for (var i = 0; i < SIZE.length; i++) {
            AutoChunkSize = SIZE[i] * 1024 * 1024;
            if (FileSize / AutoChunkSize <= self.options.MaxPartNumber) break;
        }
        params.ChunkSize = params.SliceSize = ChunkSize = Math.max(ChunkSize, AutoChunkSize);
    })();

    // 开始上传
    if (FileSize === 0) {
        params.Body = '';
        params.ContentLength = 0;
        params.SkipTask = true;
        self.putObject(params, callback);
    } else {
        ep.emit('get_file_size_finish');
    }

}

// 获取上传任务的 UploadId
function getUploadIdAndPartList(params, callback) {
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var StorageClass = params.StorageClass;
    var self = this;

    // 计算 ETag
    var ETagMap = {};
    var FileSize = params.FileSize;
    var SliceSize = params.SliceSize;
    var SliceCount = Math.ceil(FileSize / SliceSize);
    var FinishSliceCount = 0;
    var FinishSize = 0;
    var onHashProgress = util.throttleOnProgress.call(self, FileSize, params.onHashProgress);
    var getChunkETag = function (PartNumber, callback) {
        var start = SliceSize * (PartNumber - 1);
        var end = Math.min(start + SliceSize, FileSize);
        var ChunkSize = end - start;

        if (ETagMap[PartNumber]) {
            callback(null, {
                PartNumber: PartNumber,
                ETag: ETagMap[PartNumber],
                Size: ChunkSize
            });
        } else {
            util.fileSlice(params.FilePath, start, end, function (chunkItem) {
                util.getFileMd5(chunkItem, function (err, md5) {
                    if (err) return callback(util.error(err));
                    var ETag = '"' + md5 + '"';
                    ETagMap[PartNumber] = ETag;
                    FinishSliceCount += 1;
                    FinishSize += ChunkSize;
                    onHashProgress({loaded: FinishSize, total: FileSize});
                    callback(null, {
                        PartNumber: PartNumber,
                        ETag: ETag,
                        Size: ChunkSize
                    });
                });
            });
        }
    };

    // 通过和文件的 md5 对比，判断 UploadId 是否可用
    var isAvailableUploadList = function (PartList, callback) {
        var PartCount = PartList.length;
        // 如果没有分片，通过
        if (PartCount === 0) {
            return callback(null, true);
        }
        // 检查分片数量
        if (PartCount > SliceCount) {
            return callback(null, false);
        }
        // 检查分片大小
        if (PartCount > 1) {
            var PartSliceSize = Math.max(PartList[0].Size, PartList[1].Size);
            if (PartSliceSize !== SliceSize) {
                return callback(null, false);
            }
        }
        // 逐个分片计算并检查 ETag 是否一致
        var next = function (index) {
            if (index < PartCount) {
                var Part = PartList[index];
                getChunkETag(Part.PartNumber, function (err, chunk) {
                    if (chunk && chunk.ETag === Part.ETag && chunk.Size === Part.Size) {
                        next(index + 1);
                    } else {
                        callback(null, false);
                    }
                });
            } else {
                callback(null, true);
            }
        };
        next(0);
    };

    var ep = new EventProxy();
    ep.on('error', function (errData) {
        if (!self._isRunningTask(TaskId)) return;
        return callback(errData);
    });

    // 存在 UploadId
    ep.on('upload_id_available', function (UploadData) {
        // 转换成 map
        var map = {};
        var list = [];
        util.each(UploadData.PartList, function (item) {
            map[item.PartNumber] = item;
        });
        for (var PartNumber = 1; PartNumber <= SliceCount; PartNumber++) {
            var item = map[PartNumber];
            if (item) {
                item.PartNumber = PartNumber;
                item.Uploaded = true;
            } else {
                item = {
                    PartNumber: PartNumber,
                    ETag: null,
                    Uploaded: false
                };
            }
            list.push(item);
        }
        UploadData.PartList = list;
        callback(null, UploadData);
    });

    // 不存在 UploadId, 初始化生成 UploadId
    ep.on('no_available_upload_id', function () {
        if (!self._isRunningTask(TaskId)) return;
        var _params = util.extend({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: util.clone(params.Headers),
            Query: util.clone(params.Query),
            StorageClass: StorageClass,
        }, params);
        self.multipartInit(_params, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) return ep.emit('error', err);
            var UploadId = data.UploadId;
            if (!UploadId) {
                return callback(util.error(new Error('no such upload id')));
            }
            ep.emit('upload_id_available', {UploadId: UploadId, PartList: []});
        });
    });

    // 如果已存在 UploadId，找一个可以用的 UploadId
    ep.on('has_and_check_upload_id', function (UploadIdList) {
        // 串行地，找一个内容一致的 UploadId
        UploadIdList = UploadIdList.reverse();
        Async.eachLimit(UploadIdList, 1, function (UploadId, asyncCallback) {
            if (!self._isRunningTask(TaskId)) return;
            // 如果正在上传，跳过
            if (session.using[UploadId]) {
                asyncCallback(); // 检查下一个 UploadId
                return;
            }
            // 判断 UploadId 是否可用
            wholeMultipartListPart.call(self, {
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                UploadId: UploadId,
            }, function (err, PartListData) {
                if (!self._isRunningTask(TaskId)) return;
                if (err) {
                    session.removeUsing(UploadId);
                    return ep.emit('error', err);
                }
                var PartList = PartListData.PartList;
                PartList.forEach(function (item) {
                    item.PartNumber *= 1;
                    item.Size *= 1;
                    item.ETag = item.ETag || '';
                });
                isAvailableUploadList(PartList, function (err, isAvailable) {
                    if (!self._isRunningTask(TaskId)) return;
                    if (err) return ep.emit('error', err);
                    if (isAvailable) {
                        asyncCallback({
                            UploadId: UploadId,
                            PartList: PartList
                        }); // 马上结束
                    } else {
                        asyncCallback(); // 检查下一个 UploadId
                    }
                });
            });
        }, function (AvailableUploadData) {
            if (!self._isRunningTask(TaskId)) return;
            onHashProgress(null, true);
            if (AvailableUploadData && AvailableUploadData.UploadId) {
                ep.emit('upload_id_available', AvailableUploadData);
            } else {
                ep.emit('no_available_upload_id');
            }
        });
    });

    // 在本地缓存找可用的 UploadId
    ep.on('seek_local_avail_upload_id', function (RemoteUploadIdList) {
        // 在本地找可用的 UploadId
        var uuid = session.getFileId(params.FileStat, params.ChunkSize, Bucket, Key);
        var LocalUploadIdList = session.getUploadIdList.call(self, uuid);
        if (!uuid || !LocalUploadIdList) {
            ep.emit('has_and_check_upload_id', RemoteUploadIdList);
            return;
        }
        var next = function (index) {
            // 如果本地找不到可用 UploadId，再一个个遍历校验远端
            if (index >= LocalUploadIdList.length) {
                ep.emit('has_and_check_upload_id', RemoteUploadIdList);
                return;
            }
            var UploadId = LocalUploadIdList[index];
            // 如果不在远端 UploadId 列表里，跳过并删除
            if (!util.isInArray(RemoteUploadIdList, UploadId)) {
                session.removeUploadId.call(self, UploadId);
                next(index + 1);
                return;
            }
            // 如果正在上传，跳过
            if (session.using[UploadId]) {
                next(index + 1);
                return;
            }
            // 判断 UploadId 是否存在线上
            wholeMultipartListPart.call(self, {
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                UploadId: UploadId,
            }, function (err, PartListData) {
                if (!self._isRunningTask(TaskId)) return;
                if (err) {
                    // 如果 UploadId 获取会出错，跳过并删除
                    session.removeUploadId.call(self, UploadId);
                    next(index + 1);
                } else {
                    // 找到可用 UploadId
                    ep.emit('upload_id_available', {
                        UploadId: UploadId,
                        PartList: PartListData.PartList,
                    });
                }
            });
        };
        next(0);
    });

    // 获取线上 UploadId 列表
    ep.on('get_remote_upload_id_list', function () {
        // 获取符合条件的 UploadId 列表，因为同一个文件可以有多个上传任务。
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) return ep.emit('error', err);
            // 整理远端 UploadId 列表
            var RemoteUploadIdList = util.filter(data.UploadList, function (item) {
                return item.Key === Key && (!StorageClass || item.StorageClass.toUpperCase() === StorageClass.toUpperCase());
            }).reverse().map(function (item) {
                return item.UploadId || item.UploadID;
            });
            if (RemoteUploadIdList.length) {
                ep.emit('seek_local_avail_upload_id', RemoteUploadIdList);
            } else {
                // 远端没有 UploadId，清理缓存的 UploadId
                var uuid = session.getFileId(params.FileStat, params.ChunkSize, Bucket, Key), LocalUploadIdList;
                if (uuid && (LocalUploadIdList = session.getUploadIdList.call(self, uuid))) {
                    util.each(LocalUploadIdList, function (UploadId) {
                        session.removeUploadId.call(self, UploadId);
                    });
                }
                ep.emit('no_available_upload_id');
            }
        });
    });

    // 开始找可用 UploadId
    ep.emit('get_remote_upload_id_list');

}

// 获取符合条件的全部上传任务 (条件包括 Bucket, Region, Prefix)
function wholeMultipartList(params, callback) {
    var self = this;
    var UploadList = [];
    var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Prefix: params.Key
    };
    var next = function () {
        self.multipartList(sendParams, function (err, data) {
            if (err) return callback(err);
            UploadList.push.apply(UploadList, data.Upload || []);
            if (data.IsTruncated === 'true') { // 列表不完整
                sendParams.KeyMarker = data.NextKeyMarker;
                sendParams.UploadIdMarker = data.NextUploadIdMarker;
                next();
            } else {
                callback(null, {UploadList: UploadList});
            }
        });
    };
    next();
}

// 获取指定上传任务的分块列表
function wholeMultipartListPart(params, callback) {
    var self = this;
    var PartList = [];
    var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        UploadId: params.UploadId
    };
    var next = function () {
        self.multipartListPart(sendParams, function (err, data) {
            if (err) return callback(err);
            PartList.push.apply(PartList, data.Part || []);
            if (data.IsTruncated === 'true') { // 列表不完整
                sendParams.PartNumberMarker = data.NextPartNumberMarker;
                next();
            } else {
                callback(null, {PartList: PartList});
            }
        });
    };
    next();
}

// 上传文件分块，包括
/*
 UploadId (上传任务编号)
 AsyncLimit (并发量)，
 SliceList (上传的分块数组)，
 FilePath (本地文件的位置)，
 SliceSize (文件分块大小)
 FileSize (文件大小)
 onProgress (上传成功之后的回调函数)
 */
function uploadSliceList(params, cb) {
    var self = this;
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadData = params.UploadData;
    var FileSize = params.FileSize;
    var SliceSize = params.SliceSize;
    var ChunkParallel = Math.min(params.AsyncLimit || self.options.ChunkParallelLimit || 1, 256);
    var FilePath = params.FilePath;
    var SliceCount = Math.ceil(FileSize / SliceSize);
    var FinishSize = 0;
    var ServerSideEncryption = params.ServerSideEncryption;
    var needUploadSlices = util.filter(UploadData.PartList, function (SliceItem) {
        if (SliceItem['Uploaded']) {
            FinishSize += SliceItem['PartNumber'] >= SliceCount ? (FileSize % SliceSize || SliceSize) : SliceSize;
        }
        return !SliceItem['Uploaded'];
    });
    var onProgress = params.onProgress;

    Async.eachLimit(needUploadSlices, ChunkParallel, function (SliceItem, asyncCallback) {
        if (!self._isRunningTask(TaskId)) return;
        var PartNumber = SliceItem['PartNumber'];
        var currentSize = Math.min(FileSize, SliceItem['PartNumber'] * SliceSize) - (SliceItem['PartNumber'] - 1) * SliceSize;
        var preAddSize = 0;
        uploadSliceItem.call(self, {
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            SliceSize: SliceSize,
            FileSize: FileSize,
            PartNumber: PartNumber,
            ServerSideEncryption: ServerSideEncryption,
            FilePath: FilePath,
            UploadData: UploadData,
            onProgress: function (data) {
                FinishSize += data.loaded - preAddSize;
                preAddSize = data.loaded;
                onProgress({loaded: FinishSize, total: FileSize});
            },
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
                FinishSize -= preAddSize;
            } else {
                FinishSize += currentSize - preAddSize;
                SliceItem.ETag = data.ETag;
            }
            onProgress({loaded: FinishSize, total: FileSize});
            asyncCallback(err || null, data);
        });
    }, function (err) {
        if (!self._isRunningTask(TaskId)) return;
        if (err) return cb(err);
        cb(null, {
            UploadId: UploadData.UploadId,
            SliceList: UploadData.PartList
        });
    });
}

// 上传指定分片
function uploadSliceItem(params, callback) {
    var self = this;
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var FileSize = params.FileSize;
    var FilePath = params.FilePath;
    var PartNumber = params.PartNumber * 1;
    var SliceSize = params.SliceSize;
    var ServerSideEncryption = params.ServerSideEncryption;
    var UploadData = params.UploadData;
    var ChunkRetryTimes = self.options.ChunkRetryTimes + 1;

    var start = SliceSize * (PartNumber - 1);

    var ContentLength = SliceSize;

    var end = start + SliceSize;

    if (end > FileSize) {
        end = FileSize;
        ContentLength = end - start;
    }

    util.fileSlice(FilePath, start, end, function (md5Body) {
        util.getFileMd5(md5Body, function (err, md5) {
            var contentMd5 = md5 ? util.binaryBase64(md5) : '';
            var PartItem = UploadData.PartList[PartNumber - 1];
            Async.retry(ChunkRetryTimes, function (tryCallback) {
                if (!self._isRunningTask(TaskId)) return;
                util.fileSlice(FilePath, start, end, function (Body) {
                    self.multipartUpload({
                        TaskId: TaskId,
                        Bucket: Bucket,
                        Region: Region,
                        Key: Key,
                        ContentLength: ContentLength,
                        PartNumber: PartNumber,
                        UploadId: UploadData.UploadId,
                        ServerSideEncryption: ServerSideEncryption,
                        Body: Body,
                        onProgress: params.onProgress,
                        ContentMD5: contentMd5,
                    }, function (err, data) {
                        if (!self._isRunningTask(TaskId)) return;
                        if (err) return tryCallback(err);
                        PartItem.Uploaded = true;
                        return tryCallback(null, data);
                    });
                });
            }, function (err, data) {
                if (!self._isRunningTask(TaskId)) return;
                return callback(err, data);
            });
        });
    });
}


// 完成分块上传
function uploadSliceComplete(params, callback) {
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadId = params.UploadId;
    var SliceList = params.SliceList;
    var self = this;
    var ChunkRetryTimes = this.options.ChunkRetryTimes + 1;
    var Parts = SliceList.map(function (item) {
        return {
            PartNumber: item.PartNumber,
            ETag: item.ETag
        };
    });
    // 完成上传的请求也做重试
    Async.retry(ChunkRetryTimes, function (tryCallback) {
        self.multipartComplete({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadId,
            Parts: Parts
        }, tryCallback);
    }, function (err, data) {
        callback(err, data);
    });
}

// 抛弃分块上传任务
/*
 AsyncLimit (抛弃上传任务的并发量)，
 UploadId (上传任务的编号，当 Level 为 task 时候需要)
 Level (抛弃分块上传任务的级别，task : 抛弃指定的上传任务，file ： 抛弃指定的文件对应的上传任务，其他值 ：抛弃指定Bucket 的全部上传任务)
 */
function abortUploadTask(params, callback) {
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadId = params.UploadId;
    var Level = params.Level || 'task';
    var AsyncLimit = params.AsyncLimit;
    var self = this;

    var ep = new EventProxy();

    ep.on('error', function (errData) {
        return callback(errData);
    });

    // 已经获取到需要抛弃的任务列表
    ep.on('get_abort_array', function (AbortArray) {
        abortUploadTaskArray.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: params.Headers,
            AsyncLimit: AsyncLimit,
            AbortArray: AbortArray
        }, callback);
    });

    if (Level === 'bucket') {
        // Bucket 级别的任务抛弃，抛弃该 Bucket 下的全部上传任务
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region
        }, function (err, data) {
            if (err) return callback(err);
            ep.emit('get_abort_array', data.UploadList || []);
        });
    } else if (Level === 'file') {
        // 文件级别的任务抛弃，抛弃该文件的全部上传任务
        if (!Key) return callback(util.error(new Error('abort_upload_task_no_key')));
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key
        }, function (err, data) {
            if (err) return callback(err);
            ep.emit('get_abort_array', data.UploadList || []);
        });
    } else if (Level === 'task') {
        // 单个任务级别的任务抛弃，抛弃指定 UploadId 的上传任务
        if (!UploadId) return callback(util.error(new Error('abort_upload_task_no_id')));
        if (!Key) return callback(util.error(new Error('abort_upload_task_no_key')));
        ep.emit('get_abort_array', [{
            Key: Key,
            UploadId: UploadId
        }]);
    } else {
        return callback(util.error(new Error('abort_unknown_level')));
    }
}

// 批量抛弃分块上传任务
function abortUploadTaskArray(params, callback) {

    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var AbortArray = params.AbortArray;
    var AsyncLimit = params.AsyncLimit || 1;
    var self = this;

    var index = 0;
    var resultList = new Array(AbortArray.length);
    Async.eachLimit(AbortArray, AsyncLimit, function (AbortItem, nextItem) {
        var eachIndex = index;
        if (Key && Key !== AbortItem.Key) {
            resultList[eachIndex] = {error: {KeyNotMatch: true}};
            nextItem(null);
            return;
        }
        var UploadId = AbortItem.UploadId || AbortItem.UploadID;

        self.multipartAbort({
            Bucket: Bucket,
            Region: Region,
            Key: AbortItem.Key,
            Headers: params.Headers,
            UploadId: UploadId
        }, function (err) {
            var task = {
                Bucket: Bucket,
                Region: Region,
                Key: AbortItem.Key,
                UploadId: UploadId
            };
            resultList[eachIndex] = {error: err, task: task};
            nextItem(null);
        });
        index++;

    }, function (err) {
        if (err) return callback(err);

        var successList = [];
        var errorList = [];

        for (var i = 0, len = resultList.length; i < len; i++) {
            var item = resultList[i];
            if (item['task']) {
                if (item['error']) {
                    errorList.push(item['task']);
                } else {
                    successList.push(item['task']);
                }
            }
        }

        return callback(null, {
            successList: successList,
            errorList: errorList
        });
    });
}


// 批量上传文件
function uploadFiles(params, callback) {
    var self = this;

    // 判断多大的文件使用分片上传
    var SliceSize = params.SliceSize === undefined ? self.options.SliceSize : params.SliceSize;

    // 汇总返回进度
    var TotalSize = 0;
    var TotalFinish = 0;
    var onTotalProgress = util.throttleOnProgress.call(self, TotalFinish, params.onProgress);

    // 汇总返回回调
    var unFinishCount = params.files.length;
    var _onTotalFileFinish = params.onFileFinish;
    var resultList = Array(unFinishCount);
    var onTotalFileFinish = function (err, data, options) {
        onTotalProgress(null, true);
        _onTotalFileFinish && _onTotalFileFinish(err, data, options);
        resultList[options.Index] = {
            options: options,
            error: err,
            data: data
        };
        if (--unFinishCount <= 0 && callback) {
            callback(null, {files: resultList});
        }
    };

    // 开始处理每个文件
    var taskList = [];
    var count = params.files.length;
    util.each(params.files, function (fileParams, index) {
        fs.stat(fileParams.FilePath, function (err, stat) {

            var FileSize = fileParams.ContentLength = stat.size || 0;
            var fileInfo = {Index: index, TaskId: ''};

            // 更新文件总大小
            TotalSize += FileSize;

            // 整理 option，用于返回给回调
            util.each(fileParams, function (v, k) {
                if (typeof v !== 'object' && typeof v !== 'function') {
                    fileInfo[k] = v;
                }
            });

            // 处理单个文件 TaskReady
            var _onTaskReady = fileParams.onTaskReady;
            var onTaskReady = function (tid) {
                fileInfo.TaskId = tid;
                _onTaskReady && _onTaskReady(tid);
            };
            fileParams.onTaskReady = onTaskReady;

            // 处理单个文件进度
            var PreAddSize = 0;
            var _onProgress = fileParams.onProgress;
            var onProgress = function (info) {
                TotalFinish = TotalFinish - PreAddSize + info.loaded;
                PreAddSize = info.loaded;
                _onProgress && _onProgress(info);
                onTotalProgress({loaded: TotalFinish, total: TotalSize});
            };
            fileParams.onProgress = onProgress;

            // 处理单个文件完成
            var _onFileFinish = fileParams.onFileFinish;
            var onFileFinish = function (err, data) {
                _onFileFinish && _onFileFinish(err, data);
                onTotalFileFinish && onTotalFileFinish(err, data, fileInfo);
            };

            // 添加上传任务
            var api = FileSize > SliceSize ? 'sliceUploadFile' : 'putObject';
            if (api === 'putObject') {
                fileParams.Body = fs.createReadStream(fileParams.FilePath);
                fileParams.Body.isSdkCreated = true;
            }
            taskList.push({
                api: api,
                params: fileParams,
                callback: onFileFinish,
            });
            --count === 0 && self._addTasks(taskList);
        });
    });
}

// 分片复制文件
function sliceCopyFile(params, callback) {
    var ep = new EventProxy();

    var self = this;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var CopySource = params.CopySource;
    var m = CopySource.match(/^([^.]+-\d+)\.cos(v6)?\.([^.]+)\.[^/]+\/(.+)$/);
    if (!m) {
        callback(util.error(new Error('CopySource format error')));
        return;
    }

    var SourceBucket = m[1];
    var SourceRegion = m[3];
    var SourceKey = decodeURIComponent(m[4]);
    var CopySliceSize = params.CopySliceSize === undefined ? self.options.CopySliceSize : params.CopySliceSize;
    CopySliceSize = Math.max(0, CopySliceSize);

    var ChunkSize = params.CopyChunkSize || this.options.CopyChunkSize;
    var ChunkParallel = this.options.CopyChunkParallelLimit;

    var FinishSize = 0;
    var FileSize;
    var onProgress;

    // 分片复制完成，开始 multipartComplete 操作
    ep.on('copy_slice_complete', function (UploadData) {
        var Parts = util.map(UploadData.PartList, function (item) {
            return {
                PartNumber: item.PartNumber,
                ETag: item.ETag,
            };
        });
        self.multipartComplete({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadData.UploadId,
            Parts: Parts,
        },function (err, data) {
            if (err) {
                onProgress(null, true);
                return callback(err);
            }
            onProgress({loaded: FileSize, total: FileSize}, true);
            callback(null, data);
        });
    });

    ep.on('get_copy_data_finish',function (UploadData) {
        Async.eachLimit(UploadData.PartList, ChunkParallel, function (SliceItem, asyncCallback) {
            var PartNumber = SliceItem.PartNumber;
            var CopySourceRange = SliceItem.CopySourceRange;
            var currentSize = SliceItem.end - SliceItem.start;
            var preAddSize = 0;

            copySliceItem.call(self, {
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                CopySource: CopySource,
                UploadId: UploadData.UploadId,
                PartNumber: PartNumber,
                CopySourceRange: CopySourceRange,
                onProgress: function (data) {
                    FinishSize += data.loaded - preAddSize;
                    preAddSize = data.loaded;
                    onProgress({loaded: FinishSize, total: FileSize});
                }
            },function (err,data) {
                if (err) return asyncCallback(err);
                onProgress({loaded: FinishSize, total: FileSize});

                FinishSize += currentSize - preAddSize;
                SliceItem.ETag = data.ETag;
                asyncCallback(err || null, data);
            });
        }, function (err) {
            if (err) {
                onProgress(null, true);
                return callback(err);
            }

            ep.emit('copy_slice_complete', UploadData);
        });
    });

    ep.on('get_file_size_finish', function (SourceHeaders) {
        // 控制分片大小
        (function () {
            var SIZE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1024 * 2, 1024 * 4, 1024 * 5];
            var AutoChunkSize = 1024 * 1024;
            for (var i = 0; i < SIZE.length; i++) {
                AutoChunkSize = SIZE[i] * 1024 * 1024;
                if (FileSize / AutoChunkSize <= self.options.MaxPartNumber) break;
            }
            params.ChunkSize = ChunkSize = Math.max(ChunkSize, AutoChunkSize);

            var ChunkCount = Math.ceil(FileSize / ChunkSize);

            var list = [];
            for (var partNumber = 1; partNumber <= ChunkCount; partNumber++) {
                var start = (partNumber - 1) * ChunkSize;
                var end = partNumber * ChunkSize < FileSize ? (partNumber * ChunkSize - 1) : FileSize - 1;
                var item = {
                    PartNumber: partNumber,
                    start: start,
                    end: end,
                    CopySourceRange: "bytes=" + start + "-" + end,
                };
                list.push(item);
            }
            params.PartList = list;
        })();

        var TargetHeader;
        if (params.Headers['x-cos-metadata-directive'] === 'Replaced') {
            TargetHeader = params.Headers;
        } else {
            TargetHeader = SourceHeaders;
        }
        TargetHeader['x-cos-storage-class'] = params.Headers['x-cos-storage-class'] || SourceHeaders['x-cos-storage-class'];
        TargetHeader = util.clearKey(TargetHeader);
        /**
         * 对于归档存储的对象，如果未恢复副本，则不允许 Copy
         */
        if (SourceHeaders['x-cos-storage-class'] === 'ARCHIVE' || SourceHeaders['x-cos-storage-class'] === 'DEEP_ARCHIVE') {
            var restoreHeader = SourceHeaders['x-cos-restore'];
            if (!restoreHeader || restoreHeader === 'ongoing-request="true"') {
                callback(util.error(new Error('Unrestored archive object is not allowed to be copied')));
                return;
            }
        }
        /**
         * 去除一些无用的头部，规避 multipartInit 出错
         * 这些头部通常是在 putObjectCopy 时才使用
         */
        delete TargetHeader['x-cos-copy-source'];
        delete TargetHeader['x-cos-metadata-directive'];
        delete TargetHeader['x-cos-copy-source-If-Modified-Since'];
        delete TargetHeader['x-cos-copy-source-If-Unmodified-Since'];
        delete TargetHeader['x-cos-copy-source-If-Match'];
        delete TargetHeader['x-cos-copy-source-If-None-Match'];
        self.multipartInit({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: TargetHeader,
        },function (err,data) {
            if (err) return callback(err);
            params.UploadId = data.UploadId;
            ep.emit('get_copy_data_finish', params);
        });
    });

    // 获取远端复制源文件的大小
    self.headObject({
        Bucket: SourceBucket,
        Region: SourceRegion,
        Key: SourceKey,
    },function(err, data) {
        if (err) {
            if (err.statusCode && err.statusCode === 404) {
                callback(util.error(err, {ErrorStatus: SourceKey + ' Not Exist'}));
            } else {
                callback(err);
            }
            return;
        }

        FileSize = params.FileSize = data.headers['content-length'];
        if (FileSize === undefined || !FileSize) {
            callback(util.error(new Error('get Content-Length error, please add "Content-Length" to CORS ExposeHeader setting.')));
            return;
        }

        onProgress = util.throttleOnProgress.call(self, FileSize, params.onProgress);

        // 开始上传
        if (FileSize <= CopySliceSize) {
            if (!params.Headers['x-cos-metadata-directive']) {
                params.Headers['x-cos-metadata-directive'] = 'Copy';
            }
            self.putObjectCopy(params, function (err, data) {
                if (err) {
                    onProgress(null, true);
                    return callback(err);
                }
                onProgress({loaded: FileSize, total: FileSize}, true);
                callback(err, data);
            });
        } else {
            var resHeaders = data.headers;
            var SourceHeaders = {
                'Cache-Control': resHeaders['cache-control'],
                'Content-Disposition': resHeaders['content-disposition'],
                'Content-Encoding': resHeaders['content-encoding'],
                'Content-Type': resHeaders['content-type'],
                'Expires': resHeaders['expires'],
                'x-cos-storage-class': resHeaders['x-cos-storage-class'],
            };
            util.each(resHeaders, function (v, k) {
                var metaPrefix = 'x-cos-meta-';
                if (k.indexOf(metaPrefix) === 0 && k.length > metaPrefix.length) {
                    SourceHeaders[k] = v;
                }
            });
            ep.emit('get_file_size_finish', SourceHeaders);
        }
    });
}

// 复制指定分片
function copySliceItem(params, callback) {
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var CopySource = params.CopySource;
    var UploadId = params.UploadId;
    var PartNumber = params.PartNumber * 1;
    var CopySourceRange = params.CopySourceRange;

    var ChunkRetryTimes = this.options.ChunkRetryTimes + 1;
    var self = this;

    Async.retry(ChunkRetryTimes, function (tryCallback) {
        self.uploadPartCopy({
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            CopySource: CopySource,
            UploadId: UploadId,
            PartNumber:PartNumber,
            CopySourceRange:CopySourceRange,
            onProgress:params.onProgress,
        },function (err,data) {
            tryCallback(err || null, data);
        })
    }, function (err, data) {
        return callback(err, data);
    });
}


var API_MAP = {
    sliceUploadFile: sliceUploadFile,
    abortUploadTask: abortUploadTask,
    uploadFiles: uploadFiles,
    sliceCopyFile: sliceCopyFile,
};

module.exports.init = function (COS, task) {
    task.transferToTaskMethod(API_MAP, 'sliceUploadFile');
    util.each(API_MAP, function (fn, apiName) {
        COS.prototype[apiName] = util.apiWrapper(apiName, fn);
    });
};

}, function(modId) { var map = {"./session":1654780339460,"./async":1654780339465,"./event":1654780339458,"./util":1654780339457}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339465, function(require, module, exports) {
var eachLimit = function (arr, limit, iterator, callback) {
    callback = callback || function () {};
    if (!arr.length || limit <= 0) {
        return callback();
    }

    var completed = 0;
    var started = 0;
    var running = 0;

    (function replenish () {
        if (completed >= arr.length) {
            return callback();
        }

        while (running < limit && started < arr.length) {
            started += 1;
            running += 1;
            iterator(arr[started - 1], function (err) {

                if (err) {
                    callback(err);
                    callback = function () {};
                } else {
                    completed += 1;
                    running -= 1;
                    if (completed >= arr.length) {
                        callback();
                    } else {
                        replenish();
                    }
                }
            });
        }
    })();
};

var retry = function (times, iterator, callback) {
    var next = function (index) {
        iterator(function (err, data) {
            if (err && index < times) {
                next(index + 1);
            } else {
                callback(err, data);
            }
        });
    };
    if (times < 1) {
        callback();
    } else {
        next(1);
    }
};

var async = {
    eachLimit: eachLimit,
    retry: retry
};

module.exports = async;
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339455);
})()
//miniprogram-npm-outsideDeps=["fs","crypto","xml2js","conf","request","mime-types","stream"]
//# sourceMappingURL=index.js.map