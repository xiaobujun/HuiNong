module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339108, function(require, module, exports) {

const cloudbase_1 = require("./cloudbase");
const symbol_1 = require("./const/symbol");
const request_1 = require("./utils/request");
const { version } = require('../package.json');
module.exports = {
    request: request_1.extraRequest,
    init: (config) => {
        return new cloudbase_1.CloudBase(config);
    },
    parseContext: (context) => {
        // 校验context 是否正确
        return cloudbase_1.CloudBase.parseContext(context);
    },
    version,
    getCloudbaseContext: (context) => {
        return cloudbase_1.CloudBase.getCloudbaseContext(context);
    },
    /**
     * 云函数下获取当前env
     */
    SYMBOL_CURRENT_ENV: symbol_1.SYMBOL_CURRENT_ENV
};

}, function(modId) {var map = {"./cloudbase":1654780339109,"./const/symbol":1654780339116,"./utils/request":1654780339117,"../package.json":1654780339123}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339109, function(require, module, exports) {

var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@cloudbase/database");
const functions_1 = require("./functions");
const auth_1 = require("./auth");
const wx_1 = require("./wx");
const storage_1 = require("./storage");
const analytics_1 = require("./analytics");
const dbRequest_1 = require("./utils/dbRequest");
const log_1 = require("./log");
const code_1 = require("./const/code");
const utils_1 = require("./utils/utils");
const axios_1 = __importDefault(require("axios"));
class CloudBase {
    static parseContext(context) {
        if (typeof context !== 'object') {
            throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_CONTEXT, { message: 'context 必须为对象类型' }));
        }
        let { memory_limit_in_mb, time_limit_in_ms, request_id, environ, function_version, namespace, function_name, environment } = context;
        let parseResult = {};
        try {
            parseResult.memoryLimitInMb = memory_limit_in_mb;
            parseResult.timeLimitIns = time_limit_in_ms;
            parseResult.requestId = request_id;
            parseResult.functionVersion = function_version;
            parseResult.namespace = namespace;
            parseResult.functionName = function_name;
            // 存在environment 为新架构 上新字段 JSON序列化字符串
            if (environment) {
                parseResult.environment = JSON.parse(environment);
                return parseResult;
            }
            // 不存在environment 则为老字段，老架构上存在bug，无法识别value含特殊字符(若允许特殊字符，影响解析，这里特殊处理)
            const parseEnviron = environ.split(';');
            let parseEnvironObj = {};
            for (let i in parseEnviron) {
                // value含分号影响切割，未找到= 均忽略
                if (parseEnviron[i].indexOf('=') >= 0) {
                    const equalIndex = parseEnviron[i].indexOf('=');
                    const key = parseEnviron[i].slice(0, equalIndex);
                    let value = parseEnviron[i].slice(equalIndex + 1);
                    // value 含, 为数组
                    if (value.indexOf(',') >= 0) {
                        value = value.split(',');
                    }
                    parseEnvironObj[key] = value;
                }
            }
            parseResult.environ = parseEnvironObj;
        }
        catch (err) {
            throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_CONTEXT));
        }
        CloudBase.scfContext = parseResult;
        return parseResult;
    }
    /**
     * 获取当前函数内的所有环境变量(作为获取变量的统一方法，取值来源process.env 和 context)
     */
    static getCloudbaseContext(context) {
        // WX_CONTEXT_ENV  WX_APPID WX_OPENID WX_UNIONID WX_API_TOKEN
        // TCB_CONTEXT_ENV TCB_ENV TCB_SEQID TRIGGER_SRC LOGINTYPE QQ_OPENID QQ_APPID TCB_UUID TCB_ISANONYMOUS_USER TCB_SESSIONTOKEN TCB_CUSTOM_USER_ID TCB_SOURCE_IP TCB_SOURCE TCB_ROUTE_KEY TCB_HTTP_CONTEXT TCB_CONTEXT_CNFG
        // 解析process.env
        const { TENCENTCLOUD_RUNENV, SCF_NAMESPACE, TCB_CONTEXT_KEYS, TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN, TRIGGER_SRC, WX_CONTEXT_KEYS, WX_TRIGGER_API_TOKEN_V0, WX_CLIENTIP, WX_CLIENTIPV6, _SCF_TCB_LOG, TCB_CONTEXT_CNFG, LOGINTYPE } = process.env;
        let contextEnv = {};
        if (context) {
            const { environment, environ } = CloudBase.parseContext(context);
            contextEnv = environment || environ || {};
        }
        // 从TCB_CONTEXT_KEYS 和 WX_CONTEXT_KEYS中解析环境变量 取值优先级为 context > process.env
        const tcb_context_keys = contextEnv.TCB_CONTEXT_KEYS || TCB_CONTEXT_KEYS;
        const wx_context_keys = contextEnv.WX_CONTEXT_KEYS || WX_CONTEXT_KEYS;
        let rawContext = {
            TENCENTCLOUD_RUNENV,
            SCF_NAMESPACE,
            TCB_CONTEXT_KEYS,
            TENCENTCLOUD_SECRETID,
            TENCENTCLOUD_SECRETKEY,
            TENCENTCLOUD_SESSIONTOKEN,
            TRIGGER_SRC,
            WX_TRIGGER_API_TOKEN_V0,
            WX_CLIENTIP,
            WX_CLIENTIPV6,
            WX_CONTEXT_KEYS,
            _SCF_TCB_LOG,
            TCB_CONTEXT_CNFG,
            LOGINTYPE
        };
        // 遍历keys
        if (tcb_context_keys) {
            try {
                const tcbKeysList = tcb_context_keys.split(',');
                for (let item of tcbKeysList) {
                    rawContext[item] = contextEnv[item] || process.env[item];
                }
            }
            catch (e) { }
        }
        if (wx_context_keys) {
            try {
                const wxKeysList = wx_context_keys.split(',');
                for (let item of wxKeysList) {
                    rawContext[item] = contextEnv[item] || process.env[item];
                }
            }
            catch (e) { }
        }
        rawContext = Object.assign({}, rawContext, contextEnv);
        let finalContext = {};
        for (let key in rawContext) {
            if (rawContext[key] !== undefined) {
                finalContext[key] = rawContext[key];
            }
        }
        return finalContext;
    }
    constructor(config) {
        this.init(config);
    }
    init(config = {}) {
        let { debug, secretId, secretKey, sessionToken, env, timeout, headers = {}, throwOnCode } = config, restConfig = __rest(config, ["debug", "secretId", "secretKey", "sessionToken", "env", "timeout", "headers", "throwOnCode"]);
        if ((secretId && !secretKey) || (!secretId && secretKey)) {
            throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'secretId and secretKey must be a pair' }));
        }
        const newConfig = Object.assign({}, restConfig, { debug: !!debug, secretId: secretId, secretKey: secretKey, sessionToken: sessionToken, envName: env, headers: Object.assign({}, headers), timeout: timeout || 15000, throwOnCode: throwOnCode !== undefined ? throwOnCode : true });
        this.config = newConfig;
        this.extensionMap = {};
    }
    registerExtension(ext) {
        this.extensionMap[ext.name] = ext;
    }
    async invokeExtension(name, opts) {
        const ext = this.extensionMap[name];
        if (!ext) {
            throw Error(`扩展${name} 必须先注册`);
        }
        console.log(opts);
        return ext.invoke(opts, this);
    }
    database(dbConfig = {}) {
        database_1.Db.reqClass = dbRequest_1.DBRequest;
        // 兼容方法预处理
        if (Object.prototype.toString.call(dbConfig).slice(8, -1) !== 'Object') {
            throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'dbConfig must be an object' }));
        }
        if (dbConfig && dbConfig.env) {
            // env变量名转换
            dbConfig.envName = dbConfig.env;
            delete dbConfig.env;
        }
        return new database_1.Db(Object.assign({}, this.config, dbConfig));
    }
    /**
     * 调用云函数
     *
     * @param param0
     * @param opts
     */
    callFunction(callFunctionOptions, opts) {
        return functions_1.callFunction(this, callFunctionOptions, opts);
    }
    auth() {
        return auth_1.auth(this);
    }
    /**
     * openapi调用
     *
     * @param param0
     * @param opts
     */
    callWxOpenApi(wxOpenApiOptions, opts) {
        return wx_1.callWxOpenApi(this, wxOpenApiOptions, opts);
    }
    /**
     * wxpayapi调用
     *
     * @param param0
     * @param opts
     */
    callWxPayApi(wxOpenApiOptions, opts) {
        return wx_1.callWxPayApi(this, wxOpenApiOptions, opts);
    }
    /**
     * wxpayapi调用
     *
     * @param param0
     * @param opts
     */
    wxCallContainerApi(wxOpenApiOptions, opts) {
        return wx_1.wxCallContainerApi(this, wxOpenApiOptions, opts);
    }
    /**
     * 微信云调用
     *
     * @param param0
     * @param opts
     */
    callCompatibleWxOpenApi(wxOpenApiOptions, opts) {
        return wx_1.callCompatibleWxOpenApi(this, wxOpenApiOptions, opts);
    }
    /**
     * 上传文件
     *
     * @param param0
     * @param opts
     */
    uploadFile({ cloudPath, fileContent }, opts) {
        return storage_1.uploadFile(this, { cloudPath, fileContent }, opts);
    }
    /**
     * 删除文件
     *
     * @param param0
     * @param opts
     */
    deleteFile({ fileList }, opts) {
        return storage_1.deleteFile(this, { fileList }, opts);
    }
    /**
     * 获取临时连接
     *
     * @param param0
     * @param opts
     */
    getTempFileURL({ fileList }, opts) {
        return storage_1.getTempFileURL(this, { fileList }, opts);
    }
    /**
     * 下载文件
     *
     * @param params
     * @param opts
     */
    downloadFile(params, opts) {
        return storage_1.downloadFile(this, params, opts);
    }
    /**
     * 获取上传元数据
     *
     * @param param0
     * @param opts
     */
    getUploadMetadata({ cloudPath }, opts) {
        return storage_1.getUploadMetadata(this, { cloudPath }, opts);
    }
    getFileAuthority({ fileList }, opts) {
        return storage_1.getFileAuthority(this, { fileList }, opts);
    }
    /**
     * 获取logger
     *
     */
    logger() {
        if (!this.clsLogger) {
            this.clsLogger = log_1.logger();
        }
        return this.clsLogger;
    }
    analytics(reportData) {
        return analytics_1.analytics(this, reportData);
    }
    // shim for tcb extension ci
    get requestClient() {
        return {
            get: axios_1.default,
            post: axios_1.default,
            put: axios_1.default,
            delete: axios_1.default
        };
    }
}
exports.CloudBase = CloudBase;

}, function(modId) { var map = {"./functions":1654780339110,"./auth":1654780339124,"./wx":1654780339125,"./storage":1654780339126,"./analytics":1654780339127,"./utils/dbRequest":1654780339128,"./log":1654780339129,"./const/code":1654780339115,"./utils/utils":1654780339113}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339110, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const cloudbase_1 = require("../cloudbase");
/**
 * 调用云函数
 * @param {String} name  函数名
 * @param {Object} functionParam 函数参数
 * @return {Promise}
 */
async function callFunction(cloudbase, { name, qualifier, data }, opts) {
    const { TCB_ROUTE_KEY } = cloudbase_1.CloudBase.getCloudbaseContext();
    let transformData;
    try {
        transformData = data ? JSON.stringify(data) : '';
    }
    catch (e) {
        throw utils_1.E(Object.assign({}, e, { code: code_1.ERROR.INVALID_PARAM.code, message: '对象出现了循环引用' }));
    }
    if (!name) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '函数名不能为空' }));
    }
    const params = {
        action: 'functions.invokeFunction',
        function_name: name,
        qualifier: qualifier,
        // async: async,
        request_data: transformData
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: Object.assign({ 'content-type': 'application/json' }, (TCB_ROUTE_KEY ? { 'X-Tcb-Route-Key': TCB_ROUTE_KEY } : {}))
    }).then(res => {
        if (res.code) {
            return res;
        }
        let result;
        try {
            result = JSON.parse(res.data.response_data);
        }
        catch (e) {
            result = res.data.response_data;
        }
        return {
            result,
            requestId: res.requestId
        };
    });
}
exports.callFunction = callFunction;

}, function(modId) { var map = {"../utils/httpRequest":1654780339111,"../utils/utils":1654780339113,"../const/code":1654780339115,"../cloudbase":1654780339109}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339111, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const tracing_1 = require("./tracing");
const utils = __importStar(require("./utils"));
const code_1 = require("../const/code");
const symbol_1 = require("../const/symbol");
const cloudbase_1 = require("../cloudbase");
const request_1 = require("./request");
const requestHook_1 = require("./requestHook");
const wxCloudToken_1 = require("./wxCloudToken");
const signature_nodejs_1 = require("@cloudbase/signature-nodejs");
const url_1 = __importDefault(require("url"));
// import { version } from '../../package.json'
const secretManager_1 = __importDefault(require("./secretManager"));
const { version } = require('../../package.json');
const { E, second, processReturn, getServerInjectUrl } = utils;
class Request {
    constructor(args) {
        this.urlPath = '/admin';
        this.defaultTimeout = 15000;
        this.timestamp = new Date().valueOf();
        this.tracingInfo = tracing_1.generateTracingInfo();
        this.slowWarnTimer = null;
        // 请求参数
        this.hooks = {};
        this.args = args;
        this.config = args.config;
        this.opts = args.opts || {};
        this.secretManager = new secretManager_1.default();
    }
    /**
     * 最终发送请求
     */
    async request() {
        // 校验密钥是否存在
        await this.validateSecretIdAndKey();
        // 构造请求参数
        const params = await this.makeParams();
        const opts = await this.makeReqOpts(params);
        const action = this.getAction();
        const key = {
            functions: 'function_name',
            database: 'collectionName',
            wx: 'apiName'
        }[action.split('.')[0]];
        const argopts = this.opts;
        const config = this.config;
        // 发请求时未找到有效环境字段
        if (!params.envName) {
            // 检查config中是否有设置
            if (config.envName) {
                return processReturn(config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '未取到init 指定 env！' }));
            }
            else {
                console.warn(`当前未指定env，将默认使用第一个创建的环境！`);
            }
        }
        // 注意：必须初始化为 null
        let retryOptions = null;
        if (argopts.retryOptions) {
            retryOptions = argopts.retryOptions;
        }
        else if (config.retries && typeof config.retries === 'number') {
            retryOptions = { retries: config.retries };
        }
        return request_1.extraRequest(opts, {
            debug: config.debug,
            op: `${action}:${this.args.params[key]}@${params.envName}`,
            seqId: this.getSeqId(),
            retryOptions: retryOptions,
            timingsMeasurerOptions: config.timingsMeasurerOptions || {}
        }).then((response) => {
            this.slowWarnTimer && clearTimeout(this.slowWarnTimer);
            const { body } = response;
            if (response.statusCode === 200) {
                let res;
                try {
                    res = typeof body === 'string' ? JSON.parse(body) : body;
                    if (this.hooks && this.hooks.handleData) {
                        res = this.hooks.handleData(res, null, response, body);
                    }
                }
                catch (e) {
                    res = body;
                }
                return res;
            }
            else {
                const e = E({
                    code: response.statusCode,
                    message: ` ${response.statusCode} ${http_1.default.STATUS_CODES[response.statusCode]} | [${opts.url}]`
                });
                throw e;
            }
        });
    }
    setHooks(hooks) {
        Object.assign(this.hooks, hooks);
    }
    getSeqId() {
        return this.tracingInfo.seqId;
    }
    /**
     * 接口action
     */
    getAction() {
        const { params } = this.args;
        const { action } = params;
        return action;
    }
    /**
     * 设置超时warning
     */
    setSlowWarning(timeout) {
        const action = this.getAction();
        const { seqId } = this.tracingInfo;
        this.slowWarnTimer = setTimeout(() => {
            /* istanbul ignore next */
            const msg = `Your current request ${action ||
                ''} is longer than 3s, it may be due to the network or your query performance | [${seqId}]`;
            /* istanbul ignore next */
            console.warn(msg);
        }, timeout);
    }
    /**
     * 构造params
     */
    async makeParams() {
        const { TCB_SESSIONTOKEN, TCB_ENV, SCF_NAMESPACE } = cloudbase_1.CloudBase.getCloudbaseContext();
        const args = this.args;
        const opts = this.opts;
        const config = this.config;
        const { eventId } = this.tracingInfo;
        const crossAuthorizationData = opts.getCrossAccountInfo && (await opts.getCrossAccountInfo()).authorization;
        const { wxCloudApiToken, wxCloudbaseAccesstoken } = wxCloudToken_1.getWxCloudToken();
        const params = Object.assign({}, args.params, { envName: config.envName, eventId,
            wxCloudApiToken,
            wxCloudbaseAccesstoken, tcb_sessionToken: TCB_SESSIONTOKEN || '', sessionToken: config.sessionToken, crossAuthorizationToken: crossAuthorizationData
                ? Buffer.from(JSON.stringify(crossAuthorizationData)).toString('base64')
                : '' });
        // 取当前云函数环境时，替换为云函数下环境变量
        if (params.envName === symbol_1.SYMBOL_CURRENT_ENV) {
            params.envName = TCB_ENV || SCF_NAMESPACE;
        }
        // 过滤value undefined
        utils.filterUndefined(params);
        return params;
    }
    /**
     *  构造请求项
     */
    async makeReqOpts(params) {
        const config = this.config;
        const args = this.args;
        const isInternal = await utils.checkIsInternalAsync();
        const url = this.getUrl({ isInternal });
        const method = this.getMethod();
        const opts = {
            url: url,
            method,
            // 先取模块的timeout，没有则取sdk的timeout，还没有就使用默认值
            // timeout: args.timeout || config.timeout || 15000,
            timeout: this.getTimeout(),
            // 优先取config，其次取模块，最后取默认
            headers: await this.getHeaders(url),
            proxy: config.proxy
        };
        opts.keepalive = config.keepalive === true;
        if (args.method === 'post') {
            if (args.isFormData) {
                opts.formData = params;
                opts.encoding = null;
            }
            else {
                opts.body = params;
                opts.json = true;
            }
        }
        else {
            /* istanbul ignore next */
            opts.qs = params;
        }
        return opts;
    }
    /**
     * 协议
     */
    getProtocol() {
        return this.config.isHttp === true ? 'http' : 'https';
    }
    /**
     * 请求方法
     */
    getMethod() {
        return this.args.method || 'get';
    }
    /**
     * 超时时间
     */
    getTimeout() {
        const { opts = {} } = this.args;
        // timeout优先级 自定义接口timeout > config配置timeout > 默认timeout
        return opts.timeout || this.config.timeout || this.defaultTimeout;
    }
    /**
     * 校验密钥和token是否存在
     */
    async validateSecretIdAndKey() {
        const { TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN } = cloudbase_1.CloudBase.getCloudbaseContext(); // 放在此处是为了兼容本地环境下读环境变量
        const isInSCF = utils.checkIsInScf();
        const isInContainer = utils.checkIsInEks();
        let opts = this.opts;
        let getCrossAccountInfo = opts.getCrossAccountInfo || this.config.getCrossAccountInfo;
        /* istanbul ignore if  */
        if (getCrossAccountInfo) {
            let crossAccountInfo = await getCrossAccountInfo();
            let { credential } = await getCrossAccountInfo();
            let { secretId, secretKey, token } = credential || {};
            this.config = Object.assign({}, this.config, { secretId,
                secretKey, sessionToken: token });
            this.opts.getCrossAccountInfo = () => Promise.resolve(crossAccountInfo);
            if (!this.config.secretId || !this.config.secretKey) {
                throw E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'missing secretId or secretKey of tencent cloud' }));
            }
        }
        else {
            const { secretId, secretKey } = this.config;
            if (!secretId || !secretKey) {
                /* istanbul ignore if  */
                if (isInContainer) {
                    // 这种情况有可能是在容器内，此时尝试拉取临时
                    const tmpSecret = await this.secretManager.getTmpSecret();
                    this.config = Object.assign({}, this.config, { secretId: tmpSecret.id, secretKey: tmpSecret.key, sessionToken: tmpSecret.token });
                    return;
                }
                if (!TENCENTCLOUD_SECRETID || !TENCENTCLOUD_SECRETKEY) {
                    if (isInSCF) {
                        throw E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'missing authoration key, redeploy the function' }));
                    }
                    else {
                        throw E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'missing secretId or secretKey of tencent cloud' }));
                    }
                }
                else {
                    this.config = Object.assign({}, this.config, { secretId: TENCENTCLOUD_SECRETID, secretKey: TENCENTCLOUD_SECRETKEY, sessionToken: TENCENTCLOUD_SESSIONTOKEN });
                }
            }
        }
    }
    /**
     *
     * 获取headers 此函数中设置authorization
     */
    async getHeaders(url) {
        const config = this.config;
        const { secretId, secretKey } = config;
        const args = this.args;
        const method = this.getMethod();
        const { TCB_SOURCE } = cloudbase_1.CloudBase.getCloudbaseContext();
        // Note: 云函数被调用时可能调用端未传递 SOURCE，TCB_SOURCE 可能为空
        const SOURCE = utils.checkIsInScf() ? `${TCB_SOURCE || ''},scf` : ',not_scf';
        let requiredHeaders = {
            'User-Agent': `tcb-node-sdk/${version}`,
            'x-tcb-source': SOURCE,
            'x-client-timestamp': this.timestamp,
            'X-SDK-Version': `tcb-node-sdk/${version}`,
            Host: url_1.default.parse(url).host
        };
        if (config.version) {
            requiredHeaders['X-SDK-Version'] = config.version;
        }
        if (this.tracingInfo.trace) {
            requiredHeaders['x-tcb-tracelog'] = this.tracingInfo.trace;
        }
        const region = this.config.region || process.env.TENCENTCLOUD_REGION || '';
        if (region) {
            requiredHeaders['X-TCB-Region'] = region;
        }
        requiredHeaders = Object.assign({}, config.headers, args.headers, requiredHeaders);
        const { authorization, timestamp } = signature_nodejs_1.sign({
            secretId: secretId,
            secretKey: secretKey,
            method: method,
            url: url,
            params: await this.makeParams(),
            headers: requiredHeaders,
            withSignedParams: true,
            timestamp: second() - 1
        });
        requiredHeaders['Authorization'] = authorization;
        requiredHeaders['X-Signature-Expires'] = 600;
        requiredHeaders['X-Timestamp'] = timestamp;
        return Object.assign({}, requiredHeaders);
    }
    /**
     * 获取url
     * @param action
     */
    /* eslint-disable-next-line complexity */
    getUrl(options = {
        isInternal: false
    }) {
        if (utils.checkIsInScf()) {
            // 云函数环境下，应该包含以下环境变量，如果没有，后续逻辑可能会有问题
            if (!process.env.TENCENTCLOUD_REGION) {
                console.error('[ERROR] missing `TENCENTCLOUD_REGION` environment');
            }
            if (!process.env.SCF_NAMESPACE) {
                console.error('[ERROR] missing `SCF_NAMESPACE` environment');
            }
        }
        const { TCB_ENV, SCF_NAMESPACE } = cloudbase_1.CloudBase.getCloudbaseContext();
        // 优先级：用户配置 > 环境变量
        const region = this.config.region || process.env.TENCENTCLOUD_REGION || '';
        // 有地域信息则访问地域级别域名，无地域信息则访问默认域名，默认域名固定解析到上海地域保持兼容
        const internetRegionEndpoint = region
            ? `${region}.tcb-api.tencentcloudapi.com`
            : `tcb-api.tencentcloudapi.com`;
        const internalRegionEndpoint = region
            ? `internal.${region}.tcb-api.tencentcloudapi.com`
            : `internal.tcb-api.tencentcloudapi.com`;
        // 同地域走内网，跨地域走公网
        const isSameRegionVisit = this.config.region
            ? this.config.region === process.env.TENCENTCLOUD_REGION
            : true;
        const endpoint = isSameRegionVisit && (options.isInternal)
            ? internalRegionEndpoint
            : internetRegionEndpoint;
        const envName = this.config.envName || '';
        const currEnv = TCB_ENV || SCF_NAMESPACE || '';
        // 注意：特殊环境ID不能拼在请求地址的域名中，所以这里需要特殊处理
        const envId = envName === symbol_1.SYMBOL_CURRENT_ENV || utils.isPageModuleName(envName)
            ? currEnv
            : envName;
        const envEndpoint = utils.isValidEnvFormat(envId) ? `${envId}.${endpoint}` : endpoint;
        const protocol = options.isInternal ? 'http' : this.getProtocol();
        // 注意：云函数环境下有地域信息，云应用环境下不确定是否有，如果没有，用户必须显式的传入
        const defaultUrl = `${protocol}://${envEndpoint}${this.urlPath}`;
        const { eventId, seqId } = this.tracingInfo;
        const { serviceUrl } = this.config;
        const serverInjectUrl = getServerInjectUrl();
        const url = serviceUrl || serverInjectUrl || defaultUrl;
        const qs = cloudbase_1.CloudBase.scfContext
            ? `&eventId=${eventId}&seqId=${seqId}&scfRequestId=${cloudbase_1.CloudBase.scfContext.requestId}`
            : `&eventId=${eventId}&seqId=${seqId}`;
        return url.includes('?') ? `${url}${qs}` : `${url}?${qs}`;
    }
}
exports.Request = Request;
// 业务逻辑都放在这里处理
exports.default = async (args) => {
    const req = new Request(args);
    const config = args.config;
    const { action } = args.params;
    if (action === 'wx.openApi' || action === 'wx.wxPayApi') {
        req.setHooks({ handleData: requestHook_1.handleWxOpenApiData });
    }
    if (action.startsWith('database')) {
        req.setSlowWarning(3000);
    }
    try {
        const res = await req.request();
        // 检查res是否为return {code, message}回包
        if (res && res.code) {
            // 判断是否设置config._returnCodeByThrow = false
            return processReturn(config.throwOnCode, res);
        }
        return res;
    }
    finally {
        //
    }
};

}, function(modId) { var map = {"./tracing":1654780339112,"./utils":1654780339113,"../const/code":1654780339115,"../const/symbol":1654780339116,"../cloudbase":1654780339109,"./request":1654780339117,"./requestHook":1654780339120,"./wxCloudToken":1654780339121,"./secretManager":1654780339122,"../../package.json":1654780339123}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339112, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const cloudbase_1 = require("../cloudbase");
let seqNum = 0;
function getSeqNum() {
    return ++seqNum;
}
function generateEventId() {
    return Date.now().toString(16) + '_' + getSeqNum().toString(16);
}
exports.generateTracingInfo = () => {
    let { TCB_SEQID, TCB_TRACELOG } = cloudbase_1.CloudBase.getCloudbaseContext();
    TCB_SEQID = TCB_SEQID || '';
    const eventId = generateEventId();
    const seqId = TCB_SEQID ? `${TCB_SEQID}-${eventId}` : eventId;
    return { eventId, seqId, trace: TCB_TRACELOG };
};

}, function(modId) { var map = {"../cloudbase":1654780339109}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339113, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const cloudbase_1 = require("../cloudbase");
const metadata_1 = require("./metadata");
class TcbError extends Error {
    constructor(error) {
        super(error.message);
        this.code = error.code;
        this.message = error.message;
        this.requestId = error.requestId;
    }
}
exports.TcbError = TcbError;
function isAppId(appIdStr) {
    return /^[1-9][0-9]{4,64}$/gim.test(appIdStr);
}
exports.isAppId = isAppId;
exports.filterValue = function filterValue(o, value) {
    for (let key in o) {
        if (o[key] === value) {
            delete o[key];
        }
    }
};
exports.filterUndefined = function (o) {
    return exports.filterValue(o, undefined);
};
exports.E = (errObj) => {
    return new TcbError(errObj);
};
function isNonEmptyString(str) {
    return typeof str === 'string' && str !== '';
}
exports.isNonEmptyString = isNonEmptyString;
function checkIsInScf() {
    // TENCENTCLOUD_RUNENV
    return process.env.TENCENTCLOUD_RUNENV === 'SCF';
}
exports.checkIsInScf = checkIsInScf;
function checkIsInEks() {
    // EKS_CLUSTER_ID=cls-abcdefg
    // EKS_LOGS_xxx=
    // return isNonEmptyString(process.env.EKS_CLUSTER_ID)
    return !!process.env.KUBERNETES_SERVICE_HOST;
}
exports.checkIsInEks = checkIsInEks;
const kSumeruEnvSet = new Set(['formal', 'pre', 'test']);
function checkIsInSumeru() {
    // SUMERU_ENV=formal | test | pre
    return kSumeruEnvSet.has(process.env.SUMERU_ENV);
}
exports.checkIsInSumeru = checkIsInSumeru;
async function checkIsInTencentCloud() {
    return isNonEmptyString(await metadata_1.lookupAppId());
}
exports.checkIsInTencentCloud = checkIsInTencentCloud;
function second() {
    // istanbul ignore next
    return Math.floor(new Date().getTime() / 1000);
}
exports.second = second;
function processReturn(throwOnCode, res) {
    if (throwOnCode === false) {
        // 不抛报错，正常return，兼容旧逻辑
        return res;
    }
    throw exports.E(Object.assign({}, res));
}
exports.processReturn = processReturn;
function getServerInjectUrl() {
    const tcbContextConfig = getTcbContextConfig();
    return tcbContextConfig['URL'] || '';
}
exports.getServerInjectUrl = getServerInjectUrl;
function getTcbContextConfig() {
    try {
        const { TCB_CONTEXT_CNFG } = cloudbase_1.CloudBase.getCloudbaseContext();
        if (TCB_CONTEXT_CNFG) {
            // 检查约定环境变量字段是否存在
            return JSON.parse(TCB_CONTEXT_CNFG);
        }
        return {};
    }
    catch (e) {
        /* istanbul ignore next */
        console.log('parse context error...');
        /* istanbul ignore next */
        return {};
    }
}
exports.getTcbContextConfig = getTcbContextConfig;
/* istanbul ignore next */
function getWxUrl(config) {
    const protocal = config.isHttp === true ? 'http' : 'https';
    let wxUrl = protocal + '://tcb-open.tencentcloudapi.com/admin';
    if (checkIsInScf()) {
        wxUrl = 'http://tcb-open.tencentyun.com/admin';
    }
    return wxUrl;
}
exports.getWxUrl = getWxUrl;
function checkIsInternal() {
    return checkIsInScf() || checkIsInEks() || checkIsInSumeru();
}
exports.checkIsInternal = checkIsInternal;
function checkIsInternalAsync() {
    return checkIsInternal() ? Promise.resolve(true) : checkIsInTencentCloud();
}
exports.checkIsInternalAsync = checkIsInternalAsync;
function getCurrRunEnvTag() {
    if (checkIsInScf()) {
        return 'scf';
    }
    else if (checkIsInEks()) {
        return 'eks';
    }
    else if (checkIsInSumeru()) {
        return 'sumeru';
    }
    else if (checkIsInTencentCloud()) {
        return 'tencentcloud';
    }
    return 'unknown';
}
exports.getCurrRunEnvTag = getCurrRunEnvTag;
/**
 * 是否是场景模块名
 *
 * $: 前缀，表示SaaS场景模块名，非实际环境ID，当前通过特殊环境ID标识
 *
 * @param env
 * @returns
 */
function isPageModuleName(env = '') {
    return typeof env === 'string' && env.startsWith('$:');
}
exports.isPageModuleName = isPageModuleName;
// 20 + 1 + 16, 限制长度 40
const env_rule_reg = /^[a-z0-9_-]{1,40}$/;
function isValidEnvFormat(env = '') {
    return typeof env === 'string' && env_rule_reg.test(env);
}
exports.isValidEnvFormat = isValidEnvFormat;

}, function(modId) { var map = {"../cloudbase":1654780339109,"./metadata":1654780339114}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339114, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
exports.kMetadataBaseUrl = 'http://metadata.tencentyun.com';
var kMetadataVersions;
(function (kMetadataVersions) {
    kMetadataVersions["v20170919"] = "2017-09-19";
    kMetadataVersions["v1.0"] = "1.0";
    kMetadataVersions["latest"] = "latest";
})(kMetadataVersions = exports.kMetadataVersions || (exports.kMetadataVersions = {}));
function isAppId(appIdStr) {
    return /^[1-9][0-9]{4,64}$/gim.test(appIdStr);
}
exports.isAppId = isAppId;
async function lookup(path, options = {}) {
    const url = `${exports.kMetadataBaseUrl}/${kMetadataVersions.latest}/${path}`;
    const resp = await axios_1.default.get(url, options);
    if (resp.status === 200) {
        return resp.data;
    }
    else {
        throw new Error(`[ERROR] GET ${url} status: ${resp.status}`);
    }
}
exports.lookup = lookup;
const metadataCache = {
    appId: undefined
};
/**
 * lookupAppId - 该方法主要用于判断是否在云上环境
 * @returns
 */
async function lookupAppId() {
    if (metadataCache.appId === undefined) {
        metadataCache.appId = '';
        try {
            // 只有首次会请求且要求快速返回，超时时间很短，DNS无法解析将会超时返回
            // 在云环境中，这个时间通常在 10ms 内，部分耗时长（30+ms）的情况是 DNS 解析耗时长（27+ms）
            const appId = await lookup('meta-data/app-id', { timeout: 30 });
            if (isAppId(appId)) {
                metadataCache.appId = appId;
            }
        }
        catch (e) {
            // ignore
        }
    }
    return metadataCache.appId || '';
}
exports.lookupAppId = lookupAppId;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339115, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR = {
    INVALID_PARAM: {
        code: 'INVALID_PARAM',
        message: 'invalid param'
    },
    SYS_ERR: {
        code: 'SYS_ERR',
        message: 'system error'
    },
    STORAGE_REQUEST_FAIL: {
        code: 'STORAGE_REQUEST_FAIL',
        message: 'storage request fail'
    },
    STORAGE_FILE_NONEXIST: {
        code: 'STORAGE_FILE_NONEXIST',
        message: 'storage file not exist'
    },
    TCB_CLS_UNOPEN: {
        code: 'TCB_CLS_UNOPEN',
        message: '需要先开通日志检索功能'
    },
    INVALID_CONTEXT: {
        code: 'INVALID_CONTEXT',
        message: '无效的context对象，请使用 云函数入口的context参数'
    }
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339116, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.SYMBOL_CURRENT_ENV = Symbol.for("SYMBOL_CURRENT_ENV");

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339117, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const request_1 = __importDefault(require("request"));
const retry_1 = require("./retry");
const request_timings_measurer_1 = require("./request-timings-measurer");
const agentkeepalive_1 = __importStar(require("agentkeepalive"));
const SAFE_RETRY_CODE_SET = new Set([
    'ENOTFOUND',
    'ENETDOWN',
    'EHOSTDOWN',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'ECONNREFUSED'
]);
const RETRY_CODE_SET = new Set(['ECONNRESET', 'ESOCKETTIMEDOUT']);
const RETRY_STATUS_CODE_SET = new Set([]);
/* istanbul ignore next */
function shouldRetry(e, result, operation) {
    // 重试的错误码
    if (e && SAFE_RETRY_CODE_SET.has(e.code)) {
        return {
            retryAble: true,
            message: e.message
        };
    }
    // 连接超时
    if (e && e.code === 'ETIMEDOUT' && e.connect === true) {
        return {
            retryAble: true,
            message: e.message
        };
    }
    // 重试的状态码
    if (result && RETRY_STATUS_CODE_SET.has(result.statusCode)) {
        return {
            retryAble: true,
            message: `${result.request.method} ${result.request.href} ${result.statusCode} ${http_1.default.STATUS_CODES[result.statusCode]}`
        };
    }
    return {
        retryAble: false,
        message: ''
    };
}
/* istanbul ignore next */
function requestWithTimingsMeasure(opts, extraOptions) {
    return new Promise((resolve, reject) => {
        const timingsMeasurerOptions = extraOptions.timingsMeasurerOptions || {};
        const { waitingTime = 1000, interval = 200, enable = !!extraOptions.debug } = timingsMeasurerOptions;
        const timingsMeasurer = request_timings_measurer_1.RequestTimgingsMeasurer.new({
            waitingTime,
            interval,
            enable
        });
        timingsMeasurer.on('progress', (timings, reason = '') => {
            const timingsLine = `s:${timings.socket || '-'}|l:${timings.lookup ||
                '-'}|c:${timings.connect || '-'}|r:${timings.ready || '-'}|w:${timings.waiting ||
                '-'}|d:${timings.download || '-'}|e:${timings.end || '-'}|E:${timings.error || '-'}`;
            console.warn(`[RequestTimgings][${extraOptions.op || ''}] spent ${Date.now() -
                timings.start}ms(${timingsLine}) [${extraOptions.seqId}][${extraOptions.attempts || 1}][${reason}]`);
        });
        if (opts.keepalive) {
            ;
            opts.agentClass = opts.url.startsWith('https')
                ? agentkeepalive_1.HttpsAgent
                : agentkeepalive_1.default;
            opts.agentOptions = {
                // keepAlive: true,
                keepAliveMsecs: 3000,
                maxSockets: 100,
                maxFreeSockets: 10,
                freeSocketTimeout: 20000,
                timeout: 20000,
                socketActiveTTL: null
            };
        }
        ;
        (function r(times) {
            const clientRequest = request_1.default(opts, function (err, response, body) {
                const reusedSocket = !!(clientRequest && clientRequest.req && clientRequest.req.reusedSocket);
                if (err && extraOptions.debug) {
                    console.warn(`[RequestTimgings][keepalive:${opts.keepalive}][reusedSocket:${reusedSocket}][times:${times}][code:${err.code}][message:${err.message}]${opts.url}`);
                }
                if (err && err.code === 'ECONNRESET' && reusedSocket && times >= 0 && opts.keepalive) {
                    return r(--times);
                }
                return err ? reject(err) : resolve(response);
            });
            if ((request_1.default.Request && clientRequest instanceof request_1.default.Request) ||
                clientRequest instanceof http_1.default.ClientRequest) {
                timingsMeasurer.measure(clientRequest);
            }
        }(1));
    });
}
exports.requestWithTimingsMeasure = requestWithTimingsMeasure;
function extraRequest(opts, extraOptions) {
    if (extraOptions && extraOptions.retryOptions) {
        return retry_1.withRetry(attempts => {
            return requestWithTimingsMeasure(opts, Object.assign({}, extraOptions, { attempts }));
        }, Object.assign({ shouldRetry }, extraOptions.retryOptions));
    }
    else {
        return requestWithTimingsMeasure(opts, Object.assign({}, extraOptions, { attempts: 1 }));
    }
}
exports.extraRequest = extraRequest;

}, function(modId) { var map = {"request":1654780339117,"./retry":1654780339118,"./request-timings-measurer":1654780339119}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339118, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const retry_1 = __importDefault(require("retry"));
// import { RetryOperation } from 'retry/lib/retry_operation'
const RetryOperation = require('retry/lib/retry_operation');
/* istanbul ignore next */
function defaultShouldRetry(e, result) {
    return { retryAble: false, message: '' };
}
/**
 * withRetry 重试封装函数
 * @param fn
 * @param retryOptions
 */
/* istanbul ignore next */
function withRetry(fn, retryOptions) {
    // 默认不重试，0 表达未开启的含义，所以直接返回 promise
    if (!retryOptions || retryOptions.retries === 0) {
        return fn();
    }
    // 默认重试策略采取指数退避策略，超时时间计算公式及参数可查文档
    // https://github.com/tim-kos/node-retry/
    // 自定重试时间：
    // timeouts: [1000, 2000, 4000, 8000]
    const timeouts = retryOptions.timeouts
        ? [...retryOptions.timeouts]
        : retry_1.default.timeouts(retryOptions);
    const operation = new RetryOperation(timeouts, {
        forever: retryOptions.forever,
        unref: retryOptions.unref,
        maxRetryTime: retryOptions.maxRetryTime // 重试总的时间，单位毫秒，默认：Infinity
    });
    const shouldRetry = retryOptions.shouldRetry || defaultShouldRetry;
    return new Promise((resolve, reject) => {
        const isReadyToRetry = (e, resp, operation) => {
            // 外层有效识别需要或者能够进行重试
            // shouldRetry 中可调用 operation.stop 停掉重试，operation.retry 返回 false
            const { retryAble, message } = shouldRetry(e, resp, operation);
            const info = {};
            info.nth = operation.attempts();
            info.at = new Date();
            info.message = message;
            // 双重条件判断是否重试，外层判断满足条件与否，还需判断是否满足再次重试条件
            const readyToRetry = retryAble && operation.retry(Object.assign({}, info));
            if (!readyToRetry) {
                // 如果不准备进行重试，并且尝试不止一次
                // 最后一个错误记录重试信息
                const ref = e || resp;
                if (ref && operation.attempts() > 1) {
                    ref.attempt = {};
                    ref.attempt.timeouts = operation._originalTimeouts;
                    ref.attempt.attempts = operation.attempts();
                    ref.attempt.errors = operation.errors();
                    // 如果最后一次因为 !retryAble 而没有进行重试
                    // ref.attempt.errors 中将缺少最后的这个错误
                    // ref.attempt.errors 中包含最后一次错误信息
                    if (!retryAble) {
                        ref.attempt.errors.push(info);
                    }
                }
            }
            return readyToRetry;
        };
        operation.attempt(async () => {
            try {
                const result = await fn(operation.attempts());
                if (!isReadyToRetry(null, result, operation)) {
                    resolve(result);
                }
            }
            catch (e) {
                try {
                    if (!isReadyToRetry(e, null, operation)) {
                        reject(e);
                    }
                }
                catch (e) {
                    reject(e);
                }
            }
        }, retryOptions.timeoutOps);
    });
}
exports.withRetry = withRetry;

}, function(modId) { var map = {"retry":1654780339118}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339119, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require('events').EventEmitter;
class RequestTimgingsMeasurer extends EventEmitter {
    constructor(options) {
        super();
        this.e = null;
        this.timings = {
        // start: 0,
        // lookup: -1,
        // connect: -1,
        // ready: -1,
        // waiting: -1,
        // download: -1,
        // end: -1
        };
        this.e = null;
        this.enable = options.enable === true;
        this.timerStarted = false;
        this.intervalId = null;
        this.timeoutId = null;
        this.waitingTime = options.waitingTime || 1000;
        this.interval = options.interval || 200;
    }
    static new(options) {
        return new RequestTimgingsMeasurer(options);
    }
    /* istanbul ignore next */
    measure(clientRequest) {
        if (!this.enable) {
            return;
        }
        this.startTimer();
        const timings = this.timings;
        timings.start = Date.now();
        clientRequest
            .once('response', message => {
            timings.response = Date.now();
            timings.waiting = Date.now() - timings.start;
            message.once('end', () => {
                timings.socket = timings.socket || 0;
                // timings.lookup = timings.lookup || timings.socket
                // timings.connect = timings.connect || timings.lookup
                timings.download = Date.now() - timings.response;
                timings.end = Date.now() - timings.start;
                this.stopTimer('end');
            });
        })
            .once('socket', socket => {
            timings.socket = Date.now() - timings.start;
            const onlookup = () => {
                this.timings.lookup = Date.now() - this.timings.start;
            };
            const onconnect = () => {
                this.timings.connect = Date.now() - this.timings.start;
            };
            const onready = () => {
                this.timings.ready = Date.now() - this.timings.start;
            };
            if (socket.connecting) {
                socket.once('lookup', onlookup);
                socket.once('connect', onconnect);
                socket.once('ready', onready);
                socket.once('error', e => {
                    socket.off('lookup', onlookup);
                    socket.off('connect', onconnect);
                    socket.off('ready', onready);
                    this.e = e;
                    this.timings.error = Date.now() - this.timings.start;
                    this.stopTimer(`ee:${e.message}`);
                });
            }
            else {
                this.timings.lookup = -1;
                this.timings.connect = -1;
                this.timings.ready = -1;
            }
            // socket.once('data', () => {})
            // socket.once('drain', () => {})
            // socket.once('end', () => {
            //   this.stopTimer('end')
            // })
            // socket.once('timeout', () => {
            //   this.timings.timeout = Date.now() - this.timings.start
            // })
        })
            .on('error', (e) => {
            this.stopTimer(`ee:${e.message}`);
        });
    }
    /* istanbul ignore next */
    startTimer() {
        if (!this.enable) {
            return;
        }
        if (this.timerStarted) {
            return;
        }
        this.timerStarted = true;
        this.intervalId = null;
        this.timeoutId = setTimeout(() => {
            this.process('inprogress');
            this.intervalId = setInterval(() => {
                this.process('inprogress');
            }, this.interval);
        }, this.waitingTime);
    }
    /* istanbul ignore next */
    stopTimer(reason) {
        // if (!this.enable) {
        //   return
        // }
        // if (!this.timerStarted) {
        //   return
        // }
        this.timerStarted = false;
        clearTimeout(this.timeoutId);
        clearInterval(this.intervalId);
        this.process(reason);
    }
    /* istanbul ignore next */
    process(reason) {
        this.emit('progress', Object.assign({}, this.timings), reason);
    }
}
exports.RequestTimgingsMeasurer = RequestTimgingsMeasurer;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339120, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 处理wxopenapi返回
 *
 * @param err
 * @param response
 * @param body
 */
exports.handleWxOpenApiData = (res, err, response, body) => {
    // wx.openApi 调用时，需用content-type区分buffer or JSON
    const { headers } = response;
    let transformRes = res;
    if (headers['content-type'] === 'application/json; charset=utf-8') {
        transformRes = JSON.parse(transformRes.toString()); // JSON错误时buffer转JSON
    }
    return transformRes;
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339121, function(require, module, exports) {

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// 由定时触发器触发时（TRIGGER_SRC=timer）：优先使用 WX_TRIGGER_API_TOKEN_V0，不存在的话，为了兼容兼容旧的开发者工具，也是使用 WX_API_TOKEN
// 非定时触发器触发时（TRIGGER_SRC!=timer）: 使用 WX_API_TOKEN
const cloudbase_1 = require("../cloudbase");
const utils = __importStar(require("./utils"));
const fs = __importStar(require("fs"));
exports.CLOUDBASE_ACCESS_TOKEN_PATH = '/.tencentcloudbase/wx/cloudbase_access_token';
function getWxCloudToken() {
    const { TRIGGER_SRC, WX_TRIGGER_API_TOKEN_V0, WX_API_TOKEN, WX_CLOUDBASE_ACCESSTOKEN = '' } = cloudbase_1.CloudBase.getCloudbaseContext();
    const wxCloudToken = {};
    if (TRIGGER_SRC === 'timer') {
        wxCloudToken.wxCloudApiToken = WX_TRIGGER_API_TOKEN_V0 || WX_API_TOKEN || '';
    }
    else {
        wxCloudToken.wxCloudApiToken = WX_API_TOKEN || '';
    }
    // 只在不存在 wxCloudApiToken 时，才尝试读取 wxCloudbaseAccesstoken
    if (!wxCloudToken.wxCloudApiToken) {
        wxCloudToken.wxCloudbaseAccesstoken = WX_CLOUDBASE_ACCESSTOKEN || loadWxCloudbaseAccesstoken();
    }
    return wxCloudToken;
}
exports.getWxCloudToken = getWxCloudToken;
const maxCacheAge = 10 * 60 * 1000;
const cloudbaseAccessTokenInfo = { token: '', timestamp: 0 };
function loadWxCloudbaseAccesstoken() {
    if (cloudbaseAccessTokenInfo.token && Date.now() - cloudbaseAccessTokenInfo.timestamp < maxCacheAge) {
        return cloudbaseAccessTokenInfo.token;
    }
    try {
        if (utils.checkIsInEks() && fs.existsSync(exports.CLOUDBASE_ACCESS_TOKEN_PATH)) {
            cloudbaseAccessTokenInfo.token = fs.readFileSync(exports.CLOUDBASE_ACCESS_TOKEN_PATH).toString();
            cloudbaseAccessTokenInfo.timestamp = Date.now();
            return cloudbaseAccessTokenInfo.token;
        }
    }
    catch (e) {
        console.warn('[ERROR]: loadWxCloudbaseAccesstoken error: ', e.message);
    }
    return '';
}
exports.loadWxCloudbaseAccesstoken = loadWxCloudbaseAccesstoken;

}, function(modId) { var map = {"../cloudbase":1654780339109,"./utils":1654780339113}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339122, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const metadata_1 = require("./metadata");
/**
 * 容器托管内的密钥管理器
 */
class SecretManager {
    constructor() {
        this.TMP_SECRET_URL = `${metadata_1.kMetadataBaseUrl}/meta-data/cam/security-credentials/TCB_QcsRole`;
        this.tmpSecret = null;
    }
    /* istanbul ignore next */
    async getTmpSecret() {
        if (this.tmpSecret) {
            const now = new Date().getTime();
            const expire = this.tmpSecret.expire * 1000;
            const oneHour = 3600 * 1000;
            if (now < expire - oneHour) {
                // 密钥没过期
                return this.tmpSecret;
            }
            else {
                // 密钥过期
                return this.fetchTmpSecret();
            }
        }
        else {
            return this.fetchTmpSecret();
        }
    }
    /* istanbul ignore next */
    async fetchTmpSecret() {
        const body = await this.get(this.TMP_SECRET_URL);
        const payload = JSON.parse(body);
        this.tmpSecret = {
            id: payload.TmpSecretId,
            key: payload.TmpSecretKey,
            expire: payload.ExpiredTime,
            token: payload.Token
        };
        return this.tmpSecret;
    }
    /* istanbul ignore next */
    get(url) {
        return new Promise((resolve, reject) => {
            request_1.default.get(url, (err, res, body) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(body);
                }
            });
        });
    }
}
exports.default = SecretManager;

}, function(modId) { var map = {"request":1654780339117,"./metadata":1654780339114}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339123, function(require, module, exports) {
module.exports = {
    "name": "@cloudbase/node-sdk",
    "version": "2.8.1",
    "description": "tencent cloud base server sdk for node.js",
    "main": "lib/index.js",
    "scripts": {
        "eslint": "eslint \"./**/*.ts\"",
        "eslint-fix": "eslint --fix \"./**/*.ts\"",
        "build": "rm -rf lib/* && npm run tsc",
        "tsc": "tsc -p tsconfig.json",
        "tsc:w": "tsc -p tsconfig.json -w",
        "tstest": "mocha --timeout 5000 --require espower-typescript/guess test/**/*.test.ts",
        "test": "jest --detectOpenHandles --verbose --coverage --runInBand",
        "coverage": "jest --detectOpenHandles --coverage",
        "coveralls": "cat ./coverage/lcov.info | coveralls"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/TencentCloudBase/node-sdk"
    },
    "bugs": {
        "url": "https://github.com/TencentCloudBase/node-sdk/issues"
    },
    "homepage": "https://github.com/TencentCloudBase/node-sdk#readme",
    "keywords": [
        "node sdk"
    ],
    "author": "lukejyhuang",
    "license": "MIT",
    "typings": "types/index.d.ts",
    "dependencies": {
        "@cloudbase/database": "1.4.0",
        "@cloudbase/signature-nodejs": "1.0.0-beta.0",
        "@types/retry": "^0.12.0",
        "agentkeepalive": "^4.1.3",
        "axios": "^0.21.1",
        "is-regex": "^1.0.4",
        "jsonwebtoken": "^8.5.1",
        "lodash.merge": "^4.6.1",
        "request": "^2.87.0",
        "request-promise": "^4.2.5",
        "retry": "^0.12.0",
        "ts-node": "^8.10.2",
        "xml2js": "^0.4.19"
    },
    "devDependencies": {
        "@types/jest": "^23.1.4",
        "@types/mocha": "^5.2.4",
        "@types/node": "^10.12.12",
        "@typescript-eslint/eslint-plugin": "^2.16.0",
        "@typescript-eslint/parser": "^2.16.0",
        "babel-eslint": "^10.0.3",
        "coveralls": "^3.0.9",
        "dumper.js": "^1.3.0",
        "eslint": "^7.1.0",
        "eslint-config-alloy": "^3.5.0",
        "eslint-plugin-prettier": "^3.1.2",
        "husky": "^3.1.0",
        "jest": "^23.3.0",
        "lint-staged": "^9.2.5",
        "mocha": "^5.2.0",
        "power-assert": "^1.5.0",
        "prettier": "^1.19.1",
        "ts-jest": "^23.10.4",
        "tslib": "^1.7.1",
        "typescript": "3.5.3"
    },
    "engines": {
        "node": ">=8.6.0"
    },
    "husky": {
        "hooks": {
            "pre-commit": "npm run build && git add . && lint-staged"
        }
    },
    "lint-staged": {
        "*.ts": [
            "eslint --fix",
            "git add"
        ]
    }
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339124, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const cloudbase_1 = require("../cloudbase");
const symbol_1 = require("../const/symbol");
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const checkCustomUserIdRegex = /^[a-zA-Z0-9_\-#@~=*(){}[\]:.,<>+]{4,32}$/;
function validateUid(uid) {
    if (typeof uid !== 'string') {
        // console.log('debug:', { ...ERROR.INVALID_PARAM, message: 'uid must be a string' })
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'uid must be a string' }));
    }
    if (!checkCustomUserIdRegex.test(uid)) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: `Invalid uid: "${uid}"` }));
    }
}
function auth(cloudbase) {
    return {
        getUserInfo() {
            const { WX_OPENID, WX_APPID, TCB_UUID, TCB_CUSTOM_USER_ID, TCB_ISANONYMOUS_USER } = cloudbase_1.CloudBase.getCloudbaseContext();
            return {
                openId: WX_OPENID || '',
                appId: WX_APPID || '',
                uid: TCB_UUID || '',
                customUserId: TCB_CUSTOM_USER_ID || '',
                isAnonymous: TCB_ISANONYMOUS_USER === 'true' ? true : false
            };
        },
        getEndUserInfo(uid, opts) {
            const { WX_OPENID, WX_APPID, TCB_UUID, TCB_CUSTOM_USER_ID, TCB_ISANONYMOUS_USER } = cloudbase_1.CloudBase.getCloudbaseContext();
            const defaultUserInfo = {
                openId: WX_OPENID || '',
                appId: WX_APPID || '',
                uid: TCB_UUID || '',
                customUserId: TCB_CUSTOM_USER_ID || '',
                isAnonymous: TCB_ISANONYMOUS_USER === 'true' ? true : false
            };
            if (uid === undefined) {
                return {
                    userInfo: defaultUserInfo
                };
            }
            validateUid(uid);
            const params = {
                action: 'auth.getUserInfoForAdmin',
                uuid: uid
            };
            return httpRequest_1.default({
                config: cloudbase.config,
                params,
                method: 'post',
                opts,
                headers: {
                    'content-type': 'application/json'
                }
            }).then(res => {
                if (res.code) {
                    return res;
                }
                return {
                    userInfo: Object.assign({}, defaultUserInfo, res.data),
                    requestId: res.requestId
                };
            });
        },
        queryUserInfo(query, opts) {
            const { uid, platform, platformId } = query;
            const params = {
                action: 'auth.getUserInfoForAdmin',
                uuid: uid,
                platform,
                platformId
            };
            return httpRequest_1.default({
                config: cloudbase.config,
                params,
                method: 'post',
                opts,
                headers: {
                    'content-type': 'application/json'
                }
            }).then(res => {
                if (res.code) {
                    return res;
                }
                return {
                    userInfo: Object.assign({}, res.data),
                    requestId: res.requestId
                };
            });
        },
        async getAuthContext(context) {
            const { TCB_UUID, LOGINTYPE, QQ_OPENID, QQ_APPID } = cloudbase_1.CloudBase.getCloudbaseContext(context);
            const res = {
                uid: TCB_UUID,
                loginType: LOGINTYPE
            };
            if (LOGINTYPE === 'QQ-MINI') {
                res.appId = QQ_APPID;
                res.openId = QQ_OPENID;
            }
            return res;
        },
        getClientIP() {
            const { TCB_SOURCE_IP } = cloudbase_1.CloudBase.getCloudbaseContext();
            return TCB_SOURCE_IP || '';
        },
        createTicket: (uid, options = {}) => {
            validateUid(uid);
            const timestamp = new Date().getTime();
            const { TCB_ENV, SCF_NAMESPACE } = cloudbase_1.CloudBase.getCloudbaseContext();
            const { credentials } = cloudbase.config;
            const { env_id } = credentials;
            let { envName } = cloudbase.config;
            if (!envName) {
                throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'no env in config' }));
            }
            // 检查credentials 是否包含env
            if (!env_id) {
                throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '当前私钥未包含env_id 信息， 请前往腾讯云云开发控制台，获取自定义登录最新私钥' }));
            }
            // 使用symbol时替换为环境变量内的env
            if (envName === symbol_1.SYMBOL_CURRENT_ENV) {
                envName = TCB_ENV || SCF_NAMESPACE;
            }
            // 检查 credentials env 和 init 指定env 是否一致
            if (env_id && env_id !== envName) {
                throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '当前私钥所属环境与 init 指定环境不一致！' }));
            }
            const { refresh = 3600 * 1000, expire = timestamp + 7 * 24 * 60 * 60 * 1000 } = options;
            const token = jsonwebtoken_1.default.sign({
                alg: 'RS256',
                env: envName,
                iat: timestamp,
                exp: timestamp + 10 * 60 * 1000,
                uid,
                refresh,
                expire
            }, credentials.private_key, { algorithm: 'RS256' });
            return credentials.private_key_id + '/@@/' + token;
        }
    };
}
exports.auth = auth;

}, function(modId) { var map = {"../utils/utils":1654780339113,"../const/code":1654780339115,"../cloudbase":1654780339109,"../const/symbol":1654780339116,"../utils/httpRequest":1654780339111}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339125, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
function validateCrossAccount(config, opts = {}) {
    let getCrossAccountInfo = opts.getCrossAccountInfo || config.getCrossAccountInfo;
    if (getCrossAccountInfo) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'invalid config: getCrossAccountInfo' }));
    }
}
async function callWxOpenApi(cloudbase, { apiName, apiOptions, cgiName, requestData }, opts) {
    let transformRequestData;
    try {
        transformRequestData = requestData ? JSON.stringify(requestData) : '';
    }
    catch (e) {
        throw utils_1.E(Object.assign({}, e, { code: code_1.ERROR.INVALID_PARAM.code, message: '对象出现了循环引用' }));
    }
    validateCrossAccount(cloudbase.config, opts);
    const params = {
        action: 'wx.api',
        apiName,
        apiOptions,
        cgiName,
        requestData: transformRequestData
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        if (res.code) {
            return res;
        }
        let result;
        try {
            result = JSON.parse(res.data.responseData);
        }
        catch (e) {
            result = res.data.responseData;
        }
        return {
            result,
            requestId: res.requestId
        };
        // }
    });
}
exports.callWxOpenApi = callWxOpenApi;
/**
 * 调用wxopenAPi
 * @param {String} apiName  接口名
 * @param {Buffer} requestData
 * @return {Promise} 正常内容为buffer，报错为json {code:'', message:'', resquestId:''}
 */
