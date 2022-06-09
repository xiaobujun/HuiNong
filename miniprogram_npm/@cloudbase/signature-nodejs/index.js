module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339130, function(require, module, exports) {

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./keyvalue"));
__export(require("./signer"));
__export(require("./utils.http"));
__export(require("./utils.lang"));
__export(require("./utils"));
const signer_1 = require("./signer");
const utils_1 = require("./utils");
const clone = require('clone');
function sign(options) {
    const { secretId, secretKey, method, url } = options;
    const signer = new signer_1.Signer({ secretId, secretKey }, 'tcb');
    const headers = clone(options.headers || {});
    const params = clone(options.params || {});
    const timestamp = options.timestamp || utils_1.second() - 1;
    const signatureInfo = signer.tc3sign(method, url, headers, params, timestamp, {
        withSignedParams: options.withSignedParams
    });
    return {
        authorization: signatureInfo.authorization,
        timestamp: signatureInfo.timestamp,
        multipart: signatureInfo.multipart
    };
}
exports.sign = sign;

}, function(modId) {var map = {"./keyvalue":1654780339131,"./signer":1654780339133,"./utils.http":1654780339135,"./utils.lang":1654780339132,"./utils":1654780339134}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339131, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const utils_lang_1 = require("./utils.lang");
class SortedKeyValue {
    constructor(obj, selectkeys) {
        this._keys = [];
        this._values = [];
        this._pairs = [];
        this._obj = {};
        if (!utils_lang_1.isObject(obj)) {
            return this;
        }
        // https://stackoverflow.com/questions/5525795/does-javascript-guarantee-object-property-order
        // https://www.stefanjudis.com/today-i-learned/property-order-is-predictable-in-javascript-objects-since-es2015/
        Object.keys(obj || {}).sort((l, r) => {
            return l.toString().localeCompare(r);
        }).forEach(key => {
            if (!selectkeys || selectkeys.includes(key)) {
                this._keys.push(key);
                this._values.push(obj[key]);
                this._pairs.push([key, obj[key]]);
                this._obj[key.toLowerCase()] = obj[key];
            }
        });
    }
    static kv(obj, selectkeys) {
        return new SortedKeyValue(obj, selectkeys);
    }
    get(key) {
        return this._obj[key];
    }
    keys() {
        return this._keys;
    }
    values() {
        return this._values;
    }
    pairs() {
        return this._pairs;
    }
    toString(kvSeparator = '=', joinSeparator = '&') {
        return this._pairs.map((pair) => pair.join(kvSeparator)).join(joinSeparator);
    }
}
exports.SortedKeyValue = SortedKeyValue;

}, function(modId) { var map = {"./utils.lang":1654780339132}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339132, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
function isNumber(v) {
    return v === +v;
}
exports.isNumber = isNumber;
function isString(v) {
    return typeof v === 'string';
}
exports.isString = isString;
function isObject(v) {
    return v != null && typeof v === 'object' && Array.isArray(v) === false;
}
exports.isObject = isObject;
function isPlainObject(v) {
    return isObject(v) && [null, Object.prototype].includes(Object.getPrototypeOf(v));
}
exports.isPlainObject = isPlainObject;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339133, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const utils_1 = require("./utils");
const utils_lang_1 = require("./utils.lang");
const keyvalue_1 = require("./keyvalue");
const url_1 = require("url");
const debug = require('util').debuglog('@cloudbase/signature');
const isStream = require('is-stream');
exports.signedParamsSeparator = ';';
const HOST_KEY = 'host';
const CONTENT_TYPE_KEY = 'content-type';
var MIME;
(function (MIME) {
    MIME["MULTIPART_FORM_DATA"] = "multipart/form-data";
    MIME["APPLICATION_JSON"] = "application/json";
})(MIME || (MIME = {}));
class Signer {
    constructor(credential, service, options = {}) {
        this.credential = credential;
        this.service = service;
        this.algorithm = 'TC3-HMAC-SHA256';
        this.options = options;
    }
    static camSafeUrlEncode(str) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
    }
    /**
     * 将一个对象处理成 KeyValue 形式，嵌套的对象将会被处理成字符串，Key转换成小写字母
     * @param {Object}  obj - 待处理的对象
     * @param {Object}  options
     * @param {Boolean} options.enableBuffer
     */
    static formatKeyAndValue(obj, options = {}) {
        if (!utils_lang_1.isPlainObject(obj)) {
            return obj;
        }
        // enableValueToLowerCase：头部字段，要求小写，其他数据不需要小写，所以这里避免转小写
        const { multipart, enableValueToLowerCase = false, selectedKeys, filter } = options;
        const kv = {};
        Object.keys(obj || {}).forEach(key => {
            // NOTE: 客户端类型在服务端可能会丢失
            const lowercaseKey = Signer.camSafeUrlEncode(key.toLowerCase().trim());
            // 过滤 Key，服务端接收到的数据，可能含有未签名的 Key，通常是签名的时候被过滤掉的流，数据量可能会比较大
            // 所以这里提供一个过滤的判断，避免不必要的计算
            // istanbul ignore next
            if (Array.isArray(selectedKeys) && !selectedKeys.includes(lowercaseKey)) {
                return;
            }
            // istanbul ignore next
            if (typeof filter === 'function') {
                if (filter(key, obj[key], options)) {
                    return;
                }
            }
            // istanbul ignore else
            if (key && obj[key] !== undefined) {
                if (lowercaseKey === CONTENT_TYPE_KEY) {
                    // multipart/form-data; boundary=???
                    if (obj[key].startsWith(MIME.MULTIPART_FORM_DATA)) {
                        kv[lowercaseKey] = MIME.MULTIPART_FORM_DATA;
                    }
                    else {
                        kv[lowercaseKey] = obj[key];
                    }
                    return;
                }
                if (isStream(obj[key])) {
                    // 这里如果是个文件流，在发送的时候可以识别
                    // 服务端接收到数据之后传到这里判断不出来的
                    // 所以会进入后边的逻辑
                    return;
                }
                else if (utils_1.isNodeEnv() && Buffer.isBuffer(obj[key])) {
                    if (multipart) {
                        kv[lowercaseKey] = obj[key];
                    }
                    else {
                        kv[lowercaseKey] = enableValueToLowerCase
                            ? utils_1.stringify(obj[key]).trim().toLowerCase()
                            : utils_1.stringify(obj[key]).trim();
                    }
                }
                else {
                    kv[lowercaseKey] = enableValueToLowerCase
                        ? utils_1.stringify(obj[key]).trim().toLowerCase()
                        : utils_1.stringify(obj[key]).trim();
                }
            }
        });
        return kv;
    }
    static calcParamsHash(params, keys = null, options = {}) {
        debug(params, 'calcParamsHash');
        if (utils_lang_1.isString(params)) {
            return utils_1.sha256hash(params);
        }
        // 只关心业务参数，不关心以什么类型的 Content-Type 传递的
        // 所以 application/json multipart/form-data 计算方式是相同的
        keys = keys || keyvalue_1.SortedKeyValue.kv(params).keys();
        const hash = crypto.createHash('sha256');
        for (const key of keys) {
            // istanbul ignore next
            if (!params[key]) {
                continue;
            }
            // istanbul ignore next
            if (isStream(params[key])) {
                continue;
            }
            // string && buffer
            hash.update(`&${key}=`);
            hash.update(params[key]);
            hash.update('\r\n');
        }
        return hash.digest(options.encoding || 'hex');
    }
    /**
     * 计算签名信息
     * @param {string} method       - Http Verb：GET/get POST/post 区分大小写
     * @param {string} url          - 地址：http://abc.org/api/v1?a=1&b=2
     * @param {Object} headers      - 需要签名的头部字段
     * @param {string} params       - 请求参数
     * @param {number} [timestamp]  - 签名时间戳
     * @param {object} [options]    - 可选参数
     */
    tc3sign(method, url, headers, params, timestamp, options = {}) {
        timestamp = timestamp || utils_1.second();
        const urlInfo = url_1.parse(url);
        const formatedHeaders = Signer.formatKeyAndValue(headers, {
            enableValueToLowerCase: true
        });
        const headerKV = keyvalue_1.SortedKeyValue.kv(formatedHeaders);
        const signedHeaders = headerKV.keys();
        const canonicalHeaders = headerKV.toString(':', '\n') + '\n';
        const { enableHostCheck = true, enableContentTypeCheck = true } = options;
        if (enableHostCheck && headerKV.get(HOST_KEY) !== urlInfo.host) {
            throw new TypeError(`host:${urlInfo.host} in url must be equals to host:${headerKV.get('host')} in headers`);
        }
        if (enableContentTypeCheck && !headerKV.get(CONTENT_TYPE_KEY)) {
            throw new TypeError(`${CONTENT_TYPE_KEY} field must in headers`);
        }
        const multipart = headerKV.get(CONTENT_TYPE_KEY).startsWith(MIME.MULTIPART_FORM_DATA);
        const formatedParams = method.toUpperCase() === 'GET' ? '' : Signer.formatKeyAndValue(params, {
            multipart
        });
        const paramKV = keyvalue_1.SortedKeyValue.kv(formatedParams);
        const signedParams = paramKV.keys();
        const hashedPayload = Signer.calcParamsHash(formatedParams, null);
        const signedUrl = url.replace(/^https?:/, '').split('?')[0];
        const canonicalRequest = `${method}\n${signedUrl}\n${urlInfo.query || ''}\n${canonicalHeaders}\n${signedHeaders.join(';')}\n${hashedPayload}`;
        debug(canonicalRequest, 'canonicalRequest\n\n');
        const date = utils_1.formateDate(timestamp);
        const service = this.service;
        const algorithm = this.algorithm;
        const credentialScope = `${date}/${service}/tc3_request`;
        const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${utils_1.sha256hash(canonicalRequest)}`;
        debug(stringToSign, 'stringToSign\n\n');
        const secretDate = utils_1.sha256hmac(date, `TC3${this.credential.secretKey}`);
        const secretService = utils_1.sha256hmac(service, secretDate);
        const secretSigning = utils_1.sha256hmac('tc3_request', secretService);
        const signature = utils_1.sha256hmac(stringToSign, secretSigning, 'hex');
        debug(secretDate.toString('hex'), 'secretDate');
        debug(secretService.toString('hex'), 'secretService');
        debug(secretSigning.toString('hex'), 'secretSigning');
        debug(signature, 'signature');
        const { withSignedParams = false } = options;
        return {
            // 需注意该字段长度
            // https://stackoverflow.com/questions/686217/maximum-on-http-header-values
            // https://www.tutorialspoint.com/What-is-the-maximum-size-of-HTTP-header-values
            authorization: `${algorithm} Credential=${this.credential.secretId}/${credentialScope},${withSignedParams ? ` SignedParams=${signedParams.join(';')},` : ''} SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`,
            signedParams,
            signedHeaders,
            signature,
            timestamp,
            multipart
        };
    }
}
exports.Signer = Signer;

}, function(modId) { var map = {"./utils":1654780339134,"./utils.lang":1654780339132,"./keyvalue":1654780339131}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339134, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
function formateDate(timestamp) {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
}
exports.formateDate = formateDate;
function second() {
    // istanbul ignore next
    return Math.floor(new Date().getTime() / 1000);
}
exports.second = second;
function stringify(v) {
    return typeof v !== 'string' ? JSON.stringify(v) : v;
}
exports.stringify = stringify;
function sha256hash(string, encoding = 'hex') {
    return crypto
        .createHash('sha256')
        .update(string)
        .digest(encoding);
}
exports.sha256hash = sha256hash;
function sha256hmac(string, secret = '', encoding) {
    return crypto
        .createHmac('sha256', secret)
        .update(string)
        .digest(encoding);
}
exports.sha256hmac = sha256hmac;
function isNodeEnv() {
    return process && process.release && process.release.name === 'node';
}
exports.isNodeEnv = isNodeEnv;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339135, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const utils_lang_1 = require("./utils.lang");
const isStream = require('is-stream');
/**
 * 是否能够使用 FormData 发送数据
 * @param {any} data - 待发送的数据
 */
function canUseFormdata(data) {
    let enable = true;
    for (const key in data) {
        const value = data[key];
        if (!isStream(value) && (utils_1.isNodeEnv() && !Buffer.isBuffer(value)) && !utils_lang_1.isString(value) && !utils_lang_1.isNumber(value)) {
            enable = false;
            break;
        }
    }
    return enable;
}
exports.canUseFormdata = canUseFormdata;
/**
 * 是否一定要通过 FormData 发送数据
 * 如果有 Buffer 和 Stream 必须用 multipart/form-data，如果同时还含有
 * @param {any} data - 待发送的数据
 */
function mustUseFormdata(data) {
    let must = false;
    for (const key in data) {
        const value = data[key];
        if ((utils_1.isNodeEnv() && Buffer.isBuffer(value)) || isStream(value)) {
            must = true;
            break;
        }
    }
    return must;
}
exports.mustUseFormdata = mustUseFormdata;

}, function(modId) { var map = {"./utils":1654780339134,"./utils.lang":1654780339132}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339130);
})()
//miniprogram-npm-outsideDeps=["clone","crypto","url","util","is-stream"]
//# sourceMappingURL=index.js.map