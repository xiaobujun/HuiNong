module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1654780339917, function(require, module, exports) {
const Db = require('@cloudbase/database').Db
const storage = require('./src/storage')
const functions = require('./src/functions')
const auth = require('./src/auth')
const wx = require('./src/wx')
const Request = require('./src/utils/dbRequest')
const logger = require('./src/log')
const { SYMBOL_CURRENT_ENV } = require('./src/const/symbol')
const { getCurrentEnv } = require('./src/utils/utils')

const ExtRequest = require('./src/utils/extRequest')

function Tcb(config) {
  this.config = config ? config : this.config
  this.requestClient = new ExtRequest()
  this.SYMBOL_CURRENT_ENV = SYMBOL_CURRENT_ENV
}

Tcb.prototype.init = function({
  secretId,
  secretKey,
  sessionToken,
  debug,
  env,
  proxy,
  timeout,
  serviceUrl,
  version,
  headers = {},
  credentials,
  timingsMeasurer,
  isHttp,
  signMethod = 'v2',
  isUpdateSelfConfig = true,
  forever = false
} = {}) {
  if ((secretId && !secretKey) || (!secretId && secretKey)) {
    throw Error('secretId and secretKey must be a pair')
  }

  const config = {
    get secretId() {
      return this._secretId ? this._secretId : process.env.TENCENTCLOUD_SECRETID
    },
    set secretId(id) {
      this._secretId = id
    },
    get secretKey() {
      return this._secretKey
        ? this._secretKey
        : process.env.TENCENTCLOUD_SECRETKEY
    },
    set secretKey(key) {
      this._secretKey = key
    },
    get sessionToken() {
      if (this._sessionToken === undefined) {
        //默认临时密钥
        return process.env.TENCENTCLOUD_SESSIONTOKEN
      } else if (this._sessionToken === false) {
        //固定秘钥
        return undefined
      } else {
        //传入的临时密钥
        return this._sessionToken
      }
    },
    set sessionToken(token) {
      this._sessionToken = token
    },
    envName: env,
    proxy: proxy,
    isHttp: isHttp,
    headers: Object.assign({}, headers)
  }

  config.debug = debug
  config.forever = forever
  config.signMethod = signMethod
  config.timingsMeasurer = timingsMeasurer
  config.secretId = secretId
  config.secretKey = secretKey
  config.timeout = timeout || 15000
  config.serviceUrl = serviceUrl
  config.credentials = credentials
  config.sessionToken = sessionToken
    ? sessionToken
    : secretId && secretKey
    ? false
    : undefined

  if (version) {
    config.headers['x-sdk-version'] = version
  }

  // 这里的目的是创建新实例时可以避免更新当前实例
  if (isUpdateSelfConfig) {
    this.config = config
  }

  return new Tcb(config)
}

Tcb.prototype.database = function(dbConfig = {}) {
  Db.reqClass = Request
  if (Object.prototype.toString.call(dbConfig).slice(8, -1) !== 'Object') {
    throw Error('dbConfig must be an object')
  }

  if (dbConfig && dbConfig.env) {
    // env变量名转换
    dbConfig.envName = dbConfig.env
    delete dbConfig.env
  }
  this.config = Object.assign(this.config, dbConfig)
  return new Db({ ...this })
}

/**
 * @returns string
 */
Tcb.prototype.getCurrentEnv = function() {
  return getCurrentEnv()
}

const extensionMap = {}
/**
 * 注册扩展
 */
Tcb.prototype.registerExtension = function(ext) {
  extensionMap[ext.name] = ext
}

Tcb.prototype.invokeExtension = async function(name, opts) {
  const ext = extensionMap[name]
  if (!ext) {
    throw Error(`扩展${name} 必须先注册`)
  }

  return await ext.invoke(opts, this)
}

Tcb.prototype.parseContext = function(context) {
  if (typeof context !== 'object') {
    throw Error('context 必须为对象类型')
  }
  let {
    memory_limit_in_mb,
    time_limit_in_ms,
    request_id,
    environ = '',
    function_version,
    namespace,
    function_name,
    environment
  } = context
  let parseResult = {}

  try {
    parseResult.memoryLimitInMb = memory_limit_in_mb
    parseResult.timeLimitIns = time_limit_in_ms
    parseResult.requestId = request_id
    parseResult.functionVersion = function_version
    parseResult.namespace = namespace
    parseResult.functionName = function_name

    // 存在environment 为新架构 上新字段 JSON序列化字符串
    if (environment) {
      parseResult.environment = JSON.parse(environment)
      return parseResult
    }

    // 不存在environment 则为老字段，老架构上存在bug，无法识别value含特殊字符(若允许特殊字符，影响解析，这里特殊处理)

    const parseEnviron = environ.split(';')
    let parseEnvironObj = {}
    for (let i in parseEnviron) {
      const equalIndex = parseEnviron[i].indexOf('=')
      if (equalIndex < 0) {
        // value含分号影响切割，未找到= 均忽略
        continue
      }
      const key = parseEnviron[i].slice(0, equalIndex)
      let value = parseEnviron[i].slice(equalIndex + 1)

      // value 含, 为数组
      if (value.indexOf(',') >= 0) {
        value = value.split(',')
      }
      parseEnvironObj[key] = value
    }

    parseResult.environ = parseEnvironObj
  } catch (err) {
    throw Error('无效的context对象')
  }
  return parseResult
}

function each(obj, fn) {
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      fn(obj[i], i)
    }
  }
}

