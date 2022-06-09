module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339653, function(require, module, exports) {


Object.defineProperty(exports, '__esModule', { value: true });

(function (JSONSchemaFormat) {
  JSONSchemaFormat["Date"] = "date";
  JSONSchemaFormat["DateTime"] = "date-time";
  JSONSchemaFormat["Email"] = "email";
  JSONSchemaFormat["Hostname"] = "hostname";
  JSONSchemaFormat["IDNEmail"] = "idn-email";
  JSONSchemaFormat["IDNHostname"] = "idn-hostname";
  JSONSchemaFormat["IPv4"] = "ipv4";
  JSONSchemaFormat["IPv6"] = "ipv6";
  JSONSchemaFormat["IRI"] = "iri";
  JSONSchemaFormat["IRIReference"] = "iri-reference";
  JSONSchemaFormat["JSONPointer"] = "json-pointer";
  JSONSchemaFormat["JSONPointerURIFragment"] = "json-pointer-uri-fragment";
  JSONSchemaFormat["RegEx"] = "regex";
  JSONSchemaFormat["RelativeJSONPointer"] = "relative-json-pointer";
  JSONSchemaFormat["Time"] = "time";
  JSONSchemaFormat["URI"] = "uri";
  JSONSchemaFormat["URIReference"] = "uri-reference";
  JSONSchemaFormat["URITemplate"] = "uri-template";
  JSONSchemaFormat["UUID"] = "uuid";
})(exports.JSONSchemaFormat || (exports.JSONSchemaFormat = {}));

(function (JSONSchemaType) {
  JSONSchemaType["Array"] = "array";
  JSONSchemaType["Boolean"] = "boolean";
  JSONSchemaType["Integer"] = "integer";
  JSONSchemaType["Null"] = "null";
  JSONSchemaType["Number"] = "number";
  JSONSchemaType["Object"] = "object";
  JSONSchemaType["String"] = "string";
})(exports.JSONSchemaType || (exports.JSONSchemaType = {}));

(function (JSONSchemaContentEncoding) {
  JSONSchemaContentEncoding["7bit"] = "7bit";
  JSONSchemaContentEncoding["8bit"] = "8bit";
  JSONSchemaContentEncoding["Binary"] = "binary";
  JSONSchemaContentEncoding["QuotedPrintable"] = "quoted-printable";
  JSONSchemaContentEncoding["Base64"] = "base64";
  JSONSchemaContentEncoding["IETFToken"] = "ietf-token";
  JSONSchemaContentEncoding["XToken"] = "x-token";
})(exports.JSONSchemaContentEncoding || (exports.JSONSchemaContentEncoding = {}));

const JSONSchemaKeys = ['$comment', '$id', '$ref', '$schema', 'additionalItems', 'additionalProperties', 'allOf', 'anyOf', 'const', 'contains', 'contentEncoding', 'contentMediaType', 'default', 'definitions', 'dependencies', 'description', 'else', 'enum', 'examples', 'exclusiveMaximum', 'exclusiveMinimum', 'format', 'if', 'items', 'maximum', 'maxItems', 'maxLength', 'maxProperties', 'minimum', 'minItems', 'minLength', 'minProperties', 'multipleOf', 'not', 'oneOf', 'pattern', 'patternProperties', 'properties', 'propertyNames', 'readOnly', 'required', 'then', 'title', 'type', 'uniqueItems', 'writeOnly'];

exports.JSONSchemaKeys = JSONSchemaKeys;
//# sourceMappingURL=index.js.map

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339653);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map