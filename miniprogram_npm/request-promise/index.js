module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339802, function(require, module, exports) {


var Bluebird = require('bluebird').getNewLibraryCopy(),
    configure = require('request-promise-core/configure/request2'),
    stealthyRequire = require('stealthy-require');

try {

    // Load Request freshly - so that users can require an unaltered request instance!
    var request = stealthyRequire(require.cache, function () {
        return require('request');
    },
    function () {
        require('tough-cookie');
    }, module);

} catch (err) {
    /* istanbul ignore next */
    var EOL = require('os').EOL;
    /* istanbul ignore next */
    console.error(EOL + '###' + EOL + '### The "request" library is not installed automatically anymore.' + EOL + '### But is a dependency of "request-promise".' + EOL + '### Please install it with:' + EOL + '### npm install request --save' + EOL + '###' + EOL);
    /* istanbul ignore next */
    throw err;
}

Bluebird.config({cancellation: true});

configure({
    request: request,
    PromiseImpl: Bluebird,
    expose: [
        'then',
        'catch',
        'finally',
        'cancel',
        'promise'
        // Would you like to expose more Bluebird methods? Try e.g. `rp(...).promise().tap(...)` first. `.promise()` returns the full-fledged Bluebird promise.
    ],
    constructorMixin: function (resolve, reject, onCancel) {
        var self = this;
        onCancel(function () {
            self.abort();
        });
    }
});

request.bindCLS = function RP$bindCLS() {
    throw new Error('CLS support was dropped. To get it back read: https://github.com/request/request-promise/wiki/Getting-Back-Support-for-Continuation-Local-Storage');
};


module.exports = request;

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339802);
})()
//miniprogram-npm-outsideDeps=["bluebird","request-promise-core/configure/request2","stealthy-require","request","tough-cookie","os"]
//# sourceMappingURL=index.js.map