function extend(target, source) {
  each(source, function(val, key) {
    target[key] = source[key]
  })
  return target
}

extend(Tcb.prototype, functions)
extend(Tcb.prototype, storage)
extend(Tcb.prototype, wx)
extend(Tcb.prototype, auth)
extend(Tcb.prototype, logger)

module.exports = new Tcb()

}, function(modId) {var map = {"./src/storage":1654780339918,"./src/functions":1654780339927,"./src/auth":1654780339928,"./src/wx":1654780339929,"./src/utils/dbRequest":1654780339930,"./src/log":1654780339931,"./src/const/symbol":1654780339926,"./src/utils/utils":1654780339922,"./src/utils/extRequest":1654780339932}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339918, function(require, module, exports) {
const request = require('request')
const fs = require('fs')
const httpRequest = require('../utils/httpRequest')
const { parseString } = require('xml2js')

async function parseXML(str) {
  return new Promise((resolve, reject) => {
    parseString(str, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

/*
 * 上传文件
 * @param {string} cloudPath 上传后的文件路径
 * @param {fs.ReadStream} fileContent  上传文件的二进制流
 */
async function uploadFile({ cloudPath, fileContent }) {
  const {
    data: { url, token, authorization, fileId, cosFileId }
  } = await getUploadMetadata.call(this, { cloudPath })

  const formData = {
    Signature: authorization,
    'x-cos-security-token': token,
    'x-cos-meta-fileid': cosFileId,
    key: cloudPath,
    file: fileContent
  }

  let body = await new Promise((resolve, reject) => {
    request.post({ url, formData: formData }, function(err, res, body) {
      if (err) {
        reject(err)
      } else {
        resolve(body)
      }
    })
  })

  body = await parseXML(body)
  if (body && body.Error) {
    const {
      Code: [code],
      Message: [message]
    } = body.Error
    if (code === 'SignatureDoesNotMatch') {
      return {
        code: 'SYS_ERR',
        message
      }
    }
    return {
      code: 'STORAGE_REQUEST_FAIL',
      message
    }
  }

  return {
    fileID: fileId
  }
}

/**
 * 删除文件
 * @param {Array.<string>} fileList 文件id数组
 */
async function deleteFile({ fileList }) {
  if (!fileList || !Array.isArray(fileList)) {
    return {
      code: 'INVALID_PARAM',
      message: 'fileList必须是非空的数组'
    }
  }

  for (let file of fileList) {
    if (!file || typeof file != 'string') {
      return {
        code: 'INVALID_PARAM',
        message: 'fileList的元素必须是非空的字符串'
      }
    }
  }

  let params = {
    action: 'storage.batchDeleteFile',
    fileid_list: fileList
  }

  return httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {
      'content-type': 'application/json'
    }
  }).then(res => {
    if (res.code) {
      return res
    } else {
      return {
        fileList: res.data.delete_list,
        requestId: res.requestId
      }
    }
  })
}

/**
 * 获取文件下载链接
 * @param {Array.<Object>} fileList
 */
async function getTempFileURL({ fileList }) {
  if (!fileList || !Array.isArray(fileList)) {
    return {
      code: 'INVALID_PARAM',
      message: 'fileList必须是非空的数组'
    }
  }

  let file_list = []
  for (let file of fileList) {
    if (typeof file === 'object') {
      if (!file.hasOwnProperty('fileID') || !file.hasOwnProperty('maxAge')) {
        return {
          code: 'INVALID_PARAM',
          message: 'fileList的元素必须是包含fileID和maxAge的对象'
        }
      }

      file_list.push({
        fileid: file.fileID,
        max_age: file.maxAge
      })
    } else if (typeof file === 'string') {
      file_list.push({
        fileid: file
      })
    } else {
      return {
        code: 'INVALID_PARAM',
        message: 'fileList的元素必须是字符串'
      }
    }
  }

  let params = {
    action: 'storage.batchGetDownloadUrl',
    file_list
  }
  // console.log(params);

  return httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {
      'content-type': 'application/json'
    }
  }).then(res => {
    // console.log(res);
    if (res.code) {
      return res
    } else {
      return {
        fileList: res.data.download_list,
        requestId: res.requestId
      }
    }
  })
}

async function getFileAuthority({ fileList }) {
  if (!Array.isArray(fileList)) {
    throw new Error(
      '[tcb-admin-node] getCosFileAuthority fileList must be a array'
    )
  }

  if (
    fileList.some(file => {
      if (!file || !file.path) {
        return true
      }
      if (['READ', 'WRITE', 'READWRITE'].indexOf(file.type) === -1) {
        return true
      }
    })
  ) {
    throw new Error('[tcb-admin-node] getCosFileAuthority fileList param error')
  }

  const userInfo = this.auth().getUserInfo()
  const { openId, uid } = userInfo

  if (!openId && !uid) {
    throw new Error('[tcb-admin-node] admin do not need getCosFileAuthority.')
  }

  let params = {
    action: 'storage.getFileAuthority',
    openId,
    uid,
    loginType: process.env.LOGINTYPE,
    fileList
  }
  const res = await httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {
      'content-type': 'application/json'
    }
  })

  if (res.code) {
    throw new Error('[tcb-admin-node] getCosFileAuthority failed: ' + res.code)
  } else {
    return res
  }
}

