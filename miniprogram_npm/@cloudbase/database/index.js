module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780338997, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const Geo = require("./geo/index");
const collection_1 = require("./collection");
const command_1 = require("./command");
const index_1 = require("./serverDate/index");
const index_2 = require("./regexp/index");
const index_3 = require("./transaction/index");
const index_4 = require("./ObjectId/index");
var query_1 = require("./query");
exports.Query = query_1.Query;
var collection_2 = require("./collection");
exports.CollectionReference = collection_2.CollectionReference;
var document_1 = require("./document");
exports.DocumentReference = document_1.DocumentReference;
class Db {
    constructor(config) {
        this.config = config;
        this.Geo = Geo;
        this.serverDate = index_1.ServerDateConstructor;
        this.command = command_1.Command;
        this.RegExp = index_2.RegExpConstructor;
        this.ObjectId = index_4.ObjectIdConstructor;
        this.startTransaction = index_3.startTransaction;
        this.runTransaction = index_3.runTransaction;
    }
    collection(collName) {
        if (!collName) {
            throw new Error('Collection name is required');
        }
        return new collection_1.CollectionReference(this, collName);
    }
    createCollection(collName) {
        let request = new Db.reqClass(this.config);
        const params = {
            collectionName: collName
        };
        return request.send('database.addCollection', params);
    }
}
exports.Db = Db;

}, function(modId) {var map = {"./geo/index":1654780338998,"./collection":1654780339013,"./command":1654780339035,"./serverDate/index":1654780339022,"./regexp/index":1654780339036,"./transaction/index":1654780339037,"./ObjectId/index":1654780339038,"./query":1654780339032,"./document":1654780339014}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780338998, function(require, module, exports) {

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./point"));
__export(require("./lineString"));
__export(require("./polygon"));
__export(require("./multiPoint"));
__export(require("./multiLineString"));
__export(require("./multiPolygon"));

}, function(modId) { var map = {"./point":1654780338999,"./lineString":1654780339008,"./polygon":1654780339009,"./multiPoint":1654780339010,"./multiLineString":1654780339011,"./multiPolygon":1654780339012}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780338999, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const validate_1 = require("../validate");
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
class Point {
    constructor(longitude, latitude) {
        validate_1.Validate.isGeopoint('longitude', longitude);
        validate_1.Validate.isGeopoint('latitude', latitude);
        this.longitude = longitude;
        this.latitude = latitude;
    }
    parse(key) {
        return {
            [key]: {
                type: 'Point',
                coordinates: [this.longitude, this.latitude]
            }
        };
    }
    toJSON() {
        return {
            type: 'Point',
            coordinates: [
                this.longitude,
                this.latitude,
            ],
        };
    }
    toReadableString() {
        return `[${this.longitude},${this.latitude}]`;
    }
    static validate(point) {
        return point.type === 'Point' &&
            type_1.isArray(point.coordinates) &&
            validate_1.Validate.isGeopoint('longitude', point.coordinates[0]) &&
            validate_1.Validate.isGeopoint('latitude', point.coordinates[1]);
    }
    get _internalType() {
        return symbol_1.SYMBOL_GEO_POINT;
    }
}
exports.Point = Point;

}, function(modId) { var map = {"../validate":1654780339000,"../helper/symbol":1654780339007,"../utils/type":1654780339005}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339000, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("./constant");
const util_1 = require("./util");
const code_1 = require("./const/code");
const utils_1 = require("./utils/utils");
const type_1 = require("./utils/type");
const symbol_1 = require("./helper/symbol");
const validOptionsKeys = ['limit', 'offset', 'projection', 'order', 'multiple', 'timeout', 'raw'];
class Validate {
    static isGeopoint(point, degree) {
        if (util_1.Util.whichType(degree) !== constant_1.FieldType.Number) {
            throw new Error('Geo Point must be number type');
        }
        const degreeAbs = Math.abs(degree);
        if (point === 'latitude' && degreeAbs > 90) {
            throw new Error('latitude should be a number ranges from -90 to 90');
        }
        else if (point === 'longitude' && degreeAbs > 180) {
            throw new Error('longitude should be a number ranges from -180 to 180');
        }
        return true;
    }
    static isInteger(param, num) {
        if (!Number.isInteger(num)) {
            throw new Error(param + constant_1.ErrorCode.IntergerError);
        }
        return true;
    }
    static mustBeBoolean(param, bool) {
        if (typeof bool !== 'boolean') {
            throw new Error(param + constant_1.ErrorCode.BooleanError);
        }
        return true;
    }
    static isProjection(param, value) {
        if (type_1.getType(value) !== 'object') {
            throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `${param} projection must be an object` }));
        }
        for (const key in value) {
            const subValue = value[key];
            if (type_1.getType(subValue) === 'number') {
                if (subValue !== 0 && subValue !== 1) {
                    throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `if the value in projection is of number, it must be 0 or 1` }));
                }
            }
            else if (type_1.getType(subValue) === 'object') {
            }
            else {
                throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: 'invalid projection' }));
            }
        }
        return true;
    }
    static isOrder(param, value) {
        if (type_1.getType(value) !== 'object') {
            throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `${param} order must be an object` }));
        }
        for (let key in value) {
            const subValue = value[key];
            if (subValue !== 1 && subValue !== -1) {
                throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `order value must be 1 or -1` }));
            }
        }
        return true;
    }
    static isFieldOrder(direction) {
        if (constant_1.OrderDirectionList.indexOf(direction) === -1) {
            throw new Error(constant_1.ErrorCode.DirectionError);
        }
        return true;
    }
    static isFieldPath(path) {
        if (!/^[a-zA-Z0-9-_\.]/.test(path)) {
            throw new Error();
        }
        return true;
    }
    static isOperator(op) {
        if (constant_1.WhereFilterOpList.indexOf(op) === -1) {
            throw new Error(constant_1.ErrorCode.OpStrError);
        }
        return true;
    }
    static isCollName(name) {
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-_]){1,32}$/.test(name)) {
            throw new Error(constant_1.ErrorCode.CollNameError);
        }
        return true;
    }
    static isDocID(docId) {
        if (!/^([a-fA-F0-9]){24}$/.test(docId)) {
            throw new Error(constant_1.ErrorCode.DocIDError);
        }
        return true;
    }
    static isValidOptions(options = {}) {
        if (type_1.getType(options) !== 'object') {
            throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `options must be an object` }));
        }
        const keys = Object.keys(options);
        for (const index in keys) {
            if (validOptionsKeys.indexOf(keys[index]) < 0) {
                throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `${keys[index]} is invalid options key` }));
            }
        }
        const { limit, offset, projection, order } = options;
        const { multiple } = options;
        if (limit !== undefined) {
            Validate.isInteger('limit', limit);
        }
        if (offset !== undefined) {
            Validate.isInteger('offset', offset);
        }
        if (projection !== undefined) {
            Validate.isProjection('projection', projection);
        }
        if (order !== undefined) {
            Validate.isOrder('order', order);
        }
        if (multiple !== undefined) {
            Validate.mustBeBoolean('multiple', multiple);
        }
        if (options.timeout !== undefined) {
            Validate.isInteger('timeout', options.timeout);
        }
        return true;
    }
    static isValidAggregation(stage) {
        if (Object.keys(stage).length !== 1) {
            throw utils_1.E(Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: `aggregation stage must have one key` }));
        }
        return true;
    }
    static isCentersPhere(param) {
        if (Array.isArray(param) && param.length === 2) {
            if (type_1.getType(param[0]) === 'object' &&
                param[0]._internalType === symbol_1.SYMBOL_GEO_POINT &&
                typeof param[1] === 'number') {
                return true;
            }
            if (Array.isArray(param[0]) && param[0].length === 2) {
                const longitude = param[0][0];
                const latitude = param[0][1];
                Validate.isGeopoint('longitude', longitude);
                Validate.isGeopoint('latitude', latitude);
                if (typeof param[1] === 'number') {
                    return true;
                }
            }
        }
        throw new Error(`${constant_1.ErrorCode.CentersPhereError}`);
    }
}
exports.Validate = Validate;

}, function(modId) { var map = {"./constant":1654780339001,"./util":1654780339002,"./const/code":1654780339003,"./utils/utils":1654780339004,"./utils/type":1654780339005,"./helper/symbol":1654780339007}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339001, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["DocIDError"] = "\u6587\u6863ID\u4E0D\u5408\u6CD5";
    ErrorCode["CollNameError"] = "\u96C6\u5408\u540D\u79F0\u4E0D\u5408\u6CD5";
    ErrorCode["OpStrError"] = "\u64CD\u4F5C\u7B26\u4E0D\u5408\u6CD5";
    ErrorCode["DirectionError"] = "\u6392\u5E8F\u5B57\u7B26\u4E0D\u5408\u6CD5";
    ErrorCode["IntergerError"] = "must be integer";
    ErrorCode["BooleanError"] = "must be boolean";
    ErrorCode["ArrayError"] = "must be array";
    ErrorCode["QueryParamTypeError"] = "\u67E5\u8BE2\u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61";
    ErrorCode["QueryParamValueError"] = "\u67E5\u8BE2\u53C2\u6570\u5BF9\u8C61\u503C\u4E0D\u80FD\u5747\u4E3Aundefined";
    ErrorCode["CentersPhereError"] = "centersPhere\u7ED3\u6784\u4E0D\u5408\u6CD5";
})(ErrorCode || (ErrorCode = {}));
exports.ErrorCode = ErrorCode;
const FieldType = {
    String: 'String',
    Number: 'Number',
    Object: 'Object',
    Array: 'Array',
    Boolean: 'Boolean',
    Null: 'Null',
    GeoPoint: 'GeoPoint',
    GeoLineString: 'GeoLineString',
    GeoPolygon: 'GeoPolygon',
    GeoMultiPoint: 'GeoMultiPoint',
    GeoMultiLineString: 'GeoMultiLineString',
    GeoMultiPolygon: 'GeoMultiPolygon',
    Date: 'Date',
    Command: 'Command',
    ServerDate: 'ServerDate',
    BsonDate: 'BsonDate'
};
exports.FieldType = FieldType;
const OrderDirectionList = ['desc', 'asc'];
exports.OrderDirectionList = OrderDirectionList;
const WhereFilterOpList = ['<', '<=', '==', '>=', '>'];
exports.WhereFilterOpList = WhereFilterOpList;
var Opeartor;
(function (Opeartor) {
    Opeartor["lt"] = "<";
    Opeartor["gt"] = ">";
    Opeartor["lte"] = "<=";
    Opeartor["gte"] = ">=";
    Opeartor["eq"] = "==";
})(Opeartor || (Opeartor = {}));
exports.Opeartor = Opeartor;
const OperatorMap = {
    [Opeartor.eq]: '$eq',
    [Opeartor.lt]: '$lt',
    [Opeartor.lte]: '$lte',
    [Opeartor.gt]: '$gt',
    [Opeartor.gte]: '$gte'
};
exports.OperatorMap = OperatorMap;
const UpdateOperatorList = [
    '$set',
    '$inc',
    '$mul',
    '$unset',
    '$push',
    '$pop',
    '$unshift',
    '$shift',
    '$currentDate',
    '$each',
    '$position'
];
exports.UpdateOperatorList = UpdateOperatorList;
var QueryType;
(function (QueryType) {
    QueryType["WHERE"] = "WHERE";
    QueryType["DOC"] = "DOC";
})(QueryType || (QueryType = {}));
exports.QueryType = QueryType;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339002, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("./constant");
const index_1 = require("./geo/index");
class Util {
}
exports.Util = Util;
Util.formatResDocumentData = (documents) => {
    return documents.map(document => {
        return Util.formatField(document);
    });
};
Util.formatField = document => {
    const keys = Object.keys(document);
    let protoField = {};
    if (Array.isArray(document)) {
        protoField = [];
    }
    keys.forEach(key => {
        const item = document[key];
        const type = Util.whichType(item);
        let realValue;
        switch (type) {
            case constant_1.FieldType.GeoPoint:
                realValue = new index_1.Point(item.coordinates[0], item.coordinates[1]);
                break;
            case constant_1.FieldType.GeoLineString:
                realValue = new index_1.LineString(item.coordinates.map(point => new index_1.Point(point[0], point[1])));
                break;
            case constant_1.FieldType.GeoPolygon:
                realValue = new index_1.Polygon(item.coordinates.map(line => new index_1.LineString(line.map(([lng, lat]) => new index_1.Point(lng, lat)))));
                break;
            case constant_1.FieldType.GeoMultiPoint:
                realValue = new index_1.MultiPoint(item.coordinates.map(point => new index_1.Point(point[0], point[1])));
                break;
            case constant_1.FieldType.GeoMultiLineString:
                realValue = new index_1.MultiLineString(item.coordinates.map(line => new index_1.LineString(line.map(([lng, lat]) => new index_1.Point(lng, lat)))));
                break;
            case constant_1.FieldType.GeoMultiPolygon:
                realValue = new index_1.MultiPolygon(item.coordinates.map(polygon => new index_1.Polygon(polygon.map(line => new index_1.LineString(line.map(([lng, lat]) => new index_1.Point(lng, lat)))))));
                break;
            case constant_1.FieldType.Date:
                realValue = item;
                break;
            case constant_1.FieldType.Object:
            case constant_1.FieldType.Array:
                realValue = Util.formatField(item);
                break;
            case constant_1.FieldType.ServerDate:
                realValue = new Date(item.$date);
                break;
            default:
                realValue = item;
        }
        if (Array.isArray(protoField)) {
            protoField.push(realValue);
        }
        else {
            protoField[key] = realValue;
        }
    });
    return protoField;
};
Util.whichType = (obj) => {
    let type = Object.prototype.toString.call(obj).slice(8, -1);
    if (type === constant_1.FieldType.Date) {
        return constant_1.FieldType.Date;
    }
    if (type === constant_1.FieldType.Object) {
        if (obj.$date) {
            type = constant_1.FieldType.ServerDate;
        }
        else if (index_1.Point.validate(obj)) {
            type = constant_1.FieldType.GeoPoint;
        }
        else if (index_1.LineString.validate(obj)) {
            type = constant_1.FieldType.GeoLineString;
        }
        else if (index_1.Polygon.validate(obj)) {
            type = constant_1.FieldType.GeoPolygon;
        }
        else if (index_1.MultiPoint.validate(obj)) {
            type = constant_1.FieldType.GeoMultiPoint;
        }
        else if (index_1.MultiLineString.validate(obj)) {
            type = constant_1.FieldType.GeoMultiLineString;
        }
        else if (index_1.MultiPolygon.validate(obj)) {
            type = constant_1.FieldType.GeoMultiPolygon;
        }
    }
    return type;
};
Util.generateDocId = () => {
    let chars = 'ABCDEFabcdef0123456789';
    let autoId = '';
    for (let i = 0; i < 24; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
};

}, function(modId) { var map = {"./constant":1654780339001,"./geo/index":1654780338998}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339003, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.ERRORS = {
    CREATE_WATCH_NET_ERROR: {
        code: 'CREATE_WATCH_NET_ERROR',
        message: 'create watch network error'
    },
    CREATE_WACTH_EXCEED_ERROR: {
        code: 'CREATE_WACTH_EXCEED_ERROR',
        message: 'maximum connections exceed'
    },
    CREATE_WATCH_SERVER_ERROR: {
        code: 'CREATE_WATCH_SERVER_ERROR',
        message: 'create watch server error'
    },
    CONN_ERROR: {
        code: 'CONN_ERROR',
        message: 'connection error'
    },
    INVALID_PARAM: {
        code: 'INVALID_PARAM',
        message: 'Invalid request param'
    },
    INSERT_DOC_FAIL: {
        code: 'INSERT_DOC_FAIL',
        message: 'insert document failed'
    },
    DATABASE_TRANSACTION_CONFLICT: {
        code: 'DATABASE_TRANSACTION_CONFLICT',
        message: 'database transaction conflict'
    },
    DATABASE_REQUEST_FAILED: {
        code: 'DATABASE_REQUEST_FAILED',
        message: 'database request failed'
    }
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339004, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const bson_1 = require("bson");
const type_1 = require("./type");
exports.sleep = (ms = 0) => new Promise(r => setTimeout(r, ms));
const counters = {};
exports.autoCount = (domain = 'any') => {
    if (!counters[domain]) {
        counters[domain] = 0;
    }
    return counters[domain]++;
};
exports.getReqOpts = (apiOptions) => {
    if (apiOptions.timeout !== undefined) {
        return {
            timeout: apiOptions.timeout
        };
    }
    return {};
};
exports.filterUndefined = o => {
    if (!type_1.isObject(o)) {
        return o;
    }
    for (let key in o) {
        if (o[key] === undefined) {
            delete o[key];
        }
        else if (type_1.isObject(o[key])) {
            o[key] = exports.filterUndefined(o[key]);
        }
    }
    return o;
};
exports.stringifyByEJSON = params => {
    params = exports.filterUndefined(params);
    return bson_1.EJSON.stringify(params, { relaxed: false });
};
exports.parseByEJSON = params => {
    return bson_1.EJSON.parse(params);
};
class TcbError extends Error {
    constructor(error) {
        super(error.message);
        this.code = error.code;
        this.message = error.message;
    }
}
exports.TcbError = TcbError;
exports.E = (errObj) => {
    return new TcbError(errObj);
};
function processReturn(throwOnCode, res) {
    if (throwOnCode === false) {
        return res;
    }
    throw exports.E(Object.assign({}, res));
}
exports.processReturn = processReturn;

}, function(modId) { var map = {"./type":1654780339005}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339005, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("./symbol");
exports.getType = (x) => Object.prototype.toString.call(x).slice(8, -1).toLowerCase();
exports.isObject = (x) => exports.getType(x) === 'object';
exports.isString = (x) => exports.getType(x) === 'string';
exports.isNumber = (x) => exports.getType(x) === 'number';
exports.isPromise = (x) => exports.getType(x) === 'promise';
exports.isFunction = (x) => typeof x === 'function';
exports.isArray = (x) => Array.isArray(x);
exports.isDate = (x) => exports.getType(x) === 'date';
exports.isRegExp = (x) => exports.getType(x) === 'regexp';
exports.isInternalObject = (x) => x && (x._internalType instanceof symbol_1.InternalSymbol);
exports.isPlainObject = (obj) => {
    if (typeof obj !== 'object' || obj === null)
        return false;
    let proto = obj;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(obj) === proto;
};

}, function(modId) { var map = {"./symbol":1654780339006}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339006, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const _symbols = [];
const __internalMark__ = {};
class HiddenSymbol {
    constructor(target) {
        Object.defineProperties(this, {
            target: {
                enumerable: false,
                writable: false,
                configurable: false,
                value: target,
            },
        });
    }
}
class InternalSymbol extends HiddenSymbol {
    constructor(target, __mark__) {
        if (__mark__ !== __internalMark__) {
            throw new TypeError('InternalSymbol cannot be constructed with new operator');
        }
        super(target);
    }
    static for(target) {
        for (let i = 0, len = _symbols.length; i < len; i++) {
            if (_symbols[i].target === target) {
                return _symbols[i].instance;
            }
        }
        const symbol = new InternalSymbol(target, __internalMark__);
        _symbols.push({
            target,
            instance: symbol,
        });
        return symbol;
    }
}
exports.InternalSymbol = InternalSymbol;
exports.default = InternalSymbol;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339007, function(require, module, exports) {

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../utils/symbol");
__export(require("../utils/symbol"));
exports.SYMBOL_UNSET_FIELD_NAME = symbol_1.default.for('UNSET_FIELD_NAME');
exports.SYMBOL_UPDATE_COMMAND = symbol_1.default.for('UPDATE_COMMAND');
exports.SYMBOL_QUERY_COMMAND = symbol_1.default.for('QUERY_COMMAND');
exports.SYMBOL_LOGIC_COMMAND = symbol_1.default.for('LOGIC_COMMAND');
exports.SYMBOL_GEO_POINT = symbol_1.default.for('GEO_POINT');
exports.SYMBOL_GEO_LINE_STRING = symbol_1.default.for('SYMBOL_GEO_LINE_STRING');
exports.SYMBOL_GEO_POLYGON = symbol_1.default.for('SYMBOL_GEO_POLYGON');
exports.SYMBOL_GEO_MULTI_POINT = symbol_1.default.for('SYMBOL_GEO_MULTI_POINT');
exports.SYMBOL_GEO_MULTI_LINE_STRING = symbol_1.default.for('SYMBOL_GEO_MULTI_LINE_STRING');
exports.SYMBOL_GEO_MULTI_POLYGON = symbol_1.default.for('SYMBOL_GEO_MULTI_POLYGON');
exports.SYMBOL_SERVER_DATE = symbol_1.default.for('SERVER_DATE');
exports.SYMBOL_REGEXP = symbol_1.default.for('REGEXP');
exports.SYMBOL_OBJECTID = symbol_1.default.for('OBJECTID');

}, function(modId) { var map = {"../utils/symbol":1654780339006}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339008, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const point_1 = require("./point");
const type_1 = require("../utils/type");
class LineString {
    constructor(points) {
        if (!type_1.isArray(points)) {
            throw new TypeError(`"points" must be of type Point[]. Received type ${typeof points}`);
        }
        if (points.length < 2) {
            throw new Error('"points" must contain 2 points at least');
        }
        points.forEach(point => {
            if (!(point instanceof point_1.Point)) {
                throw new TypeError(`"points" must be of type Point[]. Received type ${typeof point}[]`);
            }
        });
        this.points = points;
    }
    parse(key) {
        return {
            [key]: {
                type: 'LineString',
                coordinates: this.points.map(point => point.toJSON().coordinates)
            }
        };
    }
    toJSON() {
        return {
            type: 'LineString',
            coordinates: this.points.map(point => point.toJSON().coordinates)
        };
    }
    static validate(lineString) {
        if (lineString.type !== 'LineString' || !type_1.isArray(lineString.coordinates)) {
            return false;
        }
        for (let point of lineString.coordinates) {
            if (!type_1.isNumber(point[0]) || !type_1.isNumber(point[1])) {
                return false;
            }
        }
        return true;
    }
    static isClosed(lineString) {
        const firstPoint = lineString.points[0];
        const lastPoint = lineString.points[lineString.points.length - 1];
        if (firstPoint.latitude === lastPoint.latitude && firstPoint.longitude === lastPoint.longitude) {
            return true;
        }
    }
    get _internalType() {
        return symbol_1.SYMBOL_GEO_LINE_STRING;
    }
}
exports.LineString = LineString;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"./point":1654780338999,"../utils/type":1654780339005}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339009, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
const lineString_1 = require("./lineString");
class Polygon {
    constructor(lines) {
        if (!type_1.isArray(lines)) {
            throw new TypeError(`"lines" must be of type LineString[]. Received type ${typeof lines}`);
        }
        if (lines.length === 0) {
            throw new Error('Polygon must contain 1 linestring at least');
        }
        lines.forEach(line => {
            if (!(line instanceof lineString_1.LineString)) {
                throw new TypeError(`"lines" must be of type LineString[]. Received type ${typeof line}[]`);
            }
            if (!lineString_1.LineString.isClosed(line)) {
                throw new Error(`LineString ${line.points.map(p => p.toReadableString())} is not a closed cycle`);
            }
        });
        this.lines = lines;
    }
    parse(key) {
        return {
            [key]: {
                type: 'Polygon',
                coordinates: this.lines.map(line => {
                    return line.points.map(point => [point.longitude, point.latitude]);
                })
            }
        };
    }
    toJSON() {
        return {
            type: 'Polygon',
            coordinates: this.lines.map(line => {
                return line.points.map(point => [point.longitude, point.latitude]);
            })
        };
    }
    static validate(polygon) {
        if (polygon.type !== 'Polygon' || !type_1.isArray(polygon.coordinates)) {
            return false;
        }
        for (let line of polygon.coordinates) {
            if (!this.isCloseLineString(line)) {
                return false;
            }
            for (let point of line) {
                if (!type_1.isNumber(point[0]) || !type_1.isNumber(point[1])) {
                    return false;
                }
            }
        }
        return true;
    }
    static isCloseLineString(lineString) {
        const firstPoint = lineString[0];
        const lastPoint = lineString[lineString.length - 1];
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
            return false;
        }
        return true;
    }
    get _internalType() {
        return symbol_1.SYMBOL_GEO_POLYGON;
    }
}
exports.Polygon = Polygon;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"../utils/type":1654780339005,"./lineString":1654780339008}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339010, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const point_1 = require("./point");
const type_1 = require("../utils/type");
class MultiPoint {
    constructor(points) {
        if (!type_1.isArray(points)) {
            throw new TypeError(`"points" must be of type Point[]. Received type ${typeof points}`);
        }
        if (points.length === 0) {
            throw new Error('"points" must contain 1 point at least');
        }
        points.forEach(point => {
            if (!(point instanceof point_1.Point)) {
                throw new TypeError(`"points" must be of type Point[]. Received type ${typeof point}[]`);
            }
        });
        this.points = points;
    }
    parse(key) {
        return {
            [key]: {
                type: 'MultiPoint',
                coordinates: this.points.map(point => point.toJSON().coordinates)
            }
        };
    }
    toJSON() {
        return {
            type: 'MultiPoint',
            coordinates: this.points.map(point => point.toJSON().coordinates)
        };
    }
    static validate(multiPoint) {
        if (multiPoint.type !== 'MultiPoint' || !type_1.isArray(multiPoint.coordinates)) {
            return false;
        }
        for (let point of multiPoint.coordinates) {
            if (!type_1.isNumber(point[0]) || !type_1.isNumber(point[1])) {
                return false;
            }
        }
        return true;
    }
    get _internalType() {
        return symbol_1.SYMBOL_GEO_MULTI_POINT;
    }
}
exports.MultiPoint = MultiPoint;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"./point":1654780338999,"../utils/type":1654780339005}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339011, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
const lineString_1 = require("./lineString");
class MultiLineString {
    constructor(lines) {
        if (!type_1.isArray(lines)) {
            throw new TypeError(`"lines" must be of type LineString[]. Received type ${typeof lines}`);
        }
        if (lines.length === 0) {
            throw new Error('Polygon must contain 1 linestring at least');
        }
        lines.forEach(line => {
            if (!(line instanceof lineString_1.LineString)) {
                throw new TypeError(`"lines" must be of type LineString[]. Received type ${typeof line}[]`);
            }
        });
        this.lines = lines;
    }
    parse(key) {
        return {
            [key]: {
                type: 'MultiLineString',
                coordinates: this.lines.map(line => {
                    return line.points.map(point => [point.longitude, point.latitude]);
                })
            }
        };
    }
    toJSON() {
        return {
            type: 'MultiLineString',
            coordinates: this.lines.map(line => {
                return line.points.map(point => [point.longitude, point.latitude]);
            })
        };
    }
    static validate(multiLineString) {
        if (multiLineString.type !== 'MultiLineString' || !type_1.isArray(multiLineString.coordinates)) {
            return false;
        }
        for (let line of multiLineString.coordinates) {
            for (let point of line) {
                if (!type_1.isNumber(point[0]) || !type_1.isNumber(point[1])) {
                    return false;
                }
            }
        }
        return true;
    }
    get _internalType() {
        return symbol_1.SYMBOL_GEO_MULTI_LINE_STRING;
    }
}
exports.MultiLineString = MultiLineString;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"../utils/type":1654780339005,"./lineString":1654780339008}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339012, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
const polygon_1 = require("./polygon");
class MultiPolygon {
    constructor(polygons) {
        if (!type_1.isArray(polygons)) {
            throw new TypeError(`"polygons" must be of type Polygon[]. Received type ${typeof polygons}`);
        }
        if (polygons.length === 0) {
            throw new Error('MultiPolygon must contain 1 polygon at least');
        }
        for (let polygon of polygons) {
            if (!(polygon instanceof polygon_1.Polygon)) {
                throw new TypeError(`"polygon" must be of type Polygon[]. Received type ${typeof polygon}[]`);
            }
        }
        this.polygons = polygons;
    }
    parse(key) {
        return {
            [key]: {
                type: 'MultiPolygon',
                coordinates: this.polygons.map(polygon => {
                    return polygon.lines.map(line => {
                        return line.points.map(point => [point.longitude, point.latitude]);
                    });
                })
            }
        };
    }
    toJSON() {
        return {
            type: 'MultiPolygon',
            coordinates: this.polygons.map(polygon => {
                return polygon.lines.map(line => {
                    return line.points.map(point => [point.longitude, point.latitude]);
                });
            })
        };
    }
    static validate(multiPolygon) {
        if (multiPolygon.type !== 'MultiPolygon' || !type_1.isArray(multiPolygon.coordinates)) {
            return false;
        }
        for (let polygon of multiPolygon.coordinates) {
            for (let line of polygon) {
                for (let point of line) {
                    if (!type_1.isNumber(point[0]) || !type_1.isNumber(point[1])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    get _internalType() {
        return symbol_1.SYMBOL_GEO_MULTI_POLYGON;
    }
}
exports.MultiPolygon = MultiPolygon;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"../utils/type":1654780339005,"./polygon":1654780339009}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339013, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const document_1 = require("./document");
const query_1 = require("./query");
const aggregate_1 = require("./aggregate");
const datatype_1 = require("./serializer/datatype");
const utils_1 = require("./utils/utils");
const validate_1 = require("./validate");
const type_1 = require("./utils/type");
class CollectionReference extends query_1.Query {
    constructor(db, coll, apiOptions, transactionId) {
        super(db, coll, '', apiOptions, transactionId);
        if (transactionId) {
            this._transactionId = transactionId;
        }
    }
    get name() {
        return this._coll;
    }
    doc(docID) {
        if (typeof docID !== 'string' && typeof docID !== 'number') {
            throw new Error('docId必须为字符串或数字');
        }
        return new document_1.DocumentReference(this._db, this._coll, this._apiOptions, docID, this._transactionId);
    }
    async add(data) {
        let transformData = data;
        if (!type_1.isArray(data)) {
            transformData = [data];
        }
        transformData = transformData.map(item => {
            return utils_1.stringifyByEJSON(datatype_1.serialize(item));
        });
        let params = {
            collectionName: this._coll,
            data: transformData
        };
        if (this._transactionId) {
            params.transactionId = this._transactionId;
        }
        const res = await this._request.send('database.insertDocument', params, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        if (!type_1.isArray(data)) {
            if (this._transactionId) {
                return {
                    inserted: 1,
                    ok: 1,
                    id: res.data.insertedIds[0],
                    requestId: res.requestId
                };
            }
            return {
                id: res.data.insertedIds[0],
                requestId: res.requestId
            };
        }
        return {
            ids: res.data.insertedIds,
            requestId: res.requestId
        };
    }
    aggregate(rawPipeline = []) {
        return new aggregate_1.default(this._db, this._coll, (this._apiOptions.raw || false) ? rawPipeline : []);
    }
    options(apiOptions) {
        validate_1.Validate.isValidOptions(apiOptions);
        return new CollectionReference(this._db, this._coll, apiOptions, this._transactionId);
    }
}
exports.CollectionReference = CollectionReference;

}, function(modId) { var map = {"./document":1654780339014,"./query":1654780339032,"./aggregate":1654780339034,"./serializer/datatype":1654780339021,"./utils/utils":1654780339004,"./validate":1654780339000,"./utils/type":1654780339005}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339014, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const util_1 = require("./util");
const update_1 = require("./serializer/update");
const datatype_1 = require("./serializer/datatype");
const update_2 = require("./commands/update");
const websocket_client_1 = require("./realtime/websocket-client");
const constant_1 = require("./constant");
const utils_1 = require("./utils/utils");
const code_1 = require("./const/code");
const bson_1 = require("bson");
class DocumentReference {
    constructor(db, coll, apiOptions, docID, transactionId) {
        this.watch = (options) => {
            if (!index_1.Db.ws) {
                index_1.Db.ws = new websocket_client_1.RealtimeWebSocketClient({
                    context: {
                        appConfig: {
                            docSizeLimit: 1000,
                            realtimePingInterval: 10000,
                            realtimePongWaitTimeout: 5000,
                            request: this.request
                        }
                    }
                });
            }
            return index_1.Db.ws.watch(Object.assign(Object.assign({}, options), { envId: this._db.config.env, collectionName: this._coll, query: JSON.stringify({
                    _id: this.id
                }) }));
        };
        this._db = db;
        this._coll = coll;
        this.id = docID;
        this._transactionId = transactionId;
        this.request = new index_1.Db.reqClass(this._db.config);
        this._apiOptions = apiOptions;
    }
    async create(data) {
        if (this.id) {
            data['_id'] = this.id;
        }
        let params = {
            collectionName: this._coll,
            data: [utils_1.stringifyByEJSON(datatype_1.serialize(data))],
            transactionId: this._transactionId
        };
        const res = await this.request.send('database.insertDocument', params, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        if (this._transactionId) {
            return {
                inserted: 1,
                ok: 1,
                id: res.data.insertedIds[0],
                requestId: res.requestId
            };
        }
        return {
            id: res.data.insertedIds[0],
            requestId: res.requestId
        };
    }
    async set(data) {
        if (!this.id) {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: 'docId不能为空' }));
        }
        if (!data || typeof data !== 'object') {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '参数必需是非空对象' }));
        }
        if (data.hasOwnProperty('_id')) {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '不能更新_id的值' }));
        }
        let hasOperator = false;
        const checkMixed = objs => {
            if (typeof objs === 'object') {
                for (let key in objs) {
                    if (objs[key] instanceof update_2.UpdateCommand) {
                        hasOperator = true;
                    }
                    else if (typeof objs[key] === 'object') {
                        checkMixed(objs[key]);
                    }
                }
            }
        };
        checkMixed(data);
        if (hasOperator) {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.DATABASE_REQUEST_FAILED), { message: 'update operator complicit' }));
        }
        let param = {
            collectionName: this._coll,
            queryType: constant_1.QueryType.DOC,
            data: utils_1.stringifyByEJSON(datatype_1.serialize(data)),
            transactionId: this._transactionId,
            multi: false,
            merge: false,
            upsert: true
        };
        if (this.id) {
            param['query'] = utils_1.stringifyByEJSON({ _id: this.id });
        }
        const res = await this.request.send('database.modifyDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        if (this._transactionId) {
            return {
                updated: res.data.updated,
                upserted: [{ _id: res.data.upsert_id }],
                requestId: res.requestId
            };
        }
        return {
            updated: res.data.updated,
            upsertedId: res.data.upsert_id,
            requestId: res.requestId
        };
    }
    async update(data) {
        if (!data || typeof data !== 'object') {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '参数必需是非空对象' }));
        }
        if (data.hasOwnProperty('_id')) {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '不能更新_id的值' }));
        }
        const query = utils_1.stringifyByEJSON({ _id: this.id });
        const param = {
            collectionName: this._coll,
            transactionId: this._transactionId,
            data: update_1.UpdateSerializer.encodeEJSON(data, this._apiOptions.raw || false),
            query,
            queryType: constant_1.QueryType.DOC,
            multi: false,
            merge: true,
            upsert: false
        };
        const res = await this.request.send('database.modifyDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        return {
            updated: res.data.updated,
            requestId: res.requestId
        };
    }
    async delete() {
        return this.remove();
    }
    async remove() {
        const query = utils_1.stringifyByEJSON({ _id: this.id });
        const param = {
            collectionName: this._coll,
            transactionId: this._transactionId,
            query: query,
            queryType: constant_1.QueryType.DOC,
            multi: false
        };
        const res = await this.request.send('database.removeDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        return {
            deleted: res.data.deleted,
            requestId: res.requestId
        };
    }
    async get() {
        const query = utils_1.stringifyByEJSON({ _id: this.id });
        const { projection } = this._apiOptions;
        const param = {
            collectionName: this._coll,
            query,
            transactionId: this._transactionId,
            queryType: constant_1.QueryType.DOC,
            multi: false
        };
        if (projection) {
            param.projection = utils_1.stringifyByEJSON(projection);
        }
        const res = await this.request.send('database.getDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        const list = res.data.list.map(item => bson_1.EJSON.parse(item));
        const documents = util_1.Util.formatResDocumentData(list);
        if (this._transactionId) {
            return {
                data: documents[0] || null,
                requestId: res.requestId
            };
        }
        return {
            data: documents,
            requestId: res.requestId,
            offset: res.data.offset,
            limit: res.data.limit
        };
    }
    field(projection) {
        let transformProjection = {};
        for (let k in projection) {
            if (typeof projection[k] === 'boolean') {
                transformProjection[k] = projection[k] === true ? 1 : 0;
            }
            if (typeof projection[k] === 'number') {
                transformProjection[k] = projection[k] > 0 ? 1 : 0;
            }
            if (typeof projection[k] === 'object') {
                transformProjection[k] = projection[k];
            }
        }
        let newApiOption = Object.assign({}, this._apiOptions);
        newApiOption.projection = transformProjection;
        return new DocumentReference(this._db, this._coll, newApiOption, this.id, this._transactionId);
    }
}
exports.DocumentReference = DocumentReference;

}, function(modId) { var map = {"./index":1654780338997,"./util":1654780339002,"./serializer/update":1654780339015,"./serializer/datatype":1654780339021,"./commands/update":1654780339016,"./realtime/websocket-client":1654780339023,"./constant":1654780339001,"./utils/utils":1654780339004,"./const/code":1654780339003}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339015, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const update_1 = require("../commands/update");
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
const operator_map_1 = require("../operator-map");
const common_1 = require("./common");
const utils_1 = require("../utils/utils");
class UpdateSerializer {
    constructor() { }
    static encode(query) {
        const stringifier = new UpdateSerializer();
        return stringifier.encodeUpdate(query);
    }
    static encodeEJSON(query, raw) {
        const stringifier = new UpdateSerializer();
        return utils_1.stringifyByEJSON(raw ? query : stringifier.encodeUpdate(query));
    }
    encodeUpdate(query) {
        if (update_1.isUpdateCommand(query)) {
            return this.encodeUpdateCommand(query);
        }
        else if (type_1.getType(query) === 'object') {
            return this.encodeUpdateObject(query);
        }
        else {
            return query;
        }
    }
    encodeUpdateCommand(query) {
        if (query.fieldName === symbol_1.SYMBOL_UNSET_FIELD_NAME) {
            throw new Error('Cannot encode a comparison command with unset field name');
        }
        switch (query.operator) {
            case update_1.UPDATE_COMMANDS_LITERAL.PUSH:
            case update_1.UPDATE_COMMANDS_LITERAL.PULL:
            case update_1.UPDATE_COMMANDS_LITERAL.PULL_ALL:
            case update_1.UPDATE_COMMANDS_LITERAL.POP:
            case update_1.UPDATE_COMMANDS_LITERAL.SHIFT:
            case update_1.UPDATE_COMMANDS_LITERAL.UNSHIFT:
            case update_1.UPDATE_COMMANDS_LITERAL.ADD_TO_SET: {
                return this.encodeArrayUpdateCommand(query);
            }
            default: {
                return this.encodeFieldUpdateCommand(query);
            }
        }
    }
    encodeFieldUpdateCommand(query) {
        const $op = operator_map_1.operatorToString(query.operator);
        switch (query.operator) {
            case update_1.UPDATE_COMMANDS_LITERAL.REMOVE: {
                return {
                    [$op]: {
                        [query.fieldName]: ''
                    }
                };
            }
            default: {
                return {
                    [$op]: {
                        [query.fieldName]: query.operands[0]
                    }
                };
            }
        }
    }
    encodeArrayUpdateCommand(query) {
        const $op = operator_map_1.operatorToString(query.operator);
        switch (query.operator) {
            case update_1.UPDATE_COMMANDS_LITERAL.PUSH: {
                let modifiers;
                if (type_1.isArray(query.operands)) {
                    modifiers = {
                        $each: query.operands.map(common_1.encodeInternalDataType)
                    };
                }
                else {
                    modifiers = query.operands;
                }
                return {
                    [$op]: {
                        [query.fieldName]: modifiers
                    }
                };
            }
            case update_1.UPDATE_COMMANDS_LITERAL.UNSHIFT: {
                const modifiers = {
                    $each: query.operands.map(common_1.encodeInternalDataType),
                    $position: 0
                };
                return {
                    [$op]: {
                        [query.fieldName]: modifiers
                    }
                };
            }
            case update_1.UPDATE_COMMANDS_LITERAL.POP: {
                return {
                    [$op]: {
                        [query.fieldName]: 1
                    }
                };
            }
            case update_1.UPDATE_COMMANDS_LITERAL.SHIFT: {
                return {
                    [$op]: {
                        [query.fieldName]: -1
                    }
                };
            }
            default: {
                return {
                    [$op]: {
                        [query.fieldName]: common_1.encodeInternalDataType(query.operands)
                    }
                };
            }
        }
    }
    encodeUpdateObject(query) {
        const flattened = common_1.flattenQueryObject(query);
        for (const key in flattened) {
            if (/^\$/.test(key))
                continue;
            let val = flattened[key];
            if (update_1.isUpdateCommand(val)) {
                flattened[key] = val._setFieldName(key);
                const condition = this.encodeUpdateCommand(flattened[key]);
                common_1.mergeConditionAfterEncode(flattened, condition, key);
            }
            else {
                flattened[key] = val = common_1.encodeInternalDataType(val);
                const $setCommand = new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.SET, [val], key);
                const condition = this.encodeUpdateCommand($setCommand);
                common_1.mergeConditionAfterEncode(flattened, condition, key);
            }
        }
        return flattened;
    }
}
exports.UpdateSerializer = UpdateSerializer;

}, function(modId) { var map = {"../commands/update":1654780339016,"../helper/symbol":1654780339007,"../utils/type":1654780339005,"../operator-map":1654780339017,"./common":1654780339020,"../utils/utils":1654780339004}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339016, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
var UPDATE_COMMANDS_LITERAL;
(function (UPDATE_COMMANDS_LITERAL) {
    UPDATE_COMMANDS_LITERAL["SET"] = "set";
    UPDATE_COMMANDS_LITERAL["REMOVE"] = "remove";
    UPDATE_COMMANDS_LITERAL["INC"] = "inc";
    UPDATE_COMMANDS_LITERAL["MUL"] = "mul";
    UPDATE_COMMANDS_LITERAL["PUSH"] = "push";
    UPDATE_COMMANDS_LITERAL["PULL"] = "pull";
    UPDATE_COMMANDS_LITERAL["PULL_ALL"] = "pullAll";
    UPDATE_COMMANDS_LITERAL["POP"] = "pop";
    UPDATE_COMMANDS_LITERAL["SHIFT"] = "shift";
    UPDATE_COMMANDS_LITERAL["UNSHIFT"] = "unshift";
    UPDATE_COMMANDS_LITERAL["ADD_TO_SET"] = "addToSet";
    UPDATE_COMMANDS_LITERAL["BIT"] = "bit";
    UPDATE_COMMANDS_LITERAL["RENAME"] = "rename";
    UPDATE_COMMANDS_LITERAL["MAX"] = "max";
    UPDATE_COMMANDS_LITERAL["MIN"] = "min";
})(UPDATE_COMMANDS_LITERAL = exports.UPDATE_COMMANDS_LITERAL || (exports.UPDATE_COMMANDS_LITERAL = {}));
class UpdateCommand {
    constructor(operator, operands, fieldName) {
        this._internalType = symbol_1.SYMBOL_UPDATE_COMMAND;
        Object.defineProperties(this, {
            _internalType: {
                enumerable: false,
                configurable: false,
            },
        });
        this.operator = operator;
        this.operands = operands;
        this.fieldName = fieldName || symbol_1.SYMBOL_UNSET_FIELD_NAME;
    }
    _setFieldName(fieldName) {
        const command = new UpdateCommand(this.operator, this.operands, fieldName);
        return command;
    }
}
exports.UpdateCommand = UpdateCommand;
function isUpdateCommand(object) {
    return object && (object instanceof UpdateCommand) && (object._internalType === symbol_1.SYMBOL_UPDATE_COMMAND);
}
exports.isUpdateCommand = isUpdateCommand;
function isKnownUpdateCommand(object) {
    return isUpdateCommand(object) && (object.operator.toUpperCase() in UPDATE_COMMANDS_LITERAL);
}
exports.isKnownUpdateCommand = isKnownUpdateCommand;
exports.default = UpdateCommand;

}, function(modId) { var map = {"../helper/symbol":1654780339007}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339017, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const query_1 = require("./commands/query");
const logic_1 = require("./commands/logic");
const update_1 = require("./commands/update");
exports.OperatorMap = {};
for (const key in query_1.QUERY_COMMANDS_LITERAL) {
    exports.OperatorMap[key] = '$' + key;
}
for (const key in logic_1.LOGIC_COMMANDS_LITERAL) {
    exports.OperatorMap[key] = '$' + key;
}
for (const key in update_1.UPDATE_COMMANDS_LITERAL) {
    exports.OperatorMap[key] = '$' + key;
}
exports.OperatorMap[query_1.QUERY_COMMANDS_LITERAL.NEQ] = '$ne';
exports.OperatorMap[update_1.UPDATE_COMMANDS_LITERAL.REMOVE] = '$unset';
exports.OperatorMap[update_1.UPDATE_COMMANDS_LITERAL.SHIFT] = '$pop';
exports.OperatorMap[update_1.UPDATE_COMMANDS_LITERAL.UNSHIFT] = '$push';
function operatorToString(operator) {
    return exports.OperatorMap[operator] || '$' + operator;
}
exports.operatorToString = operatorToString;

}, function(modId) { var map = {"./commands/query":1654780339018,"./commands/logic":1654780339019,"./commands/update":1654780339016}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339018, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const logic_1 = require("./logic");
const symbol_1 = require("../helper/symbol");
const index_1 = require("../geo/index");
const type_1 = require("../utils/type");
const validate_1 = require("../validate");
exports.EQ = 'eq';
exports.NEQ = 'neq';
exports.GT = 'gt';
exports.GTE = 'gte';
exports.LT = 'lt';
exports.LTE = 'lte';
exports.IN = 'in';
exports.NIN = 'nin';
exports.ALL = 'all';
exports.ELEM_MATCH = 'elemMatch';
exports.EXISTS = 'exists';
exports.SIZE = 'size';
exports.MOD = 'mod';
var QUERY_COMMANDS_LITERAL;
(function (QUERY_COMMANDS_LITERAL) {
    QUERY_COMMANDS_LITERAL["EQ"] = "eq";
    QUERY_COMMANDS_LITERAL["NEQ"] = "neq";
    QUERY_COMMANDS_LITERAL["GT"] = "gt";
    QUERY_COMMANDS_LITERAL["GTE"] = "gte";
    QUERY_COMMANDS_LITERAL["LT"] = "lt";
    QUERY_COMMANDS_LITERAL["LTE"] = "lte";
    QUERY_COMMANDS_LITERAL["IN"] = "in";
    QUERY_COMMANDS_LITERAL["NIN"] = "nin";
    QUERY_COMMANDS_LITERAL["ALL"] = "all";
    QUERY_COMMANDS_LITERAL["ELEM_MATCH"] = "elemMatch";
    QUERY_COMMANDS_LITERAL["EXISTS"] = "exists";
    QUERY_COMMANDS_LITERAL["SIZE"] = "size";
    QUERY_COMMANDS_LITERAL["MOD"] = "mod";
    QUERY_COMMANDS_LITERAL["GEO_NEAR"] = "geoNear";
    QUERY_COMMANDS_LITERAL["GEO_WITHIN"] = "geoWithin";
    QUERY_COMMANDS_LITERAL["GEO_INTERSECTS"] = "geoIntersects";
})(QUERY_COMMANDS_LITERAL = exports.QUERY_COMMANDS_LITERAL || (exports.QUERY_COMMANDS_LITERAL = {}));
class QueryCommand extends logic_1.LogicCommand {
    constructor(operator, operands, fieldName) {
        super(operator, operands, fieldName);
        this.operator = operator;
        this._internalType = symbol_1.SYMBOL_QUERY_COMMAND;
    }
    toJSON() {
        switch (this.operator) {
            case QUERY_COMMANDS_LITERAL.IN:
            case QUERY_COMMANDS_LITERAL.NIN:
                return {
                    ['$' + this.operator]: this.operands
                };
            case QUERY_COMMANDS_LITERAL.NEQ:
                return {
                    ['$ne']: this.operands[0]
                };
            default:
                return {
                    ['$' + this.operator]: this.operands[0]
                };
        }
    }
    _setFieldName(fieldName) {
        const command = new QueryCommand(this.operator, this.operands, fieldName);
        return command;
    }
    eq(val) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.EQ, [val], this.fieldName);
        return this.and(command);
    }
    neq(val) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.NEQ, [val], this.fieldName);
        return this.and(command);
    }
    gt(val) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.GT, [val], this.fieldName);
        return this.and(command);
    }
    gte(val) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.GTE, [val], this.fieldName);
        return this.and(command);
    }
    lt(val) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.LT, [val], this.fieldName);
        return this.and(command);
    }
    lte(val) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.LTE, [val], this.fieldName);
        return this.and(command);
    }
    in(list) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.IN, list, this.fieldName);
        return this.and(command);
    }
    nin(list) {
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.NIN, list, this.fieldName);
        return this.and(command);
    }
    geoNear(val) {
        if (!(val.geometry instanceof index_1.Point)) {
            throw new TypeError(`"geometry" must be of type Point. Received type ${typeof val.geometry}`);
        }
        if (val.maxDistance !== undefined && !type_1.isNumber(val.maxDistance)) {
            throw new TypeError(`"maxDistance" must be of type Number. Received type ${typeof val.maxDistance}`);
        }
        if (val.minDistance !== undefined && !type_1.isNumber(val.minDistance)) {
            throw new TypeError(`"minDistance" must be of type Number. Received type ${typeof val.minDistance}`);
        }
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.GEO_NEAR, [val], this.fieldName);
        return this.and(command);
    }
    geoWithin(val) {
        if (!(val.geometry instanceof index_1.MultiPolygon) &&
            !(val.geometry instanceof index_1.Polygon) &&
            !validate_1.Validate.isCentersPhere(val.centerSphere)) {
            throw new TypeError(`"geometry" must be of type Polygon or MultiPolygon. Received type ${typeof val.geometry}`);
        }
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.GEO_WITHIN, [val], this.fieldName);
        return this.and(command);
    }
    geoIntersects(val) {
        if (!(val.geometry instanceof index_1.Point) &&
            !(val.geometry instanceof index_1.LineString) &&
            !(val.geometry instanceof index_1.Polygon) &&
            !(val.geometry instanceof index_1.MultiPoint) &&
            !(val.geometry instanceof index_1.MultiLineString) &&
            !(val.geometry instanceof index_1.MultiPolygon)) {
            throw new TypeError(`"geometry" must be of type Point, LineString, Polygon, MultiPoint, MultiLineString or MultiPolygon. Received type ${typeof val.geometry}`);
        }
        const command = new QueryCommand(QUERY_COMMANDS_LITERAL.GEO_INTERSECTS, [val], this.fieldName);
        return this.and(command);
    }
}
exports.QueryCommand = QueryCommand;
function isQueryCommand(object) {
    return object && object instanceof QueryCommand && object._internalType === symbol_1.SYMBOL_QUERY_COMMAND;
}
exports.isQueryCommand = isQueryCommand;
function isKnownQueryCommand(object) {
    return isQueryCommand(object) && object.operator.toUpperCase() in QUERY_COMMANDS_LITERAL;
}
exports.isKnownQueryCommand = isKnownQueryCommand;
function isComparisonCommand(object) {
    return isQueryCommand(object);
}
exports.isComparisonCommand = isComparisonCommand;
exports.default = QueryCommand;

}, function(modId) { var map = {"./logic":1654780339019,"../helper/symbol":1654780339007,"../geo/index":1654780338998,"../utils/type":1654780339005,"../validate":1654780339000}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339019, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const query_1 = require("./query");
exports.AND = 'and';
exports.OR = 'or';
exports.NOT = 'not';
exports.NOR = 'nor';
var LOGIC_COMMANDS_LITERAL;
(function (LOGIC_COMMANDS_LITERAL) {
    LOGIC_COMMANDS_LITERAL["AND"] = "and";
    LOGIC_COMMANDS_LITERAL["OR"] = "or";
    LOGIC_COMMANDS_LITERAL["NOT"] = "not";
    LOGIC_COMMANDS_LITERAL["NOR"] = "nor";
})(LOGIC_COMMANDS_LITERAL = exports.LOGIC_COMMANDS_LITERAL || (exports.LOGIC_COMMANDS_LITERAL = {}));
class LogicCommand {
    constructor(operator, operands, fieldName) {
        this._internalType = symbol_1.SYMBOL_LOGIC_COMMAND;
        Object.defineProperties(this, {
            _internalType: {
                enumerable: false,
                configurable: false,
            },
        });
        this.operator = operator;
        this.operands = operands;
        this.fieldName = fieldName || symbol_1.SYMBOL_UNSET_FIELD_NAME;
        if (this.fieldName !== symbol_1.SYMBOL_UNSET_FIELD_NAME) {
            if (Array.isArray(operands)) {
                operands = operands.slice();
                this.operands = operands;
                for (let i = 0, len = operands.length; i < len; i++) {
                    const query = operands[i];
                    if (isLogicCommand(query) || query_1.isQueryCommand(query)) {
                        operands[i] = query._setFieldName(this.fieldName);
                    }
                }
            }
            else {
                const query = operands;
                if (isLogicCommand(query) || query_1.isQueryCommand(query)) {
                    operands = query._setFieldName(this.fieldName);
                }
            }
        }
    }
    _setFieldName(fieldName) {
        const operands = this.operands.map(operand => {
            if (operand instanceof LogicCommand) {
                return operand._setFieldName(fieldName);
            }
            else {
                return operand;
            }
        });
        const command = new LogicCommand(this.operator, operands, fieldName);
        return command;
    }
    and(...__expressions__) {
        const expressions = Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        expressions.unshift(this);
        return new LogicCommand(LOGIC_COMMANDS_LITERAL.AND, expressions, this.fieldName);
    }
    or(...__expressions__) {
        const expressions = Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        expressions.unshift(this);
        return new LogicCommand(LOGIC_COMMANDS_LITERAL.OR, expressions, this.fieldName);
    }
}
exports.LogicCommand = LogicCommand;
function isLogicCommand(object) {
    return object && (object instanceof LogicCommand) && (object._internalType === symbol_1.SYMBOL_LOGIC_COMMAND);
}
exports.isLogicCommand = isLogicCommand;
function isKnownLogicCommand(object) {
    return isLogicCommand && (object.operator.toUpperCase() in LOGIC_COMMANDS_LITERAL);
}
exports.isKnownLogicCommand = isKnownLogicCommand;
exports.default = LogicCommand;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"./query":1654780339018}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339020, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("../utils/type");
const datatype_1 = require("./datatype");
function flatten(query, shouldPreserverObject, parents, visited) {
    const cloned = Object.assign({}, query);
    for (const key in query) {
        if (/^\$/.test(key))
            continue;
        const value = query[key];
        if (value === undefined) {
            delete cloned[key];
            continue;
        }
        if (!value)
            continue;
        if (type_1.isObject(value) && !shouldPreserverObject(value)) {
            if (visited.indexOf(value) > -1) {
                throw new Error('Cannot convert circular structure to JSON');
            }
            const newParents = [...parents, key];
            const newVisited = [...visited, value];
            const flattenedChild = flatten(value, shouldPreserverObject, newParents, newVisited);
            cloned[key] = flattenedChild;
            let hasKeyNotCombined = false;
            for (const childKey in flattenedChild) {
                if (!/^\$/.test(childKey)) {
                    cloned[`${key}.${childKey}`] = flattenedChild[childKey];
                    delete cloned[key][childKey];
                }
                else {
                    hasKeyNotCombined = true;
                }
            }
            if (!hasKeyNotCombined) {
                delete cloned[key];
            }
        }
    }
    return cloned;
}
function flattenQueryObject(query) {
    return flatten(query, isConversionRequired, [], [query]);
}
exports.flattenQueryObject = flattenQueryObject;
function flattenObject(object) {
    return flatten(object, (_) => false, [], [object]);
}
exports.flattenObject = flattenObject;
function mergeConditionAfterEncode(query, condition, key) {
    if (!condition[key]) {
        delete query[key];
    }
    for (const conditionKey in condition) {
        if (query[conditionKey]) {
            if (type_1.isArray(query[conditionKey])) {
                query[conditionKey].push(condition[conditionKey]);
            }
            else if (type_1.isObject(query[conditionKey])) {
                if (type_1.isObject(condition[conditionKey])) {
                    Object.assign(query[conditionKey], condition[conditionKey]);
                }
                else {
                    console.warn(`unmergable condition, query is object but condition is ${type_1.getType(condition)}, can only overwrite`, condition, key);
                    query[conditionKey] = condition[conditionKey];
                }
            }
            else {
                console.warn(`to-merge query is of type ${type_1.getType(query)}, can only overwrite`, query, condition, key);
                query[conditionKey] = condition[conditionKey];
            }
        }
        else {
            query[conditionKey] = condition[conditionKey];
        }
    }
}
exports.mergeConditionAfterEncode = mergeConditionAfterEncode;
function isConversionRequired(val) {
    return type_1.isInternalObject(val) || type_1.isDate(val) || type_1.isRegExp(val);
}
exports.isConversionRequired = isConversionRequired;
function encodeInternalDataType(val) {
    return datatype_1.serialize(val);
}
exports.encodeInternalDataType = encodeInternalDataType;
function decodeInternalDataType(object) {
    return datatype_1.deserialize(object);
}
exports.decodeInternalDataType = decodeInternalDataType;

}, function(modId) { var map = {"../utils/type":1654780339005,"./datatype":1654780339021}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339021, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
const index_1 = require("../geo/index");
const index_2 = require("../serverDate/index");
function serialize(val) {
    return serializeHelper(val, [val]);
}
exports.serialize = serialize;
function serializeHelper(val, visited) {
    if (type_1.isInternalObject(val)) {
        switch (val._internalType) {
            case symbol_1.SYMBOL_GEO_POINT: {
                return val.toJSON();
            }
            case symbol_1.SYMBOL_SERVER_DATE: {
                return val.parse();
            }
            case symbol_1.SYMBOL_REGEXP: {
                return val.parse();
            }
            case symbol_1.SYMBOL_OBJECTID: {
                return val.parse();
            }
            default: {
                return val.toJSON ? val.toJSON() : val;
            }
        }
    }
    else if (type_1.isDate(val)) {
        return val;
    }
    else if (type_1.isRegExp(val)) {
        return {
            $regularExpression: {
                pattern: val.source,
                options: val.flags
            }
        };
    }
    else if (type_1.isArray(val)) {
        return val.map(item => {
            if (visited.indexOf(item) > -1) {
                throw new Error('Cannot convert circular structure to JSON');
            }
            return serializeHelper(item, [...visited, item]);
        });
    }
    else if (type_1.isObject(val)) {
        const rawRet = Object.assign({}, val);
        const finalRet = {};
        for (const key in rawRet) {
            if (visited.indexOf(rawRet[key]) > -1) {
                throw new Error('Cannot convert circular structure to JSON');
            }
            if (rawRet[key] !== undefined) {
                finalRet[key] = serializeHelper(rawRet[key], [...visited, rawRet[key]]);
            }
        }
        return finalRet;
    }
    else {
        return val;
    }
}
function deserialize(object) {
    const ret = Object.assign({}, object);
    for (const key in ret) {
        switch (key) {
            case '$date': {
                switch (type_1.getType(ret[key])) {
                    case 'number': {
                        return new Date(ret[key]);
                    }
                    case 'object': {
                        return new index_2.ServerDate(ret[key]);
                    }
                }
                break;
            }
            case 'type': {
                switch (ret.type) {
                    case 'Point': {
                        if (type_1.isArray(ret.coordinates) &&
                            type_1.isNumber(ret.coordinates[0]) &&
                            type_1.isNumber(ret.coordinates[1])) {
                            return new index_1.Point(ret.coordinates[0], ret.coordinates[1]);
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
    return object;
}
exports.deserialize = deserialize;

}, function(modId) { var map = {"../helper/symbol":1654780339007,"../utils/type":1654780339005,"../geo/index":1654780338998,"../serverDate/index":1654780339022}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339022, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
class ServerDate {
    constructor({ offset = 0 } = {}) {
        this.offset = offset;
    }
    get _internalType() {
        return symbol_1.SYMBOL_SERVER_DATE;
    }
    parse() {
        return {
            $tcb_server_date: {
                offset: this.offset
            }
        };
    }
}
exports.ServerDate = ServerDate;
function ServerDateConstructor(opt) {
    return new ServerDate(opt);
}
exports.ServerDateConstructor = ServerDateConstructor;

}, function(modId) { var map = {"../helper/symbol":1654780339007}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339023, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const virtual_websocket_client_1 = require("./virtual-websocket-client");
const utils_1 = require("../utils/utils");
const message_1 = require("./message");
const ws_event_1 = require("./ws-event");
const error_1 = require("../utils/error");
const error_2 = require("./error");
const error_config_1 = require("../config/error.config");
const __1 = require("../");
const WS_READY_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
};
const MAX_RTT_OBSERVED = 3;
const DEFAULT_EXPECTED_EVENT_WAIT_TIME = 5000;
const DEFAULT_UNTRUSTED_RTT_THRESHOLD = 10000;
const DEFAULT_MAX_RECONNECT = 5;
const DEFAULT_WS_RECONNECT_INTERVAL = 10000;
const DEFAULT_PING_FAIL_TOLERANCE = 2;
const DEFAULT_PONG_MISS_TOLERANCE = 2;
const DEFAULT_LOGIN_TIMEOUT = 5000;
class RealtimeWebSocketClient {
    constructor(options) {
        this._virtualWSClient = new Set();
        this._queryIdClientMap = new Map();
        this._watchIdClientMap = new Map();
        this._pingFailed = 0;
        this._pongMissed = 0;
        this._logins = new Map();
        this._wsReadySubsribers = [];
        this._wsResponseWait = new Map();
        this._rttObserved = [];
        this.initWebSocketConnection = async (reconnect, availableRetries = this._maxReconnect) => {
            if (reconnect && this._reconnectState) {
                return;
            }
            if (reconnect) {
                this._reconnectState = true;
            }
            if (this._wsInitPromise) {
                return this._wsInitPromise;
            }
            if (reconnect) {
                this.pauseClients();
            }
            this.close(ws_event_1.CLOSE_EVENT_CODE.ReconnectWebSocket);
            this._wsInitPromise = new Promise(async (resolve, reject) => {
                try {
                    const wsSign = await this.getWsSign();
                    await new Promise(success => {
                        const url = wsSign.wsUrl || 'wss://tcb-ws.tencentcloudapi.com';
                        this._ws = __1.Db.wsClass ? new __1.Db.wsClass(url) : new WebSocket(url);
                        success();
                    });
                    if (this._ws.connect) {
                        await this._ws.connect();
                    }
                    await this.initWebSocketEvent();
                    resolve();
                    if (reconnect) {
                        this.resumeClients();
                        this._reconnectState = false;
                    }
                }
                catch (e) {
                    console.error('[realtime] initWebSocketConnection connect fail', e);
                    if (availableRetries > 0) {
                        const isConnected = true;
                        this._wsInitPromise = undefined;
                        if (isConnected) {
                            await utils_1.sleep(this._reconnectInterval);
                            if (reconnect) {
                                this._reconnectState = false;
                            }
                        }
                        resolve(this.initWebSocketConnection(reconnect, availableRetries - 1));
                    }
                    else {
                        reject(e);
                        if (reconnect) {
                            this.closeAllClients(new error_1.CloudSDKError({
                                errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_RECONNECT_WATCH_FAIL,
                                errMsg: e
                            }));
                        }
                    }
                }
            });
            try {
                await this._wsInitPromise;
                this._wsReadySubsribers.forEach(({ resolve }) => resolve());
            }
            catch (e) {
                this._wsReadySubsribers.forEach(({ reject }) => reject());
            }
            finally {
                this._wsInitPromise = undefined;
                this._wsReadySubsribers = [];
            }
        };
        this.initWebSocketEvent = () => new Promise((resolve, reject) => {
            if (!this._ws) {
                throw new Error('can not initWebSocketEvent, ws not exists');
            }
            let wsOpened = false;
            this._ws.onopen = event => {
                console.warn('[realtime] ws event: open', event);
                wsOpened = true;
                resolve();
            };
            this._ws.onerror = event => {
                this._logins = new Map();
                if (!wsOpened) {
                    console.error('[realtime] ws open failed with ws event: error', event);
                    reject(event);
                }
                else {
                    console.error('[realtime] ws event: error', event);
                    this.clearHeartbeat();
                    this._virtualWSClient.forEach(client => client.closeWithError(new error_1.CloudSDKError({
                        errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_ERROR,
                        errMsg: event
                    })));
                }
            };
            this._ws.onclose = closeEvent => {
                console.warn('[realtime] ws event: close', closeEvent);
                this._logins = new Map();
                this.clearHeartbeat();
                switch (closeEvent.code) {
                    case ws_event_1.CLOSE_EVENT_CODE.ReconnectWebSocket: {
                        break;
                    }
                    case ws_event_1.CLOSE_EVENT_CODE.NoRealtimeListeners: {
                        break;
                    }
                    case ws_event_1.CLOSE_EVENT_CODE.HeartbeatPingError:
                    case ws_event_1.CLOSE_EVENT_CODE.HeartbeatPongTimeoutError:
                    case ws_event_1.CLOSE_EVENT_CODE.NormalClosure:
                    case ws_event_1.CLOSE_EVENT_CODE.AbnormalClosure: {
                        if (this._maxReconnect > 0) {
                            this.initWebSocketConnection(true, this._maxReconnect);
                        }
                        else {
                            this.closeAllClients(ws_event_1.getWSCloseError(closeEvent.code));
                        }
                        break;
                    }
                    case ws_event_1.CLOSE_EVENT_CODE.NoAuthentication: {
                        this.closeAllClients(ws_event_1.getWSCloseError(closeEvent.code, closeEvent.reason));
                        break;
                    }
                    default: {
                        if (this._maxReconnect > 0) {
                            this.initWebSocketConnection(true, this._maxReconnect);
                        }
                        else {
                            this.closeAllClients(ws_event_1.getWSCloseError(closeEvent.code));
                        }
                    }
                }
            };
            this._ws.onmessage = res => {
                const rawMsg = res.data;
                this.heartbeat();
                let msg;
                try {
                    msg = JSON.parse(rawMsg);
                }
                catch (e) {
                    throw new Error(`[realtime] onMessage parse res.data error: ${e}`);
                }
                if (msg.msgType === 'ERROR') {
                    let virtualWatch = null;
                    this._virtualWSClient.forEach(item => {
                        if (item.watchId === msg.watchId) {
                            virtualWatch = item;
                        }
                    });
                    if (virtualWatch) {
                        virtualWatch.listener.onError(msg);
                    }
                }
                const responseWaitSpec = this._wsResponseWait.get(msg.requestId);
                if (responseWaitSpec) {
                    try {
                        if (msg.msgType === 'ERROR') {
                            responseWaitSpec.reject(new error_2.RealtimeErrorMessageError(msg));
                        }
                        else {
                            responseWaitSpec.resolve(msg);
                        }
                    }
                    catch (e) {
                        console.error('ws onMessage responseWaitSpec.resolve(msg) errored:', e);
                    }
                    finally {
                        this._wsResponseWait.delete(msg.requestId);
                    }
                    if (responseWaitSpec.skipOnMessage) {
                        return;
                    }
                }
                if (msg.msgType === 'PONG') {
                    if (this._lastPingSendTS) {
                        const rtt = Date.now() - this._lastPingSendTS;
                        if (rtt > DEFAULT_UNTRUSTED_RTT_THRESHOLD) {
                            console.warn(`[realtime] untrusted rtt observed: ${rtt}`);
                            return;
                        }
                        if (this._rttObserved.length >= MAX_RTT_OBSERVED) {
                            this._rttObserved.splice(0, this._rttObserved.length - MAX_RTT_OBSERVED + 1);
                        }
                        this._rttObserved.push(rtt);
                    }
                    return;
                }
                let client = msg.watchId && this._watchIdClientMap.get(msg.watchId);
                if (client) {
                    client.onMessage(msg);
                }
                else {
                    console.error(`[realtime] no realtime listener found responsible for watchId ${msg.watchId}: `, msg);
                    switch (msg.msgType) {
                        case 'INIT_EVENT':
                        case 'NEXT_EVENT':
                        case 'CHECK_EVENT': {
                            client = this._queryIdClientMap.get(msg.msgData.queryID);
                            if (client) {
                                client.onMessage(msg);
                            }
                            break;
                        }
                        default: {
                            for (const [, client] of this._watchIdClientMap) {
                                client.onMessage(msg);
                                break;
                            }
                        }
                    }
                }
            };
            this.heartbeat();
        });
        this.isWSConnected = () => {
            return Boolean(this._ws && this._ws.readyState === WS_READY_STATE.OPEN);
        };
        this.onceWSConnected = async () => {
            if (this.isWSConnected()) {
                return;
            }
            if (this._wsInitPromise) {
                return this._wsInitPromise;
            }
            return new Promise((resolve, reject) => {
                this._wsReadySubsribers.push({
                    resolve,
                    reject
                });
            });
        };
        this.webLogin = async (envId, refresh) => {
            if (!refresh) {
                if (envId) {
                    const loginInfo = this._logins.get(envId);
                    if (loginInfo) {
                        if (loginInfo.loggedIn && loginInfo.loginResult) {
                            return loginInfo.loginResult;
                        }
                        else if (loginInfo.loggingInPromise) {
                            return loginInfo.loggingInPromise;
                        }
                    }
                }
                else {
                    const emptyEnvLoginInfo = this._logins.get('');
                    if (emptyEnvLoginInfo && emptyEnvLoginInfo.loggingInPromise) {
                        return emptyEnvLoginInfo.loggingInPromise;
                    }
                }
            }
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const wsSign = await this.getWsSign();
                    const msgData = {
                        envId: wsSign.envId || '',
                        accessToken: '',
                        referrer: 'web',
                        sdkVersion: '',
                        dataVersion: __1.Db.dataVersion || ''
                    };
                    const loginMsg = {
                        watchId: undefined,
                        requestId: message_1.genRequestId(),
                        msgType: 'LOGIN',
                        msgData,
                        exMsgData: {
                            runtime: __1.Db.runtime,
                            signStr: wsSign.signStr,
                            secretVersion: wsSign.secretVersion
                        }
                    };
                    const loginResMsg = await this.send({
                        msg: loginMsg,
                        waitResponse: true,
                        skipOnMessage: true,
                        timeout: DEFAULT_LOGIN_TIMEOUT
                    });
                    if (!loginResMsg.msgData.code) {
                        resolve({
                            envId: wsSign.envId
                        });
                    }
                    else {
                        reject(new Error(`${loginResMsg.msgData.code} ${loginResMsg.msgData.message}`));
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
            let loginInfo = envId && this._logins.get(envId);
            const loginStartTS = Date.now();
            if (loginInfo) {
                loginInfo.loggedIn = false;
                loginInfo.loggingInPromise = promise;
                loginInfo.loginStartTS = loginStartTS;
            }
            else {
                loginInfo = {
                    loggedIn: false,
                    loggingInPromise: promise,
                    loginStartTS
                };
                this._logins.set(envId || '', loginInfo);
            }
            try {
                const loginResult = await promise;
                const curLoginInfo = envId && this._logins.get(envId);
                if (curLoginInfo &&
                    curLoginInfo === loginInfo &&
                    curLoginInfo.loginStartTS === loginStartTS) {
                    loginInfo.loggedIn = true;
                    loginInfo.loggingInPromise = undefined;
                    loginInfo.loginStartTS = undefined;
                    loginInfo.loginResult = loginResult;
                    return loginResult;
                }
                else if (curLoginInfo) {
                    if (curLoginInfo.loggedIn && curLoginInfo.loginResult) {
                        return curLoginInfo.loginResult;
                    }
                    else if (curLoginInfo.loggingInPromise) {
                        return curLoginInfo.loggingInPromise;
                    }
                    else {
                        throw new Error('ws unexpected login info');
                    }
                }
                else {
                    throw new Error('ws login info reset');
                }
            }
            catch (e) {
                loginInfo.loggedIn = false;
                loginInfo.loggingInPromise = undefined;
                loginInfo.loginStartTS = undefined;
                loginInfo.loginResult = undefined;
                throw e;
            }
        };
        this.getWsSign = async () => {
            if (this._wsSign && this._wsSign.expiredTs > Date.now()) {
                return this._wsSign;
            }
            const expiredTs = Date.now() + 60000;
            const res = await this._context.appConfig.request.send('auth.wsWebSign', { runtime: __1.Db.runtime });
            if (res.code) {
                throw new Error(`[tcb-js-sdk] 获取实时数据推送登录票据失败: ${res.code}`);
            }
            if (res.data) {
                const { signStr, wsUrl, secretVersion, envId } = res.data;
                return {
                    signStr,
                    wsUrl,
                    secretVersion,
                    envId,
                    expiredTs
                };
            }
            else {
                throw new Error('[tcb-js-sdk] 获取实时数据推送登录票据失败');
            }
        };
        this.getWaitExpectedTimeoutLength = () => {
            if (!this._rttObserved.length) {
                return DEFAULT_EXPECTED_EVENT_WAIT_TIME;
            }
            return ((this._rttObserved.reduce((acc, cur) => acc + cur) /
                this._rttObserved.length) *
                1.5);
        };
        this.ping = async () => {
            const msg = {
                watchId: undefined,
                requestId: message_1.genRequestId(),
                msgType: 'PING',
                msgData: null
            };
            await this.send({
                msg
            });
        };
        this.send = async (opts) => new Promise(async (_resolve, _reject) => {
            let timeoutId;
            let _hasResolved = false;
            let _hasRejected = false;
            const resolve = (value) => {
                _hasResolved = true;
                timeoutId && clearTimeout(timeoutId);
                _resolve(value);
            };
            const reject = (error) => {
                _hasRejected = true;
                timeoutId && clearTimeout(timeoutId);
                _reject(error);
            };
            if (opts.timeout) {
                timeoutId = setTimeout(async () => {
                    if (!_hasResolved || !_hasRejected) {
                        await utils_1.sleep(0);
                        if (!_hasResolved || !_hasRejected) {
                            reject(new error_1.TimeoutError('wsclient.send timedout'));
                        }
                    }
                }, opts.timeout);
            }
            try {
                if (this._wsInitPromise) {
                    await this._wsInitPromise;
                }
                if (!this._ws) {
                    reject(new Error('invalid state: ws connection not exists, can not send message'));
                    return;
                }
                if (this._ws.readyState !== WS_READY_STATE.OPEN) {
                    reject(new Error(`ws readyState invalid: ${this._ws.readyState}, can not send message`));
                    return;
                }
                if (opts.waitResponse) {
                    this._wsResponseWait.set(opts.msg.requestId, {
                        resolve,
                        reject,
                        skipOnMessage: opts.skipOnMessage
                    });
                }
                try {
                    await this._ws.send(JSON.stringify(opts.msg));
                    if (!opts.waitResponse) {
                        resolve();
                    }
                }
                catch (err) {
                    if (err) {
                        reject(err);
                        if (opts.waitResponse) {
                            this._wsResponseWait.delete(opts.msg.requestId);
                        }
                    }
                }
            }
            catch (e) {
                reject(e);
            }
        });
        this.closeAllClients = (error) => {
            this._virtualWSClient.forEach(client => {
                client.closeWithError(error);
            });
        };
        this.pauseClients = (clients) => {
            ;
            (clients || this._virtualWSClient).forEach(client => {
                client.pause();
            });
        };
        this.resumeClients = (clients) => {
            ;
            (clients || this._virtualWSClient).forEach(client => {
                client.resume();
            });
        };
        this.onWatchStart = (client, queryID) => {
            this._queryIdClientMap.set(queryID, client);
        };
        this.onWatchClose = (client, queryID) => {
            if (queryID) {
                this._queryIdClientMap.delete(queryID);
            }
            this._watchIdClientMap.delete(client.watchId);
            this._virtualWSClient.delete(client);
            if (!this._virtualWSClient.size) {
                this.close(ws_event_1.CLOSE_EVENT_CODE.NoRealtimeListeners);
            }
        };
        this._maxReconnect = options.maxReconnect || DEFAULT_MAX_RECONNECT;
        this._reconnectInterval =
            options.reconnectInterval || DEFAULT_WS_RECONNECT_INTERVAL;
        this._context = options.context;
    }
    heartbeat(immediate) {
        this.clearHeartbeat();
        this._pingTimeoutId = setTimeout(async () => {
            try {
                if (!this._ws || this._ws.readyState !== WS_READY_STATE.OPEN) {
                    return;
                }
                this._lastPingSendTS = Date.now();
                await this.ping();
                this._pingFailed = 0;
                this._pongTimeoutId = setTimeout(() => {
                    console.error('pong timed out');
                    if (this._pongMissed < DEFAULT_PONG_MISS_TOLERANCE) {
                        this._pongMissed++;
                        this.heartbeat(true);
                    }
                    else {
                        this.initWebSocketConnection(true);
                    }
                }, this._context.appConfig.realtimePongWaitTimeout);
            }
            catch (e) {
                if (this._pingFailed < DEFAULT_PING_FAIL_TOLERANCE) {
                    this._pingFailed++;
                    this.heartbeat();
                }
                else {
                    this.close(ws_event_1.CLOSE_EVENT_CODE.HeartbeatPingError);
                }
            }
        }, immediate ? 0 : this._context.appConfig.realtimePingInterval);
    }
    clearHeartbeat() {
        this._pingTimeoutId && clearTimeout(this._pingTimeoutId);
        this._pongTimeoutId && clearTimeout(this._pongTimeoutId);
    }
    close(code) {
        this.clearHeartbeat();
        if (this._ws) {
            this._ws.close(code, ws_event_1.CLOSE_EVENT_CODE_INFO[code].name);
            this._ws = undefined;
        }
    }
    watch(options) {
        if (!this._ws && !this._wsInitPromise) {
            this.initWebSocketConnection(false);
        }
        const virtualClient = new virtual_websocket_client_1.VirtualWebSocketClient(Object.assign(Object.assign({}, options), { send: this.send, login: this.webLogin, isWSConnected: this.isWSConnected, onceWSConnected: this.onceWSConnected, getWaitExpectedTimeoutLength: this.getWaitExpectedTimeoutLength, onWatchStart: this.onWatchStart, onWatchClose: this.onWatchClose, debug: true }));
        this._virtualWSClient.add(virtualClient);
        this._watchIdClientMap.set(virtualClient.watchId, virtualClient);
        return virtualClient.listener;
    }
}
exports.RealtimeWebSocketClient = RealtimeWebSocketClient;

}, function(modId) { var map = {"./virtual-websocket-client":1654780339024,"../utils/utils":1654780339004,"./message":1654780339025,"./ws-event":1654780339031,"../utils/error":1654780339026,"./error":1654780339030,"../config/error.config":1654780339027,"../":1654780338997}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339024, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const lodash_set_1 = require("lodash.set");
const lodash_unset_1 = require("lodash.unset");
const lodash_clonedeep_1 = require("lodash.clonedeep");
const message_1 = require("./message");
const error_1 = require("../utils/error");
const error_config_1 = require("../config/error.config");
const utils_1 = require("../utils/utils");
const listener_1 = require("./listener");
const snapshot_1 = require("./snapshot");
const error_2 = require("./error");
var WATCH_STATUS;
(function (WATCH_STATUS) {
    WATCH_STATUS["LOGGINGIN"] = "LOGGINGIN";
    WATCH_STATUS["INITING"] = "INITING";
    WATCH_STATUS["REBUILDING"] = "REBUILDING";
    WATCH_STATUS["ACTIVE"] = "ACTIVE";
    WATCH_STATUS["ERRORED"] = "ERRORED";
    WATCH_STATUS["CLOSING"] = "CLOSING";
    WATCH_STATUS["CLOSED"] = "CLOSED";
    WATCH_STATUS["PAUSED"] = "PAUSED";
    WATCH_STATUS["RESUMING"] = "RESUMING";
})(WATCH_STATUS || (WATCH_STATUS = {}));
const DEFAULT_WAIT_TIME_ON_UNKNOWN_ERROR = 100;
const DEFAULT_MAX_AUTO_RETRY_ON_ERROR = 2;
const DEFAULT_MAX_SEND_ACK_AUTO_RETRY_ON_ERROR = 2;
const DEFAULT_SEND_ACK_DEBOUNCE_TIMEOUT = 10 * 1000;
const DEFAULT_INIT_WATCH_TIMEOUT = 10 * 1000;
const DEFAULT_REBUILD_WATCH_TIMEOUT = 10 * 1000;
class VirtualWebSocketClient {
    constructor(options) {
        this.watchStatus = WATCH_STATUS.INITING;
        this._login = async (envId, refresh) => {
            this.watchStatus = WATCH_STATUS.LOGGINGIN;
            const loginResult = await this.login(envId, refresh);
            if (!this.envId) {
                this.envId = loginResult.envId;
            }
            return loginResult;
        };
        this.initWatch = async (forceRefreshLogin) => {
            if (this._initWatchPromise) {
                return this._initWatchPromise;
            }
            this._initWatchPromise = new Promise(async (resolve, reject) => {
                try {
                    if (this.watchStatus === WATCH_STATUS.PAUSED) {
                        console.log('[realtime] initWatch cancelled on pause');
                        return resolve();
                    }
                    const { envId } = await this._login(this.envId, forceRefreshLogin);
                    if (this.watchStatus === WATCH_STATUS.PAUSED) {
                        console.log('[realtime] initWatch cancelled on pause');
                        return resolve();
                    }
                    this.watchStatus = WATCH_STATUS.INITING;
                    const initWatchMsg = {
                        watchId: this.watchId,
                        requestId: message_1.genRequestId(),
                        msgType: 'INIT_WATCH',
                        msgData: {
                            envId,
                            collName: this.collectionName,
                            query: this.query,
                            limit: this.limit,
                            orderBy: this.orderBy
                        }
                    };
                    const initEventMsg = await this.send({
                        msg: initWatchMsg,
                        waitResponse: true,
                        skipOnMessage: true,
                        timeout: DEFAULT_INIT_WATCH_TIMEOUT
                    });
                    const { events, currEvent } = initEventMsg.msgData;
                    this.sessionInfo = {
                        queryID: initEventMsg.msgData.queryID,
                        currentEventId: currEvent - 1,
                        currentDocs: []
                    };
                    if (events.length > 0) {
                        for (const e of events) {
                            e.ID = currEvent;
                        }
                        this.handleServerEvents(initEventMsg);
                    }
                    else {
                        this.sessionInfo.currentEventId = currEvent;
                        const snapshot = new snapshot_1.Snapshot({
                            id: currEvent,
                            docChanges: [],
                            docs: [],
                            type: 'init'
                        });
                        this.listener.onChange(snapshot);
                        this.scheduleSendACK();
                    }
                    this.onWatchStart(this, this.sessionInfo.queryID);
                    this.watchStatus = WATCH_STATUS.ACTIVE;
                    this._availableRetries.INIT_WATCH = DEFAULT_MAX_AUTO_RETRY_ON_ERROR;
                    resolve();
                }
                catch (e) {
                    this.handleWatchEstablishmentError(e, {
                        operationName: 'INIT_WATCH',
                        resolve,
                        reject
                    });
                }
            });
            let success = false;
            try {
                await this._initWatchPromise;
                success = true;
            }
            finally {
                this._initWatchPromise = undefined;
            }
            console.log(`[realtime] initWatch ${success ? 'success' : 'fail'}`);
        };
        this.rebuildWatch = async (forceRefreshLogin) => {
            if (this._rebuildWatchPromise) {
                return this._rebuildWatchPromise;
            }
            this._rebuildWatchPromise = new Promise(async (resolve, reject) => {
                try {
                    if (this.watchStatus === WATCH_STATUS.PAUSED) {
                        console.log('[realtime] rebuildWatch cancelled on pause');
                        return resolve();
                    }
                    const { envId } = await this._login(this.envId, forceRefreshLogin);
                    if (!this.sessionInfo) {
                        throw new Error('can not rebuildWatch without a successful initWatch (lack of sessionInfo)');
                    }
                    if (this.watchStatus === WATCH_STATUS.PAUSED) {
                        console.log('[realtime] rebuildWatch cancelled on pause');
                        return resolve();
                    }
                    this.watchStatus = WATCH_STATUS.REBUILDING;
                    const rebuildWatchMsg = {
                        watchId: this.watchId,
                        requestId: message_1.genRequestId(),
                        msgType: 'REBUILD_WATCH',
                        msgData: {
                            envId,
                            collName: this.collectionName,
                            queryID: this.sessionInfo.queryID,
                            eventID: this.sessionInfo.currentEventId
                        }
                    };
                    const nextEventMsg = await this.send({
                        msg: rebuildWatchMsg,
                        waitResponse: true,
                        skipOnMessage: false,
                        timeout: DEFAULT_REBUILD_WATCH_TIMEOUT
                    });
                    this.handleServerEvents(nextEventMsg);
                    this.watchStatus = WATCH_STATUS.ACTIVE;
                    this._availableRetries.REBUILD_WATCH = DEFAULT_MAX_AUTO_RETRY_ON_ERROR;
                    resolve();
                }
                catch (e) {
                    this.handleWatchEstablishmentError(e, {
                        operationName: 'REBUILD_WATCH',
                        resolve,
                        reject
                    });
                }
            });
            let success = false;
            try {
                await this._rebuildWatchPromise;
                success = true;
            }
            finally {
                this._rebuildWatchPromise = undefined;
            }
            console.log(`[realtime] rebuildWatch ${success ? 'success' : 'fail'}`);
        };
        this.handleWatchEstablishmentError = async (e, options) => {
            const isInitWatch = options.operationName === 'INIT_WATCH';
            const abortWatch = () => {
                this.closeWithError(new error_1.CloudSDKError({
                    errCode: isInitWatch
                        ? error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_INIT_WATCH_FAIL
                        : error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_REBUILD_WATCH_FAIL,
                    errMsg: e
                }));
                options.reject(e);
            };
            const retry = (refreshLogin) => {
                if (this.useRetryTicket(options.operationName)) {
                    if (isInitWatch) {
                        this._initWatchPromise = undefined;
                        options.resolve(this.initWatch(refreshLogin));
                    }
                    else {
                        this._rebuildWatchPromise = undefined;
                        options.resolve(this.rebuildWatch(refreshLogin));
                    }
                }
                else {
                    abortWatch();
                }
            };
            this.handleCommonError(e, {
                onSignError: () => retry(true),
                onTimeoutError: () => retry(false),
                onNotRetryableError: abortWatch,
                onCancelledError: options.reject,
                onUnknownError: async () => {
                    try {
                        const onWSDisconnected = async () => {
                            this.pause();
                            await this.onceWSConnected();
                            retry(true);
                        };
                        if (!this.isWSConnected()) {
                            await onWSDisconnected();
                        }
                        else {
                            await utils_1.sleep(DEFAULT_WAIT_TIME_ON_UNKNOWN_ERROR);
                            if (this.watchStatus === WATCH_STATUS.PAUSED) {
                                options.reject(new error_1.CancelledError(`${options.operationName} cancelled due to pause after unknownError`));
                            }
                            else if (!this.isWSConnected()) {
                                await onWSDisconnected();
                            }
                            else {
                                retry(false);
                            }
                        }
                    }
                    catch (e) {
                        retry(true);
                    }
                }
            });
        };
        this.closeWatch = async () => {
            const queryId = this.sessionInfo ? this.sessionInfo.queryID : '';
            if (this.watchStatus !== WATCH_STATUS.ACTIVE) {
                this.watchStatus = WATCH_STATUS.CLOSED;
                this.onWatchClose(this, queryId);
                return;
            }
            try {
                this.watchStatus = WATCH_STATUS.CLOSING;
                const closeWatchMsg = {
                    watchId: this.watchId,
                    requestId: message_1.genRequestId(),
                    msgType: 'CLOSE_WATCH',
                    msgData: null
                };
                await this.send({
                    msg: closeWatchMsg
                });
                this.sessionInfo = undefined;
                this.watchStatus = WATCH_STATUS.CLOSED;
            }
            catch (e) {
                this.closeWithError(new error_1.CloudSDKError({
                    errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_CLOSE_WATCH_FAIL,
                    errMsg: e
                }));
            }
            finally {
                this.onWatchClose(this, queryId);
            }
        };
        this.scheduleSendACK = () => {
            this.clearACKSchedule();
            this._ackTimeoutId = setTimeout(() => {
                if (this._waitExpectedTimeoutId) {
                    this.scheduleSendACK();
                }
                else {
                    this.sendACK();
                }
            }, DEFAULT_SEND_ACK_DEBOUNCE_TIMEOUT);
        };
        this.clearACKSchedule = () => {
            if (this._ackTimeoutId) {
                clearTimeout(this._ackTimeoutId);
            }
        };
        this.sendACK = async () => {
            try {
                if (this.watchStatus !== WATCH_STATUS.ACTIVE) {
                    this.scheduleSendACK();
                    return;
                }
                if (!this.sessionInfo) {
                    console.warn('[realtime listener] can not send ack without a successful initWatch (lack of sessionInfo)');
                    return;
                }
                const ackMsg = {
                    watchId: this.watchId,
                    requestId: message_1.genRequestId(),
                    msgType: 'CHECK_LAST',
                    msgData: {
                        queryID: this.sessionInfo.queryID,
                        eventID: this.sessionInfo.currentEventId
                    }
                };
                await this.send({
                    msg: ackMsg
                });
                this.scheduleSendACK();
            }
            catch (e) {
                if (error_2.isRealtimeErrorMessageError(e)) {
                    const msg = e.payload;
                    switch (msg.msgData.code) {
                        case 'CHECK_LOGIN_FAILED':
                        case 'SIGN_EXPIRED_ERROR':
                        case 'SIGN_INVALID_ERROR':
                        case 'SIGN_PARAM_INVALID': {
                            this.rebuildWatch();
                            return;
                        }
                        case 'QUERYID_INVALID_ERROR':
                        case 'SYS_ERR':
                        case 'INVALIID_ENV':
                        case 'COLLECTION_PERMISSION_DENIED': {
                            this.closeWithError(new error_1.CloudSDKError({
                                errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_CHECK_LAST_FAIL,
                                errMsg: msg.msgData.code
                            }));
                            return;
                        }
                        default: {
                            break;
                        }
                    }
                }
                if (this._availableRetries.CHECK_LAST &&
                    this._availableRetries.CHECK_LAST > 0) {
                    this._availableRetries.CHECK_LAST--;
                    this.scheduleSendACK();
                }
                else {
                    this.closeWithError(new error_1.CloudSDKError({
                        errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_CHECK_LAST_FAIL,
                        errMsg: e
                    }));
                }
            }
        };
        this.handleCommonError = (e, options) => {
            if (error_2.isRealtimeErrorMessageError(e)) {
                const msg = e.payload;
                switch (msg.msgData.code) {
                    case 'CHECK_LOGIN_FAILED':
                    case 'SIGN_EXPIRED_ERROR':
                    case 'SIGN_INVALID_ERROR':
                    case 'SIGN_PARAM_INVALID': {
                        options.onSignError(e);
                        return;
                    }
                    case 'QUERYID_INVALID_ERROR':
                    case 'SYS_ERR':
                    case 'INVALIID_ENV':
                    case 'COLLECTION_PERMISSION_DENIED': {
                        options.onNotRetryableError(e);
                        return;
                    }
                    default: {
                        options.onNotRetryableError(e);
                        return;
                    }
                }
            }
            else if (error_1.isTimeoutError(e)) {
                options.onTimeoutError(e);
                return;
            }
            else if (error_1.isCancelledError(e)) {
                options.onCancelledError(e);
                return;
            }
            options.onUnknownError(e);
        };
        this.watchId = `watchid_${+new Date()}_${Math.random()}`;
        this.envId = options.envId;
        this.collectionName = options.collectionName;
        this.query = options.query;
        this.limit = options.limit;
        this.orderBy = options.orderBy;
        this.send = options.send;
        this.login = options.login;
        this.isWSConnected = options.isWSConnected;
        this.onceWSConnected = options.onceWSConnected;
        this.getWaitExpectedTimeoutLength = options.getWaitExpectedTimeoutLength;
        this.onWatchStart = options.onWatchStart;
        this.onWatchClose = options.onWatchClose;
        this.debug = options.debug;
        this._availableRetries = {
            INIT_WATCH: DEFAULT_MAX_AUTO_RETRY_ON_ERROR,
            REBUILD_WATCH: DEFAULT_MAX_AUTO_RETRY_ON_ERROR,
            CHECK_LAST: DEFAULT_MAX_SEND_ACK_AUTO_RETRY_ON_ERROR
        };
        this.listener = new listener_1.RealtimeListener({
            close: this.closeWatch,
            onChange: options.onChange,
            onError: options.onError,
            debug: this.debug,
            virtualClient: this
        });
        this.initWatch();
    }
    useRetryTicket(operationName) {
        if (this._availableRetries[operationName] &&
            this._availableRetries[operationName] > 0) {
            this._availableRetries[operationName]--;
            console.log(`[realtime] ${operationName} use a retry ticket, now only ${this._availableRetries[operationName]} retry left`);
            return true;
        }
        return false;
    }
    async handleServerEvents(msg) {
        try {
            this.scheduleSendACK();
            await this._handleServerEvents(msg);
            this._postHandleServerEventsValidityCheck(msg);
        }
        catch (e) {
            console.error('[realtime listener] internal non-fatal error: handle server events failed with error: ', e);
            throw e;
        }
    }
    async _handleServerEvents(msg) {
        const { requestId } = msg;
        const { events } = msg.msgData;
        const { msgType } = msg;
        if (!events.length || !this.sessionInfo) {
            return;
        }
        const sessionInfo = this.sessionInfo;
        let allChangeEvents;
        try {
            allChangeEvents = events.map(getPublicEvent);
        }
        catch (e) {
            this.closeWithError(new error_1.CloudSDKError({
                errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_RECEIVE_INVALID_SERVER_DATA,
                errMsg: e
            }));
            return;
        }
        let docs = [...sessionInfo.currentDocs];
        let initEncountered = false;
        for (let i = 0, len = allChangeEvents.length; i < len; i++) {
            const change = allChangeEvents[i];
            if (sessionInfo.currentEventId >= change.id) {
                if (!allChangeEvents[i - 1] || change.id > allChangeEvents[i - 1].id) {
                    console.warn(`[realtime] duplicate event received, cur ${sessionInfo.currentEventId} but got ${change.id}`);
                }
                else {
                    console.error(`[realtime listener] server non-fatal error: events out of order (the latter event's id is smaller than that of the former) (requestId ${requestId})`);
                }
                continue;
            }
            else if (sessionInfo.currentEventId === change.id - 1) {
                switch (change.dataType) {
                    case 'update': {
                        if (!change.doc) {
                            switch (change.queueType) {
                                case 'update':
                                case 'dequeue': {
                                    const localDoc = docs.find(doc => doc._id === change.docId);
                                    if (localDoc) {
                                        const doc = lodash_clonedeep_1.default(localDoc);
                                        if (change.updatedFields) {
                                            for (const fieldPath in change.updatedFields) {
                                                lodash_set_1.default(doc, fieldPath, change.updatedFields[fieldPath]);
                                            }
                                        }
                                        if (change.removedFields) {
                                            for (const fieldPath of change.removedFields) {
                                                lodash_unset_1.default(doc, fieldPath);
                                            }
                                        }
                                        change.doc = doc;
                                    }
                                    else {
                                        console.error('[realtime listener] internal non-fatal server error: unexpected update dataType event where no doc is associated.');
                                    }
                                    break;
                                }
                                case 'enqueue': {
                                    const err = new error_1.CloudSDKError({
                                        errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_UNEXPECTED_FATAL_ERROR,
                                        errMsg: `HandleServerEvents: full doc is not provided with dataType="update" and queueType="enqueue" (requestId ${msg.requestId})`
                                    });
                                    this.closeWithError(err);
                                    throw err;
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                        break;
                    }
                    case 'replace': {
                        if (!change.doc) {
                            const err = new error_1.CloudSDKError({
                                errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_UNEXPECTED_FATAL_ERROR,
                                errMsg: `HandleServerEvents: full doc is not provided with dataType="replace" (requestId ${msg.requestId})`
                            });
                            this.closeWithError(err);
                            throw err;
                        }
                        break;
                    }
                    case 'remove': {
                        const doc = docs.find(doc => doc._id === change.docId);
                        if (doc) {
                            change.doc = doc;
                        }
                        else {
                            console.error('[realtime listener] internal non-fatal server error: unexpected remove event where no doc is associated.');
                        }
                        break;
                    }
                    case 'limit': {
                        if (!change.doc) {
                            switch (change.queueType) {
                                case 'dequeue': {
                                    const doc = docs.find(doc => doc._id === change.docId);
                                    if (doc) {
                                        change.doc = doc;
                                    }
                                    else {
                                        console.error('[realtime listener] internal non-fatal server error: unexpected limit dataType event where no doc is associated.');
                                    }
                                    break;
                                }
                                case 'enqueue': {
                                    const err = new error_1.CloudSDKError({
                                        errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_UNEXPECTED_FATAL_ERROR,
                                        errMsg: `HandleServerEvents: full doc is not provided with dataType="limit" and queueType="enqueue" (requestId ${msg.requestId})`
                                    });
                                    this.closeWithError(err);
                                    throw err;
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
                switch (change.queueType) {
                    case 'init': {
                        if (!initEncountered) {
                            initEncountered = true;
                            docs = [change.doc];
                        }
                        else {
                            docs.push(change.doc);
                        }
                        break;
                    }
                    case 'enqueue': {
                        docs.push(change.doc);
                        break;
                    }
                    case 'dequeue': {
                        const ind = docs.findIndex(doc => doc._id === change.docId);
                        if (ind > -1) {
                            docs.splice(ind, 1);
                        }
                        else {
                            console.error('[realtime listener] internal non-fatal server error: unexpected dequeue event where no doc is associated.');
                        }
                        break;
                    }
                    case 'update': {
                        const ind = docs.findIndex(doc => doc._id === change.docId);
                        if (ind > -1) {
                            docs[ind] = change.doc;
                        }
                        else {
                            console.error('[realtime listener] internal non-fatal server error: unexpected queueType update event where no doc is associated.');
                        }
                        break;
                    }
                }
                if (i === len - 1 ||
                    (allChangeEvents[i + 1] && allChangeEvents[i + 1].id !== change.id)) {
                    const docsSnapshot = [...docs];
                    const docChanges = allChangeEvents
                        .slice(0, i + 1)
                        .filter(c => c.id === change.id);
                    this.sessionInfo.currentEventId = change.id;
                    this.sessionInfo.currentDocs = docs;
                    const snapshot = new snapshot_1.Snapshot({
                        id: change.id,
                        docChanges,
                        docs: docsSnapshot,
                        msgType
                    });
                    this.listener.onChange(snapshot);
                }
            }
            else {
                console.warn(`[realtime listener] event received is out of order, cur ${this.sessionInfo.currentEventId} but got ${change.id}`);
                await this.rebuildWatch();
                return;
            }
        }
    }
    _postHandleServerEventsValidityCheck(msg) {
        if (!this.sessionInfo) {
            console.error('[realtime listener] internal non-fatal error: sessionInfo lost after server event handling, this should never occur');
            return;
        }
        if (this.sessionInfo.expectEventId &&
            this.sessionInfo.currentEventId >= this.sessionInfo.expectEventId) {
            this.clearWaitExpectedEvent();
        }
        if (this.sessionInfo.currentEventId < msg.msgData.currEvent) {
            console.warn('[realtime listener] internal non-fatal error: client eventId does not match with server event id after server event handling');
            return;
        }
    }
    clearWaitExpectedEvent() {
        if (this._waitExpectedTimeoutId) {
            clearTimeout(this._waitExpectedTimeoutId);
            this._waitExpectedTimeoutId = undefined;
        }
    }
    onMessage(msg) {
        switch (this.watchStatus) {
            case WATCH_STATUS.PAUSED: {
                if (msg.msgType !== 'ERROR') {
                    return;
                }
                break;
            }
            case WATCH_STATUS.LOGGINGIN:
            case WATCH_STATUS.INITING:
            case WATCH_STATUS.REBUILDING: {
                console.warn(`[realtime listener] internal non-fatal error: unexpected message received while ${this.watchStatus}`);
                return;
            }
            case WATCH_STATUS.CLOSED: {
                console.warn('[realtime listener] internal non-fatal error: unexpected message received when the watch has closed');
                return;
            }
            case WATCH_STATUS.ERRORED: {
                console.warn('[realtime listener] internal non-fatal error: unexpected message received when the watch has ended with error');
                return;
            }
        }
        if (!this.sessionInfo) {
            console.warn('[realtime listener] internal non-fatal error: sessionInfo not found while message is received.');
            return;
        }
        this.scheduleSendACK();
        switch (msg.msgType) {
            case 'NEXT_EVENT': {
                console.warn(`nextevent ${msg.msgData.currEvent} ignored`, msg);
                this.handleServerEvents(msg);
                break;
            }
            case 'CHECK_EVENT': {
                if (this.sessionInfo.currentEventId < msg.msgData.currEvent) {
                    this.sessionInfo.expectEventId = msg.msgData.currEvent;
                    this.clearWaitExpectedEvent();
                    this._waitExpectedTimeoutId = setTimeout(() => {
                        this.rebuildWatch();
                    }, this.getWaitExpectedTimeoutLength());
                    console.log(`[realtime] waitExpectedTimeoutLength ${this.getWaitExpectedTimeoutLength()}`);
                }
                break;
            }
            case 'ERROR': {
                this.closeWithError(new error_1.CloudSDKError({
                    errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_SERVER_ERROR_MSG,
                    errMsg: `${msg.msgData.code} - ${msg.msgData.message}`
                }));
                break;
            }
            default: {
                console.warn(`[realtime listener] virtual client receive unexpected msg ${msg.msgType}: `, msg);
                break;
            }
        }
    }
    closeWithError(error) {
        this.watchStatus = WATCH_STATUS.ERRORED;
        this.clearACKSchedule();
        this.listener.onError(error);
        this.onWatchClose(this, (this.sessionInfo && this.sessionInfo.queryID) || '');
        console.log(`[realtime] client closed (${this.collectionName} ${this.query}) (watchId ${this.watchId})`);
    }
    pause() {
        this.watchStatus = WATCH_STATUS.PAUSED;
        console.log(`[realtime] client paused (${this.collectionName} ${this.query}) (watchId ${this.watchId})`);
    }
    async resume() {
        this.watchStatus = WATCH_STATUS.RESUMING;
        console.log(`[realtime] client resuming with ${this.sessionInfo ? 'REBUILD_WATCH' : 'INIT_WATCH'} (${this.collectionName} ${this.query}) (${this.watchId})`);
        try {
            await (this.sessionInfo ? this.rebuildWatch() : this.initWatch());
            console.log(`[realtime] client successfully resumed (${this.collectionName} ${this.query}) (${this.watchId})`);
        }
        catch (e) {
            console.error(`[realtime] client resume failed (${this.collectionName} ${this.query}) (${this.watchId})`, e);
        }
    }
}
exports.VirtualWebSocketClient = VirtualWebSocketClient;
function getPublicEvent(event) {
    const e = {
        id: event.ID,
        dataType: event.DataType,
        queueType: event.QueueType,
        docId: event.DocID,
        doc: event.Doc && event.Doc !== '{}' ? JSON.parse(event.Doc) : undefined
    };
    if (event.DataType === 'update') {
        if (event.UpdatedFields) {
            e.updatedFields = JSON.parse(event.UpdatedFields);
        }
        if (event.removedFields || event.RemovedFields) {
            e.removedFields = JSON.parse(event.removedFields);
        }
    }
    return e;
}

}, function(modId) { var map = {"./message":1654780339025,"../utils/error":1654780339026,"../config/error.config":1654780339027,"../utils/utils":1654780339004,"./listener":1654780339028,"./snapshot":1654780339029,"./error":1654780339030}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339025, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
function genRequestId(prefix = '') {
    return `${prefix ? `${prefix}_` : ''}${+new Date()}_${Math.random()}`;
}
exports.genRequestId = genRequestId;
function isInitEventMessage(msg) {
    return msg.msgType === 'INIT_EVENT';
}
exports.isInitEventMessage = isInitEventMessage;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339026, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("./type");
const error_config_1 = require("../config/error.config");
class CloudSDKError extends Error {
    constructor(options) {
        super(options.errMsg);
        this.errCode = 'UNKNOWN_ERROR';
        Object.defineProperties(this, {
            message: {
                get() {
                    return (`errCode: ${this.errCode} ${error_config_1.ERR_CODE[this.errCode] ||
                        ''} | errMsg: ` + this.errMsg);
                },
                set(msg) {
                    this.errMsg = msg;
                }
            }
        });
        this.errCode = options.errCode || 'UNKNOWN_ERROR';
        this.errMsg = options.errMsg;
    }
    get message() {
        return `errCode: ${this.errCode} | errMsg: ` + this.errMsg;
    }
    set message(msg) {
        this.errMsg = msg;
    }
}
exports.CloudSDKError = CloudSDKError;
function isSDKError(error) {
    return (error && error instanceof Error && type_1.isString(error.errMsg));
}
exports.isSDKError = isSDKError;
exports.isGenericError = (e) => e.generic;
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.type = 'timeout';
        this.payload = null;
        this.generic = true;
    }
}
exports.TimeoutError = TimeoutError;
exports.isTimeoutError = (e) => e.type === 'timeout';
class CancelledError extends Error {
    constructor(message) {
        super(message);
        this.type = 'cancelled';
        this.payload = null;
        this.generic = true;
    }
}
exports.CancelledError = CancelledError;
exports.isCancelledError = (e) => e.type === 'cancelled';

}, function(modId) { var map = {"./type":1654780339005,"../config/error.config":1654780339027}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339027, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.ERR_CODE = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    SDK_DATABASE_REALTIME_LISTENER_INIT_WATCH_FAIL: 'SDK_DATABASE_REALTIME_LISTENER_INIT_WATCH_FAIL',
    SDK_DATABASE_REALTIME_LISTENER_RECONNECT_WATCH_FAIL: 'SDK_DATABASE_REALTIME_LISTENER_RECONNECT_WATCH_FAIL',
    SDK_DATABASE_REALTIME_LISTENER_REBUILD_WATCH_FAIL: 'SDK_DATABASE_REALTIME_LISTENER_REBUILD_WATCH_FAIL',
    SDK_DATABASE_REALTIME_LISTENER_CLOSE_WATCH_FAIL: 'SDK_DATABASE_REALTIME_LISTENER_CLOSE_WATCH_FAIL',
    SDK_DATABASE_REALTIME_LISTENER_SERVER_ERROR_MSG: 'SDK_DATABASE_REALTIME_LISTENER_SERVER_ERROR_MSG',
    SDK_DATABASE_REALTIME_LISTENER_RECEIVE_INVALID_SERVER_DATA: 'SDK_DATABASE_REALTIME_LISTENER_RECEIVE_INVALID_SERVER_DATA',
    SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_ERROR: 'SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_ERROR',
    SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_CLOSED: 'SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_CLOSED',
    SDK_DATABASE_REALTIME_LISTENER_CHECK_LAST_FAIL: 'SDK_DATABASE_REALTIME_LISTENER_CHECK_LAST_FAIL',
    SDK_DATABASE_REALTIME_LISTENER_UNEXPECTED_FATAL_ERROR: 'SDK_DATABASE_REALTIME_LISTENER_UNEXPECTED_FATAL_ERROR'
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339028, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
class RealtimeListener {
    constructor(options) {
        this.close = options.close;
        this.onChange = options.onChange;
        this.onError = options.onError;
        if (options.debug) {
            Object.defineProperty(this, 'virtualClient', {
                get: () => {
                    return options.virtualClient;
                }
            });
        }
    }
}
exports.RealtimeListener = RealtimeListener;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339029, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
class Snapshot {
    constructor(options) {
        const { id, docChanges, docs, msgType, type } = options;
        let cachedDocChanges;
        let cachedDocs;
        Object.defineProperties(this, {
            id: {
                get: () => id,
                enumerable: true
            },
            docChanges: {
                get: () => {
                    if (!cachedDocChanges) {
                        cachedDocChanges = JSON.parse(JSON.stringify(docChanges));
                    }
                    return cachedDocChanges;
                },
                enumerable: true
            },
            docs: {
                get: () => {
                    if (!cachedDocs) {
                        cachedDocs = JSON.parse(JSON.stringify(docs));
                    }
                    return cachedDocs;
                },
                enumerable: true
            },
            msgType: {
                get: () => msgType,
                enumerable: true
            },
            type: {
                get: () => type,
                enumerable: true
            }
        });
    }
}
exports.Snapshot = Snapshot;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339030, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
class RealtimeErrorMessageError extends Error {
    constructor(serverErrorMsg) {
        super(`Watch Error ${JSON.stringify(serverErrorMsg.msgData)} (requestid: ${serverErrorMsg.requestId})`);
        this.isRealtimeErrorMessageError = true;
        this.payload = serverErrorMsg;
    }
}
exports.RealtimeErrorMessageError = RealtimeErrorMessageError;
exports.isRealtimeErrorMessageError = (e) => e && e.isRealtimeErrorMessageError;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339031, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("../utils/error");
const error_config_1 = require("../config/error.config");
exports.CLOSE_EVENT_CODE_INFO = {
    1000: {
        code: 1000,
        name: 'Normal Closure',
        description: 'Normal closure; the connection successfully completed whatever purpose for which it was created.'
    },
    1001: {
        code: 1001,
        name: 'Going Away',
        description: 'The endpoint is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection.'
    },
    1002: {
        code: 1002,
        name: 'Protocol Error',
        description: 'The endpoint is terminating the connection due to a protocol error.'
    },
    1003: {
        code: 1003,
        name: 'Unsupported Data',
        description: 'The connection is being terminated because the endpoint received data of a type it cannot accept (for example, a text-only endpoint received binary data).'
    },
    1005: {
        code: 1005,
        name: 'No Status Received',
        description: 'Indicates that no status code was provided even though one was expected.'
    },
    1006: {
        code: 1006,
        name: 'Abnormal Closure',
        description: 'Used to indicate that a connection was closed abnormally (that is, with no close frame being sent) when a status code is expected.'
    },
    1007: {
        code: 1007,
        name: 'Invalid frame payload data',
        description: 'The endpoint is terminating the connection because a message was received that contained inconsistent data (e.g., non-UTF-8 data within a text message).'
    },
    1008: {
        code: 1008,
        name: 'Policy Violation',
        description: 'The endpoint is terminating the connection because it received a message that violates its policy. This is a generic status code, used when codes 1003 and 1009 are not suitable.'
    },
    1009: {
        code: 1009,
        name: 'Message too big',
        description: 'The endpoint is terminating the connection because a data frame was received that is too large.'
    },
    1010: {
        code: 1010,
        name: 'Missing Extension',
        description: "The client is terminating the connection because it expected the server to negotiate one or more extension, but the server didn't."
    },
    1011: {
        code: 1011,
        name: 'Internal Error',
        description: 'The server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.'
    },
    1012: {
        code: 1012,
        name: 'Service Restart',
        description: 'The server is terminating the connection because it is restarting.'
    },
    1013: {
        code: 1013,
        name: 'Try Again Later',
        description: 'The server is terminating the connection due to a temporary condition, e.g. it is overloaded and is casting off some of its clients.'
    },
    1014: {
        code: 1014,
        name: 'Bad Gateway',
        description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server. This is similar to 502 HTTP Status Code.'
    },
    1015: {
        code: 1015,
        name: 'TLS Handshake',
        description: "Indicates that the connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified)."
    },
    3000: {
        code: 3000,
        name: 'Reconnect WebSocket',
        description: 'The client is terminating the connection because it wants to reconnect'
    },
    3001: {
        code: 3001,
        name: 'No Realtime Listeners',
        description: 'The client is terminating the connection because no more realtime listeners exist'
    },
    3002: {
        code: 3002,
        name: 'Heartbeat Ping Error',
        description: 'The client is terminating the connection due to its failure in sending heartbeat messages'
    },
    3003: {
        code: 3003,
        name: 'Heartbeat Pong Timeout Error',
        description: 'The client is terminating the connection because no heartbeat response is received from the server'
    },
    3050: {
        code: 3050,
        name: 'Server Close',
        description: 'The client is terminating the connection because no heartbeat response is received from the server'
    }
};
var CLOSE_EVENT_CODE;
(function (CLOSE_EVENT_CODE) {
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["NormalClosure"] = 1000] = "NormalClosure";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["GoingAway"] = 1001] = "GoingAway";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["ProtocolError"] = 1002] = "ProtocolError";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["UnsupportedData"] = 1003] = "UnsupportedData";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["NoStatusReceived"] = 1005] = "NoStatusReceived";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["AbnormalClosure"] = 1006] = "AbnormalClosure";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["InvalidFramePayloadData"] = 1007] = "InvalidFramePayloadData";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["PolicyViolation"] = 1008] = "PolicyViolation";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["MessageTooBig"] = 1009] = "MessageTooBig";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["MissingExtension"] = 1010] = "MissingExtension";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["InternalError"] = 1011] = "InternalError";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["ServiceRestart"] = 1012] = "ServiceRestart";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["TryAgainLater"] = 1013] = "TryAgainLater";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["BadGateway"] = 1014] = "BadGateway";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["TLSHandshake"] = 1015] = "TLSHandshake";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["ReconnectWebSocket"] = 3000] = "ReconnectWebSocket";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["NoRealtimeListeners"] = 3001] = "NoRealtimeListeners";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["HeartbeatPingError"] = 3002] = "HeartbeatPingError";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["HeartbeatPongTimeoutError"] = 3003] = "HeartbeatPongTimeoutError";
    CLOSE_EVENT_CODE[CLOSE_EVENT_CODE["NoAuthentication"] = 3050] = "NoAuthentication";
})(CLOSE_EVENT_CODE = exports.CLOSE_EVENT_CODE || (exports.CLOSE_EVENT_CODE = {}));
exports.getWSCloseError = (code, reason) => {
    const info = exports.CLOSE_EVENT_CODE_INFO[code];
    const errMsg = !info
        ? `code ${code}`
        : `${info.name}, code ${code}, reason ${reason || info.description}`;
    return new error_1.CloudSDKError({
        errCode: error_config_1.ERR_CODE.SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_CLOSED,
        errMsg
    });
};

}, function(modId) { var map = {"../utils/error":1654780339026,"../config/error.config":1654780339027}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339032, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("./constant");
const index_1 = require("./index");
const validate_1 = require("./validate");
const util_1 = require("./util");
const query_1 = require("./serializer/query");
const update_1 = require("./serializer/update");
const websocket_client_1 = require("./realtime/websocket-client");
const constant_2 = require("./constant");
const utils_1 = require("./utils/utils");
const code_1 = require("./const/code");
const bson_1 = require("bson");
class Query {
    constructor(db, coll, fieldFilters, apiOptions, transactionId) {
        this.watch = (options) => {
            if (!index_1.Db.ws) {
                index_1.Db.ws = new websocket_client_1.RealtimeWebSocketClient({
                    context: {
                        appConfig: {
                            docSizeLimit: 1000,
                            realtimePingInterval: 10000,
                            realtimePongWaitTimeout: 5000,
                            request: this._request
                        }
                    }
                });
            }
            const { limit, order } = this._apiOptions;
            return index_1.Db.ws.watch(Object.assign(Object.assign({}, options), { envId: this._db.config.env, collectionName: this._coll, query: JSON.stringify(this._fieldFilters), limit, orderBy: order
                    ? order.reduce((acc, cur) => {
                        acc[cur.field] = cur.direction;
                        return acc;
                    }, {})
                    : undefined }));
        };
        this._db = db;
        this._coll = coll;
        this._fieldFilters = fieldFilters;
        this._apiOptions = apiOptions || {};
        this._request = new index_1.Db.reqClass(this._db.config);
        this._transactionId = transactionId;
    }
    async get() {
        const order = this._apiOptions.order;
        let param = {
            collectionName: this._coll,
            queryType: constant_1.QueryType.WHERE,
            transactionId: this._transactionId
        };
        if (this._fieldFilters) {
            param.query = this._fieldFilters;
        }
        if (order) {
            param.order = utils_1.stringifyByEJSON(order);
        }
        const offset = this._apiOptions.offset;
        if (offset) {
            param.offset = offset;
        }
        const limit = this._apiOptions.limit;
        if (limit) {
            param.limit = limit < 1000 ? limit : 1000;
        }
        else {
            param.limit = 100;
        }
        const projection = this._apiOptions.projection;
        if (projection) {
            param.projection = utils_1.stringifyByEJSON(projection);
        }
        const res = await this._request.send('database.getDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        const list = res.data.list.map(item => bson_1.EJSON.parse(item));
        const documents = util_1.Util.formatResDocumentData(list);
        const result = {
            data: documents,
            requestId: res.requestId
        };
        if (res.limit)
            result.limit = res.limit;
        if (res.offset)
            result.offset = res.offset;
        return result;
    }
    async count() {
        let param = {
            collectionName: this._coll,
            queryType: constant_1.QueryType.WHERE
        };
        if (this._fieldFilters) {
            param.query = this._fieldFilters;
        }
        const res = await this._request.send('database.calculateDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        return {
            requestId: res.requestId,
            total: res.data.total
        };
    }
    where(query) {
        if (Object.prototype.toString.call(query).slice(8, -1) !== 'Object') {
            throw Error(constant_2.ErrorCode.QueryParamTypeError);
        }
        const keys = Object.keys(query);
        const checkFlag = keys.some(item => {
            return query[item] !== undefined;
        });
        if (keys.length && !checkFlag) {
            throw Error(constant_2.ErrorCode.QueryParamValueError);
        }
        return new Query(this._db, this._coll, query_1.QuerySerializer.encodeEJSON(query, this._apiOptions.raw || false), this._apiOptions, this._transactionId);
    }
    options(apiOptions) {
        validate_1.Validate.isValidOptions(apiOptions);
        return new Query(this._db, this._coll, this._fieldFilters, apiOptions, this._transactionId);
    }
    orderBy(fieldPath, directionStr) {
        validate_1.Validate.isFieldPath(fieldPath);
        validate_1.Validate.isFieldOrder(directionStr);
        const newOrder = {
            [fieldPath]: directionStr === 'desc' ? -1 : 1
        };
        const order = this._apiOptions.order || {};
        const newApiOption = Object.assign({}, this._apiOptions, {
            order: Object.assign({}, order, newOrder)
        });
        return new Query(this._db, this._coll, this._fieldFilters, newApiOption, this._transactionId);
    }
    limit(limit) {
        validate_1.Validate.isInteger('limit', limit);
        let newApiOption = Object.assign({}, this._apiOptions);
        newApiOption.limit = limit;
        return new Query(this._db, this._coll, this._fieldFilters, newApiOption, this._transactionId);
    }
    skip(offset) {
        validate_1.Validate.isInteger('offset', offset);
        let newApiOption = Object.assign({}, this._apiOptions);
        newApiOption.offset = offset;
        return new Query(this._db, this._coll, this._fieldFilters, newApiOption, this._transactionId);
    }
    async update(data) {
        if (!data || typeof data !== 'object') {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '参数必需是非空对象' }));
        }
        if (data.hasOwnProperty('_id')) {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '不能更新_id的值' }));
        }
        let { multiple } = this._apiOptions;
        const multi = multiple === undefined ? true : multiple;
        let param = {
            collectionName: this._coll,
            queryType: constant_1.QueryType.WHERE,
            multi,
            merge: true,
            upsert: false,
            data: update_1.UpdateSerializer.encodeEJSON(data, this._apiOptions.raw || false)
        };
        if (this._fieldFilters) {
            param.query = this._fieldFilters;
        }
        const res = await this._request.send('database.modifyDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        return {
            requestId: res.requestId,
            updated: res.data.updated,
            upsertId: res.data.upsert_id
        };
    }
    field(projection) {
        let transformProjection = {};
        for (let k in projection) {
            if (typeof projection[k] === 'boolean') {
                transformProjection[k] = projection[k] === true ? 1 : 0;
            }
            if (typeof projection[k] === 'number') {
                transformProjection[k] = projection[k] > 0 ? 1 : 0;
            }
            if (typeof projection[k] === 'object') {
                transformProjection[k] = projection[k];
            }
        }
        let newApiOption = Object.assign({}, this._apiOptions);
        newApiOption.projection = transformProjection;
        return new Query(this._db, this._coll, this._fieldFilters, newApiOption, this._transactionId);
    }
    async remove() {
        const { offset, limit, projection, order } = this._apiOptions;
        if (offset !== undefined ||
            limit !== undefined ||
            projection !== undefined ||
            order !== undefined) {
            console.warn('`offset`, `limit`, `projection`, `orderBy` are not supported in remove() operation');
        }
        let { multiple } = this._apiOptions;
        const multi = multiple === undefined ? true : multiple;
        const param = {
            collectionName: this._coll,
            query: this._fieldFilters,
            queryType: constant_1.QueryType.WHERE,
            multi
        };
        const res = await this._request.send('database.removeDocument', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        return {
            requestId: res.requestId,
            deleted: res.data.deleted
        };
    }
    async updateAndReturn(data) {
        if (!data || typeof data !== 'object') {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '参数必需是非空对象' }));
        }
        if (data.hasOwnProperty('_id')) {
            return utils_1.processReturn(this._db.config.throwOnCode, Object.assign(Object.assign({}, code_1.ERRORS.INVALID_PARAM), { message: '不能更新_id的值' }));
        }
        let param = {
            collectionName: this._coll,
            queryType: constant_1.QueryType.WHERE,
            data: update_1.UpdateSerializer.encodeEJSON(data, false)
        };
        if (this._transactionId) {
            param.transactionId = this._transactionId;
        }
        if (this._fieldFilters) {
            param.query = this._fieldFilters;
        }
        const res = await this._request.send('database.modifyAndReturnDoc', param, utils_1.getReqOpts(this._apiOptions));
        if (res.code) {
            return res;
        }
        return {
            requestId: res.requestId,
            updated: res.data.updated,
            doc: res.data.doc && bson_1.EJSON.parse(res.data.doc)
        };
    }
}
exports.Query = Query;

}, function(modId) { var map = {"./constant":1654780339001,"./index":1654780338997,"./validate":1654780339000,"./util":1654780339002,"./serializer/query":1654780339033,"./serializer/update":1654780339015,"./realtime/websocket-client":1654780339023,"./utils/utils":1654780339004,"./const/code":1654780339003}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339033, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const query_1 = require("../commands/query");
const logic_1 = require("../commands/logic");
const symbol_1 = require("../helper/symbol");
const type_1 = require("../utils/type");
const operator_map_1 = require("../operator-map");
const common_1 = require("./common");
const utils_1 = require("../utils/utils");
const validate_1 = require("../validate");
class QuerySerializer {
    constructor() { }
    static encode(query) {
        const encoder = new QueryEncoder();
        return encoder.encodeQuery(query);
    }
    static encodeEJSON(query, raw) {
        const encoder = new QueryEncoder();
        return utils_1.stringifyByEJSON(raw ? query : encoder.encodeQuery(query));
    }
}
exports.QuerySerializer = QuerySerializer;
class QueryEncoder {
    encodeQuery(query, key) {
        if (common_1.isConversionRequired(query)) {
            if (logic_1.isLogicCommand(query)) {
                return this.encodeLogicCommand(query);
            }
            else if (query_1.isQueryCommand(query)) {
                return this.encodeQueryCommand(query);
            }
            else if (type_1.isRegExp(query)) {
                return { [key]: this.encodeRegExp(query) };
            }
            else if (type_1.isDate(query)) {
                return { [key]: query };
            }
            else {
                return { [key]: this.encodeQueryObject(query) };
            }
        }
        else {
            if (type_1.isObject(query)) {
                return this.encodeQueryObject(query);
            }
            else {
                return query;
            }
        }
    }
    encodeRegExp(query) {
        return {
            $regularExpression: {
                pattern: query.source,
                options: query.flags
            }
        };
    }
    encodeLogicCommand(query) {
        switch (query.operator) {
            case logic_1.LOGIC_COMMANDS_LITERAL.NOR:
            case logic_1.LOGIC_COMMANDS_LITERAL.AND:
            case logic_1.LOGIC_COMMANDS_LITERAL.OR: {
                const $op = operator_map_1.operatorToString(query.operator);
                const subqueries = query.operands.map((oprand) => this.encodeQuery(oprand, query.fieldName));
                return {
                    [$op]: subqueries
                };
            }
            case logic_1.LOGIC_COMMANDS_LITERAL.NOT: {
                const $op = operator_map_1.operatorToString(query.operator);
                const operatorExpression = query.operands[0];
                if (type_1.isRegExp(operatorExpression)) {
                    return {
                        [query.fieldName]: {
                            [$op]: this.encodeRegExp(operatorExpression)
                        }
                    };
                }
                else {
                    const subqueries = this.encodeQuery(operatorExpression)[query.fieldName];
                    return {
                        [query.fieldName]: {
                            [$op]: subqueries
                        }
                    };
                }
            }
            default: {
                const $op = operator_map_1.operatorToString(query.operator);
                if (query.operands.length === 1) {
                    const subquery = this.encodeQuery(query.operands[0]);
                    return {
                        [$op]: subquery
                    };
                }
                else {
                    const subqueries = query.operands.map(this.encodeQuery.bind(this));
                    return {
                        [$op]: subqueries
                    };
                }
            }
        }
    }
    encodeQueryCommand(query) {
        if (query_1.isComparisonCommand(query)) {
            return this.encodeComparisonCommand(query);
        }
        else {
            return this.encodeComparisonCommand(query);
        }
    }
    encodeComparisonCommand(query) {
        if (query.fieldName === symbol_1.SYMBOL_UNSET_FIELD_NAME) {
            throw new Error('Cannot encode a comparison command with unset field name');
        }
        const $op = operator_map_1.operatorToString(query.operator);
        switch (query.operator) {
            case query_1.QUERY_COMMANDS_LITERAL.EQ:
            case query_1.QUERY_COMMANDS_LITERAL.NEQ:
            case query_1.QUERY_COMMANDS_LITERAL.LT:
            case query_1.QUERY_COMMANDS_LITERAL.LTE:
            case query_1.QUERY_COMMANDS_LITERAL.GT:
            case query_1.QUERY_COMMANDS_LITERAL.GTE:
            case query_1.QUERY_COMMANDS_LITERAL.ELEM_MATCH:
            case query_1.QUERY_COMMANDS_LITERAL.EXISTS:
            case query_1.QUERY_COMMANDS_LITERAL.SIZE:
            case query_1.QUERY_COMMANDS_LITERAL.MOD: {
                return {
                    [query.fieldName]: {
                        [$op]: common_1.encodeInternalDataType(query.operands[0])
                    }
                };
            }
            case query_1.QUERY_COMMANDS_LITERAL.IN:
            case query_1.QUERY_COMMANDS_LITERAL.NIN:
            case query_1.QUERY_COMMANDS_LITERAL.ALL: {
                return {
                    [query.fieldName]: {
                        [$op]: common_1.encodeInternalDataType(query.operands)
                    }
                };
            }
            case query_1.QUERY_COMMANDS_LITERAL.GEO_NEAR: {
                const options = query.operands[0];
                return {
                    [query.fieldName]: {
                        $nearSphere: {
                            $geometry: options.geometry.toJSON(),
                            $maxDistance: options.maxDistance,
                            $minDistance: options.minDistance
                        }
                    }
                };
            }
            case query_1.QUERY_COMMANDS_LITERAL.GEO_WITHIN: {
                const options = query.operands[0];
                if (options.centerSphere) {
                    validate_1.Validate.isCentersPhere(options.centerSphere);
                    const centerSphere = options.centerSphere;
                    if (centerSphere[0]._internalType === symbol_1.SYMBOL_GEO_POINT) {
                        return {
                            [query.fieldName]: {
                                $geoWithin: {
                                    $centerSphere: [centerSphere[0].toJSON().coordinates, centerSphere[1]]
                                }
                            }
                        };
                    }
                    return {
                        [query.fieldName]: {
                            $geoWithin: {
                                $centerSphere: options.centerSphere
                            }
                        }
                    };
                }
                return {
                    [query.fieldName]: {
                        $geoWithin: {
                            $geometry: options.geometry.toJSON()
                        }
                    }
                };
            }
            case query_1.QUERY_COMMANDS_LITERAL.GEO_INTERSECTS: {
                const options = query.operands[0];
                return {
                    [query.fieldName]: {
                        $geoIntersects: {
                            $geometry: options.geometry.toJSON()
                        }
                    }
                };
            }
            default: {
                return {
                    [query.fieldName]: {
                        [$op]: common_1.encodeInternalDataType(query.operands[0])
                    }
                };
            }
        }
    }
    encodeQueryObject(query) {
        const flattened = common_1.flattenQueryObject(query);
        for (const key in flattened) {
            const val = flattened[key];
            if (logic_1.isLogicCommand(val)) {
                flattened[key] = val._setFieldName(key);
                const condition = this.encodeLogicCommand(flattened[key]);
                this.mergeConditionAfterEncode(flattened, condition, key);
            }
            else if (query_1.isComparisonCommand(val)) {
                flattened[key] = val._setFieldName(key);
                const condition = this.encodeComparisonCommand(flattened[key]);
                this.mergeConditionAfterEncode(flattened, condition, key);
            }
            else if (common_1.isConversionRequired(val)) {
                flattened[key] = common_1.encodeInternalDataType(val);
            }
        }
        return flattened;
    }
    mergeConditionAfterEncode(query, condition, key) {
        if (!condition[key]) {
            delete query[key];
        }
        for (const conditionKey in condition) {
            if (query[conditionKey]) {
                if (type_1.isArray(query[conditionKey])) {
                    query[conditionKey] = query[conditionKey].concat(condition[conditionKey]);
                }
                else if (type_1.isObject(query[conditionKey])) {
                    if (type_1.isObject(condition[conditionKey])) {
                        Object.assign(query, condition);
                    }
                    else {
                        console.warn(`unmergable condition, query is object but condition is ${type_1.getType(condition)}, can only overwrite`, condition, key);
                        query[conditionKey] = condition[conditionKey];
                    }
                }
                else {
                    console.warn(`to-merge query is of type ${type_1.getType(query)}, can only overwrite`, query, condition, key);
                    query[conditionKey] = condition[conditionKey];
                }
            }
            else {
                query[conditionKey] = condition[conditionKey];
            }
        }
    }
}

}, function(modId) { var map = {"../commands/query":1654780339018,"../commands/logic":1654780339019,"../helper/symbol":1654780339007,"../utils/type":1654780339005,"../operator-map":1654780339017,"./common":1654780339020,"../utils/utils":1654780339004,"../validate":1654780339000}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339034, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const bson_1 = require("bson");
const query_1 = require("./serializer/query");
const utils_1 = require("./utils/utils");
const type_1 = require("./utils/type");
const validate_1 = require("./validate");
const EARTH_RADIUS = 6378100;
class Aggregation {
    constructor(db, collectionName, rawPipeline) {
        this._stages = [];
        if (db && collectionName) {
            this._db = db;
            this._request = new index_1.Db.reqClass(this._db.config);
            this._collectionName = collectionName;
            if (rawPipeline && rawPipeline.length > 0) {
                rawPipeline.forEach((stage) => {
                    validate_1.Validate.isValidAggregation(stage);
                    const stageName = Object.keys(stage)[0];
                    this._pipe(stageName, stage[stageName], true);
                });
            }
        }
    }
    async end() {
        if (!this._collectionName || !this._db) {
            throw new Error('Aggregation pipeline cannot send request');
        }
        const result = await this._request.send('database.aggregateDocuments', {
            collectionName: this._collectionName,
            stages: this._stages
        });
        if (result && result.data && result.data.list) {
            return {
                requestId: result.requestId,
                data: result.data.list.map(bson_1.EJSON.parse)
            };
        }
        return result;
    }
    unwrap() {
        return this._stages;
    }
    done() {
        return this._stages.map(({ stageKey, stageValue }) => {
            return {
                [stageKey]: JSON.parse(stageValue)
            };
        });
    }
    _pipe(stage, param, raw = false) {
        let transformParam = '';
        if (type_1.getType(param) === 'object') {
            transformParam = utils_1.stringifyByEJSON(param);
        }
        else {
            transformParam = JSON.stringify(param);
        }
        this._stages.push({
            stageKey: raw ? stage : `$${stage}`,
            stageValue: transformParam
        });
        return this;
    }
    addFields(param) {
        return this._pipe('addFields', param);
    }
    bucket(param) {
        return this._pipe('bucket', param);
    }
    bucketAuto(param) {
        return this._pipe('bucketAuto', param);
    }
    count(param) {
        return this._pipe('count', param);
    }
    geoNear(param) {
        if (param.query) {
            param.query = query_1.QuerySerializer.encode(param.query);
        }
        if (param.distanceMultiplier && typeof (param.distanceMultiplier) === 'number') {
            param.distanceMultiplier = param.distanceMultiplier * EARTH_RADIUS;
        }
        else {
            param.distanceMultiplier = EARTH_RADIUS;
        }
        return this._pipe('geoNear', param);
    }
    group(param) {
        return this._pipe('group', param);
    }
    limit(param) {
        return this._pipe('limit', param);
    }
    match(param) {
        return this._pipe('match', query_1.QuerySerializer.encode(param));
    }
    project(param) {
        return this._pipe('project', param);
    }
    lookup(param) {
        return this._pipe('lookup', param);
    }
    replaceRoot(param) {
        return this._pipe('replaceRoot', param);
    }
    sample(param) {
        return this._pipe('sample', param);
    }
    skip(param) {
        return this._pipe('skip', param);
    }
    sort(param) {
        return this._pipe('sort', param);
    }
    sortByCount(param) {
        return this._pipe('sortByCount', param);
    }
    unwind(param) {
        return this._pipe('unwind', param);
    }
}
exports.default = Aggregation;

}, function(modId) { var map = {"./index":1654780338997,"./serializer/query":1654780339033,"./utils/utils":1654780339004,"./utils/type":1654780339005,"./validate":1654780339000}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339035, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const query_1 = require("./commands/query");
const logic_1 = require("./commands/logic");
const update_1 = require("./commands/update");
const type_1 = require("./utils/type");
const aggregate_1 = require("./aggregate");
exports.Command = {
    eq(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.EQ, [val]);
    },
    neq(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.NEQ, [val]);
    },
    lt(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.LT, [val]);
    },
    lte(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.LTE, [val]);
    },
    gt(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.GT, [val]);
    },
    gte(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.GTE, [val]);
    },
    in(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.IN, val);
    },
    nin(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.NIN, val);
    },
    all(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.ALL, val);
    },
    elemMatch(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.ELEM_MATCH, [val]);
    },
    exists(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.EXISTS, [val]);
    },
    size(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.SIZE, [val]);
    },
    mod() {
        if (arguments.length == 1)
            return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.MOD, [arguments[0]]);
        if (arguments.length == 2)
            return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.MOD, [[arguments[0], arguments[1]]]);
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.MOD, arguments);
    },
    geoNear(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.GEO_NEAR, [val]);
    },
    geoWithin(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.GEO_WITHIN, [val]);
    },
    geoIntersects(val) {
        return new query_1.QueryCommand(query_1.QUERY_COMMANDS_LITERAL.GEO_INTERSECTS, [val]);
    },
    and(...__expressions__) {
        const expressions = type_1.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        return new logic_1.LogicCommand(logic_1.LOGIC_COMMANDS_LITERAL.AND, expressions);
    },
    nor(...__expressions__) {
        const expressions = type_1.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        return new logic_1.LogicCommand(logic_1.LOGIC_COMMANDS_LITERAL.NOR, expressions);
    },
    or(...__expressions__) {
        const expressions = type_1.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        return new logic_1.LogicCommand(logic_1.LOGIC_COMMANDS_LITERAL.OR, expressions);
    },
    not(...__expressions__) {
        const expressions = type_1.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        return new logic_1.LogicCommand(logic_1.LOGIC_COMMANDS_LITERAL.NOT, expressions);
    },
    set(val) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.SET, [val]);
    },
    remove() {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.REMOVE, []);
    },
    inc(val) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.INC, [val]);
    },
    mul(val) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.MUL, [val]);
    },
    push(...args) {
        let values;
        if (type_1.isObject(args[0]) && args[0].hasOwnProperty('each')) {
            values = {};
            const options = args[0];
            if (options.each !== undefined) {
                values['$each'] = options.each;
            }
            if (options.position !== undefined) {
                values['$position'] = options.position;
            }
            if (options.sort !== undefined) {
                values['$sort'] = options.sort;
            }
            if (options.slice !== undefined) {
                values['$slice'] = options.slice;
            }
        }
        else if (type_1.isArray(args[0])) {
            values = args[0];
        }
        else {
            values = Array.from(args);
        }
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.PUSH, values);
    },
    pull(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.PULL, values);
    },
    pullAll(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.PULL_ALL, values);
    },
    pop() {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.POP, []);
    },
    shift() {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.SHIFT, []);
    },
    unshift(...__values__) {
        const values = type_1.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.UNSHIFT, values);
    },
    addToSet(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.ADD_TO_SET, values);
    },
    rename(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.RENAME, [values]);
    },
    bit(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.BIT, [values]);
    },
    max(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.MAX, [values]);
    },
    min(values) {
        return new update_1.UpdateCommand(update_1.UPDATE_COMMANDS_LITERAL.MIN, [values]);
    },
    expr(values) {
        return {
            $expr: values
        };
    },
    jsonSchema(schema) {
        return {
            $jsonSchema: schema
        };
    },
    text(values) {
        if (type_1.isString(values)) {
            return {
                $search: values.search
            };
        }
        else {
            return {
                $search: values.search,
                $language: values.language,
                $caseSensitive: values.caseSensitive,
                $diacriticSensitive: values.diacriticSensitive
            };
        }
    },
    aggregate: {
        pipeline() {
            return new aggregate_1.default();
        },
        abs: param => new AggregationOperator('abs', param),
        add: param => new AggregationOperator('add', param),
        ceil: param => new AggregationOperator('ceil', param),
        divide: param => new AggregationOperator('divide', param),
        exp: param => new AggregationOperator('exp', param),
        floor: param => new AggregationOperator('floor', param),
        ln: param => new AggregationOperator('ln', param),
        log: param => new AggregationOperator('log', param),
        log10: param => new AggregationOperator('log10', param),
        mod: param => new AggregationOperator('mod', param),
        multiply: param => new AggregationOperator('multiply', param),
        pow: param => new AggregationOperator('pow', param),
        sqrt: param => new AggregationOperator('sqrt', param),
        subtract: param => new AggregationOperator('subtract', param),
        trunc: param => new AggregationOperator('trunc', param),
        arrayElemAt: param => new AggregationOperator('arrayElemAt', param),
        arrayToObject: param => new AggregationOperator('arrayToObject', param),
        concatArrays: param => new AggregationOperator('concatArrays', param),
        filter: param => new AggregationOperator('filter', param),
        in: param => new AggregationOperator('in', param),
        indexOfArray: param => new AggregationOperator('indexOfArray', param),
        isArray: param => new AggregationOperator('isArray', param),
        map: param => new AggregationOperator('map', param),
        range: param => new AggregationOperator('range', param),
        reduce: param => new AggregationOperator('reduce', param),
        reverseArray: param => new AggregationOperator('reverseArray', param),
        size: param => new AggregationOperator('size', param),
        slice: param => new AggregationOperator('slice', param),
        zip: param => new AggregationOperator('zip', param),
        and: param => new AggregationOperator('and', param),
        not: param => new AggregationOperator('not', param),
        or: param => new AggregationOperator('or', param),
        cmp: param => new AggregationOperator('cmp', param),
        eq: param => new AggregationOperator('eq', param),
        gt: param => new AggregationOperator('gt', param),
        gte: param => new AggregationOperator('gte', param),
        lt: param => new AggregationOperator('lt', param),
        lte: param => new AggregationOperator('lte', param),
        neq: param => new AggregationOperator('ne', param),
        cond: param => new AggregationOperator('cond', param),
        ifNull: param => new AggregationOperator('ifNull', param),
        switch: param => new AggregationOperator('switch', param),
        dateFromParts: param => new AggregationOperator('dateFromParts', param),
        dateFromString: param => new AggregationOperator('dateFromString', param),
        dayOfMonth: param => new AggregationOperator('dayOfMonth', param),
        dayOfWeek: param => new AggregationOperator('dayOfWeek', param),
        dayOfYear: param => new AggregationOperator('dayOfYear', param),
        isoDayOfWeek: param => new AggregationOperator('isoDayOfWeek', param),
        isoWeek: param => new AggregationOperator('isoWeek', param),
        isoWeekYear: param => new AggregationOperator('isoWeekYear', param),
        millisecond: param => new AggregationOperator('millisecond', param),
        minute: param => new AggregationOperator('minute', param),
        month: param => new AggregationOperator('month', param),
        second: param => new AggregationOperator('second', param),
        hour: param => new AggregationOperator('hour', param),
        week: param => new AggregationOperator('week', param),
        year: param => new AggregationOperator('year', param),
        literal: param => new AggregationOperator('literal', param),
        mergeObjects: param => new AggregationOperator('mergeObjects', param),
        objectToArray: param => new AggregationOperator('objectToArray', param),
        allElementsTrue: param => new AggregationOperator('allElementsTrue', param),
        anyElementTrue: param => new AggregationOperator('anyElementTrue', param),
        setDifference: param => new AggregationOperator('setDifference', param),
        setEquals: param => new AggregationOperator('setEquals', param),
        setIntersection: param => new AggregationOperator('setIntersection', param),
        setIsSubset: param => new AggregationOperator('setIsSubset', param),
        setUnion: param => new AggregationOperator('setUnion', param),
        concat: param => new AggregationOperator('concat', param),
        dateToString: param => new AggregationOperator('dateToString', param),
        indexOfBytes: param => new AggregationOperator('indexOfBytes', param),
        indexOfCP: param => new AggregationOperator('indexOfCP', param),
        split: param => new AggregationOperator('split', param),
        strLenBytes: param => new AggregationOperator('strLenBytes', param),
        strLenCP: param => new AggregationOperator('strLenCP', param),
        strcasecmp: param => new AggregationOperator('strcasecmp', param),
        substr: param => new AggregationOperator('substr', param),
        substrBytes: param => new AggregationOperator('substrBytes', param),
        substrCP: param => new AggregationOperator('substrCP', param),
        toLower: param => new AggregationOperator('toLower', param),
        toUpper: param => new AggregationOperator('toUpper', param),
        meta: param => new AggregationOperator('meta', param),
        addToSet: param => new AggregationOperator('addToSet', param),
        avg: param => new AggregationOperator('avg', param),
        first: param => new AggregationOperator('first', param),
        last: param => new AggregationOperator('last', param),
        max: param => new AggregationOperator('max', param),
        min: param => new AggregationOperator('min', param),
        push: param => new AggregationOperator('push', param),
        stdDevPop: param => new AggregationOperator('stdDevPop', param),
        stdDevSamp: param => new AggregationOperator('stdDevSamp', param),
        sum: param => new AggregationOperator('sum', param),
        let: param => new AggregationOperator('let', param)
    },
    project: {
        slice: param => new ProjectionOperator('slice', param),
        elemMatch: param => new ProjectionOperator('elemMatch', param)
    }
};
class AggregationOperator {
    constructor(name, param) {
        this['$' + name] = param;
    }
}
exports.AggregationOperator = AggregationOperator;
class ProjectionOperator {
    constructor(name, param) {
        this['$' + name] = param;
    }
}
exports.ProjectionOperator = ProjectionOperator;
exports.default = exports.Command;

}, function(modId) { var map = {"./commands/query":1654780339018,"./commands/logic":1654780339019,"./commands/update":1654780339016,"./utils/type":1654780339005,"./aggregate":1654780339034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339036, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
class RegExp {
    constructor({ regexp, options }) {
        if (!regexp) {
            throw new TypeError('regexp must be a string');
        }
        this.$regularExpression = {
            pattern: regexp || '',
            options: options || ''
        };
    }
    parse() {
        return {
            $regularExpression: {
                pattern: this.$regularExpression.pattern,
                options: this.$regularExpression.options
            }
        };
    }
    get _internalType() {
        return symbol_1.SYMBOL_REGEXP;
    }
}
exports.RegExp = RegExp;
function RegExpConstructor(param) {
    return new RegExp(param);
}
exports.RegExpConstructor = RegExpConstructor;

}, function(modId) { var map = {"../helper/symbol":1654780339007}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339037, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const collection_1 = require("../collection");
const code_1 = require("../const/code");
const START = 'database.startTransaction';
const COMMIT = 'database.commitTransaction';
const ABORT = 'database.abortTransaction';
class Transaction {
    constructor(db) {
        this._db = db;
        this._request = new index_1.Db.reqClass(this._db.config);
        this.aborted = false;
        this.commited = false;
        this.inited = false;
    }
    async init() {
        const res = await this._request.send(START);
        if (res.code) {
            throw res;
        }
        this.inited = true;
        this._id = res.transactionId;
    }
    collection(collName) {
        if (!collName) {
            throw new Error('Collection name is required');
        }
        return new collection_1.CollectionReference(this._db, collName, {}, this._id);
    }
    getTransactionId() {
        return this._id;
    }
    getRequestMethod() {
        return this._request;
    }
    async commit() {
        const param = {
            transactionId: this._id
        };
        const res = await this._request.send(COMMIT, param);
        if (res.code)
            throw res;
        this.commited = true;
        return res;
    }
    async rollback(customRollbackRes) {
        const param = {
            transactionId: this._id
        };
        const res = await this._request.send(ABORT, param);
        if (res.code)
            throw res;
        this.aborted = true;
        this.abortReason = customRollbackRes;
        return res;
    }
}
exports.Transaction = Transaction;
async function startTransaction() {
    const transaction = new Transaction(this);
    await transaction.init();
    return transaction;
}
exports.startTransaction = startTransaction;
async function runTransaction(callback, times = 3) {
    let transaction;
    try {
        transaction = new Transaction(this);
        await transaction.init();
        const callbackRes = await callback(transaction);
        if (transaction.aborted === true) {
            throw transaction.abortReason;
        }
        await transaction.commit();
        return callbackRes;
    }
    catch (error) {
        if (transaction.inited === false) {
            throw error;
        }
        const throwWithRollback = async (error) => {
            if (!transaction.aborted && !transaction.commited) {
                try {
                    await transaction.rollback();
                }
                catch (err) {
                }
                throw error;
            }
            if (transaction.aborted === true) {
                throw transaction.abortReason;
            }
            throw error;
        };
        if (times <= 0) {
            await throwWithRollback(error);
        }
        if (error && error.code === code_1.ERRORS.DATABASE_TRANSACTION_CONFLICT.code) {
            return await runTransaction.bind(this)(callback, --times);
        }
        await throwWithRollback(error);
    }
}
exports.runTransaction = runTransaction;

}, function(modId) { var map = {"../index":1654780338997,"../collection":1654780339013,"../const/code":1654780339003}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339038, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const symbol_1 = require("../helper/symbol");
class ObjectId {
    constructor({ id = '' } = {}) {
        this.id = id;
    }
    get _internalType() {
        return symbol_1.SYMBOL_OBJECTID;
    }
    parse() {
        return {
            $oid: this.id
        };
    }
}
exports.ObjectId = ObjectId;
function ObjectIdConstructor(opt) {
    return new ObjectId(opt);
}
exports.ObjectIdConstructor = ObjectIdConstructor;

}, function(modId) { var map = {"../helper/symbol":1654780339007}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780338997);
})()
//miniprogram-npm-outsideDeps=["bson","lodash.set","lodash.unset","lodash.clonedeep"]
//# sourceMappingURL=index.js.map