async function callCompatibleWxOpenApi(cloudbase, { apiName, apiOptions, cgiName, requestData }, opts) {
    validateCrossAccount(cloudbase.config, opts);
    const params = {
        action: 'wx.openApi',
        apiName,
        apiOptions,
        cgiName,
        requestData
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        method: 'post',
        headers: { 'content-type': 'multipart/form-data' },
        params,
        isFormData: true,
        opts
    }).then(res => res);
}
exports.callCompatibleWxOpenApi = callCompatibleWxOpenApi;
/**
 * wx.wxPayApi 微信支付用
 * @param {String} apiName  接口名
 * @param {Buffer} requestData
 * @return {Promise} 正常内容为buffer，报错为json {code:'', message:'', resquestId:''}
 */
async function callWxPayApi(cloudbase, { apiName, apiOptions, cgiName, requestData }, opts) {
    validateCrossAccount(cloudbase.config, opts);
    const params = {
        action: 'wx.wxPayApi',
        apiName,
        apiOptions,
        cgiName,
        requestData
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        method: 'post',
        headers: { 'content-type': 'multipart/form-data' },
        params,
        isFormData: true,
        opts
    });
}
exports.callWxPayApi = callWxPayApi;
/**
 * wx.wxCallContainerApi
 * @param {String} apiName  接口名
 * @param {Buffer} requestData
 * @return {Promise} 正常内容为buffer，报错为json {code:'', message:'', resquestId:''}
 */