async function downloadFile({ fileID, tempFilePath }) {
  let tmpUrl,
    self = this
  try {
    const tmpUrlRes = await this.getTempFileURL({
      fileList: [
        {
          fileID,
          maxAge: 600
        }
      ]
    })
    // console.log(tmpUrlRes);
    const res = tmpUrlRes.fileList[0]

    if (res.code != 'SUCCESS') {
      return res
    }

    tmpUrl = res.tempFileURL
    tmpUrl = encodeURI(tmpUrl)
  } catch (e) {
    throw e
  }

  let req = request({
    url: tmpUrl,
    encoding: null,
    proxy: self.config.proxy
  })

  return new Promise((resolve, reject) => {
    let fileContent = Buffer.alloc(0)
    req.on('response', function(response) {
      if (response && +response.statusCode === 200) {
        if (tempFilePath) {
          response.pipe(fs.createWriteStream(tempFilePath))
        } else {
          response.on('data', data => {
            fileContent = Buffer.concat([fileContent, data])
          })
        }
        response.on('end', () => {
          resolve({
            fileContent: tempFilePath ? undefined : fileContent,
            message: '文件下载完成'
          })
        })
      } else {
        reject(response)
      }
    })
  })
}

async function getUploadMetadata({ cloudPath }) {
  let params = {
    action: 'storage.getUploadMetadata',
    path: cloudPath
  }

  const res = await httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {
      'content-type': 'application/json'
    }
  })

  if (res.code) {
    throw new Error('get upload metadata failed: ' + res.code)
  } else {
    return res
  }
}

