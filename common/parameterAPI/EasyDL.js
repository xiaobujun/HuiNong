let TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token"
let TOKEN_GRANT_TYPE = "client_credentials"
let TOKEN_CLIENT_ID = "mTzozXMfAjy0i2pugklNexRX"
let TOKEN_CLIENT_SECRET = "vSl3hpZiYX9YIX6HtfNiF7YalSYqULFB"

let API_URL = access_token => {
  return "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/classification/miao213?access_token=" + access_token
}

export {
  TOKEN_URL,
  TOKEN_GRANT_TYPE,
  TOKEN_CLIENT_ID,
  TOKEN_CLIENT_SECRET,
  API_URL
}