async function wxCallContainerApi(cloudbase, { apiName, apiOptions, cgiName, requestData }, opts) {
    validateCrossAccount(cloudbase.config, opts);
    const params = {
        action: 'wx.wxCallContainerApi',
        apiName,
        apiOptions,
        cgiName,
        requestData
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        method: 'post',
        headers: { 'content-type': 'multipart/form-data' },
        params,
        isFormData: true,
        opts
    });
}
exports.wxCallContainerApi = wxCallContainerApi;

}, function(modId) { var map = {"../utils/httpRequest":1654780339111,"../utils/utils":1654780339113,"../const/code":1654780339115}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339126, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const fs_1 = __importDefault(require("fs"));
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const xml2js_1 = require("xml2js");
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const cloudbase_1 = require("../cloudbase");
async function parseXML(str) {
    return new Promise((resolve, reject) => {
        xml2js_1.parseString(str, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
exports.parseXML = parseXML;
/*
 * 上传文件
 * @param {string} cloudPath 上传后的文件路径
 * @param {fs.ReadStream} fileContent  上传文件的二进制流
 */
async function uploadFile(cloudbase, { cloudPath, fileContent }, opts) {
    const { data: { url, token, authorization, fileId, cosFileId } } = await getUploadMetadata(cloudbase, { cloudPath }, opts);
    const formData = {
        Signature: authorization,
        'x-cos-security-token': token,
        'x-cos-meta-fileid': cosFileId,
        key: cloudPath,
        file: fileContent
    };
    let body = await new Promise((resolve, reject) => {
        request_1.default({ url, formData: formData, method: 'post' }, function (err, res, body) {
            if (err) {
                reject(err);
            }
            else {
                resolve(body);
            }
        });
    });
    body = await parseXML(body);
    if (body && body.Error) {
        const { Code: [code], Message: [message] } = body.Error;
        if (code === 'SignatureDoesNotMatch') {
            return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.SYS_ERR, { message }));
        }
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.STORAGE_REQUEST_FAIL, { message }));
    }
    return {
        fileID: fileId
    };
}
exports.uploadFile = uploadFile;
/**
 * 删除文件
 * @param {Array.<string>} fileList 文件id数组
 */
async function deleteFile(cloudbase, { fileList }, opts) {
    if (!fileList || !Array.isArray(fileList)) {
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList必须是非空的数组' }));
    }
    for (let file of fileList) {
        if (!file || typeof file !== 'string') {
            return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList的元素必须是非空的字符串' }));
        }
    }
    let params = {
        action: 'storage.batchDeleteFile',
        fileid_list: fileList
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        if (res.code) {
            return res;
        }
        //     throw E({ ...res })
        // } else {
        return {
            fileList: res.data.delete_list,
            requestId: res.requestId
        };
        // }
    });
}
exports.deleteFile = deleteFile;
/**
 * 获取文件下载链接
 * @param {Array.<Object>} fileList
 */