exports.uploadFile = uploadFile
exports.deleteFile = deleteFile
exports.getTempFileURL = getTempFileURL
exports.downloadFile = downloadFile
exports.getUploadMetadata = getUploadMetadata
exports.getFileAuthority = getFileAuthority

}, function(modId) { var map = {"../utils/httpRequest":1654780339919}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339919, function(require, module, exports) {
const http = require('http')
const request = require('request')
const auth = require('./auth.js')
const tracing = require('./tracing')
const utils = require('./utils')
const version = require('../../package.json').version
const getWxCloudApiToken = require('./getWxCloudApiToken')
const RequestTimgingsMeasurer = require('./request-timings-measurer')
  .RequestTimgingsMeasurer
const URL = require('url')
const { sign } = require('@cloudbase/signature-nodejs')
const { SYMBOL_CURRENT_ENV } = require('../const/symbol')

module.exports = utils.warpPromise(doRequest)

async function doRequest(args) {
  const config = args.config
  const method = args.method || 'post'
  const signMethod = config.signMethod || 'v2'
  const protocol = config.isHttp === true ? 'http' : 'https'
  const isInSCF = process.env.TENCENTCLOUD_RUNENV === 'SCF'

  if (!config.secretId || !config.secretKey) {
    if (isInSCF) {
      throw Error('missing authoration key, redeploy the function')
    }
    throw Error('missing secretId or secretKey of tencent cloud')
  }

  const tracingInfo = tracing.generateTracingInfo()
  const seqId = tracingInfo.seqId
  const eventId = tracingInfo.eventId

  // 检查envName 是否为symbol
  if (config.envName === SYMBOL_CURRENT_ENV) {
    config.envName = utils.getCurrentEnv()
  }

  const params = Object.assign({}, args.params, {
    envName: config.envName,
    timestamp: new Date().valueOf(),
    eventId,
    wxCloudApiToken: getWxCloudApiToken(),
    // 对应服务端 wxCloudSessionToken
    tcb_sessionToken: process.env.TCB_SESSIONTOKEN || ''
  })
  utils.filterUndefined(params)

  // wx.openApi 以及 wx.wxPayApi 带的requestData 需避开签名

  let requestData = null
  if (params.action === 'wx.openApi' || params.action === 'wx.wxPayApi') {
    requestData = params['requestData']
    delete params['requestData']
  }

  // Note: 云函数被调用时可能调用端未传递 SOURCE，TCB_SOURCE 可能为空
  const TCB_SOURCE = process.env.TCB_SOURCE || ''
  const SOURCE = isInSCF ? `${TCB_SOURCE},scf` : ',not_scf'

  // url
  let url = ''
  if (config.serviceUrl) {
    url = config.serviceUrl
  } else {
    url = protocol + '://tcb-admin.tencentcloudapi.com/admin'

    if (isInSCF) {
      url = 'http://tcb-admin.tencentyun.com/admin'
    }

    if (
      params.action === 'wx.api' ||
      params.action === 'wx.openApi' ||
      params.action === 'wx.wxPayApi'
    ) {
      url = protocol + '://tcb-open.tencentcloudapi.com/admin'
      if (isInSCF) {
        url = 'http://tcb-open.tencentyun.com/admin'
      }
    }
  }

  if (url.includes('?')) {
    url = `${url}&eventId=${eventId}&seqId=${seqId}`
  } else {
    url = `${url}?&eventId=${eventId}&seqId=${seqId}`
  }

  let headers = {}

  if (signMethod === 'v3') {
    headers = {
      'x-tcb-source': SOURCE,
      'User-Agent': `tcb-admin-sdk/${version}`,
      'X-SDK-Version': `tcb-admin-sdk/${version}`,
      Host: URL.parse(url).host
    }

    if (params.action === 'wx.openApi' || params.action === 'wx.wxPayApi') {
      headers['content-type'] = 'multipart/form-data'
    }

    headers = Object.assign({}, config.headers, args.headers, headers)

    const signInfo = sign({
      secretId: config.secretId,
      secretKey: config.secretKey,
      method: method,
      url: url,
      params: params,
      headers,
      withSignedParams: true
    })

    headers['Authorization'] = signInfo.authorization
    headers['X-Signature-Expires'] = 600
    headers['X-Timestamp'] = signInfo.timestamp
  } else {
    headers = {
      'user-agent': `tcb-admin-sdk/${version}`,
      'x-tcb-source': SOURCE
    }

    const authObj = {
      SecretId: config.secretId,
      SecretKey: config.secretKey,
      Method: method,
      pathname: '/admin',
      Query: params,
      Headers: Object.assign({}, headers)
    }

    params.authorization = auth.getAuth(authObj)

    headers = Object.assign({}, config.headers, args.headers, headers)
  }

  requestData && (params.requestData = requestData)
  config.sessionToken && (params.sessionToken = config.sessionToken)
  params.sdk_version = version

  const opts = {
    url,
    method: args.method || 'post',
    // 先取模块的timeout，没有则取sdk的timeout，还没有就使用默认值
    timeout: args.timeout || config.timeout || 15000,
    headers,
    proxy: config.proxy
  }

  if (args.method == 'post') {
    if (params.action === 'wx.openApi' || params.action === 'wx.wxPayApi') {
      opts.formData = params
      opts.encoding = null
    } else {
      opts.body = params
      opts.json = true
    }
  } else {
    opts.qs = params
  }

  if (args.proxy) {
    opts.proxy = args.proxy
  }

  // 针对数据库请求设置慢查询提示
  let slowQueryWarning = null
  if (params.action.indexOf('database') >= 0) {
    slowQueryWarning = setTimeout(() => {
      console.warn(
        `Database operation ${params.action} is longer than 3s. Please check query performance and your network environment. | [${seqId}]`
      )
    }, 3000)
  }

  try {
    return new Promise(function(resolve, reject) {
      const timingsMeasurerOptions = config.timingsMeasurer || {}
      const {
        waitingTime = 1000,
        interval = 200,
        enable = !!config.debug
      } = timingsMeasurerOptions
      const timingsMeasurer = RequestTimgingsMeasurer.new({
        waitingTime,
        interval,
        enable
      })

      let targetName = ''
      if (params.action.startsWith('functions')) {
        targetName = params.function_name
      } else if (params.action.startsWith('database')) {
        targetName = params.collectionName
      } else if (params.action.startsWith('wx')) {
        targetName = params.apiName
      }

      timingsMeasurer.on('progress', timings => {
        const timingsLine = `s:${timings.socket || '-'}|l:${timings.lookup ||
          '-'}|c:${timings.connect || '-'}|r:${timings.ready ||
          '-'}|w:${timings.waiting || '-'}|d:${timings.download ||
          '-'}|e:${timings.end || '-'}`
        console.warn(
          `[RequestTimgings] Operation [${
            params.action
          }:${targetName}] spent ${Date.now() -
            timings.start}ms(${timingsLine}) [${seqId}]`
        )
      })

      if (config.forever) {
        opts.forever = true
      }

      const clientRequest = request(opts, function(err, response, body) {
        args && args.callback && args.callback(response)
        if (err) {
          return reject(err)
        }

        if (response.statusCode === 200) {
          let res
          try {
            res = typeof body === 'string' ? JSON.parse(body) : body
            // wx.openApi 和 wx.wxPayApi 调用时，需用content-type区分buffer or JSON
            if (
              params.action === 'wx.openApi' ||
              params.action === 'wx.wxPayApi'
            ) {
              const { headers } = response
              if (
                headers['content-type'] === 'application/json; charset=utf-8'
              ) {
                res = JSON.parse(res.toString()) // JSON错误时buffer转JSON
              }
            }
          } catch (e) {
            res = body
          }
          return resolve(res)
        } else {
          // 避免非 200 错误导致返回空内容
          const e = new Error(`
            ${response.statusCode} ${http.STATUS_CODES[response.statusCode]}
          `)
          e.statusCode = response.statusCode
          reject(e)
        }
      })
      timingsMeasurer.measure(clientRequest)
    })
  } finally {
    if (slowQueryWarning) {
      clearTimeout(slowQueryWarning)
    }
  }
}

}, function(modId) { var map = {"./auth.js":1654780339920,"./tracing":1654780339921,"./utils":1654780339922,"../../package.json":1654780339923,"./getWxCloudApiToken":1654780339924,"./request-timings-measurer":1654780339925,"../const/symbol":1654780339926}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339920, function(require, module, exports) {
var crypto = require('crypto')

function camSafeUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}
function map(obj, fn) {
  var o = isArray(obj) ? [] : {}
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = fn(obj[i], i)
    }
  }
  return o
}
function isArray(arr) {
  return arr instanceof Array
}

