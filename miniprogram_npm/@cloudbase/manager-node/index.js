module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339080, function(require, module, exports) {

const context_1 = require("./context");
const environmentManager_1 = require("./environmentManager");
class CloudBase {
    constructor(config = {}) {
        this.cloudBaseConfig = {};
        let { secretId, secretKey, token, envId, proxy, region, envType } = config;
        // config 中传入的 secretId secretkey 必须同时存在
        if ((secretId && !secretKey) || (!secretId && secretKey)) {
            throw new Error('secretId and secretKey must be a pair');
        }
        this.cloudBaseConfig = {
            secretId,
            secretKey,
            token,
            envId,
            envType,
            proxy,
            region
        };
        // 初始化 context
        this.context = new context_1.CloudBaseContext(this.cloudBaseConfig);
        this.environmentManager = new environmentManager_1.EnvironmentManager(this.context);
        this.environmentManager.add(envId || '');
    }
    /**
     * init 初始化 为单例
     *
     * @static
     * @param {ManagerConfig} config
     * @returns {CloudBase}
     * @memberof CloudBase
     */
    static init(config) {
        if (!CloudBase.cloudBase) {
            CloudBase.cloudBase = new CloudBase(config);
        }
        return CloudBase.cloudBase;
    }
    addEnvironment(envId) {
        this.environmentManager.add(envId);
    }
    currentEnvironment() {
        return this.environmentManager.getCurrentEnv();
    }
    get functions() {
        return this.currentEnvironment().getFunctionService();
    }
    get storage() {
        return this.currentEnvironment().getStorageService();
    }
    get database() {
        return this.currentEnvironment().getDatabaseService();
    }
    get hosting() {
        return this.currentEnvironment().getHostingService();
    }
    get access() {
        return this.currentEnvironment().getAccessService();
    }
    get cloudApp() {
        return this.currentEnvironment().getCloudBaseRunService();
    }
    commonService(service, version) {
        return this.currentEnvironment().getCommonService(service, version);
    }
    get env() {
        return this.currentEnvironment().getEnvService();
    }
    get third() {
        return this.currentEnvironment().getThirdService();
    }
    get user() {
        return this.currentEnvironment().getUserService();
    }
    getEnvironmentManager() {
        return this.environmentManager;
    }
    getManagerConfig() {
        return this.cloudBaseConfig;
    }
}
module.exports = CloudBase;

}, function(modId) {var map = {"./context":1654780339081,"./environmentManager":1654780339082}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339081, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseContext = void 0;
class CloudBaseContext {
    constructor({ secretId = '', secretKey = '', token = '', proxy = '', region = '', envType = '' }) {
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.token = token;
        this.proxy = proxy;
        this.region = region;
        this.envType = envType;
    }
}
exports.CloudBaseContext = CloudBaseContext;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339082, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentManager = void 0;
const environment_1 = require("./environment");
const constant_1 = require("./constant");
class EnvironmentManager {
    constructor(context) {
        this.envs = {};
        this.currentEnv = null;
        this.cloudBaseContext = context;
    }
    getCurrentEnv() {
        if (!this.currentEnv) {
            throw new Error(constant_1.ERROR.CURRENT_ENVIRONMENT_IS_NULL);
        }
        return this.currentEnv;
    }
    add(envId) {
        if (!this.envs[envId]) {
            this.envs[envId] = new environment_1.Environment(this.cloudBaseContext, envId);
        }
        if (!this.currentEnv) {
            this.currentEnv = this.envs[envId];
        }
    }
    remove(envId) {
        this.envs[envId] = null;
        delete this.envs[envId];
    }
    get(envId) {
        return this.envs[envId] || null;
    }
    switchEnv(envId) {
        const env = this.envs[envId];
        if (env) {
            this.currentEnv = env;
            return true;
        }
        else {
            return false;
        }
    }
}
exports.EnvironmentManager = EnvironmentManager;

}, function(modId) { var map = {"./environment":1654780339083,"./constant":1654780339088}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339083, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const database_1 = require("./database");
const function_1 = require("./function");
const storage_1 = require("./storage");
const env_1 = require("./env");
const common_1 = require("./common");
const error_1 = require("./error");
const constant_1 = require("./constant");
const utils_1 = require("./utils");
const hosting_1 = require("./hosting");
const third_1 = require("./third");
const access_1 = require("./access");
const user_1 = require("./user");
const cloudBaseRun_1 = require("./cloudBaseRun");
class Environment {
    constructor(context, envId) {
        this.inited = false;
        this.envId = envId;
        this.cloudBaseContext = context;
        this.envType = context.envType;
        // 拉取当前环境 的环境信息 todo
        this.functionService = new function_1.FunctionService(this);
        this.databaseService = new database_1.DatabaseService(this);
        this.storageService = new storage_1.StorageService(this);
        this.envService = new env_1.EnvService(this);
        this.hostingService = new hosting_1.HostingService(this);
        this.thirdService = new third_1.ThirdService(this);
        this.accessService = new access_1.AccessService(this);
        this.userService = new user_1.UserService(this);
        this.cloudBaseRunService = new cloudBaseRun_1.CloudBaseRunService(this);
    }
    async lazyInit() {
        if (!this.inited) {
            const envConfig = this.envService;
            return envConfig.getEnvInfo().then(envInfo => {
                this.lazyEnvironmentConfig = envInfo.EnvInfo;
                if (!this.lazyEnvironmentConfig.EnvId) {
                    throw new error_1.CloudBaseError(`Environment ${this.envId} not found`);
                }
                this.inited = true;
                return this.lazyEnvironmentConfig;
            });
        }
        else {
            return this.lazyEnvironmentConfig;
        }
    }
    getEnvId() {
        return this.envId;
    }
    getEnvType() {
        return this.envType;
    }
    getStorageService() {
        return this.storageService;
    }
    getDatabaseService() {
        return this.databaseService;
    }
    getFunctionService() {
        return this.functionService;
    }
    getEnvService() {
        return this.envService;
    }
    getHostingService() {
        return this.hostingService;
    }
    getThirdService() {
        return this.thirdService;
    }
    getAccessService() {
        return this.accessService;
    }
    getUserService() {
        return this.userService;
    }
    getCloudBaseRunService() {
        return this.cloudBaseRunService;
    }
    getCommonService(serviceType = 'tcb', serviceVersion) {
        return new common_1.CommonService(this, serviceType, serviceVersion);
    }
    getServicesEnvInfo() {
        const envConfig = this.envService;
        return envConfig.getEnvInfo().then(envInfo => {
            return envInfo.EnvInfo;
        });
    }
    getAuthConfig() {
        let { secretId, secretKey, token, proxy, region } = this.cloudBaseContext;
        const envId = this.getEnvId();
        if (!secretId || !secretKey) {
            // 未主动传入密钥，从环境变量中读取
            const envSecretId = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SECRETID);
            const envSecretKey = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SECRETKEY);
            const envToken = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SESSIONTOKEN);
            if (!envSecretId || !envSecretKey) {
                if (utils_1.getRuntime() === constant_1.RUN_ENV.SCF) {
                    throw new Error('missing authoration key, redeploy the function');
                }
                else {
                    throw new Error('missing secretId or secretKey of tencent cloud');
                }
            }
            else {
                secretId = envSecretId;
                secretKey = envSecretKey;
                token = envToken;
            }
        }
        return {
            envId,
            secretId,
            secretKey,
            token,
            proxy,
            region
        };
    }
}
exports.Environment = Environment;

}, function(modId) { var map = {"./database":1654780339084,"./function":1654780339095,"./storage":1654780339097,"./env":1654780339099,"./common":1654780339102,"./error":1654780339085,"./constant":1654780339088,"./utils":1654780339086,"./hosting":1654780339103,"./third":1654780339104,"./access":1654780339105,"./user":1654780339106,"./cloudBaseRun":1654780339107}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339084, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const path_1 = __importDefault(require("path"));
const error_1 = require("../error");
const utils_1 = require("../utils");
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldFunc = descriptor.value;
        descriptor.value = async function () {
            // 检查当前环境对象上是否已加载好环境信息
            const currentEnvironment = this.environment;
            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit();
            }
            let result = await oldFunc.apply(this, arguments);
            return result;
        };
    };
}
class DatabaseService {
    constructor(environment) {
        this.DEFAULT_MGO_OFFSET = 0;
        this.DEFAULT_MGO_LIMIT = 100;
        this.environment = environment;
        this.envId = environment.getEnvId();
        this.dbOpService = new utils_1.CloudService(environment.cloudBaseContext, DatabaseService.tcbServiceVersion.service, DatabaseService.tcbServiceVersion.version);
        this.collOpService = new utils_1.CloudService(environment.cloudBaseContext, DatabaseService.flexdbServiceVersion.service, DatabaseService.flexdbServiceVersion.version);
    }
    getCurrEnvironment() {
        return this.environment;
    }
    getDatabaseConfig() {
        const currEnv = this.environment;
        const { Databases } = currEnv.lazyEnvironmentConfig;
        return {
            Tag: Databases[0].InstanceId
        };
    }
    async checkCollectionExists(collectionName) {
        try {
            const result = await this.describeCollection(collectionName);
            return {
                RequestId: result.RequestId,
                Exists: true
            };
        }
        catch (e) {
            return {
                RequestId: e.requestId,
                Msg: e.message,
                Exists: false
            };
        }
    }
    async createCollection(collectionName) {
        let { Tag } = this.getDatabaseConfig();
        const res = await this.collOpService.request('CreateTable', {
            Tag,
            TableName: collectionName
        });
        return res;
    }
    async deleteCollection(collectionName) {
        // 先检查当前集合是否存在
        const existRes = await this.checkCollectionExists(collectionName);
        if (existRes.Exists) {
            let { Tag } = this.getDatabaseConfig();
            const res = await this.collOpService.request('DeleteTable', {
                Tag,
                TableName: collectionName
            });
            return res;
        }
        else {
            return existRes;
        }
    }
    async updateCollection(collectionName, indexiesInfo) {
        let { Tag } = this.getDatabaseConfig();
        const res = await this.collOpService.request('UpdateTable', Object.assign({ Tag, TableName: collectionName }, indexiesInfo));
        return res;
    }
    async describeCollection(collectionName) {
        let { Tag } = this.getDatabaseConfig();
        return this.collOpService.request('DescribeTable', {
            Tag,
            TableName: collectionName
        });
    }
    // 获取
    async listCollections(options = {
        MgoLimit: this.DEFAULT_MGO_LIMIT,
        MgoOffset: this.DEFAULT_MGO_OFFSET
    }) {
        let { Tag } = this.getDatabaseConfig();
        if (options.MgoLimit === undefined) {
            options.MgoLimit = this.DEFAULT_MGO_LIMIT;
        }
        if (options.MgoOffset === undefined) {
            options.MgoOffset = this.DEFAULT_MGO_OFFSET;
        }
        const res = await this.collOpService.request('ListTables', Object.assign({ Tag }, options));
        if (res.Tables === null) {
            // 无集合
            res.Collections = [];
        }
        else {
            // 云 API 返回转换为与TCB一致
            res.Collections = res.Tables.map(item => {
                item.CollectionName = item.TableName;
                delete item.TableName;
                return item;
            });
        }
        delete res.Tables;
        return res;
    }
    async createCollectionIfNotExists(collectionName) {
        const existRes = await this.checkCollectionExists(collectionName);
        let res;
        if (!existRes.Exists) {
            res = await this.createCollection(collectionName);
            return {
                RequestId: res.RequestId,
                IsCreated: true,
                ExistsResult: existRes
            };
        }
        else {
            return {
                RequestId: '',
                IsCreated: false,
                ExistsResult: existRes
            };
        }
    }
    // 检查集合中是否存在某索引
    async checkIndexExists(collectionName, indexName) {
        const result = await this.describeCollection(collectionName);
        let exists = result.Indexes.some(item => {
            return item.Name === indexName;
        });
        return {
            RequestId: result.RequestId,
            Exists: exists
        };
    }
    // 查询DB的数据存储分布
    async distribution() {
        const res = await this.dbOpService.request('DescribeDbDistribution', {
            EnvId: this.envId
        });
        return res;
    }
    // 查询DB 迁移进度
    async migrateStatus(jobId) {
        const res = await this.dbOpService.request('DatabaseMigrateQueryInfo', {
            EnvId: this.envId,
            JobId: jobId
        });
        return res;
    }
    // 数据库导入数据
    async import(collectionName, file, options) {
        let filePath;
        let fileType;
        if (file['FilePath']) {
            let temp = 'tmp/db-imports/';
            if (options['ObjectKeyPrefix']) {
                temp = options['ObjectKeyPrefix'];
                delete options['ObjectKeyPrefix'];
            }
            filePath = path_1.default.join(temp, path_1.default.basename(file['FilePath']));
            // 调用cos接口 上传文件  todo
            await this.environment.getStorageService().uploadFile({
                localPath: file['FilePath'],
                cloudPath: filePath
            });
            fileType = path_1.default.extname(filePath).substring(1);
        }
        else if (file['ObjectKey']) {
            delete options['ObjectKeyPrefix'];
            filePath = file['ObjectKey'];
            fileType = path_1.default.extname(filePath).substring(1);
        }
        else {
            throw new error_1.CloudBaseError('Miss file.filePath or file.objectKey');
        }
        if (file['FileType']) {
            fileType = file['FileType'];
        }
        return this.dbOpService.request('DatabaseMigrateImport', Object.assign({ CollectionName: collectionName, FilePath: filePath, FileType: fileType, EnvId: this.envId }, options));
    }
    // 数据库导出数据
    async export(collectionName, file, options) {
        let filePath;
        let fileType;
        if (file['ObjectKey']) {
            filePath = file['ObjectKey'];
            fileType = path_1.default.extname(filePath).substring(1);
        }
        else {
            throw new error_1.CloudBaseError('Miss file.filePath or file.objectKey');
        }
        if (file['FileType']) {
            fileType = file['FileType'];
        }
        return this.dbOpService.request('DatabaseMigrateExport', Object.assign({ CollectionName: collectionName, FilePath: filePath, FileType: fileType, EnvId: this.envId }, options));
    }
}
DatabaseService.tcbServiceVersion = {
    service: 'tcb',
    version: '2018-06-08'
};
DatabaseService.flexdbServiceVersion = {
    service: 'flexdb',
    version: '2018-11-27'
};
__decorate([
    preLazy()
], DatabaseService.prototype, "createCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "deleteCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "updateCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "describeCollection", null);
__decorate([
    preLazy()
], DatabaseService.prototype, "listCollections", null);
exports.DatabaseService = DatabaseService;

}, function(modId) { var map = {"../error":1654780339085,"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339085, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseError = void 0;
class CloudBaseError extends Error {
    constructor(message, options = {}) {
        super();
        this.name = 'CloudBaseError';
        const { code = '', action = '', original = null, requestId = '' } = options;
        this.message = action ? `[${action}] ${message}` : message;
        this.original = original;
        this.code = code;
        this.requestId = requestId;
        this.action = action;
    }
}
exports.CloudBaseError = CloudBaseError;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339086, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upperCaseObjKey = exports.upperCaseStringFisrt = exports.sleep = exports.rsaEncrypt = exports.getEnvVar = exports.getRuntime = exports.compressToZip = void 0;
const fs_1 = __importDefault(require("fs"));
const archiver_1 = __importDefault(require("archiver"));
const crypto_1 = __importDefault(require("crypto"));
const constant_1 = require("../constant");
var uuid_1 = require("./uuid");
Object.defineProperty(exports, "guid6", { enumerable: true, get: function () { return uuid_1.guid6; } });
__exportStar(require("./cloud-api-request"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./cloudbase-request"), exports);
__exportStar(require("./http-request"), exports);
__exportStar(require("./envLazy"), exports);
__exportStar(require("./fs"), exports);
async function compressToZip(option) {
    const { dirPath, outputPath, ignore, pattern = '**/*' } = option;
    return new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(outputPath);
        const archive = archiver_1.default('zip');
        output.on('close', function () {
            resolve({
                zipPath: outputPath,
                size: Math.ceil(archive.pointer() / 1024)
            });
        });
        archive.on('error', function (err) {
            reject(err);
        });
        archive.pipe(output);
        // append files from a glob pattern
        archive.glob(pattern, {
            // 目标路径
            cwd: dirPath,
            ignore: ignore,
            dot: true
        });
        archive.finalize();
    });
}
exports.compressToZip = compressToZip;
function getRuntime() {
    return process.env[constant_1.ENV_NAME.ENV_RUNENV];
}
exports.getRuntime = getRuntime;
function getEnvVar(envName) {
    return process.env[envName];
}
exports.getEnvVar = getEnvVar;
function rsaEncrypt(data) {
    const buffer = Buffer.from(data);
    const encrypted = crypto_1.default.publicEncrypt({
        key: constant_1.PUBLIC_RSA_KEY,
        padding: crypto_1.default.constants.RSA_PKCS1_PADDING
    }, buffer);
    return encrypted.toString('base64');
}
exports.rsaEncrypt = rsaEncrypt;
function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
exports.sleep = sleep;
function upperCaseStringFisrt(str) {
    return str.slice(0, 1).toUpperCase().concat(str.slice(1));
}
exports.upperCaseStringFisrt = upperCaseStringFisrt;
function upperCaseObjKey(object) {
    const type = Object.prototype.toString.call(object).slice(8, -1);
    if (type === 'Object') {
        let newObj = {};
        // eslint-disable-next-line guard-for-in
        for (let key in object) {
            newObj[upperCaseStringFisrt(key)] = upperCaseObjKey(object[key]);
        }
        return newObj;
    }
    if (type === 'Array') {
        let newArr = [];
        for (let item of object) {
            newArr.push(upperCaseObjKey(item));
        }
        return newArr;
    }
    return object;
}
exports.upperCaseObjKey = upperCaseObjKey;

}, function(modId) { var map = {"fs":1654780339087,"../constant":1654780339088,"./uuid":1654780339089,"./cloud-api-request":1654780339090,"./auth":1654780339092,"./cloudbase-request":1654780339093,"./http-request":1654780339091,"./envLazy":1654780339094,"./fs":1654780339087}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339087, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delSync = exports.formateFileSize = exports.isDirectory = exports.checkReadable = exports.checkFullAccess = void 0;
const fs_1 = __importDefault(require("fs"));
const error_1 = require("../error");
const del_1 = __importDefault(require("del"));
// 检查路径是否可以访问（读、写）
function checkFullAccess(dest, throwError = false) {
    try {
        // 可见、可写
        fs_1.default.accessSync(dest, fs_1.default.constants.F_OK);
        fs_1.default.accessSync(dest, fs_1.default.constants.W_OK);
        fs_1.default.accessSync(dest, fs_1.default.constants.R_OK);
        return true;
    }
    catch (e) {
        if (throwError) {
            throw new error_1.CloudBaseError(`路径不存在或无读写权限：${dest}`);
        }
        else {
            return false;
        }
    }
}
exports.checkFullAccess = checkFullAccess;
// 检查路径是否可以写
function checkReadable(dest, throwError = false) {
    try {
        // 可见、可读
        fs_1.default.accessSync(dest, fs_1.default.constants.F_OK);
        fs_1.default.accessSync(dest, fs_1.default.constants.R_OK);
        return true;
    }
    catch (e) {
        if (throwError) {
            throw new error_1.CloudBaseError(`路径不存在或无读权限：${dest}`);
        }
        else {
            return false;
        }
    }
}
exports.checkReadable = checkReadable;
function isDirectory(dest) {
    checkFullAccess(dest, true);
    return fs_1.default.statSync(dest).isDirectory();
}
exports.isDirectory = isDirectory;
function formateFileSize(size, unit) {
    const unitMap = {
        KB: 1024,
        MB: Math.pow(1024, 2),
        GB: Math.pow(1024, 3)
    };
    return Number(size / unitMap[unit]).toFixed(2);
}
exports.formateFileSize = formateFileSize;
function delSync(patterns) {
    del_1.default.sync(patterns, { force: true });
}
exports.delSync = delSync;

}, function(modId) { var map = {"fs":1654780339087,"../error":1654780339085}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339088, function(require, module, exports) {

// // cloudbase cli 配置的字段名
// export class ConfigItems {
//     static credentail = 'credential'
// }
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCF_STATUS = exports.ROLE_NAME = exports.PUBLIC_RSA_KEY = exports.ERROR = exports.SERVICE_TYPE = exports.ENDPOINT = exports.RUN_ENV = exports.SDK_VERSION = exports.ENV_NAME = void 0;
exports.ENV_NAME = {
    ENV_SECRETID: 'TENCENTCLOUD_SECRETID',
    ENV_SECRETKEY: 'TENCENTCLOUD_SECRETKEY',
    ENV_SESSIONTOKEN: 'TENCENTCLOUD_SESSIONTOKEN',
    ENV_TCB_ENV_ID: 'TENCENTCLOUD_TCB_ENVID',
    ENV_RUNENV: 'TENCENTCLOUD_RUNENV',
    ENV_RUNENV_SCF: 'TENCENTCLOUD_RUNENV=SCF'
};
exports.SDK_VERSION = 'TCB-NODE-MANAGER/1.0.O';
exports.RUN_ENV = {
    SCF: 'SCF'
};
exports.ENDPOINT = {
    TCB: 'tcb.tencentcloudapi.com',
    SCF: 'scf.tencentcloudapi.com',
    COS: 'cos.tencentcloudapi.com',
    FLEXDB: 'flexdb.tencentcloudapi.com'
};
exports.SERVICE_TYPE = {
    TCB: 'tcb'
};
exports.ERROR = {
    MISS_SECRET_INFO_IN_ENV: 'MISS_SECRET_INFO_IN_ENV',
    MISS_SECRET_INFO_IN_ARGS: 'MISS_SECRET_INFO_IN_ARGS',
    CURRENT_ENVIRONMENT_IS_NULL: 'CURRENT_ENVIRONMENT_IS_NULL',
    ENV_ID_NOT_EXISTS: 'ENV_ID_NOT_EXISTS'
};
exports.PUBLIC_RSA_KEY = `
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0ZLB0ZpWWFsHPnDDw++Nc2wI3
nl2uyOrIJ5FUfxt4GAmt1Faf5pgMxAnL9exEUrrUDUX8Ri1R0KyfnHQQwCvKt8T8
bgILIJe9UB8e9dvFqgqH2oA8Vqwi0YqDcvFLFJk2BJbm/0QYtZ563FumW8LEXAgu
UeHi/0OZN9vQ33jWMQIDAQAB
-----END PUBLIC KEY-----
`;
exports.ROLE_NAME = {
    TCB: 'TCB_QcsRole'
};
exports.SCF_STATUS = {
    ACTIVE: 'Active',
    CREATING: 'Creating',
    UPDATING: 'Updating',
    CREATE_FAILED: 'CreateFailed'
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339089, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv4 = exports.guid6 = void 0;
// 环境 uuid
function guid6() {
    return Math.floor((1 + Math.random()) * 0x1000000)
        .toString(16)
        .substring(1);
}
exports.guid6 = guid6;
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.uuidv4 = uuidv4;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339090, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const url_1 = require("url");
const query_string_1 = __importDefault(require("query-string"));
const error_1 = require("../error");
const http_request_1 = require("./http-request");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
function isObject(x) {
    return typeof x === 'object' && !Array.isArray(x) && x !== null;
}
// 移除对象中的空值
function deepRemoveVoid(obj) {
    if (Array.isArray(obj)) {
        return obj.map(deepRemoveVoid);
    }
    else if (isObject(obj)) {
        let result = {};
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (typeof value !== 'undefined' && value !== null) {
                    result[key] = deepRemoveVoid(value);
                }
            }
        }
        return result;
    }
    else {
        return obj;
    }
}
function sha256(message, secret, encoding) {
    const hmac = crypto_1.default.createHmac('sha256', secret);
    return hmac.update(message).digest(encoding);
}
function getHash(message) {
    const hash = crypto_1.default.createHash('sha256');
    return hash.update(message).digest('hex');
}
function getDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    // UTC 日期，非本地时间
    const day = ('0' + date.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
}
class CloudService {
    /* eslint-disable-next-line */
    constructor(context, service, version, baseParams) {
        this.service = service;
        this.version = version;
        this.timeout = 60000;
        this.baseParams = baseParams || {};
        this.cloudBaseContext = context;
    }
    get baseUrl() {
        const tcb = process.env.TCB_BASE_URL || 'https://tcb.tencentcloudapi.com';
        const urlMap = {
            tcb,
            scf: 'https://scf.tencentcloudapi.com',
            vpc: 'https://vpc.tencentcloudapi.com',
            flexdb: 'https://flexdb.tencentcloudapi.com',
            cam: 'https://cam.tencentcloudapi.com',
            cdn: 'https://cdn.tencentcloudapi.com'
        };
        if (urlMap[this.service]) {
            return urlMap[this.service];
        }
        else {
            return `https://${this.service}.tencentcloudapi.com`;
        }
    }
    async request(action, data = {}, method = 'POST') {
        this.action = action;
        this.data = deepRemoveVoid(Object.assign(Object.assign({}, data), this.baseParams));
        this.method = method;
        this.url = this.baseUrl;
        let { secretId, secretKey, token } = this.cloudBaseContext;
        // 当在云函数环境下执行时，可init时不传入密钥，取环境变量中密钥使用
        // request执行时一般处于main函数内部，取环境变量逻辑写这里更可靠
        if (!secretId || !secretKey) {
            // 未主动传入密钥，从环境变量中读取
            const envSecretId = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SECRETID);
            const envSecretKey = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SECRETKEY);
            const envToken = utils_1.getEnvVar(constant_1.ENV_NAME.ENV_SESSIONTOKEN);
            if (!envSecretId || !envSecretKey) {
                if (utils_1.getRuntime() === constant_1.RUN_ENV.SCF) {
                    throw new Error('missing authoration key, redeploy the function');
                }
                else {
                    throw new Error('missing secretId or secretKey of tencent cloud');
                }
            }
            else {
                secretId = envSecretId;
                secretKey = envSecretKey;
                token = envToken;
            }
        }
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.token = token;
        try {
            const data = await this.requestWithSign();
            if (data.Response.Error) {
                const tcError = new error_1.CloudBaseError(data.Response.Error.Message, {
                    action,
                    requestId: data.Response.RequestId,
                    code: data.Response.Error.Code,
                    original: data.Response.Error
                });
                throw tcError;
            }
            else {
                return data.Response;
            }
        }
        catch (e) {
            if (e.name === 'CloudBaseError') {
                throw e;
            }
            else {
                throw new error_1.CloudBaseError(e.message, {
                    action,
                    code: e.code
                });
            }
        }
    }
    async requestWithSign() {
        // data 中可能带有 readStream，由于需要计算整个 body 的 hash，
        // 所以这里把 readStream 转为 Buffer
        // await convertReadStreamToBuffer(data)
        const timestamp = Math.floor(new Date().getTime() / 1000);
        const { proxy } = this.cloudBaseContext;
        const { method, timeout, data = {} } = this;
        if (method === 'GET') {
            this.url += '?' + query_string_1.default.stringify(data);
        }
        if (method === 'POST') {
            this.payload = data;
        }
        const config = {
            method,
            timeout,
            headers: {
                Host: new url_1.URL(this.url).host,
                'X-TC-Action': this.action,
                // region 优先级 mock本地注入 > init 指定 > 云函数环境变量
                'X-TC-Region': process.env.TCB_REGION ||
                    this.cloudBaseContext.region ||
                    process.env.TENCENTCLOUD_REGION ||
                    'ap-shanghai',
                'X-TC-Timestamp': timestamp,
                'X-TC-Version': this.version
            }
        };
        if (this.token) {
            config.headers['X-TC-Token'] = this.token;
        }
        if (method === 'GET') {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (method === 'POST') {
            config.body = JSON.stringify(data);
            config.headers['Content-Type'] = 'application/json';
        }
        const sign = this.getRequestSign(timestamp);
        config.headers['Authorization'] = sign;
        return http_request_1.fetch(this.url, config, proxy);
    }
    getRequestSign(timestamp) {
        const { method = 'POST', url, service, secretId, secretKey } = this;
        const urlObj = new url_1.URL(url);
        // 通用头部
        let headers = '';
        const signedHeaders = 'content-type;host';
        if (method === 'GET') {
            headers = 'content-type:application/x-www-form-urlencoded\n';
        }
        else if (method === 'POST') {
            headers = 'content-type:application/json\n';
        }
        headers += `host:${urlObj.hostname}\n`;
        const path = urlObj.pathname;
        const querystring = urlObj.search.slice(1);
        const payloadHash = this.payload ? getHash(JSON.stringify(this.payload)) : getHash('');
        const canonicalRequest = `${method}\n${path}\n${querystring}\n${headers}\n${signedHeaders}\n${payloadHash}`;
        const date = getDate(timestamp);
        const StringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${date}/${service}/tc3_request\n${getHash(canonicalRequest)}`;
        const kDate = sha256(date, `TC3${secretKey}`);
        const kService = sha256(service, kDate);
        const kSigning = sha256('tc3_request', kService);
        const signature = sha256(StringToSign, kSigning, 'hex');
        return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    }
}
exports.CloudService = CloudService;

}, function(modId) { var map = {"../error":1654780339085,"./http-request":1654780339091,"../constant":1654780339088,"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339091, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStream = exports.fetch = void 0;
const url_1 = require("url");
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const error_1 = require("../error");
// 使用 fetch + 代理
async function fetch(url, config = {}, proxy) {
    if (proxy || process.env.http_proxy) {
        config.agent = new https_proxy_agent_1.default(proxy || process.env.http_proxy);
    }
    // 解决中文编码问题
    const escapeUrl = new url_1.URL(url).toString();
    let json;
    let text;
    try {
        const res = await node_fetch_1.default(escapeUrl, config);
        text = await res.text();
        json = JSON.parse(text);
    }
    catch (e) {
        // 某些情况下回返回 HTML 文本异常
        // JSON 解析错误，抛出原响应文本
        if (e.name === 'SyntaxError') {
            throw new error_1.CloudBaseError(text);
        }
        throw new error_1.CloudBaseError(e);
    }
    return json;
}
exports.fetch = fetch;
async function fetchStream(url, config = {}, proxy) {
    if (proxy || process.env.http_proxy) {
        config.agent = new https_proxy_agent_1.default(proxy || process.env.http_proxy);
    }
    // 解决中文编码问题
    const escapeUrl = new url_1.URL(url).toString();
    return node_fetch_1.default(escapeUrl, config);
}
exports.fetchStream = fetchStream;

}, function(modId) { var map = {"../error":1654780339085}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339092, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = void 0;
const crypto_1 = __importDefault(require("crypto"));
function camSafeUrlEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}
function getAuth(options) {
    const SecretId = options.secretId;
    const SecretKey = options.secretKey;
    const method = options.method.toLowerCase() || 'get';
    const queryParams = options.params || {};
    const headers = options.headers || {};
    let pathname = options.pathname || '/';
    pathname.indexOf('/') !== 0 && (pathname = '/' + pathname);
    if (!SecretId) {
        throw Error('missing param SecretId');
    }
    if (!SecretKey) {
        throw Error('missing param SecretKey');
    }
    const getObjectKeys = function (obj) {
        return Object.keys(obj)
            .filter(key => typeof obj[key] !== 'undefined')
            .sort();
    };
    const objectToString = function (obj) {
        const list = [];
        const keyList = getObjectKeys(obj);
        keyList.forEach(key => {
            let value = obj[key] === null || typeof obj[key] === 'undefined' ? '' : obj[key];
            if (typeof value !== 'string') {
                value = JSON.stringify(value);
            }
            list.push(`${camSafeUrlEncode(key.toLowerCase())}=${camSafeUrlEncode(value)}`);
        });
        return list.join('&');
    };
    // 签名有效起止时间
    const now = Math.floor(Date.now() / 1000) - 1;
    // 签名过期时间为当前 + 900s
    const exp = now + 900;
    // 要用到的 Authorization 参数列表
    const qSignAlgorithm = 'sha1';
    const qAk = SecretId;
    const qKeyTime = now + ';' + exp;
    const qHeaderList = getObjectKeys(headers)
        .join(';')
        .toLowerCase();
    const qUrlParamList = getObjectKeys(queryParams)
        .join(';')
        .toLowerCase();
    // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
    // 步骤一：计算 SignKey
    const signKey = crypto_1.default
        .createHmac('sha1', SecretKey)
        .update(qKeyTime)
        .digest('hex');
    // 步骤二：构成 FormatString
    const formatString = [
        method,
        pathname,
        objectToString(queryParams),
        objectToString(headers),
        ''
    ].join('\n');
    // 步骤三：计算 StringToSign
    const sha1Algo = crypto_1.default.createHash('sha1');
    sha1Algo.update(Buffer.from(formatString));
    const res = sha1Algo.digest('hex');
    const stringToSign = ['sha1', qKeyTime, res, ''].join('\n');
    // 步骤四：计算 Signature
    const qSignature = crypto_1.default
        .createHmac('sha1', signKey)
        .update(stringToSign)
        .digest('hex');
    // 步骤五：构造 Authorization
    const authorization = [
        'q-sign-algorithm=' + qSignAlgorithm,
        'q-ak=' + qAk,
        'q-sign-time=' + qKeyTime,
        'q-key-time=' + qKeyTime,
        'q-header-list=' + qHeaderList,
        'q-url-param-list=' + qUrlParamList,
        'q-signature=' + qSignature
    ].join('&');
    return authorization;
}
exports.getAuth = getAuth;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339093, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudBaseRequest = void 0;
const auth_1 = require("./auth");
const http_request_1 = require("./http-request");
const SUPPORT_REGIONS = ['ap-shanghai', 'ap-guangzhou'];
async function cloudBaseRequest(options) {
    // const url = 'https://tcb-admin.tencentcloudapi.com/admin'
    const { config, params = {}, method = 'POST', headers = {} } = options;
    const { region, envId } = config;
    const isInScf = process.env.TENCENTCLOUD_RUNENV === 'SCF'; // 是否scf环境内
    const protocol = isInScf ? 'http' : 'https';
    const isInContainer = !!process.env.KUBERNETES_SERVICE_HOST; // 是否容器环境
    // region 优先级 本地mock 注入 > init region > 云函数环境变量region
    const finalRegion = process.env.TCB_REGION || region || process.env.TENCENTCLOUD_REGION || '';
    let internetRegionEndpoint = '';
    let internalRegionEndpoint = '';
    if (finalRegion) {
        if (SUPPORT_REGIONS.includes(finalRegion)) {
            internetRegionEndpoint = `${finalRegion}.tcb-api.tencentcloudapi.com`;
            internalRegionEndpoint = `internal.${finalRegion}.tcb-api.tencentcloudapi.com`;
        }
        else {
            console.warn('当前仅支持上海，广州地域，其他地域默认解析到固定域名(上海地域)');
            internetRegionEndpoint = `tcb-api.tencentcloudapi.com`;
            internalRegionEndpoint = `internal.tcb-api.tencentcloudapi.com`;
        }
    }
    else {
        internetRegionEndpoint = `tcb-api.tencentcloudapi.com`;
        internalRegionEndpoint = `internal.tcb-api.tencentcloudapi.com`;
    }
    // 有地域信息则访问地域级别域名，无地域信息则访问默认域名，默认域名固定解析到上海地域保持兼容
    // const internetRegionEndpoint = finalRegion
    //     ? `${finalRegion}.tcb-api.tencentcloudapi.com`
    //     : `tcb-api.tencentcloudapi.com`
    // const internalRegionEndpoint = finalRegion
    //     ? `internal.${finalRegion}.tcb-api.tencentcloudapi.com`
    //     : `internal.tcb-api.tencentcloudapi.com`
    // 同地域走内网，跨地域走公网
    const isSameRegionVisit = region ? region === process.env.TENCENTCLOUD_REGION : true;
    // const endpoint = isInScf || isInContainer ? internalRegionEndpoint : internetRegionEndpoint
    const endpoint = isSameRegionVisit && (isInScf || isInContainer)
        ? internalRegionEndpoint
        : internetRegionEndpoint;
    // const envpoint = envId ? `${envId}.${endpoint}` : endpoint
    const envpoint = endpoint;
    const url = `${protocol}://${envpoint}/admin`;
    const requestData = Object.assign(Object.assign({}, params), { envName: config.envId, timestamp: Date.now() });
    const requestHeaders = Object.assign(Object.assign({}, headers), { 'content-type': 'application/json', 'user-agent': `cloudbase-manager-node/0.1.0`, 'x-tcb-source': 'cloudbase-manager-node, not-scf' });
    const { secretId, secretKey, token, proxy } = config;
    const authData = {
        secretId,
        secretKey,
        method: method,
        pathname: '/admin',
        params: requestData,
        headers: requestHeaders
    };
    const authorization = auth_1.getAuth(authData);
    const requestBody = Object.assign(Object.assign({}, requestData), { sessionToken: token, authorization });
    const res = await http_request_1.fetch(url, {
        method,
        body: JSON.stringify(requestBody),
        headers: requestHeaders
    }, process.env.TCB_ADMIN_PROXY || proxy);
    return res;
}
exports.cloudBaseRequest = cloudBaseRequest;

}, function(modId) { var map = {"./auth":1654780339092,"./http-request":1654780339091}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339094, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.preLazy = void 0;
function preLazy() {
    return function (target, propertyKey, descriptor) {
        let oldFunc = descriptor.value;
        descriptor.value = async function () {
            // 检查当前环境对象上是否已加载好环境信息
            const currentEnvironment = this.environment;
            if (!currentEnvironment.inited) {
                await currentEnvironment.lazyInit();
            }
            let result = await oldFunc.apply(this, arguments);
            return result;
        };
    };
}
exports.preLazy = preLazy;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339095, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const packer_1 = require("./packer");
const error_1 = require("../error");
const utils_1 = require("../utils");
const constant_1 = require("../constant");
// 是否为 Node 函数
function isNodeFunction(runtime) {
    // 不严格限制
    return runtime === 'Nodejs10.15' || runtime === 'Nodejs8.9' || (runtime === null || runtime === void 0 ? void 0 : runtime.includes('Nodejs'));
}
// 解析函数配置，换成请求参数
function configToParams(options) {
    var _a, _b, _c, _d, _e;
    const { func, codeSecret, baseParams } = options;
    let installDependency;
    // Node 函数默认安装依赖
    installDependency = isNodeFunction(func.runtime) ? 'TRUE' : 'FALSE';
    // 是否安装依赖，选项可以覆盖
    if (typeof func.installDependency !== 'undefined') {
        installDependency = func.installDependency ? 'TRUE' : 'FALSE';
    }
    // 转换环境变量
    const envVariables = Object.keys(func.envVariables || {}).map(key => ({
        Key: key,
        Value: func.envVariables[key]
    }));
    // 当不存在 L5 配置时，不修改 L5 状态，否则根据 true/false 进行修改
    const l5Enable = typeof (func === null || func === void 0 ? void 0 : func.l5) === 'undefined' ? null : (func === null || func === void 0 ? void 0 : func.l5) ? 'TRUE' : 'FALSE';
    const params = Object.assign(Object.assign({}, baseParams), { FunctionName: func.name, 
        // 不可选择
        L5Enable: l5Enable });
    // 函数绑定的角色
    params.Role = func.role || params.Role;
    // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
    // Environment 为覆盖式修改，不保留已有字段
    envVariables.length && (params.Environment = { Variables: envVariables });
    // 处理入口
    params.Handler = func.handler || 'index.main';
    // 默认超时时间为 10S
    params.Timeout = Number(func.timeout) || 10;
    // 默认运行环境 Nodejs8.9
    params.Runtime = func.runtime || 'Nodejs8.9';
    if (((_a = func === null || func === void 0 ? void 0 : func.vpc) === null || _a === void 0 ? void 0 : _a.subnetId) !== undefined && ((_b = func === null || func === void 0 ? void 0 : func.vpc) === null || _b === void 0 ? void 0 : _b.vpcId) !== undefined) {
        // VPC 网络
        params.VpcConfig = {
            SubnetId: (_c = func === null || func === void 0 ? void 0 : func.vpc) === null || _c === void 0 ? void 0 : _c.subnetId,
            VpcId: (_d = func === null || func === void 0 ? void 0 : func.vpc) === null || _d === void 0 ? void 0 : _d.vpcId
        };
    }
    // 运行内存
    params.MemorySize = func.memorySize || 256;
    // 自动安装依赖
    params.InstallDependency = installDependency;
    // 代码保护
    if (codeSecret || func.codeSecret) {
        params.CodeSecret = codeSecret || func.codeSecret;
    }
    // 函数层
    if ((_e = func === null || func === void 0 ? void 0 : func.layers) === null || _e === void 0 ? void 0 : _e.length) {
        const transformLayers = func.layers.map(item => ({
            LayerName: item.name,
            LayerVersion: item.version
        }));
        params.Layers = transformLayers;
    }
    return params;
}
class FunctionService {
    constructor(environment) {
        this.environment = environment;
        this.scfService = new utils_1.CloudService(environment.cloudBaseContext, 'scf', '2018-04-16');
        this.vpcService = new utils_1.CloudService(environment.cloudBaseContext, 'vpc', '2017-03-12');
    }
    /**
     * 增量更新函数代码
     * @param {IUpdateFunctionIncrementalCodeParam} funcParam
     * @returns {Promise<void>}
     * @memberof FunctionService
     */
    async updateFunctionIncrementalCode(funcParam) {
        const { namespace } = this.getFunctionConfig();
        const { functionRootPath, func, deleteFiles, addFiles } = funcParam;
        const { name, runtime } = func;
        const params = {
            FunctionName: name,
            Namespace: namespace
        };
        let packer;
        let base64;
        if (deleteFiles) {
            params.DeleteFiles = deleteFiles;
        }
        if (addFiles) {
            // 将选中的增量文件或增量文件夹  转base64
            const codeType = runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
            packer = new packer_1.FunctionPacker({
                codeType,
                name,
                root: functionRootPath,
                ignore: [],
                incrementalPath: addFiles
            });
            await packer.build();
            base64 = await packer.getBase64Code();
            if (!base64) {
                throw new error_1.CloudBaseError('函数不存在！');
            }
            params.AddFiles = base64;
        }
        return this.scfService.request('UpdateFunctionIncrementalCode', params);
    }
    /**
     * 创建云函数
     * @param {ICreateFunctionParam} funcParam
     * @returns {(Promise<IResponseInfo | ICreateFunctionRes>)}
     */
    async createFunction(funcParam) {
        const { namespace } = this.getFunctionConfig();
        const { func, functionRootPath, force = false, base64Code, codeSecret, functionPath, } = funcParam;
        const funcName = func.name;
        const params = configToParams({
            func,
            codeSecret,
            baseParams: {
                Namespace: namespace,
                Role: 'TCB_QcsRole',
                Stamp: 'MINI_QCBASE'
            }
        });
        params.Code = await this.getCodeParams({
            func,
            base64Code,
            functionPath,
            functionRootPath
        }, params.InstallDependency);
        try {
            // 创建云函数
            const res = await this.scfService.request('CreateFunction', params);
            // 等待函数状态正常
            await this.waitFunctionActive(funcName, codeSecret);
            // 创建函数触发器、失败自动重试
            await this.retryCreateTrigger(funcName, func.triggers);
            // 设置路径，创建云接入路径
            if (func.path) {
                await this.createAccessPath(funcName, func.path);
            }
            // 检查函数状态
            await this.waitFunctionActive(funcName, codeSecret);
            return res;
        }
        catch (e) {
            // 函数存在
            const functionExist = e.code === 'ResourceInUse.FunctionName' || e.code === 'ResourceInUse.Function';
            // 已存在同名函数，强制更新
            if (functionExist && force) {
                // 1. 更新函数配置和代码，同名函数可能存在 codeSecret，先修改代码，清除 codeSecret
                const codeRes = await this.updateFunctionCode({
                    func,
                    base64Code,
                    functionPath,
                    functionRootPath,
                    codeSecret: codeSecret
                });
                // 等待函数状态正常
                await this.waitFunctionActive(funcName, codeSecret);
                // 2. 更新函数配置
                const configRes = await this.updateFunctionConfig(func);
                // 等待函数状态正常
                await this.waitFunctionActive(funcName, codeSecret);
                // 3. 创建函数触发器
                const triggerRes = await this.retryCreateTrigger(funcName, func.triggers);
                // 设置路径，创建云接入路径
                if (func.path) {
                    await this.createAccessPath(funcName, func.path);
                }
                // 检查函数状态
                await this.waitFunctionActive(funcName, codeSecret);
                // 返回全部操作的响应值
                return {
                    triggerRes,
                    configRes,
                    codeRes
                };
            }
            // 不强制覆盖，抛出错误
            if (e.message && !force) {
                throw new error_1.CloudBaseError(`[${funcName}] 部署失败：\n${e.message}`, {
                    code: e.code,
                    requestId: e.requestId
                });
            }
            throw e;
        }
    }
    /**
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<{
     *         Functions: Record<string, string>[]
     *         RequestId: string
     *         TotalCount: number
     *     }>}
     * @memberof FunctionService
     */
    async getFunctionList(limit = 20, offset = 0) {
        // 获取Function 环境配置
        const { namespace } = this.getFunctionConfig();
        const res = await this.scfService.request('ListFunctions', {
            Namespace: namespace,
            Limit: limit,
            Offset: offset
        });
        return res;
    }
    /**
     * 列出函数
     * @param {number} [limit=20]
     * @param {number} [offset=0]
     * @returns {Promise<Record<string, string>[]>}
     */
    async listFunctions(limit = 20, offset = 0) {
        // 获取Function 环境配置
        const { namespace } = this.getFunctionConfig();
        const res = await this.scfService.request('ListFunctions', {
            Namespace: namespace,
            Limit: limit,
            Offset: offset
        });
        const { Functions = [] } = res;
        const data = [];
        Functions.forEach(func => {
            const { FunctionId, FunctionName, Runtime, AddTime, ModTime, Status } = func;
            data.push({
                FunctionId,
                FunctionName,
                Runtime,
                AddTime,
                ModTime,
                Status
            });
        });
        return data;
    }
    /**
     * 删除云函数
     * @param {string} name 云函数名称
     * @returns {Promise<IResponseInfo>}
     */
    async deleteFunction(name) {
        const { namespace } = this.getFunctionConfig();
        return this.scfService.request('DeleteFunction', {
            FunctionName: name,
            Namespace: namespace
        });
    }
    /**
     * 获取云函数详细信息
     * @param {string} name 云函数名称
     * @returns {Promise<Record<string, string>>}
     */
    async getFunctionDetail(name, codeSecret) {
        const { namespace } = this.getFunctionConfig();
        const params = {
            FunctionName: name,
            Namespace: namespace,
            ShowCode: 'TRUE'
        };
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        const data = await this.scfService.request('GetFunction', params);
        // 解析 VPC 配置
        const { VpcId = '', SubnetId = '' } = data.VpcConfig || {};
        if (VpcId && SubnetId) {
            try {
                const vpcs = await this.getVpcs();
                const subnets = await this.getSubnets(VpcId);
                const vpc = vpcs.find(item => item.VpcId === VpcId);
                const subnet = subnets.find(item => item.SubnetId === SubnetId);
                data.VpcConfig = {
                    vpc,
                    subnet
                };
            }
            catch (e) {
                data.VpcConfig = {
                    vpc: '',
                    subnet: ''
                };
            }
        }
        return data;
    }
    /**
     * 获取函数日志
     * @param {{
     *         name: string
     *         offset: number
     *         limit: number
     *         order: string
     *         orderBy: string
     *         startTime: string
     *         endTime: string
     *         requestId: string
     *     }} options
     * @returns {Promise<IFunctionLogRes>}
     */
    async getFunctionLogs(options) {
        const { name, offset = 0, limit = 10, order, orderBy, startTime, endTime, requestId } = options;
        const { namespace } = this.getFunctionConfig();
        const params = {
            Namespace: namespace,
            FunctionName: name,
            Offset: offset,
            Limit: limit,
            Order: order,
            OrderBy: orderBy,
            StartTime: startTime,
            EndTime: endTime,
            FunctionRequestId: requestId
        };
        const res = await this.scfService.request('GetFunctionLogs', params);
        return res;
    }
    /**
     * 更新云函数配置
     * @param {ICloudFunction} func 云函数配置
     * @returns {Promise<IResponseInfo>}
     */
    async updateFunctionConfig(func) {
        var _a, _b, _c, _d, _e;
        const { namespace } = this.getFunctionConfig();
        const envVariables = Object.keys(func.envVariables || {}).map(key => ({
            Key: key,
            Value: func.envVariables[key]
        }));
        // 当不存在 L5 配置时，不修改 L5 状态，否则根据 true/false 进行修改
        const l5Enable = typeof func.l5 === 'undefined' ? null : func.l5 ? 'TRUE' : 'FALSE';
        const params = {
            FunctionName: func.name,
            Namespace: namespace,
            L5Enable: l5Enable
        };
        // 修复参数存在 undefined 字段时，会出现鉴权失败的情况
        // Environment 为覆盖式修改，不保留已有字段
        envVariables.length && (params.Environment = { Variables: envVariables });
        // 不设默认超时时间，防止覆盖已有配置
        func.timeout && (params.Timeout = func.timeout);
        // 运行时
        func.runtime && (params.Runtime = func.runtime);
        if (((_a = func === null || func === void 0 ? void 0 : func.vpc) === null || _a === void 0 ? void 0 : _a.subnetId) !== undefined && ((_b = func === null || func === void 0 ? void 0 : func.vpc) === null || _b === void 0 ? void 0 : _b.vpcId) !== undefined) {
            // VPC 网络
            params.VpcConfig = {
                SubnetId: (_c = func === null || func === void 0 ? void 0 : func.vpc) === null || _c === void 0 ? void 0 : _c.subnetId,
                VpcId: (_d = func === null || func === void 0 ? void 0 : func.vpc) === null || _d === void 0 ? void 0 : _d.vpcId
            };
        }
        // 内存
        func.memorySize && (params.MemorySize = func.memorySize);
        // Node 函数默认安装依赖
        isNodeFunction(func.runtime) && (params.InstallDependency = 'TRUE');
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            params.InstallDependency = func.installDependency ? 'TRUE' : 'FALSE';
        }
        // 函数层
        if ((_e = func === null || func === void 0 ? void 0 : func.layers) === null || _e === void 0 ? void 0 : _e.length) {
            const transformLayers = func.layers.map(item => ({
                LayerName: item.name,
                LayerVersion: item.version
            }));
            params.Layers = transformLayers;
        }
        return this.scfService.request('UpdateFunctionConfiguration', params);
    }
    /**
     *
     * @param {IUpdateFunctionCodeParam} funcParam
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    async updateFunctionCode(funcParam) {
        const { func, functionRootPath, base64Code, codeSecret, functionPath } = funcParam;
        const funcName = func.name;
        const { namespace } = this.getFunctionConfig();
        let installDependency;
        // Node 函数默认安装依赖
        installDependency = isNodeFunction(func.runtime) ? 'TRUE' : 'FALSE';
        // 是否安装依赖，选项可以覆盖
        if (typeof func.installDependency !== 'undefined') {
            installDependency = func.installDependency ? 'TRUE' : 'FALSE';
        }
        const codeParams = await this.getCodeParams({
            func,
            functionPath,
            functionRootPath,
            base64Code
        }, installDependency);
        const params = Object.assign({ FunctionName: funcName, Namespace: namespace, Handler: func.handler || 'index.main', InstallDependency: installDependency }, codeParams);
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        try {
            // 等待函数状态正常
            await this.waitFunctionActive(funcName, codeSecret);
            // 更新云函数代码
            const res = await this.scfService.request('UpdateFunctionCode', params);
            if (installDependency && func.isWaitInstall === true) {
                await this.waitFunctionActive(funcName, codeSecret);
            }
            return res;
        }
        catch (e) {
            throw new error_1.CloudBaseError(`[${funcName}] 函数代码更新失败： ${e.message}`, {
                code: e.code
            });
        }
    }
    /**
     * 调用云函数
     * @param {string} name 云函数名称
     * @param {Record<string, any>} params 调用函数传入参数
     * @returns {Promise<IFunctionInvokeRes>}
     */
    async invokeFunction(name, params) {
        const { namespace } = this.getFunctionConfig();
        const _params = {
            FunctionName: name,
            Namespace: namespace,
            LogType: 'Tail'
        };
        if (params) {
            _params.ClientContext = JSON.stringify(params);
        }
        try {
            const { RequestId, Result } = await this.scfService.request('Invoke', _params);
            return Object.assign({ RequestId }, Result);
        }
        catch (e) {
            throw new error_1.CloudBaseError(`[${name}] 调用失败：\n${e.message}`);
        }
    }
    /**
     * 复制云函数
     * @param {string} name 云函数名称
     * @param {string} newFunctionName 新的云函数名称
     * @param {string} targetEnvId 目标环境 Id
     * @param {boolean} [force=false] 是否覆盖同名云函数
     * @returns {Promise<IResponseInfo>}
     */
    /* eslint-disable-next-line */
    async copyFunction(name, newFunctionName, targetEnvId, force = false) {
        const { namespace } = this.getFunctionConfig();
        if (!namespace || !name || !newFunctionName) {
            throw new error_1.CloudBaseError('参数缺失');
        }
        return this.scfService.request('CopyFunction', {
            FunctionName: name,
            NewFunctionName: newFunctionName,
            Namespace: namespace,
            TargetNamespace: targetEnvId || namespace,
            Override: force ? true : false
        });
    }
    /**
     * 创建云函数触发器
     * @param {string} name 云函数名称
     * @param {ICloudFunctionTrigger[]} triggers 云函数触发器配置
     * @returns {Promise<IResponseInfo>}
     */
    async createFunctionTriggers(name, triggers = []) {
        if (!triggers || !triggers.length)
            return null;
        const { namespace } = this.getFunctionConfig();
        const parsedTriggers = triggers.map(item => {
            if (item.type !== 'timer') {
                throw new error_1.CloudBaseError(`不支持的触发器类型 [${item.type}]，目前仅支持定时触发器（timer）！`);
            }
            return {
                TriggerName: item.name,
                Type: item.type,
                TriggerDesc: item.config
            };
        });
        return this.scfService.request('BatchCreateTrigger', {
            FunctionName: name,
            Namespace: namespace,
            Triggers: JSON.stringify(parsedTriggers),
            Count: parsedTriggers.length
        });
    }
    /**
     * 删除云函数触发器
     * @param {string} name 云函数名称
     * @param {string} triggerName 云函数触发器名称
     * @returns {Promise<IResponseInfo>}
     */
    async deleteFunctionTrigger(name, triggerName) {
        const { namespace } = this.getFunctionConfig();
        return this.scfService.request('DeleteTrigger', {
            FunctionName: name,
            Namespace: namespace,
            TriggerName: triggerName,
            Type: 'timer'
        });
    }
    /**
     * 获取云函数代码下载 链接
     * @param {string} functionName
     * @param {string} [codeSecret]
     * @returns {Promise<IFunctionDownloadUrlRes>}
     * @memberof FunctionService
     */
    async getFunctionDownloadUrl(functionName, codeSecret) {
        const { namespace } = this.getFunctionConfig();
        const params = {
            FunctionName: functionName,
            Namespace: namespace
        };
        if (codeSecret) {
            params.CodeSecret = codeSecret;
        }
        try {
            const { Url, CodeSha256, RequestId } = await this.scfService.request('GetFunctionAddress', params);
            return { Url, RequestId, CodeSha256 };
        }
        catch (e) {
            throw new error_1.CloudBaseError(`[${functionName}] 获取函数代码下载链接失败：\n${e.message}`);
        }
    }
    // 创建文件层版本
    async createLayer(options) {
        const { env } = this.getFunctionConfig();
        const { contentPath = '', name, base64Content = '', runtimes = [], description = '', licenseInfo = '' } = options;
        let base64;
        if (base64Content) {
            base64 = base64Content;
        }
        else if (utils_1.isDirectory(contentPath)) {
            // 压缩文件夹
            const dirName = path_1.default.parse(contentPath).name;
            const dest = path_1.default.join(process.cwd(), `temp-${dirName}.zip`);
            // ZIP 文件存在，删除 ZIP 文件
            if (utils_1.checkFullAccess(dest)) {
                utils_1.delSync(dest);
            }
            await utils_1.compressToZip({
                dirPath: contentPath,
                outputPath: dest
            });
            // 转换成 base64
            const fileBuffer = await fs_1.default.promises.readFile(dest);
            base64 = fileBuffer.toString('base64');
            utils_1.delSync(dest);
        }
        else {
            const fileType = path_1.default.extname(contentPath);
            if (fileType !== '.zip') {
                throw new error_1.CloudBaseError('文件类型不正确，目前只支持 ZIP 文件！');
            }
            const fileBuffer = await fs_1.default.promises.readFile(contentPath);
            base64 = fileBuffer.toString('base64');
        }
        return this.scfService.request('PublishLayerVersion', {
            LayerName: name,
            CompatibleRuntimes: runtimes,
            Content: {
                // 最大支持 20M
                ZipFile: base64
            },
            Description: description,
            LicenseInfo: licenseInfo,
            Src: `TCB_${env}`
        });
    }
    // 删除文件层版本
    async deleteLayerVersion(options) {
        const { name, version } = options;
        return this.scfService.request('DeleteLayerVersion', {
            LayerName: name,
            LayerVersion: version
        });
    }
    // 获取层版本列表
    async listLayerVersions(options) {
        const { name, runtimes } = options;
        let param = {
            LayerName: name
        };
        if (runtimes === null || runtimes === void 0 ? void 0 : runtimes.length) {
            param.CompatibleRuntime = runtimes;
        }
        return this.scfService.request('ListLayerVersions', param);
    }
    // 获取文件层列表
    async listLayers(options) {
        const { env } = this.getFunctionConfig();
        const { limit = 20, offset = 0, runtime, searchKey } = options;
        let param = {
            Limit: limit,
            Offset: offset,
            SearchKey: searchKey,
            SearchSrc: `TCB_${env}`
        };
        if (runtime) {
            param.CompatibleRuntime = runtime;
        }
        return this.scfService.request('ListLayers', param);
    }
    // 获取层版本详细信息
    async getLayerVersion(options) {
        const { name, version } = options;
        return this.scfService.request('GetLayerVersion', {
            LayerName: name,
            LayerVersion: version
        });
    }
    /**
     * 设置预置并发
     * @private
     * @param {IProvisionedConcurrencyConfig} concurrencyConfig
     * @returns
     * @memberof FunctionService
     */
    async setProvisionedConcurrencyConfig(concurrencyConfig) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, qualifier: Qualifier, versionProvisionedConcurrencyNum: VersionProvisionedConcurrencyNum } = concurrencyConfig;
        return this.scfService.request('PutProvisionedConcurrencyConfig', {
            FunctionName,
            Qualifier,
            VersionProvisionedConcurrencyNum,
            Namespace: namespace
        });
    }
    /**
     * 获取函数预置并发详情
     * @private
     * @param {IGetProvisionedConcurrencyConfig} concurrencyConfig
     * @returns {Promise<IGetProvisionedConcurrencyRes>}
     * @memberof FunctionService
     */
    async getProvisionedConcurrencyConfig(concurrencyConfig) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, qualifier: Qualifier } = concurrencyConfig;
        return this.scfService.request('GetProvisionedConcurrencyConfig', {
            FunctionName,
            Qualifier,
            Namespace: namespace
        });
    }
    /**
     * 删除预置并发
     * @private
     * @param {IGetProvisionedConcurrencyConfig} concurrencyConfig
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    async deleteProvisionedConcurrencyConfig(concurrencyConfig) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, qualifier: Qualifier } = concurrencyConfig;
        return this.scfService.request('DeleteProvisionedConcurrencyConfig', {
            FunctionName,
            Qualifier,
            Namespace: namespace
        });
    }
    /**
     * 发布新版本
     * @param {IPublishVersionParams} publishParams
     * @returns {Promise<IPublishVersionRes>}
     * @memberof FunctionService
     */
    async publishVersion(publishParams) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, description: Description } = publishParams;
        return this.scfService.request('PublishVersion', {
            FunctionName,
            Description,
            Namespace: namespace
        });
    }
    /**
     * 查询函数版本详情
     * @param {IListFunctionVersionParams} listVersionParams
     * @returns {Promise<IFunctionVersionsRes>}
     * @memberof FunctionService
     */
    async listVersionByFunction(listVersionParams) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, offset: Offset, limit: Limit, order: Order, orderBy: OrderBy } = listVersionParams;
        return this.scfService.request('ListVersionByFunction', {
            FunctionName,
            Namespace: namespace,
            Offset,
            Limit,
            Order,
            OrderBy
        });
    }
    /**
     *
     * @param {IUpdateFunctionAliasConfig} updateVersionConfigParams
     * @returns {Promise<IResponseInfo>}
     * @memberof FunctionService
     */
    async updateFunctionAliasConfig(updateVersionConfigParams) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, name: Name, functionVersion: FunctionVersion, routingConfig: RoutingConfig, description: Description } = updateVersionConfigParams;
        return this.scfService.request('UpdateAlias', {
            FunctionName,
            Name,
            Namespace: namespace,
            FunctionVersion,
            RoutingConfig,
            Description
        });
    }
    /**
     * 查询函数别名详情
     * @param {IGetFunctionAlias} params
     * @returns {Promise<IGetFunctionAliasRes>}
     * @memberof FunctionService
     */
    async getFunctionAlias(params) {
        const { namespace } = this.getFunctionConfig();
        const { functionName: FunctionName, name: Name } = params;
        return this.scfService.request('GetAlias', {
            FunctionName,
            Name,
            Namespace: namespace
        });
    }
    async createAccessPath(name, path) {
        const access = this.environment.getAccessService();
        try {
            await access.createAccess({
                name,
                path
            });
        }
        catch (e) {
            // 当 Path 存在时，校验 Path 绑定的函数是不是当前函数
            if (e.code === 'InvalidParameter.APICreated') {
                const { APISet } = await access.getAccessList({
                    name
                });
                if ((APISet === null || APISet === void 0 ? void 0 : APISet[0].Name) !== name || (APISet === null || APISet === void 0 ? void 0 : APISet[0].Type) !== 1) {
                    throw e;
                }
            }
            else {
                throw e;
            }
        }
    }
    async getCodeParams(options, installDependency) {
        const { func, functionPath, functionRootPath, base64Code } = options;
        // 20MB
        const BIG_LENGTH = 167772160;
        if ((base64Code === null || base64Code === void 0 ? void 0 : base64Code.length) > BIG_LENGTH) {
            throw new error_1.CloudBaseError('base64 不能大于 20 MB');
        }
        if (base64Code === null || base64Code === void 0 ? void 0 : base64Code.length) {
            return {
                ZipFile: base64Code
            };
        }
        const codeType = func.runtime === 'Java8' ? packer_1.CodeType.JavaFile : packer_1.CodeType.File;
        // 云端安装依赖，自动忽略 node_modules 目录
        const ignore = installDependency === 'TRUE'
            ? ['node_modules/**/*', 'node_modules', ...(func.ignore || [])]
            : [...(func.ignore || [])];
        const packer = new packer_1.FunctionPacker({
            ignore,
            codeType,
            functionPath,
            name: func.name,
            root: functionRootPath
        });
        await packer.build();
        // 通过云 API 传输的代码大小不能超过 50MB
        const reachMax = await packer.isReachMaxSize();
        if (reachMax) {
            throw new error_1.CloudBaseError('函数代码不能大于 50MB');
        }
        const base64 = await packer.getBase64Code();
        if (!(base64 === null || base64 === void 0 ? void 0 : base64.length)) {
            throw new error_1.CloudBaseError('文件不能为空');
        }
        return {
            ZipFile: base64
        };
    }
    // 获取 COS 临时信息
    async getTempCosInfo(name) {
        const { env, appId } = await this.getFunctionConfig();
        /**
         * Response:
         * Date: "2020-03-18"
         * RequestId: "91876f56-7cd3-42bb-bc32-b74df5d0516e"
         * Sign: "Gc8QvXD50dx7yBfsl2yEYFwIL45hPTEyNTM2NjU4MTkm
         */
        return this.scfService.request('GetTempCosInfo', {
            ObjectPath: `${appId}/${env}/${name}.zip"`
        });
    }
    async retryCreateTrigger(name, triggers, count = 0) {
        try {
            const res = await this.createFunctionTriggers(name, triggers);
            return res;
        }
        catch (e) {
            if (count < 3) {
                await utils_1.sleep(500);
                const res = await this.retryCreateTrigger(name, triggers, count + 1);
                return res;
            }
            else {
                throw e;
            }
        }
    }
    /**
     * 获取函数配置信息
     * @private
     * @returns
     * @memberof FunctionService
     */
    getFunctionConfig() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const namespace = envConfig.Functions[0].Namespace;
        const appId = (_a = envConfig.Storages[0]) === null || _a === void 0 ? void 0 : _a.AppId;
        const { proxy } = this.environment.cloudBaseContext;
        return {
            proxy,
            appId,
            namespace,
            env: envConfig.EnvId
        };
    }
    /**
     * 获取 vpc 信息
     * @returns
     */
    async getVpcs() {
        const { VpcSet } = await this.vpcService.request('DescribeVpcs');
        return VpcSet;
    }
    /**
     * 获取子网
     * @param {string} vpcId
     * @returns
     */
    async getSubnets(vpcId) {
        const { SubnetSet } = await this.vpcService.request('DescribeSubnets', {
            Filters: [
                {
                    Name: 'vpc-id',
                    Values: [vpcId]
                }
            ]
        });
        return SubnetSet;
    }
    // 检查函数状态，部分操作在函数更新中时不可进行
    async waitFunctionActive(funcName, codeSecret) {
        let ticker;
        let timer;
        let resolved;
        return new Promise((resolve, reject) => {
            // 超时时间 5 分钟
            timer = setTimeout(() => {
                clearInterval(ticker);
                if (!resolved) {
                    reject(new error_1.CloudBaseError('函数状态异常，检查超时'));
                }
            }, 300000);
            ticker = setInterval(async () => {
                try {
                    const { Status } = await this.getFunctionDetail(funcName, codeSecret);
                    // 更新中
                    if (Status === constant_1.SCF_STATUS.CREATING || Status === constant_1.SCF_STATUS.UPDATING)
                        return;
                    // 创建失败
                    if (Status === constant_1.SCF_STATUS.CREATE_FAILED) {
                        throw new error_1.CloudBaseError('云函数创建失败');
                    }
                    // 函数状态正常
                    clearInterval(ticker);
                    clearTimeout(timer);
                    resolve();
                }
                catch (e) {
                    clearInterval(ticker);
                    clearTimeout(timer);
                    reject(e);
                }
                resolved = true;
            }, 1000);
        });
    }
}
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionIncrementalCode", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "createFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionList", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "listFunctions", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "deleteFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionDetail", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionLogs", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionConfig", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionCode", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "invokeFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "copyFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "createFunctionTriggers", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "deleteFunctionTrigger", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionDownloadUrl", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "createLayer", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "deleteLayerVersion", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "listLayerVersions", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "listLayers", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getLayerVersion", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "setProvisionedConcurrencyConfig", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getProvisionedConcurrencyConfig", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "deleteProvisionedConcurrencyConfig", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "publishVersion", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "listVersionByFunction", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "updateFunctionAliasConfig", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getFunctionAlias", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "createAccessPath", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getCodeParams", null);
__decorate([
    utils_1.preLazy()
], FunctionService.prototype, "getTempCosInfo", null);
exports.FunctionService = FunctionService;

}, function(modId) { var map = {"./packer":1654780339096,"../error":1654780339085,"../utils":1654780339086,"../constant":1654780339088}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339096, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionPacker = exports.CodeType = exports.API_MAX_SIZE = exports.BIG_FILE_SIZE = void 0;
const fs_1 = __importDefault(require("fs"));
const del_1 = __importDefault(require("del"));
const path_1 = __importDefault(require("path"));
const make_dir_1 = __importDefault(require("make-dir"));
const util_1 = __importDefault(require("util"));
const utils_1 = require("../utils");
const error_1 = require("../error");
// 10 MB
exports.BIG_FILE_SIZE = 10485760;
exports.API_MAX_SIZE = 52428800;
var CodeType;
(function (CodeType) {
    CodeType[CodeType["File"] = 0] = "File";
    CodeType[CodeType["JavaFile"] = 1] = "JavaFile";
})(CodeType = exports.CodeType || (exports.CodeType = {}));
const TEMPDIR_NAME = '.cloudbase_temp';
/**
 * 将函数代码转换成 Base64 编码
 * 普通文件：Node，PHP
 * Java 文件：Jar，ZIP
 */
class FunctionPacker {
    constructor(options) {
        const { root, name, codeType, ignore, incrementalPath, functionPath } = options;
        this.name = name;
        this.ignore = ignore;
        this.codeType = codeType;
        this.incrementalPath = incrementalPath;
        this.funcPath = functionPath ? functionPath : path_1.default.resolve(root, name);
        // 每个函数采用不同的文件夹
        this.tmpPath = root
            ? path_1.default.join(root, `${TEMPDIR_NAME}_${name}`)
            : path_1.default.join(process.cwd(), `${TEMPDIR_NAME}_${name}`);
    }
    async compressFiles() {
        utils_1.checkFullAccess(this.funcPath, true);
        // 清除原打包文件
        this.clean();
        // 确保目标路径存在
        await make_dir_1.default(this.tmpPath);
        // 生成 name.zip 文件
        this.zipFilePath = path_1.default.resolve(this.tmpPath, `${this.name}.zip`);
        const zipOption = {
            dirPath: this.funcPath,
            outputPath: this.zipFilePath,
            ignore: this.ignore
        };
        if (this.incrementalPath) {
            zipOption.pattern = this.incrementalPath;
        }
        await utils_1.compressToZip(zipOption);
    }
    // 获取 Java 代码
    getJavaFile() {
        const { funcPath } = this;
        // funcPath 可能以 .jar 或 .zip 结尾
        const filePath = funcPath.replace(/\.jar$|\.zip$/g, '');
        // Java 代码为 jar 或 zip 包
        const jarExist = utils_1.checkFullAccess(`${filePath}.jar`);
        const zipExist = utils_1.checkFullAccess(`${filePath}.zip`);
        if (!jarExist && !zipExist) {
            throw new error_1.CloudBaseError('未找到部署函数的 Jar 或者 ZIP 格式文件！');
        }
        this.zipFilePath = jarExist ? `${filePath}.jar` : `${filePath}.zip`;
    }
    async build() {
        if (this.codeType === CodeType.JavaFile) {
            try {
                await this.getJavaFile();
            }
            catch (e) {
                this.clean();
                throw new error_1.CloudBaseError(`函数代码打包失败：${e.message}`, {
                    code: e.code
                });
            }
        }
        if (this.codeType === CodeType.File) {
            try {
                await this.compressFiles();
            }
            catch (e) {
                this.clean();
                throw new error_1.CloudBaseError(`函数代码打包失败：${e.message}`, {
                    code: e.code
                });
            }
        }
    }
    // 函数压缩后的代码大于 10M，建议使用 COS 上传（当前暂不支持）
    async isBigFile() {
        if (!this.zipFilePath) {
            await this.build();
        }
        const promiseStat = util_1.default.promisify(fs_1.default.stat);
        const fileStats = await promiseStat(this.zipFilePath);
        return fileStats.size > exports.BIG_FILE_SIZE;
    }
    // API 最大 50MB
    async isReachMaxSize() {
        if (!this.zipFilePath) {
            await this.build();
        }
        const promiseStat = util_1.default.promisify(fs_1.default.stat);
        const fileStats = await promiseStat(this.zipFilePath);
        return fileStats.size > exports.API_MAX_SIZE;
    }
    async getBase64Code() {
        // 将 zip 文件转换成 base64
        const base64 = fs_1.default.readFileSync(this.zipFilePath).toString('base64');
        // 非 Java 函数清除打包文件
        if (this.codeType !== CodeType.JavaFile) {
            await this.clean();
        }
        return base64;
    }
    async clean() {
        // allow deleting the current working directory and outside
        this.tmpPath && del_1.default.sync([this.tmpPath], { force: true });
        return;
    }
}
exports.FunctionPacker = FunctionPacker;

}, function(modId) { var map = {"../utils":1654780339086,"../error":1654780339085}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339097, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const make_dir_1 = __importDefault(require("make-dir"));
const walkdir_1 = __importDefault(require("walkdir"));
const micromatch_1 = __importDefault(require("micromatch"));
const cos_nodejs_sdk_v5_1 = __importDefault(require("cos-nodejs-sdk-v5"));
const utils_1 = require("../utils");
const error_1 = require("../error");
const parallel_1 = require("../utils/parallel");
const BIG_FILE_SIZE = 5242880; // 5MB 1024*1024*5
class StorageService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    /**
     * 上传文件
     * localPath 为文件夹时，会尝试在文件夹中寻找 cloudPath 中的文件名
     * @param {string} localPath 本地文件的绝对路径
     * @param {string} cloudPath 云端文件路径，如 img/test.png
     * @returns {Promise<any>}
     */
    async uploadFile(options) {
        const { localPath, cloudPath = '', onProgress } = options;
        const { bucket, region } = this.getStorageConfig();
        return this.uploadFileCustom({
            localPath,
            cloudPath,
            bucket,
            region,
            onProgress
        });
    }
    /**
     * 批量上传文件，默认并发 5
     * @param options
     */
    async uploadFiles(options) {
        const { files, onProgress, parallel, onFileFinish, ignore, retryCount, retryInterval } = options;
        const { bucket, region } = this.getStorageConfig();
        return this.uploadFilesCustom({
            files,
            bucket,
            region,
            ignore,
            parallel,
            onProgress,
            onFileFinish,
            retryCount,
            retryInterval
        });
    }
    /**
     * 上传文件，支持自定义 Bucket 和 Region
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    async uploadFileCustom(options) {
        const { localPath, cloudPath, bucket, region, onProgress, fileId = true } = options;
        let localFilePath = '';
        let resolveLocalPath = path_1.default.resolve(localPath);
        utils_1.checkFullAccess(resolveLocalPath, true);
        // 如果 localPath 是一个文件夹，尝试在文件下寻找 cloudPath 中的文件
        const fileStats = fs_1.default.statSync(resolveLocalPath);
        if (fileStats.isDirectory()) {
            const fileName = path_1.default.parse(cloudPath).base;
            const attemptFilePath = path_1.default.join(localPath, fileName);
            if (utils_1.checkFullAccess(attemptFilePath)) {
                localFilePath = path_1.default.resolve(attemptFilePath);
            }
        }
        else {
            localFilePath = resolveLocalPath;
        }
        if (!localFilePath) {
            throw new error_1.CloudBaseError('本地文件不存在！');
        }
        const cos = this.getCos();
        const putObject = util_1.default.promisify(cos.putObject).bind(cos);
        const sliceUploadFile = util_1.default.promisify(cos.sliceUploadFile).bind(cos);
        let cosFileId;
        // 针对静态托管，fileId 不是必须的
        if (fileId) {
            // 针对文件存储，cosFileId 是必须的，区分上传人员，否则无法获取下载连接
            const res = await this.getUploadMetadata(cloudPath);
            cosFileId = res.cosFileId;
        }
        let res;
        // 小文件，直接上传
        if (fileStats.size < BIG_FILE_SIZE) {
            res = await putObject({
                onProgress,
                Bucket: bucket,
                Region: region,
                Key: cloudPath,
                StorageClass: 'STANDARD',
                ContentLength: fileStats.size,
                Body: fs_1.default.createReadStream(localFilePath),
                'x-cos-meta-fileid': cosFileId
            });
        }
        else {
            // 大文件，分块上传
            res = await sliceUploadFile({
                Bucket: bucket,
                Region: region,
                Key: cloudPath,
                FilePath: localFilePath,
                StorageClass: 'STANDARD',
                AsyncLimit: 3,
                onProgress,
                'x-cos-meta-fileid': cosFileId
            });
        }
        if (res.statusCode !== 200) {
            throw new error_1.CloudBaseError(`上传文件错误：${JSON.stringify(res)}`);
        }
        return res;
    }
    /**
     * 上传文件夹
     * @param {string} localPath 本地文件夹路径
     * @param {string} cloudPath 云端文件夹
     * @param {number} parallel 并发量
     * @param {number} retryCount 重试次数
     * @param {number} retryInterval 重试时间间隔(毫秒)
     * @param {(string | string[])} ignore
     * @param {(string | string[])} ignore
     * @returns {Promise<void>}
     */
    async uploadDirectory(options) {
        const { localPath, cloudPath = '', ignore, onProgress, onFileFinish, parallel, retryCount, retryInterval } = options;
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const { bucket, region } = this.getStorageConfig();
        return this.uploadDirectoryCustom({
            localPath,
            cloudPath,
            parallel,
            retryCount,
            retryInterval,
            bucket,
            region,
            ignore,
            onProgress,
            onFileFinish
        });
    }
    /**
     * 上传文件夹，支持自定义 Region 和 Bucket
     * @param {string} localPath
     * @param {string} cloudPath
     * @param {number} parallel
     * @param {number} retryCount
     * @param {number} retryInterval
     * @param {string} bucket
     * @param {string} region
     * @param {IOptions} options
     * @returns {Promise<void>}
     */
    async uploadDirectoryCustom(options) {
        const { localPath, cloudPath, bucket, region, onProgress, onFileFinish, ignore, fileId = true, parallel = 20, retryCount = 0, retryInterval = 500 } = options;
        // 此处不检查路径是否存在
        // 绝对路径 /var/blog/xxxx
        const resolvePath = path_1.default.resolve(localPath);
        // 在路径结尾加上 '/'
        const resolveLocalPath = path_1.default.join(resolvePath, path_1.default.sep);
        const filePaths = await this.walkLocalDir(resolveLocalPath, ignore);
        if (!filePaths || !filePaths.length) {
            return;
        }
        const fileStatsList = filePaths.map(filePath => {
            // 处理 windows 路径
            const fileKeyPath = filePath.replace(resolveLocalPath, '').replace(/\\/g, '/');
            // 解析 cloudPath
            let cloudFileKey = path_1.default.join(cloudPath, fileKeyPath).replace(/\\/g, '/');
            if (utils_1.isDirectory(filePath)) {
                cloudFileKey = this.getCloudKey(cloudFileKey);
                return {
                    filePath,
                    cloudFileKey,
                    isDir: true
                };
            }
            else {
                return {
                    filePath,
                    cloudFileKey,
                    isDir: false
                };
            }
        });
        // 创建目录请求
        const creatingDirController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        const creatingDirTasks = fileStatsList
            .filter(info => info.isDir)
            .map(info => () => this.createCloudDirectroyCustom({
            cloudPath: info.cloudFileKey,
            bucket,
            region
        }));
        creatingDirController.loadTasks(creatingDirTasks);
        await creatingDirController.run();
        // 上传文件对象
        const tasks = fileStatsList
            .filter(stats => !stats.isDir)
            .map(stats => async () => {
            let cosFileId;
            if (fileId) {
                const res = await this.getUploadMetadata(stats.cloudFileKey);
                cosFileId = res.cosFileId;
            }
            return {
                Bucket: bucket,
                Region: region,
                Key: stats.cloudFileKey,
                FilePath: stats.filePath,
                'x-cos-meta-fileid': cosFileId
            };
        });
        // 控制请求并发
        const getMetadataController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        getMetadataController.loadTasks(tasks);
        const files = await getMetadataController.run();
        // 对文件上传进行处理
        const cos = this.getCos(parallel);
        const uploadFiles = util_1.default.promisify(cos.uploadFiles).bind(cos);
        const params = {
            files,
            SliceSize: BIG_FILE_SIZE,
            onProgress,
            onFileFinish
        };
        return this.uploadFilesWithRetry({
            uploadFiles,
            options: params,
            times: retryCount,
            interval: retryInterval,
            failedFiles: []
        });
    }
    /**
     * 批量上传文件
     * @param options
     */
    async uploadFilesCustom(options) {
        const { files, bucket, region, ignore, onProgress, onFileFinish, fileId = true, parallel = 20, retryCount = 0, retryInterval = 500 } = options;
        if (!files || !files.length) {
            return;
        }
        let fileList = files
            .map(item => {
            const { localPath, cloudPath } = item;
            return {
                filePath: localPath,
                cloudFileKey: cloudPath
            };
        })
            .filter(item => ((ignore === null || ignore === void 0 ? void 0 : ignore.length) ? !micromatch_1.default.isMatch(item.filePath, ignore) : true));
        // 生成上传文件属性
        const tasks = fileList.map(stats => async () => {
            let cosFileId;
            if (fileId) {
                const res = await this.getUploadMetadata(stats.cloudFileKey);
                cosFileId = res.cosFileId;
            }
            return {
                Bucket: bucket,
                Region: region,
                Key: stats.cloudFileKey,
                FilePath: stats.filePath,
                'x-cos-meta-fileid': cosFileId
            };
        });
        // 控制请求并发
        const asyncTaskController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        asyncTaskController.loadTasks(tasks);
        fileList = await asyncTaskController.run();
        const cos = this.getCos(parallel);
        const uploadFiles = util_1.default.promisify(cos.uploadFiles).bind(cos);
        const params = {
            files: fileList,
            SliceSize: BIG_FILE_SIZE,
            onProgress,
            onFileFinish
        };
        // return uploadFiles({
        //     onProgress,
        //     onFileFinish,
        //     files: fileList,
        //     SliceSize: BIG_FILE_SIZE
        // })
        return this.uploadFilesWithRetry({
            uploadFiles,
            options: params,
            times: retryCount,
            interval: retryInterval,
            failedFiles: []
        });
    }
    /**
     * 创建一个空的文件夹
     * @param {string} cloudPath
     */
    async createCloudDirectroy(cloudPath) {
        const { bucket, region } = this.getStorageConfig();
        await this.createCloudDirectroyCustom({
            cloudPath,
            bucket,
            region
        });
    }
    /**
     * 创建一个空的文件夹，支持自定义 Region 和 Bucket
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     */
    async createCloudDirectroyCustom(options) {
        const { cloudPath, bucket, region } = options;
        const cos = this.getCos();
        const putObject = util_1.default.promisify(cos.putObject).bind(cos);
        const dirKey = this.getCloudKey(cloudPath);
        const res = await putObject({
            Bucket: bucket,
            Region: region,
            Key: dirKey,
            Body: ''
        });
        if (res.statusCode !== 200) {
            throw new error_1.CloudBaseError(`创建文件夹失败：${JSON.stringify(res)}`);
        }
    }
    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<NodeJS.ReadableStream>}
     */
    async downloadFile(options) {
        const { cloudPath, localPath } = options;
        const resolveLocalPath = path_1.default.resolve(localPath);
        const fileDir = path_1.default.dirname(localPath);
        utils_1.checkFullAccess(fileDir, true);
        const urlList = await this.getTemporaryUrl([cloudPath]);
        const { url } = urlList[0];
        const { proxy } = await this.environment.getAuthConfig();
        const res = await utils_1.fetchStream(url, {}, proxy);
        // localPath 不存在时，返回 ReadableStream
        if (!localPath) {
            return res.body;
        }
        const dest = fs_1.default.createWriteStream(resolveLocalPath);
        res.body.pipe(dest);
        // 写完成后返回
        return new Promise(resolve => {
            dest.on('close', () => {
                // 返回文件地址
                resolve(resolveLocalPath);
            });
        });
    }
    /**
     * 下载文件夹
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<(NodeJS.ReadableStream | string)[]>}
     */
    async downloadDirectory(options) {
        const { cloudPath, localPath, parallel = 20 } = options;
        const resolveLocalPath = path_1.default.resolve(localPath);
        utils_1.checkFullAccess(resolveLocalPath, true);
        const cloudDirectoryKey = this.getCloudKey(cloudPath);
        const files = await this.walkCloudDir(cloudDirectoryKey);
        const promises = files.map(file => async () => {
            return this.downloadWithFilePath({ file, cloudDirectoryKey, resolveLocalPath });
        });
        const asyncTaskController = new parallel_1.AsyncTaskParallelController(parallel, 50);
        asyncTaskController.loadTasks(promises);
        let res = await asyncTaskController.run();
        const errorIndexArr = [];
        res.map((item, index) => /Error/gi.test(Object.prototype.toString.call(item)) && errorIndexArr.push(index));
        // 重试逻辑
        if (errorIndexArr.length) {
            const errorFiles = errorIndexArr.map(errorIndex => files[errorIndex]);
            asyncTaskController.loadTasks(errorFiles.map(file => async () => {
                return this.downloadWithFilePath({ file, cloudDirectoryKey, resolveLocalPath });
            }));
            res = await asyncTaskController.run();
        }
        const errorResultArr = this.determineDownLoadResultIsError(res);
        if (errorResultArr.length) {
            throw errorResultArr[0];
        }
        return res;
    }
    /**
     * 列出文件夹下的文件
     * @link https://cloud.tencent.com/document/product/436/7734
     * @param {string} cloudPath 云端文件夹，如果为空字符串，则表示根目录
     * @returns {Promise<ListFileInfo[]>}
     */
    async listDirectoryFiles(cloudPath) {
        return this.walkCloudDir(cloudPath);
    }
    /**
     * 获取文件临时下载链接
     * @param {((string | ITempUrlInfo)[])} fileList 文件路径或文件信息数组
     * @returns {Promise<{ fileId: string; url: string }[]>}
     */
    async getTemporaryUrl(fileList) {
        if (!fileList || !Array.isArray(fileList)) {
            throw new error_1.CloudBaseError('fileList 必须是非空的数组');
        }
        const files = fileList.map(item => {
            if (typeof item === 'string') {
                return { cloudPath: item, maxAge: 3600 };
            }
            else {
                return item;
            }
        });
        const invalidData = files.find(item => !item.cloudPath || !item.maxAge || typeof item.cloudPath !== 'string');
        if (invalidData) {
            throw new error_1.CloudBaseError(`非法参数：${JSON.stringify(invalidData)}`);
        }
        const notExistsFiles = [];
        const checkFileRequests = files.map(file => (async () => {
            try {
                await this.getFileInfo(file.cloudPath);
            }
            catch (e) {
                if (e.statusCode === 404) {
                    notExistsFiles.push(file.cloudPath);
                }
            }
        })());
        await Promise.all(checkFileRequests);
        // 文件路径不存在
        if (notExistsFiles.length) {
            throw new error_1.CloudBaseError(`以下文件不存在：${notExistsFiles.join(', ')}`);
        }
        const data = files.map(item => ({
            fileid: this.cloudPathToFileId(item.cloudPath),
            max_age: item.maxAge
        }));
        const config = this.environment.getAuthConfig();
        const res = await utils_1.cloudBaseRequest({
            config,
            params: {
                file_list: data,
                action: 'storage.batchGetDownloadUrl'
            },
            method: 'POST'
        });
        const downloadList = res.data.download_list.map(item => ({
            url: item.download_url,
            fileId: item.fileid || item.fileID
        }));
        return downloadList;
    }
    /**
     * 删除文件
     * @param {string[]} cloudPathList 云端文件路径数组
     * @returns {Promise<void>}
     */
    async deleteFile(cloudPathList) {
        if (!cloudPathList || !Array.isArray(cloudPathList)) {
            throw new error_1.CloudBaseError('fileList必须是非空的数组');
        }
        const hasInvalidFileId = cloudPathList.some(file => !file || typeof file !== 'string');
        if (hasInvalidFileId) {
            throw new error_1.CloudBaseError('fileList的元素必须是非空的字符串');
        }
        const { bucket, env } = this.getStorageConfig();
        const fileIdList = cloudPathList.map(filePath => this.cloudPathToFileId(filePath));
        const config = this.environment.getAuthConfig();
        const res = await utils_1.cloudBaseRequest({
            config,
            params: {
                action: 'storage.batchDeleteFile',
                fileid_list: fileIdList
            },
            method: 'POST'
        });
        const failedList = res.data.delete_list
            .filter(item => item.code !== 'SUCCESS')
            .map(item => `${item.fileID} : ${item.code}`);
        if (failedList.length) {
            throw new error_1.CloudBaseError(`部分删除文件失败：${JSON.stringify(failedList)}`);
        }
    }
    /**
     * 删除文件，可以指定 Bucket 和 Region
     * @param {string[]} cloudPathList
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    async deleteFileCustom(cloudPathList, bucket, region) {
        if (!cloudPathList || !Array.isArray(cloudPathList)) {
            throw new error_1.CloudBaseError('fileList必须是非空的数组');
        }
        const hasInvalidFileId = cloudPathList.some(file => !file || typeof file !== 'string');
        if (hasInvalidFileId) {
            throw new error_1.CloudBaseError('fileList的元素必须是非空的字符串');
        }
        const cos = this.getCos();
        const deleteObject = util_1.default.promisify(cos.deleteObject).bind(cos);
        const promises = cloudPathList.map(async (file) => deleteObject({
            Bucket: bucket,
            Region: region,
            Key: file
        }));
        await Promise.all(promises);
    }
    /**
     * 获取文件信息
     * @param {string} cloudPath 云端文件路径
     * @returns {Promise<FileInfo>}
     */
    async getFileInfo(cloudPath) {
        const cos = this.getCos();
        const headObject = util_1.default.promisify(cos.headObject).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const { headers } = await headObject({
            Bucket: bucket,
            Region: region,
            Key: cloudPath
        });
        if (!headers) {
            throw new error_1.CloudBaseError(`[${cloudPath}] 获取文件信息失败`);
        }
        // 文件大小 KB
        const size = Number(Number(headers['content-length']) / 1024).toFixed(2);
        return {
            Size: size,
            Type: headers['content-type'],
            Date: headers['date'],
            ETag: headers['etag']
        };
    }
    /**
     * 删除文件夹
     * @param {string} cloudPath 云端文件夹路径
     * @returns {Promise<void>}
     */
    async deleteDirectory(cloudPath) {
        const { bucket, region } = this.getStorageConfig();
        return this.deleteDirectoryCustom({
            cloudPath,
            bucket,
            region
        });
    }
    /**
     * 删除文件，可以指定 bucket 和 region
     * @param {string} cloudPath
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<void>}
     */
    async deleteDirectoryCustom(options) {
        const { cloudPath, bucket, region } = options;
        const key = this.getCloudKey(cloudPath);
        const cos = this.getCos();
        const deleteMultipleObject = util_1.default.promisify(cos.deleteMultipleObject).bind(cos);
        // 遍历获取全部文件
        const files = await this.walkCloudDirCustom({
            bucket,
            region,
            prefix: key
        });
        // 文件为空时，不能调用删除接口
        if (!files.length) {
            return {
                Deleted: [],
                Error: []
            };
        }
        // COS 接口最大一次删除 1000 个 Key
        // 将数组切分为 500 个文件一组
        const sliceGroup = [];
        const total = Math.ceil(files.length / 500);
        for (let i = 0; i < total; i++) {
            sliceGroup.push(files.splice(0, 500));
        }
        const tasks = sliceGroup.map(group => deleteMultipleObject({
            Bucket: bucket,
            Region: region,
            Objects: group.map(file => ({ Key: file.Key }))
        }));
        // 删除多个文件
        const taskRes = await Promise.all(tasks);
        // 合并响应结果
        const Deleted = taskRes.map(_ => _.Deleted).reduce((prev, next) => [...prev, ...next], []);
        const Error = taskRes.map(_ => _.Error).reduce((prev, next) => [...prev, ...next], []);
        return {
            Deleted,
            Error
        };
    }
    /**
     * 获取文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @returns
     */
    async getStorageAcl() {
        const { bucket, env } = this.getStorageConfig();
        const res = await this.tcbService.request('DescribeStorageACL', {
            EnvId: env,
            Bucket: bucket
        });
        return res.AclTag;
    }
    /**
     * 设置文件存储权限
     * READONLY：所有用户可读，仅创建者和管理员可写
     * PRIVATE：仅创建者及管理员可读写
     * ADMINWRITE：所有用户可读，仅管理员可写
     * ADMINONLY：仅管理员可读写
     * @param {string} acl
     * @returns
     */
    async setStorageAcl(acl) {
        const validAcl = ['READONLY', 'PRIVATE', 'ADMINWRITE', 'ADMINONLY'];
        if (!validAcl.includes(acl)) {
            throw new error_1.CloudBaseError('非法的权限类型');
        }
        const { bucket, env } = this.getStorageConfig();
        return this.tcbService.request('ModifyStorageACL', {
            EnvId: env,
            Bucket: bucket,
            AclTag: acl
        });
    }
    /**
     * 遍历云端文件夹
     * @param {string} prefix
     * @param {string} [marker] 路径开始标志
     * @returns {Promise<IListFileInfo[]>}
     */
    async walkCloudDir(prefix, marker) {
        const { bucket, region } = this.getStorageConfig();
        return this.walkCloudDirCustom({
            prefix,
            bucket,
            region,
            marker
        });
    }
    /**
     * 遍历云端文件夹，支持自定义 Bucket 和 Region
     * @param {string} prefix
     * @param {string} [marker]
     * @param {string} bucket
     * @param {string} region
     * @returns {Promise<IListFileInfo[]>}
     */
    async walkCloudDirCustom(options) {
        const { prefix, bucket, region, marker = '/' } = options;
        let fileList = [];
        const cos = this.getCos();
        const getBucket = util_1.default.promisify(cos.getBucket).bind(cos);
        const prefixKey = this.getCloudKey(prefix);
        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: prefixKey,
            MaxKeys: 100,
            Marker: marker
        });
        fileList.push(...res.Contents);
        let moreFiles = [];
        if (res.IsTruncated === 'true' || res.IsTruncated === true) {
            moreFiles = await this.walkCloudDirCustom({
                bucket,
                region,
                prefix: prefixKey,
                marker: res.NextMarker
            });
        }
        fileList.push(...moreFiles);
        return fileList;
    }
    /**
     * 遍历本地文件夹
     * 忽略不包含 dir 路径，即如果 ignore 匹配 dir，dir 也不会被忽略
     * @private
     * @param {string} dir
     * @param {(string | string[])} [ignore]
     * @returns
     */
    async walkLocalDir(dir, ignore) {
        try {
            return walkdir_1.default.async(dir, {
                filter: (currDir, files) => {
                    // NOTE: ignore 为空数组时会忽略全部文件
                    if (!ignore || !ignore.length)
                        return files;
                    return files.filter(item => {
                        // 当前文件全路径
                        const fullPath = path_1.default.join(currDir, item);
                        // 文件相对于传入目录的路径
                        const fileRelativePath = fullPath.replace(path_1.default.join(dir, path_1.default.sep), '');
                        // 匹配
                        return !micromatch_1.default.isMatch(fileRelativePath, ignore);
                    });
                }
            });
        }
        catch (e) {
            throw new error_1.CloudBaseError(e.message);
        }
    }
    /**
     * 获取文件上传链接属性
     */
    async getUploadMetadata(path) {
        const config = this.environment.getAuthConfig();
        const res = await utils_1.cloudBaseRequest({
            config,
            params: {
                path,
                action: 'storage.getUploadMetadata'
            },
            method: 'POST'
        });
        if (res.code) {
            throw new error_1.CloudBaseError(`${res.code}: ${res.message || ''}`, {
                requestId: res.requestId
            });
        }
        return res.data;
    }
    /**
     * 获取静态网站配置
     */
    async getWebsiteConfig(options) {
        const { bucket, region } = options;
        const cos = this.getCos();
        const getBucketWebsite = util_1.default.promisify(cos.getBucketWebsite).bind(cos);
        const res = await getBucketWebsite({
            Bucket: bucket,
            Region: region
        });
        return res;
    }
    /**
     * 配置文档
     */
    async putBucketWebsite(options) {
        const { indexDocument, errorDocument, bucket, region, routingRules } = options;
        const cos = this.getCos();
        const putBucketWebsite = util_1.default.promisify(cos.putBucketWebsite).bind(cos);
        let params = {
            Bucket: bucket,
            Region: region,
            WebsiteConfiguration: {
                IndexDocument: {
                    Suffix: indexDocument
                },
                ErrorDocument: {
                    Key: errorDocument
                }
            }
        };
        if (routingRules) {
            params.WebsiteConfiguration.RoutingRules = [];
            for (let value of routingRules) {
                const routeItem = {};
                if (value.keyPrefixEquals) {
                    routeItem.Condition = {
                        KeyPrefixEquals: value.keyPrefixEquals
                    };
                }
                if (value.httpErrorCodeReturnedEquals) {
                    routeItem.Condition = {
                        HttpErrorCodeReturnedEquals: value.httpErrorCodeReturnedEquals
                    };
                }
                if (value.replaceKeyWith) {
                    routeItem.Redirect = {
                        ReplaceKeyWith: value.replaceKeyWith
                    };
                }
                if (value.replaceKeyPrefixWith) {
                    routeItem.Redirect = {
                        ReplaceKeyPrefixWith: value.replaceKeyPrefixWith
                    };
                }
                params.WebsiteConfiguration.RoutingRules.push(routeItem);
            }
        }
        const res = await putBucketWebsite(params);
        return res;
    }
    /**
     * 查询object列表
     * @param {IGetBucketOpions} options
     * @memberof StorageService
     */
    async getBucket(options) {
        // const { bucket } = this.getStorageConfig()
        const { prefix, maxKeys, marker, bucket, region } = options;
        const cos = this.getCos();
        const getBucket = util_1.default.promisify(cos.getBucket).bind(cos);
        const prefixKey = this.getCloudKey(prefix);
        const res = await getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: prefixKey,
            MaxKeys: maxKeys,
            Marker: marker
        });
        return res;
    }
    /**
     * 获取 COS 配置
     */
    getCos(parallel = 20) {
        const { secretId, secretKey, token, proxy } = this.environment.getAuthConfig();
        const cosProxy = process.env.TCB_COS_PROXY;
        return new cos_nodejs_sdk_v5_1.default({
            FileParallelLimit: parallel,
            SecretId: secretId,
            SecretKey: secretKey,
            Proxy: cosProxy || proxy,
            SecurityToken: token
        });
    }
    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    getCloudKey(cloudPath) {
        if (!cloudPath) {
            return '';
        }
        // 单个 / 转换成根目录
        if (cloudPath === '/') {
            return '';
        }
        return cloudPath[cloudPath.length - 1] === '/' ? cloudPath : `${cloudPath}/`;
    }
    /**
     * 将 cloudPath 转换成 fileId
     */
    cloudPathToFileId(cloudPath) {
        const { env, bucket } = this.getStorageConfig();
        return `cloud://${env}.${bucket}/${cloudPath}`;
    }
    /**
     * 获取存储桶配置
     */
    getStorageConfig() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const storageConfig = (_a = envConfig === null || envConfig === void 0 ? void 0 : envConfig.Storages) === null || _a === void 0 ? void 0 : _a[0];
        const { Region, Bucket } = storageConfig;
        const region = process.env.TCB_COS_REGION || Region;
        return {
            region,
            bucket: Bucket,
            env: envConfig.EnvId
        };
    }
    /**
     * 带重试功能的上传多文件函数
     * @param uploadFiles sdk上传函数
     * @param options sdk上传函数参数
     * @param times 重试次数
     * @param interval 重试时间间隔(毫秒)
     * @param failedFiles 失败文件列表
     * @returns
     */
    async uploadFilesWithRetry({ uploadFiles, options, times, interval, failedFiles }) {
        const { files, onFileFinish } = options;
        const tempFailedFiles = [];
        let curError = null;
        const res = await uploadFiles(Object.assign(Object.assign({}, options), { files: failedFiles.length
                ? files.filter(file => failedFiles.includes(file.Key))
                : files, onFileFinish: (...args) => {
                const error = args[0];
                const fileInfo = args[2];
                if (error) {
                    curError = error;
                    tempFailedFiles.push(fileInfo.Key);
                }
                onFileFinish === null || onFileFinish === void 0 ? void 0 : onFileFinish.apply(null, args);
            } }));
        // if (!tempFailedFiles?.length || times <= 0) return res
        if (!(tempFailedFiles === null || tempFailedFiles === void 0 ? void 0 : tempFailedFiles.length)) {
            return res;
        }
        else {
            if (times > 0) {
                return await new Promise((resolve, reject) => {
                    setTimeout(() => this.uploadFilesWithRetry({
                        uploadFiles,
                        options,
                        times: times - 1,
                        interval,
                        failedFiles: tempFailedFiles
                    }).then(res => resolve(res))
                        .catch(err => reject(err)), interval);
                });
            }
            else {
                if (curError) {
                    throw curError;
                }
            }
        }
    }
    /**
     * 拼接路径下载单文件
     * @param file
     * @param cloudDirectoryKey
     * @param resolveLocalPath
     * @returns
     */
    async downloadWithFilePath({ file, cloudDirectoryKey, resolveLocalPath }) {
        const fileRelativePath = file.Key.replace(cloudDirectoryKey, '');
        // 空路径和文件夹跳过
        if (!fileRelativePath || /\/$/g.test(fileRelativePath)) {
            return;
        }
        const localFilePath = path_1.default.join(resolveLocalPath, fileRelativePath);
        // 创建文件的父文件夹
        const fileDir = path_1.default.dirname(localFilePath);
        await make_dir_1.default(fileDir);
        return this.downloadFile({
            cloudPath: file.Key,
            localPath: localFilePath
        });
    }
    /**
     * 根据下载结果返回错误列表
     * @param res
     * @returns
     */
    determineDownLoadResultIsError(res) {
        const resultErrorArr = [];
        res.map(item => /Error/gi.test(Object.prototype.toString.call(item)) && resultErrorArr.push(item));
        return resultErrorArr;
    }
}
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFiles", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFileCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadDirectoryCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "uploadFilesCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "createCloudDirectroy", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "createCloudDirectroyCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "downloadFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "downloadDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "listDirectoryFiles", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getTemporaryUrl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteFile", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteFileCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getFileInfo", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteDirectory", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "deleteDirectoryCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getStorageAcl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "setStorageAcl", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "walkCloudDir", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "walkCloudDirCustom", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "putBucketWebsite", null);
__decorate([
    utils_1.preLazy()
], StorageService.prototype, "getBucket", null);
exports.StorageService = StorageService;

}, function(modId) { var map = {"../utils":1654780339086,"../error":1654780339085,"../utils/parallel":1654780339098}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339098, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncTaskParallelController = void 0;
/**
 * 异步任务并发控制器，以一定的并发数执行所有任务
 * 不具备队列性质，异步任务随机执行
 * 单个任务异常，错误会返回，单不会退出执行
 * 所有任务执行
 */
class AsyncTaskParallelController {
    constructor(maxParallel, checkInterval = 20) {
        this.tasks = [];
        this.maxParallel = Number(maxParallel) || 20;
        this.checkInterval = checkInterval;
    }
    loadTasks(tasks) {
        this.tasks.push(...tasks);
        this.totalTasks = this.tasks.length;
    }
    push(task) {
        this.tasks.push(task);
        this.totalTasks = this.tasks.length;
    }
    // 开始执行任务
    async run() {
        // 存储任务执行结果
        const results = [];
        // 记录已经运行的任务
        const taskHasRun = [];
        // 记录任务是否执行完成
        const taskDone = [];
        // 当前正在运行的任务数量
        let runningTask = 0;
        return new Promise(resolve => {
            // 使用定时器，不阻塞线程
            const timer = setInterval(() => {
                // 全部任务运行完成
                const taskDoneLength = taskDone.filter(item => item).length;
                if (runningTask === 0 && taskDoneLength === this.totalTasks) {
                    clearInterval(timer);
                    resolve(results);
                }
                // 当前运行任务数超过最大并发，不再执行新的任务
                if (runningTask >= this.maxParallel) {
                    return;
                }
                // 遍历任务列表，开始执行还没有执行的任务
                this.tasks.forEach((task, index) => {
                    if (!taskHasRun[index] && runningTask < this.maxParallel) {
                        runningTask++;
                        taskHasRun[index] = 1;
                        task()
                            .then(res => {
                            results[index] = res;
                        })
                            .catch(err => {
                            results[index] = err;
                        })
                            .then(() => {
                            runningTask--;
                            taskDone[index] = 1;
                        });
                    }
                });
            }, this.checkInterval);
        });
    }
}
exports.AsyncTaskParallelController = AsyncTaskParallelController;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339099, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvService = void 0;
const cos_nodejs_sdk_v5_1 = __importDefault(require("cos-nodejs-sdk-v5"));
const util_1 = __importDefault(require("util"));
const error_1 = require("../error");
const utils_1 = require("../utils");
const cam_1 = require("../cam");
const constant_1 = require("../constant");
const billing_1 = require("../billing");
class EnvService {
    constructor(environment) {
        this.environment = environment;
        this.envId = environment.getEnvId();
        this.envType = environment.getEnvType();
        this.cloudService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
        this.camService = new cam_1.CamService(environment.cloudBaseContext);
        this.billService = new billing_1.BillingService(environment.cloudBaseContext);
    }
    /**
     * 列出所有环境
     * @returns {Promise<IListEnvRes>}
     */
    async listEnvs() {
        return this.cloudService.request('DescribeEnvs');
    }
    /**
     * 创建新环境
     * @param {string} name 环境名称
     * @returns {Promise<ICreateEnvRes>}
     */
    async createEnv(param) {
        // 1. 检查是否开通过TCB服务,若未开通，跳2检查角色  开通则跳5 创建环境
        // 2. 查询tcb 角色是否绑定该账户
        // 3. 若未绑定，则创建角色并绑定角色
        // 4. 开通TCB服务
        // 5. 创建环境
        // 6. 购买环境，选择预付费 或 后付费 套餐
        // 7. 若购买失败，将当前环境销毁，若购买成功，返回envId
        const { name, paymentMode, channel = 'qc_console' } = param;
        // 1. 检查TCB服务是否开通
        const { Initialized } = await this.checkTcbService();
        if (!Initialized) {
            // 跳2 查询TCB角色是否绑定
            let hasTcbRole = false;
            try {
                const res = await this.camService.getRole(constant_1.ROLE_NAME.TCB);
                hasTcbRole = true;
            }
            catch (e) {
                // 判断是否为角色不存在错误
                if (e.code !== 'InvalidParameter.RoleNotExist') {
                    throw e;
                }
            }
            if (!hasTcbRole) {
                // 3. 当前账户没有tcbRole，创建角色并绑定
                // 创建角色
                const createRoleResult = await this.camService.createRole({
                    RoleName: constant_1.ROLE_NAME.TCB,
                    Description: '云开发(TCB)操作权限含在访问管理(CAM)创建角色，新增角色载体，给角色绑定策略；含读写对象存储(COS)数据；含读写无服务器云函数(SCF)数据；含读取云监控(Monitor)数据。',
                    PolicyDocument: '{"version":"2.0","statement":[{"action":"sts:AssumeRole","effect":"allow","principal":{"service":["scf.qcloud.com","tcb.cloud.tencent.com", "cvm.qcloud.com"]}}]}'
                });
                const { RoleId } = createRoleResult;
                // 绑定角色策略
                // await this.camService.attachRolePolicy({
                //     PolicyId: 8825032,
                //     AttachRoleName: ROLE_NAME.TCB
                // })
                await this.camService.attachRolePolicies({
                    RoleName: constant_1.ROLE_NAME.TCB,
                    PolicyName: [
                        'QcloudAccessForTCBRole',
                        'QcloudAccessForTCBRoleInAccessCloudBaseRun'
                    ]
                });
            }
            // 4. 未开通则初始化TCB
            await this.initTcb({ Channel: channel, Source: 'qcloud' });
        }
        // 5. 创建环境
        const params = {
            Alias: name,
            EnvId: `${name}-${utils_1.guid6()}`,
            Source: 'qcloud'
        };
        if (channel) {
            params.Channel = channel;
        }
        const { EnvId } = await this.cloudService.request('CreateEnv', params);
        const realPaymentMode = paymentMode ? paymentMode : 'postpay';
        // 6. 购买环境
        let prepayCreateDeal = false;
        let prepayPayDeal = false;
        let postpayDeal = false;
        let payError = null;
        if (realPaymentMode === 'prepay') {
            // 预付费
            // 1. 创建订单
            // 2. 支付订单
            const goods = [
                {
                    GoodsCategoryId: 101183,
                    // action: 'purchase',
                    // currency: 'CNY',
                    RegionId: 1,
                    ZoneId: 0,
                    GoodsNum: 1,
                    ProjectId: 0,
                    PayMode: 1,
                    Platform: 1,
                    GoodsDetail: JSON.stringify({
                        productCode: 'p_tcb',
                        subProductCode: 'sp_tcb_basic',
                        resourceId: EnvId,
                        pid: 16677,
                        timeUnit: 'm',
                        timeSpan: 1,
                        tcb_cos: 1,
                        tcb_cdn: 1,
                        tcb_scf: 1,
                        tcb_mongodb: 1,
                        region: 'ap-shanghai',
                        zone: 'ap-shanghai-1',
                        source: 'qcloud',
                        envId: EnvId,
                        packageId: 'basic',
                        isAutoRenew: 'true',
                        tranType: 1,
                        productInfo: [
                            {
                                name: '套餐版本',
                                value: '基础版 1'
                            },
                            {
                                name: '存储空间',
                                value: '5GB'
                            },
                            {
                                name: 'CDN流量',
                                value: '5GB'
                            },
                            {
                                name: '云函数资源使用量',
                                value: '4万GBs'
                            },
                            {
                                name: '数据库容量',
                                value: '2GB'
                            },
                            {
                                name: '数据库同时连接数',
                                value: '20个'
                            }
                        ]
                    })
                }
            ];
            let OrderIdsList = [];
            try {
                const { OrderIds } = await this.billService.GenerateDeals(goods);
                OrderIdsList = OrderIds;
                prepayCreateDeal = true;
            }
            catch (e) {
                // 预付费下单失败
                payError = e;
            }
            if (prepayCreateDeal) {
                // 下单成功
                try {
                    // 购买环境套餐
                    const { OrderIds: succOrderIds } = await this.billService.PayDeals(OrderIdsList);
                    // 判断订单是否支付成功
                    if (succOrderIds[0] === OrderIdsList[0]) {
                        prepayPayDeal = true;
                    }
                    else {
                        throw new error_1.CloudBaseError('支付成功的订单号不一致');
                    }
                }
                catch (e) {
                    // 预付费订单支付失败
                    payError = new error_1.CloudBaseError('预付费订单支付失败，请进入订单管理页面(https://console.cloud.tencent.com/deal)重新支付', {
                        original: e
                    });
                }
            }
        }
        if (realPaymentMode === 'postpay') {
            // 后付费
            try {
                const { TranId } = await this.CreatePostpayPackage(EnvId);
                postpayDeal = true;
            }
            catch (e) {
                payError = e;
            }
        }
        // 检查支付状态
        // 1. 预付费下单失败 删除环境
        // 2. 预付费下单成功过，支付订单失败，提示用户
        // 3. 后付费开通失败 删除环境
        if (realPaymentMode === 'prepay') {
            if (!prepayCreateDeal) {
                // 情形1
                await this.destroyEnv(EnvId);
                throw payError;
            }
            else {
                if (!prepayPayDeal) {
                    // 情形2
                    throw payError;
                }
            }
        }
        if (realPaymentMode === 'postpay') {
            if (!postpayDeal) {
                // 情形3
                await this.destroyEnv(EnvId);
                throw payError;
            }
        }
        // 成功返回envId
        return {
            envId: EnvId
        };
    }
    /**
     * 拉取安全域名列表
     * @returns {Promise<IAuthDomainsRes>}
     */
    async getEnvAuthDomains() {
        return this.cloudService.request('DescribeAuthDomains', {
            EnvId: this.envId
        });
    }
    /**
     * 添加环境安全域名
     * @param {string[]} domains 域名字符串数组
     * @returns {Promise<IResponseInfo>}
     */
    async createEnvDomain(domains) {
        const res = await this.cloudService.request('CreateAuthDomain', {
            EnvId: this.envId,
            Domains: domains
        });
        // 添加 COS CORS 域名
        const promises = domains.map(async (domain) => {
            this.modifyCosCorsDomain(domain);
        });
        await Promise.all(promises);
        return res;
    }
    /**
     * 删除环境安全域名
     * @param {string[]} domainIds 域名字符串数组
     * @returns {Promise<IDeleteDomainRes>}
     */
    async deleteEnvDomain(domains) {
        // 根据域名获取域名 Id
        const { Domains } = await this.getEnvAuthDomains();
        const domainIds = Domains.filter(item => domains.includes(item.Domain)).map(item => item.Id);
        const res = await this.cloudService.request('DeleteAuthDomain', {
            EnvId: this.envId,
            DomainIds: domainIds
        });
        // 删除 COS CORS 域名
        const promises = domains.map(async (domain) => {
            this.modifyCosCorsDomain(domain, true);
        });
        await Promise.all(promises);
        return res;
    }
    /**
     * 检查tcb服务是否开通
     * @returns {Promise<ICheckTcbServiceRes>}
     * @memberof CamService
     */
    async checkTcbService() {
        return this.cloudService.request('CheckTcbService', {});
    }
    /**
     * 初始化TCB
     * @returns {Promise<IResponseInfo>}
     * @memberof EnvService
     */
    async initTcb(param) {
        let initParam = {};
        if (param) {
            initParam = Object.assign({}, param);
        }
        return this.cloudService.request('InitTcb', initParam);
    }
    /**
     * 开通后付费套餐
     * @param {string} envId
     * @param {SOURCE} [source]
     * @returns {Promise<ICreatePostpayRes>}
     * @memberof EnvService
     */
    async CreatePostpayPackage(envId, source) {
        const realSource = source ? source : 'qcloud';
        return this.cloudService.request('CreatePostpayPackage', {
            EnvId: envId,
            Source: realSource
        });
    }
    /**
     * 销毁环境
     * @param {string} envId
     * @returns {Promise<IResponseInfo>}
     * @memberof EnvService
     */
    async destroyEnv(envId) {
        return this.cloudService.request('DestroyEnv', {
            EnvId: envId
        });
    }
    /**
     * 获取环境信息
     * @returns {Promise<IEnvInfoRes>}
     */
    async getEnvInfo() {
        // NOTE: DescribeEnv 接口废弃，需要使用 DescribeEnvs 接口
        const params = {
            EnvId: this.envId
        };
        if (this.envType === 'run') {
            params.EnvType = 'run';
        }
        const { EnvList, RequestId } = await this.cloudService.request('DescribeEnvs', params);
        return {
            EnvInfo: (EnvList === null || EnvList === void 0 ? void 0 : EnvList.length) ? EnvList[0] : {},
            RequestId
        };
    }
    /**
     * 修改环境名称
     * @param {string} alias 环境名称
     * @returns {Promise<IResponseInfo>}
     */
    async updateEnvInfo(alias) {
        return this.cloudService.request('ModifyEnv', {
            EnvId: this.envId,
            Alias: alias
        });
    }
    /**
     * 拉取登录配置列表
     * @returns {Promise<IEnvLoginConfigRes>}
     */
    async getLoginConfigList() {
        return this.cloudService.request('DescribeLoginConfigs', {
            EnvId: this.envId
        });
    }
    /**
     * 创建登录方式
     * 'WECHAT-OPEN'：微信开放平台
     * 'WECHAT-PUBLIC'：微信公众平台
     * @param {('WECHAT-OPEN' | 'WECHAT-PUBLIC')} platform 'WECHAT-OPEN' | 'WECHAT-PUBLIC'
     * @param {string} appId 微信 appId
     * @param {string} appSecret 微信 appSecret
     * @returns {Promise<IResponseInfo>}
     */
    async createLoginConfig(platform, appId, appSecret) {
        let finalAppSecret = appSecret;
        if (platform === 'ANONYMOUS') {
            finalAppSecret = 'anonymous';
        }
        return this.cloudService.request('CreateLoginConfig', {
            EnvId: this.envId,
            // 平台， “QQ" "WECHAT-OPEN" "WECHAT-PUBLIC"
            Platform: platform,
            PlatformId: appId,
            PlatformSecret: finalAppSecret ? utils_1.rsaEncrypt(finalAppSecret) : undefined,
            Status: 'ENABLE'
        });
    }
    /**
     * 更新登录方式配置
     * @param {string} configId 配置 Id，从配置列表中获取
     * @param {string} [status='ENABLE'] 是否启用 'ENABLE', 'DISABLE' ，可选
     * @param {string} [appId=''] 微信 appId，可选
     * @param {string} [appSecret=''] 微信 appSecret，可选
     * @returns {Promise<IResponseInfo>}
     */
    /* eslint-disable-next-line */
    async updateLoginConfig(configId, status = 'ENABLE', appId = '', appSecret = '') {
        const validStatus = ['ENABLE', 'DISABLE'];
        let finalAppSecret = appSecret;
        if (!validStatus.includes(status)) {
            throw new error_1.CloudBaseError(`Invalid status value: ${status}. Only support 'ENABLE', 'DISABLE'`);
        }
        const params = {
            EnvId: this.envId,
            ConfigId: configId,
            Status: status
        };
        if (appId === 'anonymous') {
            finalAppSecret = 'anonymous';
        }
        appId && (params.PlatformId = appId);
        finalAppSecret && (params.PlatformSecret = utils_1.rsaEncrypt(finalAppSecret));
        return this.cloudService.request('UpdateLoginConfig', params);
    }
    // 创建自定义登录私钥
    async createCustomLoginKeys() {
        return this.cloudService.request('CreateCustomLoginKeys', {
            EnvId: this.envId
        });
    }
    // 获取 COS CORS 域名
    async getCOSDomains() {
        const cos = this.getCos();
        const getBucketCors = util_1.default.promisify(cos.getBucketCors).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        const res = await getBucketCors({
            Bucket: bucket,
            Region: region
        });
        return res.CORSRules;
    }
    // 添加 COS CORS 域名，和 Web 端行为保持一致
    async modifyCosCorsDomain(domain, deleted = false) {
        const cos = this.getCos();
        const putBucketCors = util_1.default.promisify(cos.putBucketCors).bind(cos);
        const { bucket, region } = this.getStorageConfig();
        // 去掉原有此域名CORS配置
        let corsRules = await this.getCOSDomains();
        corsRules = corsRules.filter(item => {
            return !(item.AllowedOrigins &&
                item.AllowedOrigins.length === 2 &&
                item.AllowedOrigins[0] === `http://${domain}` &&
                item.AllowedOrigins[1] === `https://${domain}`);
        });
        if (!deleted) {
            corsRules.push({
                AllowedOrigin: [`http://${domain}`, `https://${domain}`],
                AllowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                AllowedHeader: ['*'],
                ExposeHeader: ['Etag', 'Date'],
                MaxAgeSeconds: '5'
            });
        }
        await putBucketCors({
            Bucket: bucket,
            Region: region,
            CORSRules: corsRules
        });
    }
    getCos() {
        const { secretId, secretKey, token } = this.environment.getAuthConfig();
        return new cos_nodejs_sdk_v5_1.default({
            SecretId: secretId,
            SecretKey: secretKey,
            SecurityToken: token
        });
    }
    getStorageConfig() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const storageConfig = (_a = envConfig === null || envConfig === void 0 ? void 0 : envConfig.Storages) === null || _a === void 0 ? void 0 : _a[0];
        const { Region, Bucket } = storageConfig;
        return {
            env: envConfig.EnvId,
            region: Region,
            bucket: Bucket
        };
    }
}
__decorate([
    utils_1.preLazy()
], EnvService.prototype, "createEnvDomain", null);
__decorate([
    utils_1.preLazy()
], EnvService.prototype, "deleteEnvDomain", null);
exports.EnvService = EnvService;

}, function(modId) { var map = {"../error":1654780339085,"../utils":1654780339086,"../cam":1654780339100,"../constant":1654780339088,"../billing":1654780339101}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339100, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.CamService = void 0;
const utils_1 = require("../utils");
class CamService {
    constructor(context) {
        this.camService = new utils_1.CloudService(context, CamService.camServiceVersion.service, CamService.camServiceVersion.version);
    }
    /**
     * 查询账户角色列表
     * @param {number} page
     * @param {number} rp
     * @returns {Promise<IRoleListRes>}
     * @memberof CamService
     */
    async describeRoleList(page, rp) {
        return this.camService.request('DescribeRoleList', {
            Page: page,
            Rp: rp
        });
    }
    /**
     * 获取角色详情
     * @param {string} roleName
     * @returns {Promise<IGetRoleRes>}
     * @memberof CamService
     */
    async getRole(roleName) {
        return this.camService.request('GetRole', {
            RoleName: roleName
        });
    }
    /**
     * 创建角色
     * @param {{
     *         RoleName: string
     *         PolicyDocument: string
     *         Description: string
     *     }} param
     * @returns {Promise<ICreateRoleRes>}
     * @memberof CamService
     */
    async createRole(param) {
        return this.camService.request('CreateRole', param);
    }
    /**
     * 绑定角色策略
     * @param {{
     *         PolicyId: number
     *         AttachRoleName: string
     *     }} param
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    async attachRolePolicy(param) {
        return this.camService.request('AttachRolePolicy', param);
    }
    async attachRolePolicies(param) {
        return this.camService.request('AttachRolePolicies', param);
    }
    /**
     * 删除角色
     * @param {string} roleName
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    async deleteRole(roleName) {
        return this.camService.request('DeleteRole', {
            RoleName: roleName
        });
    }
}
exports.CamService = CamService;
CamService.camServiceVersion = {
    service: 'cam',
    version: '2019-01-16'
};

}, function(modId) { var map = {"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339101, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const utils_1 = require("../utils");
class BillingService {
    constructor(context) {
        this.billService = new utils_1.CloudService(context, BillingService.billServiceVersion.service, BillingService.billServiceVersion.version);
    }
    /**
     * 创建订单
     * @param {Array<IGoodItem>} goods
     * @returns {Promise<IGenerateDealsRes>}
     * @memberof BillingService
     */
    async GenerateDeals(goods) {
        return this.billService.request('GenerateDeals', {
            Goods: goods
        });
    }
    /**
     * 支付订单
     * @param {Array<string>} orderIds
     * @returns {Promise<IPayDealsRes>}
     * @memberof BillingService
     */
    async PayDeals(orderIds) {
        return this.billService.request('PayDeals', {
            OrderIds: orderIds
        });
    }
}
exports.BillingService = BillingService;
BillingService.billServiceVersion = {
    service: 'billing',
    version: '2018-07-09'
};

}, function(modId) { var map = {"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339102, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonService = void 0;
const utils_1 = require("../utils");
const error_1 = require("../error");
/**
 * 公共的云api调用方法 透传用户参数 无业务逻辑处理
 * @export
 * @class CommonService
 */
const ActionVersionMap = {
    tcb: '2018-06-08',
    flexdb: '2018-11-27',
    scf: '2018-04-16',
    sts: '2018-04-16',
    cam: '2018-04-16',
    lowcode: '2021-01-08'
};
class CommonService {
    constructor(environment, serviceType, serviceVersion) {
        this.environment = environment;
        this.commonService = new utils_1.CloudService(environment.cloudBaseContext, serviceType, serviceVersion || ActionVersionMap[serviceType]);
    }
    /**
     * 公共方法调用
     * @param {ICommonApiServiceParam} param
     * @returns {Promise<any>}
     * @memberof CommonService
     */
    async call(options) {
        const { Action, Param = {} } = options;
        if (!Action) {
            throw new error_1.CloudBaseError('缺少必填参数 Action');
        }
        const res = await this.commonService.request(Action, Object.assign({}, Param));
        return res;
    }
}
exports.CommonService = CommonService;

}, function(modId) { var map = {"../utils":1654780339086,"../error":1654780339085}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339103, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostingService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const make_dir_1 = __importDefault(require("make-dir"));
const error_1 = require("../error");
const utils_1 = require("../utils");
const parallel_1 = require("../utils/parallel");
const envDomainCache = new Map();
const HostingStatusMap = {
    init: '初始化中',
    process: '处理中',
    online: '上线',
    destroying: '销毁中',
    offline: '下线',
    create_fail: '初始化失败',
    destroy_fail: '销毁失败' // eslint-disable-line
};
class HostingService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
        this.cdnService = new utils_1.CloudService(environment.cloudBaseContext, 'cdn', '2018-06-06');
    }
    /**
     * 获取 hosting 信息
     */
    async getInfo() {
        const { envId } = this.getHostingConfig();
        const { Data } = await this.tcbService.request('DescribeStaticStore', {
            EnvId: envId
        });
        return Data;
    }
    /**
     * 开启 hosting 服务，异步任务
     */
    async enableService() {
        const { envId } = this.getHostingConfig();
        const hostings = await this.getInfo();
        // hosting 服务已开启
        if (hostings === null || hostings === void 0 ? void 0 : hostings.length) {
            const website = hostings[0];
            // offline 状态的服务可重新开启
            if (website.Status !== 'offline') {
                throw new error_1.CloudBaseError('静态网站服务已开启，请勿重复操作！');
            }
        }
        const res = await this.tcbService.request('CreateStaticStore', {
            EnvId: envId
        });
        const code = res.Result === 'succ' ? 0 : -1;
        return {
            code,
            requestId: res.RequestId
        };
    }
    async findFiles(options) {
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const { maxKeys, marker, prefix } = options;
        const storageService = await this.environment.getStorageService();
        const res = await storageService.getBucket({
            bucket: Bucket,
            region: Regoin,
            maxKeys,
            marker,
            prefix
        });
        return res;
    }
    /**
     * 展示文件列表
     */
    async listFiles() {
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        const list = await storageService.walkCloudDirCustom({
            prefix: '',
            bucket: Bucket,
            region: Regoin
        });
        return list;
    }
    /**
     * 销毁静态托管服务
     */
    async destroyService() {
        const { envId } = this.getHostingConfig();
        const files = await this.listFiles();
        if (files === null || files === void 0 ? void 0 : files.length) {
            throw new error_1.CloudBaseError('静态网站文件不为空，无法销毁！', {
                code: 'INVALID_OPERATION'
            });
        }
        const hostings = await this.getInfo();
        if (!hostings || !hostings.length) {
            throw new error_1.CloudBaseError('静态网站服务未开启！', {
                code: 'INVALID_OPERATION'
            });
        }
        const website = hostings[0];
        // destroy_fail 状态可重试
        if (website.Status !== 'online' && website.Status !== 'destroy_fail') {
            throw new error_1.CloudBaseError(`静态网站服务【${HostingStatusMap[website.Status]}】，无法进行此操作！`, {
                code: 'INVALID_OPERATION'
            });
        }
        const res = await this.tcbService.request('DestroyStaticStore', {
            EnvId: envId
        });
        const code = res.Result === 'succ' ? 0 : -1;
        return {
            code,
            requestId: res.RequestId
        };
    }
    /**
     * 支持上传单个文件，文件夹，或多个文件
     * @param options
     */
    async uploadFiles(options) {
        const { localPath, cloudPath, files = [], onProgress, onFileFinish, parallel = 20, ignore, retryCount, retryInterval } = options;
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        let uploadFiles = Array.isArray(files) ? files : [];
        // localPath 存在，上传文件夹/文件
        if (localPath) {
            const resolvePath = path_1.default.resolve(localPath);
            // 检查路径是否存在
            utils_1.checkReadable(resolvePath, true);
            if (utils_1.isDirectory(resolvePath)) {
                return storageService.uploadDirectoryCustom({
                    localPath: resolvePath,
                    cloudPath,
                    bucket: Bucket,
                    region: Regoin,
                    onProgress,
                    onFileFinish,
                    fileId: false,
                    ignore,
                    retryCount,
                    retryInterval,
                });
            }
            else {
                // 文件上传统一通过批量上传接口
                const assignCloudPath = cloudPath || path_1.default.parse(resolvePath).base;
                uploadFiles.push({
                    localPath: resolvePath,
                    cloudPath: assignCloudPath
                });
            }
        }
        // 文件上传统一通过批量上传接口
        return storageService.uploadFilesCustom({
            ignore,
            parallel,
            onProgress,
            onFileFinish,
            bucket: Bucket,
            region: Regoin,
            files: uploadFiles,
            fileId: false,
            retryCount,
            retryInterval,
        });
    }
    /**
     * 删除文件或文件夹
     * @param options
     */
    async deleteFiles(options) {
        const { cloudPath, isDir } = options;
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        if (isDir) {
            return storageService.deleteDirectoryCustom({
                cloudPath,
                bucket: Bucket,
                region: Regoin
            });
        }
        else {
            try {
                await storageService.deleteFileCustom([cloudPath], Bucket, Regoin);
                return {
                    Deleted: [{ Key: cloudPath }],
                    Error: []
                };
            }
            catch (e) {
                return {
                    Deleted: [],
                    Error: [e]
                };
            }
        }
    }
    /**
     * 下载文件
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 文件本地存储路径，文件需指定文件名称
     * @returns {Promise<NodeJS.ReadableStream>}
     */
    async downloadFile(options) {
        const { cloudPath, localPath } = options;
        const resolveLocalPath = path_1.default.resolve(localPath);
        const fileDir = path_1.default.dirname(localPath);
        utils_1.checkFullAccess(fileDir, true);
        const envConfig = this.environment.lazyEnvironmentConfig;
        const cacheHosting = envDomainCache.get(envConfig.EnvId);
        let CdnDomain;
        // 2 分钟有效
        if ((cacheHosting === null || cacheHosting === void 0 ? void 0 : cacheHosting.cacheTime) && Number(cacheHosting === null || cacheHosting === void 0 ? void 0 : cacheHosting.cacheTime) + 120000 < Date.now()) {
            console.log('cache');
            CdnDomain = cacheHosting.CdnDomain;
        }
        else {
            const hosting = await this.checkStatus();
            CdnDomain = hosting.CdnDomain;
            envDomainCache.set(envConfig.EnvId, Object.assign(Object.assign({}, hosting), { cacheTime: Date.now() }));
        }
        const url = new URL(cloudPath, `https://${CdnDomain}`).toString();
        const { proxy } = await this.environment.getAuthConfig();
        const res = await utils_1.fetchStream(url, {}, proxy);
        // localPath 不存在时，返回 ReadableStream
        if (!localPath) {
            return res.body;
        }
        const dest = fs_1.default.createWriteStream(resolveLocalPath);
        res.body.pipe(dest);
        // 写完成后返回
        return new Promise(resolve => {
            dest.on('close', () => {
                // 返回文件地址
                resolve(resolveLocalPath);
            });
        });
    }
    /**
     * 下载文件夹
     * @param {string} cloudPath 云端文件路径
     * @param {string} localPath 本地文件夹存储路径
     * @returns {Promise<(NodeJS.ReadableStream | string)[]>}
     */
    async downloadDirectory(options) {
        const { cloudPath, localPath } = options;
        const resolveLocalPath = path_1.default.resolve(localPath);
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const cloudDirectoryKey = this.getCloudKey(cloudPath);
        const storageService = await this.environment.getStorageService();
        const files = await storageService.walkCloudDirCustom({
            prefix: cloudDirectoryKey,
            bucket: Bucket,
            region: Regoin
        });
        const tasks = files.map(file => async () => {
            const fileRelativePath = file.Key.replace(cloudDirectoryKey, '');
            // 空路径和文件夹跳过
            if (!fileRelativePath || /\/$/g.test(fileRelativePath)) {
                return;
            }
            const localFilePath = path_1.default.join(resolveLocalPath, fileRelativePath);
            // 创建文件的父文件夹
            const fileDir = path_1.default.dirname(localFilePath);
            await make_dir_1.default(fileDir);
            return this.downloadFile({
                cloudPath: file.Key,
                localPath: localFilePath
            });
        });
        // 下载请求
        const creatingDirController = new parallel_1.AsyncTaskParallelController(20, 50);
        creatingDirController.loadTasks(tasks);
        await creatingDirController.run();
    }
    // 遍历文件
    async walkLocalDir(envId, dir) {
        const storageService = await this.environment.getStorageService();
        return storageService.walkLocalDir(dir);
    }
    /**
     * 绑定自定义域名
     * @param {IBindDomainOptions} options
     * @returns
     * @memberof HostingService
     */
    async CreateHostingDomain(options) {
        const { envId } = this.getHostingConfig();
        const { certId, domain } = options;
        const res = await this.tcbService.request('CreateHostingDomain', {
            EnvId: envId,
            Domain: domain,
            CertId: certId
        });
        return res;
    }
    /**
     * 删除托管域名
     *
     * @param {IBindDomainOptions} options
     * @returns
     * @memberof HostingService
     */
    async deleteHostingDomain(options) {
        const { envId } = this.getHostingConfig();
        const { domain } = options;
        return this.tcbService.request('DeleteHostingDomain', {
            EnvId: envId,
            Domain: domain
        });
    }
    /**
     * 查询域名状态信息
     * @param options
     */
    async tcbCheckResource(options) {
        return this.cdnService.request('TcbCheckResource', {
            Domains: options.domains
        });
    }
    /**
     * 域名配置变更
     * @param options
     */
    async tcbModifyAttribute(options) {
        const { domain, domainId, domainConfig } = options;
        const res = await this.cdnService.request('TcbModifyAttribute', {
            Domain: domain,
            DomainId: domainId,
            DomainConfig: domainConfig
        });
        return res;
    }
    /**
     * 查询静态网站配置
     * @memberof HostingService
     */
    async getWebsiteConfig() {
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        const res = await storageService.getWebsiteConfig({ bucket: Bucket, region: Regoin });
        return res;
    }
    /**
     * 配置静态网站文档
     * @param options
     */
    async setWebsiteDocument(options) {
        const { indexDocument, errorDocument, routingRules } = options;
        const hosting = await this.checkStatus();
        const { Bucket, Regoin } = hosting;
        const storageService = await this.environment.getStorageService();
        const res = await storageService.putBucketWebsite({
            bucket: Bucket,
            region: Regoin,
            indexDocument,
            errorDocument,
            routingRules
        });
        return res;
    }
    /**
     * 检查 hosting 服务状态
     */
    async checkStatus() {
        const hostings = await this.getInfo();
        if (!hostings || !hostings.length) {
            throw new error_1.CloudBaseError(`您还没有开启静态网站服务，请先到云开发控制台开启静态网站服务！`, {
                code: 'INVALID_OPERATION'
            });
        }
        const website = hostings[0];
        if (website.Status !== 'online') {
            throw new error_1.CloudBaseError(`静态网站服务【${HostingStatusMap[website.Status]}】，无法进行此操作！`, {
                code: 'INVALID_OPERATION'
            });
        }
        return website;
    }
    /**
     * 获取配置
     */
    getHostingConfig() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const appId = (_a = envConfig.Storages[0]) === null || _a === void 0 ? void 0 : _a.AppId;
        const { proxy } = this.environment.cloudBaseContext;
        return {
            appId,
            proxy,
            envId: envConfig.EnvId
        };
    }
    /**
     * 将 cloudPath 转换成 cloudPath/ 形式
     */
    getCloudKey(cloudPath) {
        if (!cloudPath) {
            return '';
        }
        // 单个 / 转换成根目录
        if (cloudPath === '/') {
            return '';
        }
        return cloudPath[cloudPath.length - 1] === '/' ? cloudPath : `${cloudPath}/`;
    }
}
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "getInfo", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "enableService", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "listFiles", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "destroyService", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "uploadFiles", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "deleteFiles", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "downloadFile", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "downloadDirectory", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "walkLocalDir", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "CreateHostingDomain", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "deleteHostingDomain", null);
__decorate([
    utils_1.preLazy()
], HostingService.prototype, "checkStatus", null);
exports.HostingService = HostingService;

}, function(modId) { var map = {"../error":1654780339085,"../utils":1654780339086,"../utils/parallel":1654780339098}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339104, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.ThirdService = void 0;
const utils_1 = require("../utils");
class ThirdService {
    constructor(environment) {
        this.cloudService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 解除第三方小程序绑定
    async deleteThirdPartAttach(options) {
        const { ThirdPartAppid, TypeFlag } = options;
        return this.cloudService.request('DeleteThirdPartAttach', {
            ThirdPartAppid,
            TypeFlag
        });
    }
}
exports.ThirdService = ThirdService;

}, function(modId) { var map = {"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339105, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessService = void 0;
const utils_1 = require("../utils");
class AccessService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 创建云接入路径
    async createAccess(options) {
        const { path, name, type = 1, auth } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('CreateCloudBaseGWAPI', {
            ServiceId: envId,
            Path: path,
            Type: type,
            Name: name,
            AuthSwitch: auth ? 1 : 2
        });
    }
    // 获取云接入自定义域名列表
    async getDomainList() {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DescribeCloudBaseGWService', {
            ServiceId: envId
        });
    }
    // 获取云接入服务列表
    async getAccessList(options = {}) {
        const { path, name, offset, limit } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DescribeCloudBaseGWAPI', {
            ServiceId: envId,
            Path: path,
            Name: name,
            Offset: offset,
            limit: limit
        });
    }
    // 切换云接入服务开关：开启/关闭
    async switchAuth(auth) {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('ModifyCloudBaseGWPrivilege', {
            ServiceId: envId,
            EnableService: auth,
            Options: [
                {
                    Key: 'serviceswitch',
                    Value: auth ? 'true' : 'false'
                }
            ]
        });
    }
    // 更新云接入路径鉴权
    async switchPathAuth(options) {
        const { apiIds, auth } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('ModifyCloudBaseGWAPIPrivilegeBatch', {
            ServiceId: envId,
            APIIdSet: apiIds,
            Options: [
                {
                    Key: 'authswitch',
                    Value: auth ? 'true' : 'false'
                }
            ]
        });
    }
    // 删除云接入服务
    async deleteAccess(options) {
        const { name, type = 1, apiId } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DeleteCloudBaseGWAPI', {
            ServiceId: envId,
            Name: name,
            Type: type,
            APIId: apiId
        });
    }
    // 添加自定义域名
    async addCustomDomain(options) {
        const { domain, certId } = options;
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('BindCloudBaseGWDomain', {
            Domain: domain,
            ServiceId: envId,
            CertId: certId
        });
    }
    // 删除自定义域名
    async deleteCustomDomain(domain) {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('DeleteCloudBaseGWDomain', {
            Domain: domain,
            ServiceId: envId
        });
    }
    getEnvInfo() {
        var _a;
        const envConfig = this.environment.lazyEnvironmentConfig;
        const appId = (_a = envConfig.Storages[0]) === null || _a === void 0 ? void 0 : _a.AppId;
        const { proxy } = this.environment.cloudBaseContext;
        return {
            appId,
            proxy,
            envId: envConfig.EnvId
        };
    }
}
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "createAccess", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "getDomainList", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "getAccessList", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "switchAuth", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "switchPathAuth", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "deleteAccess", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "addCustomDomain", null);
__decorate([
    utils_1.preLazy()
], AccessService.prototype, "deleteCustomDomain", null);
exports.AccessService = AccessService;

}, function(modId) { var map = {"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339106, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const utils_1 = require("../utils");
class UserService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 获取云开发用户列表
    async getEndUserList(options) {
        const { limit, offset } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('DescribeEndUsers', {
            EnvId,
            Limit: limit,
            Offset: offset
        });
    }
    // // 停用云开发用户
    // @preLazy()
    // public async disableEndUser(options: {
    //     uuid: string
    // }) {
    //     const { uuid } = options
    //     const { EnvId } = this.environment.lazyEnvironmentConfig
    //     return this.tcbService.request<{
    //         RequestId: string
    //     }>('ModifyEndUser', {
    //         EnvId,
    //         UUId: uuid,
    //         Status: 'DISABLE'
    //     })
    // }
    // 设置云开发用户状态（停用或启用）
    async setEndUserStatus(options) {
        const { uuid, status } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('ModifyEndUser', {
            EnvId,
            UUId: uuid,
            Status: status
        });
    }
    // 批量删除云开发用户
    async deleteEndUsers(options) {
        const { userList } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('DeleteEndUser', {
            EnvId,
            UserList: userList
        });
    }
    // 创建用户名密码
    async createEndUser(options) {
        const { username, password } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('CreateEndUserAccount', {
            EnvId,
            Username: username,
            Password: password,
        });
    }
    // 更改用户账户
    async modifyEndUser(options) {
        const { uuid, username, password } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        const reqData = {
            EnvId,
            Uuid: uuid
        };
        if (this.isValidStr(username)) {
            reqData.Username = username;
        }
        if (this.isValidStr(password)) {
            reqData.Password = password;
        }
        return this.tcbService.request('ModifyEndUserAccount', reqData);
    }
    // 更改用户信息
    async updateEndUser(options) {
        const { uuid, nickName, gender, avatarUrl, country, province, city } = options;
        const { EnvId } = this.environment.lazyEnvironmentConfig;
        return this.tcbService.request('ModifyEndUserInfo', {
            UUId: uuid,
            EnvId,
            Data: [{
                    Key: 'Name',
                    Value: nickName
                }, {
                    Key: 'Gender',
                    Value: gender
                }, {
                    Key: 'AvatarUrl',
                    Value: avatarUrl
                }, {
                    Key: 'Country',
                    Value: country
                }, {
                    Key: 'Province',
                    Value: province
                }, {
                    Key: 'City',
                    Value: city
                }]
        });
    }
    isValidStr(obj) {
        return typeof obj === 'string' && obj.trim().length > 0;
    }
}
__decorate([
    utils_1.preLazy()
], UserService.prototype, "getEndUserList", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "setEndUserStatus", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "deleteEndUsers", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "createEndUser", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "modifyEndUser", null);
__decorate([
    utils_1.preLazy()
], UserService.prototype, "updateEndUser", null);
exports.UserService = UserService;

}, function(modId) { var map = {"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339107, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseRunService = void 0;
const utils_1 = require("../utils");
class CloudBaseRunService {
    constructor(environment) {
        this.environment = environment;
        this.tcbService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 修改容器内版本流量配置
    async modifyServerFlow(options) {
        const { envId } = this.getEnvInfo();
        return this.tcbService.request('ModifyCloudBaseRunServerFlowConf', {
            EnvId: envId,
            ServerName: options.serverName,
            VersionFlowItems: utils_1.upperCaseObjKey(options.versionFlowItems)
            // TrafficType: options.trafficType
        });
    }
    getEnvInfo() {
        const envConfig = this.environment.lazyEnvironmentConfig;
        return {
            envId: envConfig.EnvId
        };
    }
}
__decorate([
    utils_1.preLazy()
], CloudBaseRunService.prototype, "modifyServerFlow", null);
exports.CloudBaseRunService = CloudBaseRunService;

}, function(modId) { var map = {"../utils":1654780339086}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339080);
})()
//miniprogram-npm-outsideDeps=["path","archiver","crypto","del","url","query-string","node-fetch","https-proxy-agent","fs","make-dir","util","walkdir","micromatch","cos-nodejs-sdk-v5"]
//# sourceMappingURL=index.js.map