async function getTempFileURL(cloudbase, { fileList }, opts) {
    if (!fileList || !Array.isArray(fileList)) {
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList必须是非空的数组' }));
    }
    let file_list = [];
    for (let file of fileList) {
        if (typeof file === 'object') {
            if (!file.hasOwnProperty('fileID') || !file.hasOwnProperty('maxAge')) {
                return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList的元素如果是对象，必须是包含fileID和maxAge的对象' }));
            }
            file_list.push({
                fileid: file.fileID,
                max_age: file.maxAge
            });
        }
        else if (typeof file === 'string') {
            file_list.push({
                fileid: file
            });
        }
        else {
            return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList的元素如果不是对象，则必须是字符串' }));
        }
    }
    let params = {
        action: 'storage.batchGetDownloadUrl',
        file_list
    };
    // console.log(params);
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        if (res.code) {
            return res;
        }
        // if (res.code) {
        //     throw E({ ...res })
        // } else {
        return {
            fileList: res.data.download_list,
            requestId: res.requestId
        };
        // }
    });
}
exports.getTempFileURL = getTempFileURL;
async function downloadFile(cloudbase, params, opts) {
    let tmpUrl;
    const { fileID, tempFilePath } = params;
    const tmpUrlRes = await getTempFileURL(cloudbase, {
        fileList: [
            {
                fileID,
                maxAge: 600
            }
        ]
    }, opts);
    // console.log(tmpUrlRes);
    const res = tmpUrlRes.fileList[0];
    if (res.code !== 'SUCCESS') {
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, res));
    }
    tmpUrl = res.tempFileURL;
    tmpUrl = encodeURI(tmpUrl);
    let req = request_1.default({
        url: tmpUrl,
        encoding: null,
        proxy: cloudbase.config.proxy
    });
    return new Promise((resolve, reject) => {
        let fileContent = Buffer.alloc(0);
        req.on('response', function (response) {
            /* istanbul ignore else  */
            if (response && Number(response.statusCode) === 200) {
                if (tempFilePath) {
                    response.pipe(fs_1.default.createWriteStream(tempFilePath));
                }
                else {
                    response.on('data', data => {
                        fileContent = Buffer.concat([fileContent, data]);
                    });
                }
                response.on('end', () => {
                    resolve({
                        fileContent: tempFilePath ? undefined : fileContent,
                        message: '文件下载完成'
                    });
                });
            }
            else {
                reject(response);
            }
        });
    });
}
exports.downloadFile = downloadFile;
async function getUploadMetadata(cloudbase, { cloudPath }, opts) {
    let params = {
        action: 'storage.getUploadMetadata',
        path: cloudPath
    };
    const res = await httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    });
    // if (res.code) {
    //     throw E({
    //         ...ERROR.STORAGE_REQUEST_FAIL,
    //         message: 'get upload metadata failed: ' + res.code
    //     })
    // } else {
    return res;
    // }
}
exports.getUploadMetadata = getUploadMetadata;
async function getFileAuthority(cloudbase, { fileList }, opts) {
    const { LOGINTYPE } = cloudbase_1.CloudBase.getCloudbaseContext();
    if (!Array.isArray(fileList)) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '[node-sdk] getCosFileAuthority fileList must be a array' }));
    }
    if (fileList.some(file => {
        if (!file || !file.path) {
            return true;
        }
        if (['READ', 'WRITE', 'READWRITE'].indexOf(file.type) === -1) {
            return true;
        }
        return false;
    })) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '[node-sdk] getCosFileAuthority fileList param error' }));
    }
    const userInfo = cloudbase.auth().getUserInfo();
    const { openId, uid } = userInfo;
    if (!openId && !uid) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '[node-sdk] admin do not need getCosFileAuthority.' }));
    }
    let params = {
        action: 'storage.getFileAuthority',
        openId,
        uid,
        loginType: LOGINTYPE,
        fileList
    };
    const res = await httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        headers: {
            'content-type': 'application/json'
        }
    });
    if (res.code) {
        /* istanbul ignore next  */
        throw utils_1.E(Object.assign({}, res, { message: '[node-sdk] getCosFileAuthority failed: ' + res.code }));
    }
    else {
        return res;
    }
}
exports.getFileAuthority = getFileAuthority;

}, function(modId) { var map = {"../utils/httpRequest":1654780339111,"../utils/utils":1654780339113,"../const/code":1654780339115,"../cloudbase":1654780339109}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339127, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const cloudbase_1 = require("../cloudbase");
const reportTypes = ['mall'];
function validateAnalyticsData(data) {
    if (Object.prototype.toString.call(data).slice(8, -1) !== 'Object') {
        return false;
    }
    const { report_data, report_type } = data;
    if (reportTypes.includes(report_type) === false) {
        return false;
    }
    if (Object.prototype.toString.call(report_data).slice(8, -1) !== 'Object') {
        return false;
    }
    if (report_data.action_time !== undefined && !Number.isInteger(report_data.action_time)) {
        return false;
    }
    if (typeof report_data.action_type !== 'string') {
        return false;
    }
    return true;
}
async function analytics(cloudbase, requestData) {
    // 获取openid, wxappid
    const { WX_OPENID, WX_APPID, } = cloudbase_1.CloudBase.getCloudbaseContext();
    if (!validateAnalyticsData(requestData)) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '当前的上报数据结构不符合规范' }));
    }
    const action_time = requestData.report_data.action_time === undefined ? Math.floor(Date.now() / 1000) : requestData.report_data.action_time;
    const transformRequestData = {
        analytics_scene: requestData.report_type,
        analytics_data: Object.assign({ openid: WX_OPENID, wechat_mini_program_appid: WX_APPID }, requestData.report_data, { action_time })
    };
    const params = {
        action: 'analytics.report',
        requestData: transformRequestData
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        headers: {
            'content-type': 'application/json'
        }
    });
}
exports.analytics = analytics;

}, function(modId) { var map = {"../utils/httpRequest":1654780339111,"../utils/utils":1654780339113,"../const/code":1654780339115,"../cloudbase":1654780339109}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339128, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpRequest_1 = __importDefault(require("./httpRequest"));
/**
 * 数据库模块的通用请求方法
 *
 * @author haroldhu
 * @internal
 */
class DBRequest {
    /**
     * 初始化
     *
     * @internal
     * @param config
     */
    constructor(config) {
        this.config = config;
    }
    /**
     * 发送请求
     *
     * @param dbParams   - 数据库请求参数
     * @param opts  - 可选配置项
     */
    async send(api, data, opts) {
        const params = Object.assign({}, data, { action: api });
        return httpRequest_1.default({
            config: this.config,
            params,
            method: 'post',
            opts,
            headers: {
                'content-type': 'application/json'
            }
        });
    }
}
exports.DBRequest = DBRequest;

}, function(modId) { var map = {"./httpRequest":1654780339111}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339129, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const cloudbase_1 = require("../cloudbase");
/**
 *
 *
 * @class Log
 */
class Log {
    constructor() {
        const { _SCF_TCB_LOG } = cloudbase_1.CloudBase.getCloudbaseContext();
        this.src = 'app';
        this.isSupportClsReport = true;
        if (`${_SCF_TCB_LOG}` !== '1') {
            this.isSupportClsReport = false;
        }
        else if (!console.__baseLog__) {
            this.isSupportClsReport = false;
        }
        if (!this.isSupportClsReport) {
            // 当前非tcb scf环境  log功能会退化为console
            console.warn('请检查您是否在本地环境 或者 未开通高级日志功能，当前环境下无法上报cls日志，默认使用console');
        }
    }
    /**
     *
     *
     * @param {*} logMsg
     * @param {*} logLevel
     * @returns
     * @memberof Log
     */
    transformMsg(logMsg) {
        // 目前logMsg只支持字符串value且不支持多级, 加一层转换处理
        let realMsg = {};
        realMsg = Object.assign({}, realMsg, logMsg);
        return realMsg;
    }
    /**
     *
     *
     * @param {*} logMsg
     * @param {*} logLevel
     * @memberof Log
     */
    baseLog(logMsg, logLevel) {
        // 判断当前是否属于tcb scf环境
        if (Object.prototype.toString.call(logMsg).slice(8, -1) !== 'Object') {
            throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'log msg must be an object' }));
        }
        const msgContent = this.transformMsg(logMsg);
        if (this.isSupportClsReport) {
            ;
            console.__baseLog__(msgContent, logLevel);
        }
        else {
            if (console[logLevel]) {
                console[logLevel](msgContent);
            }
        }
    }
    /**
     *
     *
     * @param {*} logMsg
     * @memberof Log
     */
    log(logMsg) {
        this.baseLog(logMsg, 'log');
    }
    /**
     *
     *
     * @param {*} logMsg
     * @memberof Log
     */
    info(logMsg) {
        this.baseLog(logMsg, 'info');
    }
    /**
     *
     *
     * @param {*} logMsg
     * @memberof Log
     */
    error(logMsg) {
        this.baseLog(logMsg, 'error');
    }
    /**
     *
     *
     * @param {*} logMsg
     * @memberof Log
     */
    warn(logMsg) {
        this.baseLog(logMsg, 'warn');
    }
}
exports.Log = Log;
function logger() {
    return new Log();
}
exports.logger = logger;

}, function(modId) { var map = {"../utils/utils":1654780339113,"../const/code":1654780339115,"../cloudbase":1654780339109}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339108);
})()
//miniprogram-npm-outsideDeps=["@cloudbase/database","axios","http","@cloudbase/signature-nodejs","url","agentkeepalive","retry/lib/retry_operation","events","fs","jsonwebtoken","request","xml2js"]
//# sourceMappingURL=index.js.map