function clone(obj) {
  return map(obj, function(v) {
    return typeof v === 'object' && v !== undefined && v !== null ? clone(v) : v
  })
}
//测试用的key后面可以去掉
var getAuth = function(opt) {
  opt = opt || {}

  var SecretId = opt.SecretId
  var SecretKey = opt.SecretKey
  var method = (opt.method || opt.Method || 'get').toLowerCase()
  var pathname = opt.pathname || '/'
  var queryParams = clone(opt.Query || opt.params || {})
  var headers = clone(opt.Headers || opt.headers || {})
  pathname.indexOf('/') !== 0 && (pathname = '/' + pathname)

  if (!SecretId) {
    throw Error('missing param SecretId')
  }

  if (!SecretKey) {
    throw Error('missing param SecretKey')
  }

  var getObjectKeys = function(obj) {
    var list = []
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] === undefined) {
          continue
        }
        list.push(key)
      }
    }
    return list.sort()
  }

  var obj2str = function(obj) {
    var i, key, val
    var list = []
    var keyList = getObjectKeys(obj)
    for (i = 0; i < keyList.length; i++) {
      key = keyList[i]
      if (obj[key] === undefined) {
        continue
      }
      val = obj[key] === null ? '' : obj[key]
      if (typeof val !== 'string') {
        val = JSON.stringify(val)
      }
      key = key.toLowerCase()
      key = camSafeUrlEncode(key)
      val = camSafeUrlEncode(val) || ''
      list.push(key + '=' + val)
    }
    return list.join('&')
  }

  // 签名有效起止时间
  var now = parseInt(new Date().getTime() / 1000) - 1
  var exp = now

  var Expires = opt.Expires || opt.expires
  if (Expires === undefined) {
    exp += 900 // 签名过期时间为当前 + 900s
  } else {
    exp += Expires * 1 || 0
  }

  // 要用到的 Authorization 参数列表
  var qSignAlgorithm = 'sha1'
  var qAk = SecretId
  var qSignTime = now + ';' + exp
  var qKeyTime = now + ';' + exp
  var qHeaderList = getObjectKeys(headers)
    .join(';')
    .toLowerCase()
  var qUrlParamList = getObjectKeys(queryParams)
    .join(';')
    .toLowerCase()

  // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
  // 步骤一：计算 SignKey
  var signKey = crypto
    .createHmac('sha1', SecretKey)
    .update(qKeyTime)
    .digest('hex')

  // console.log("queryParams", queryParams);
  // console.log(obj2str(queryParams));

  // 步骤二：构成 FormatString
  var formatString = [
    method,
    pathname,
    obj2str(queryParams),
    obj2str(headers),
    ''
  ].join('\n')

  // console.log(formatString);
  formatString = Buffer.from(formatString, 'utf8')

  // 步骤三：计算 StringToSign
  var sha1Algo = crypto.createHash('sha1')
  sha1Algo.update(formatString)
  var res = sha1Algo.digest('hex')
  var stringToSign = ['sha1', qSignTime, res, ''].join('\n')

  // console.log(stringToSign);
  // 步骤四：计算 Signature
  var qSignature = crypto
    .createHmac('sha1', signKey)
    .update(stringToSign)
    .digest('hex')

  // 步骤五：构造 Authorization
  var authorization = [
    'q-sign-algorithm=' + qSignAlgorithm,
    'q-ak=' + qAk,
    'q-sign-time=' + qSignTime,
    'q-key-time=' + qKeyTime,
    'q-header-list=' + qHeaderList,
    'q-url-param-list=' + qUrlParamList,
    'q-signature=' + qSignature
  ].join('&')

  return authorization
}

exports.getAuth = getAuth

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339921, function(require, module, exports) {
let seqNum = 0

function getSeqNum() {
  return ++seqNum
}

function generateEvnentId() {
  return (
    Date.now() +
    '_' +
    getSeqNum() +
    '_' +
    Math.random()
      .toString()
      .substr(2, 5)
  )
}

exports.generateTracingInfo = function generateTracingInfo() {
  const TCB_SEQID = process.env.TCB_SEQID || ''
  const eventId = generateEvnentId()
  const seqId = TCB_SEQID ? `${TCB_SEQID}-${eventId}` : eventId

  return { eventId, seqId }
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339922, function(require, module, exports) {
exports.filterValue = function filterValue(o, value) {
  for (let key in o) {
    if (o[key] === value) {
      delete o[key]
    }
  }
}

exports.filterUndefined = function(o) {
  return exports.filterValue(o, undefined)
}

exports.filterNull = function(o) {
  return exports.filterValue(o, null)
}

exports.filterEmptyString = function(o) {
  return exports.filterValue(o, '')
}

exports.deepFreeze = function(o) {
  if (typeof value !== 'object') {
    return o
  }

  Object.freeze(o)

  Object.getOwnPropertyNames(o).forEach(function(prop) {
    const value = o[prop]
    if (
      typeof value === 'object' &&
      value !== null &&
      !Object.isFrozen(value)
    ) {
      exports.deepFreeze(value)
    }
  })

  return o
}

exports.warpPromise = function warp(fn) {
  return function(...args) {
    // 确保返回 Promise 实例
    return new Promise((resolve, reject) => {
      try {
        return fn(...args)
          .then(resolve)
          .catch(reject)
      } catch (e) {
        reject(e)
      }
    })
  }
}

exports.getCurrentEnv = function() {
  return process.env.TCB_ENV || process.env.SCF_NAMESPACE
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339923, function(require, module, exports) {
module.exports = {
  "name": "tcb-admin-node",
  "version": "1.23.0",
  "description": "tencent cloud base admin sdk for node.js",
  "main": "index.js",
  "scripts": {
    "eslint": "eslint \"./**/*.js\" \"./**/*.ts\"",
    "eslint-fix": "eslint --fix \"./**/*.js\" \"./**/*.ts\"",
    "tsc": "tsc -p tsconfig.json",
    "tsc:w": "tsc -p tsconfig.json -w",
    "tstest": "mocha --timeout 5000 --require espower-typescript/guess test/**/*.test.ts",
    "test": "jest --verbose false -i",
    "coverage": "jest --verbose false --coverage"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/TencentCloudBase/tcb-admin-node"
  },
  "bugs": {
    "url": "https://github.com/TencentCloudBase/tcb-admin-node/issues"
  },
  "homepage": "https://github.com/TencentCloudBase/tcb-admin-node#readme",
  "keywords": [
    "tcb-admin"
  ],
  "author": "jimmyzhang",
  "license": "MIT",
  "dependencies": {
    "@cloudbase/database": "0.9.15",
    "@cloudbase/signature-nodejs": "^1.0.0-beta.0",
    "is-regex": "^1.0.4",
    "jsonwebtoken": "^8.5.1",
    "lodash.merge": "^4.6.1",
    "request": "^2.87.0",
    "xml2js": "^0.4.19"
  },
  "devDependencies": {
    "@types/jest": "^23.1.4",
    "@types/mocha": "^5.2.4",
    "@types/node": "^10.12.12",
    "bluebird": "^3.7.1",
    "dumper.js": "^1.3.0",
    "eslint": "^5.16.0",
    "eslint-config-prettier": "^4.1.0",
    "eslint-plugin-prettier": "^3.0.1",
    "eslint-plugin-typescript": "^0.14.0",
    "espower-typescript": "^8.1.4",
    "husky": "^1.3.1",
    "inquirer": "^6.3.1",
    "jest": "^23.3.0",
    "lint-staged": "^8.1.5",
    "mocha": "^5.2.0",
    "power-assert": "^1.5.0",
    "prettier": "^1.17.0",
    "semver": "^6.0.0",
    "ts-jest": "^23.10.4",
    "tslib": "^1.7.1",
    "typescript": "^3.4.3",
    "typescript-eslint-parser": "^22.0.0"
  },
  "engines": {
    "node": ">=8.6.0"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "git add"
    ]
  }
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339924, function(require, module, exports) {
// 由定时触发器触发时（TRIGGER_SRC=timer）：优先使用 WX_TRIGGER_API_TOKEN_V0，不存在的话，为了兼容兼容旧的开发者工具，也是使用 WX_API_TOKEN
// 非定时触发器触发时（TRIGGER_SRC!=timer）: 使用 WX_API_TOKEN
function getWxCloudApiToken() {
  if (process.env.TRIGGER_SRC === 'timer') {
    return process.env.WX_TRIGGER_API_TOKEN_V0 || process.env.WX_API_TOKEN || ''
  } else {
    return process.env.WX_API_TOKEN || ''
  }
}

module.exports = getWxCloudApiToken

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339925, function(require, module, exports) {
const EventEmitter = require('events').EventEmitter

class RequestTimgingsMeasurer extends EventEmitter {
  static new(options) {
    return new RequestTimgingsMeasurer(options)
  }

  constructor(options) {
    super()

    this.timings = {
      // start: 0,
      // lookup: -1,
      // connect: -1,
      // ready: -1,
      // waiting: -1,
      // download: -1,
      // end: -1
    }

    this.enable = options.enable === true
    this.timerStarted = false
    this.intervalId = null
    this.timeoutId = null

    this.waitingTime = options.waitingTime || 1000
    this.interval = options.interval || 200
  }

  _startTimer() {
    if (!this.enable) {
      return
    }

    if (this.timerStarted) {
      return
    }

    this.timerStarted = true
    this.intervalId = null
    this.timeoutId = setTimeout(() => {
      this._process()
      this.intervalId = setInterval(() => {
        this._process()
      }, this.interval)
    }, this.waitingTime)
  }

  _stopTimer() {
    if (!this.enable) {
      return
    }

    if (!this.timerStarted) {
      return
    }

    this.timerStarted = false

    clearTimeout(this.timeoutId)
    clearInterval(this.intervalId)
    this._process()
  }

  _process() {
    this.emit('progress', { ...this.timings })
  }

  measure(clientRequest) {
    if (!this.enable) {
      return
    }

    this._startTimer()
    const timings = this.timings

    timings.start = Date.now()

    clientRequest
      .on('response', message => {
        timings.response = Date.now()

        timings.waiting = Date.now() - timings.start

        message.on('end', () => {
          timings.socket = timings.socket || 0
          // timings.lookup = timings.lookup || timings.socket
          // timings.connect = timings.connect || timings.lookup
          timings.download = Date.now() - timings.response
          timings.end = Date.now() - timings.start

          this._stopTimer()
        })
      })
      .on('socket', socket => {
        timings.socket = Date.now() - timings.start
        if (socket.connecting) {
          socket.on('lookup', () => {
            timings.lookup = Date.now() - timings.start
          })
          socket.on('connect', () => {
            timings.connect = Date.now() - timings.start
          })
          socket.on('ready', () => {
            timings.ready = Date.now() - timings.start
          })
          // socket.on('data', () => {})
          // socket.on('drain', () => {})
          // socket.on('end', () => {
          //   // this._stopTimer()
          // })
          socket.on('error', () => {
            timings.error = Date.now() - timings.start
          })
        }
      })
  }
}

exports.RequestTimgingsMeasurer = RequestTimgingsMeasurer

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339926, function(require, module, exports) {
exports.SYMBOL_CURRENT_ENV = Symbol.for('SYMBOL_CURRENT_ENV')

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339927, function(require, module, exports) {
const httpRequest = require('../utils/httpRequest')

/**
 * 调用云函数
 * @param {String} name  函数名
 * @param {Object} functionParam 函数参数
 * @return {Promise}
 */
function callFunction({ name, data }) {
  try {
    data = data ? JSON.stringify(data) : ''
  } catch (e) {
    return Promise.reject(e)
  }
  if (!name) {
    return Promise.reject(
      new Error({
        message: '函数名不能为空'
      })
    )
  }

  const params = {
    action: 'functions.invokeFunction',
    function_name: name,
    request_data: data
  }

  return httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {
      'content-type': 'application/json',
      ...(process.env.TCB_ROUTE_KEY
        ? { 'X-Tcb-Route-Key': process.env.TCB_ROUTE_KEY }
        : {})
    }
  }).then(res => {
    if (res.code) {
      return res
    } else {
      let result
      try {
        result = JSON.parse(res.data.response_data)
      } catch (e) {
        result = res.data.response_data
      }
      return {
        result,
        requestId: res.requestId
      }
    }
  })
}

exports.callFunction = callFunction

}, function(modId) { var map = {"../utils/httpRequest":1654780339919}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339928, function(require, module, exports) {
const jwt = require('jsonwebtoken')
const { SYMBOL_CURRENT_ENV } = require('../const/symbol')
const { getCurrentEnv } = require('../utils/utils')

const checkCustomUserIdRegex = /^[a-zA-Z0-9_\-#@~=*(){}[\]:.,<>+]{4,32}$/

function validateUid(uid) {
  if (typeof uid !== 'string') {
    throw new TypeError('uid must be a string')
  }
  if (!checkCustomUserIdRegex.test(uid)) {
    throw new Error(`Invalid uid: "${uid}"`)
  }
}

exports.auth = function() {
  let self = this
  return {
    getUserInfo() {
      const openId = process.env.WX_OPENID || ''
      const appId = process.env.WX_APPID || ''
      const uid = process.env.TCB_UUID || ''
      const customUserId = process.env.TCB_CUSTOM_USER_ID || ''
      const isAnonymous =
        process.env.TCB_ISANONYMOUS_USER === 'true' ? true : false

      return {
        openId,
        appId,
        uid,
        customUserId,
        isAnonymous
      }
    },
    async getAuthContext(context) {
      const { environment, environ } = self.parseContext(context)
      const env = environment || environ || {}
      const { TCB_UUID, LOGINTYPE } = env
      const res = {
        uid: TCB_UUID,
        loginType: LOGINTYPE
      }
      if (LOGINTYPE === 'QQ-MINI') {
        const { QQ_OPENID, QQ_APPID } = env
        res.appId = QQ_APPID
        res.openId = QQ_OPENID
      }
      return res
    },
    getClientIP() {
      return process.env.TCB_SOURCE_IP || ''
    },
    createTicket: (uid, options = {}) => {
      validateUid(uid)
      const timestamp = new Date().getTime()
      let { credentials, envName } = this.config
      if (!envName) {
        throw new Error('no env in config')
      }

      // 使用symbol时替换为环境变量内的env
      if (envName === SYMBOL_CURRENT_ENV) {
        envName = getCurrentEnv()
      }

      const {
        refresh = 3600 * 1000,
        expire = timestamp + 7 * 24 * 60 * 60 * 1000
      } = options
      var token = jwt.sign(
        {
          alg: 'RS256',
          env: envName,
          iat: timestamp,
          exp: timestamp + 10 * 60 * 1000, // ticket十分钟有效
          uid,
          refresh,
          expire
        },
        credentials.private_key,
        { algorithm: 'RS256' }
      )

      return credentials.private_key_id + '/@@/' + token
    }
  }
}

}, function(modId) { var map = {"../const/symbol":1654780339926,"../utils/utils":1654780339922}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339929, function(require, module, exports) {
const httpRequest = require('../utils/httpRequest')

exports.callWxOpenApi = function({ apiName, requestData } = {}) {
  try {
    requestData = requestData ? JSON.stringify(requestData) : ''
  } catch (e) {
    throw Error(e)
  }

  const params = {
    action: 'wx.api',
    apiName,
    requestData
  }

  return httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {
      'content-type': 'application/json'
    }
  }).then(res => {
    if (res.code) {
      return res
    } else {
      let result
      try {
        result = JSON.parse(res.data.responseData)
      } catch (e) {
        result = res.data.responseData
      }
      return {
        result,
        requestId: res.requestId
      }
    }
  })
}

/**
 * 调用wxopenAPi
 * @param {String} apiName  接口名
 * @param {Buffer} requestData
 * @return {Promise} 正常内容为buffer，报错为json {code:'', message:'', resquestId:''}
 */
exports.callCompatibleWxOpenApi = function({ apiName, requestData } = {}) {
  const params = {
    action: 'wx.openApi',
    apiName,
    requestData
  }

  return httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {}
  })
}

/**
 * wx.wxPayApi 微信支付用
 * @param {String} apiName  接口名
 * @param {Buffer} requestData
 * @return {Promise} 正常内容为buffer，报错为json {code:'', message:'', resquestId:''}
 */
exports.callWxPayApi = function({ apiName, requestData } = {}) {
  const params = {
    action: 'wx.wxPayApi',
    apiName,
    requestData
  }

  return httpRequest({
    config: this.config,
    params,
    method: 'post',
    headers: {}
  })
}

}, function(modId) { var map = {"../utils/httpRequest":1654780339919}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339930, function(require, module, exports) {
const httpRequest = require('./httpRequest')

/**
 * 数据库模块的通用请求方法
 *
 * @author haroldhu
 * @internal
 */
class Request {
  /**
   * 初始化
   *
   * @internal
   * @param config
   */
  constructor(config) {
    this.config = config
  }

  /**
   * 发送请求
   *
   * @param api   - 接口
   * @param data  - 参数
   */
  async send(api, data) {
    const params = Object.assign({}, data, {
      action: api
    })

    return await httpRequest({
      timeout: this.config.timeout,
      config: this.config.config,
      params,
      method: 'post',
      headers: {
        'content-type': 'application/json'
      }
    })
  }
}

module.exports = Request

}, function(modId) { var map = {"./httpRequest":1654780339919}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339931, function(require, module, exports) {
/**
 *
 *
 * @class Log
 */
class Log {
  constructor() {
    this.src = 'app'
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
    let realMsg = {}

    realMsg = Object.assign({}, realMsg, logMsg)
    return realMsg
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
      throw Error('please input correct log msg')
    }

    const msgContent = this.transformMsg(logMsg)

    console.__baseLog__(msgContent, logLevel)
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  log(logMsg) {
    this.baseLog(logMsg, 'log')
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  info(logMsg) {
    this.baseLog(logMsg, 'info')
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  error(logMsg) {
    this.baseLog(logMsg, 'error')
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  warn(logMsg) {
    this.baseLog(logMsg, 'warn')
  }
}

exports.logger = () => {
  return new Log()
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1654780339932, function(require, module, exports) {
const httpRequest = require('./httpRequest')
const requestClient = require('request')

/**
 * 扩展模块的请求类
 *
 */
class ExtRequest {
  /**
   * 初始化
   *
   * @internal
   * @param config
   */
  // constructor(config) {
  //   this.config = config
  // }

  /**
   * 发送 tcb 请求
   *
   * @param api   - 接口
   * @param data  - 参数
   */
  // async tcbRequest(api, data) {
  //   const params = Object.assign({}, data, {
  //     action: api
  //   })

  //   return await httpRequest({
  //     timeout: this.config.timeout,
  //     config: this.config,
  //     params,
  //     method: 'post',
  //     headers: {
  //       'content-type': 'application/json'
  //     }
  //   })
  // }

  get(options) {
    return this.rawRequest({
      ...options,
      method: 'get'
    })
  }
  post(options) {
    return this.rawRequest({
      ...options,
      method: 'post'
    })
  }
  put(options) {
    return this.rawRequest({
      ...options,
      method: 'put'
    })
  }

  /**
   * 发送普通请求
   * @param {*} opts
   */
  async rawRequest(opts) {
    let res = await new Promise((resolve, reject) => {
      requestClient(opts, function(err, res, body) {
        if (err) {
          reject(err)
        } else {
          resolve({
            data: body,
            statusCode: res.statusCode,
            header: res.headers
          })
        }
      })
    })

    return res
  }
}

module.exports = ExtRequest

}, function(modId) { var map = {"./httpRequest":1654780339919}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1654780339917);
})()
//miniprogram-npm-outsideDeps=["@cloudbase/database","request","fs","xml2js","http","url","@cloudbase/signature-nodejs","crypto","events","jsonwebtoken"]
//# sourceMappingURL=index.js.map