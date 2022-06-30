/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-30 12:31:25
 */
/**
 * @Main 提供参数
 * @param key 识别的类别
 * @returns easydlToken 和 PlantViruses
 */

import { maps } from './mapApi'

console.log(maps)

//  @return 获取相关的参数
let TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token"
let TOKEN_GRANT_TYPE = "client_credentials"

// let cate ="番茄"
module.exports = async (cate) => {
let api_keys = await maps.get(cate)
console.log("api ====>",api_keys)
let TOKEN_CLIENT_ID = await api_keys.API_KEY
let TOKEN_CLIENT_SECRET = await api_keys.SECRET_KEY

let access_token_func = await require("../optimset/easydlToken")
let access_token = await access_token_func(TOKEN_URL,TOKEN_GRANT_TYPE,TOKEN_CLIENT_ID,TOKEN_CLIENT_SECRET)

// console.log('access_token2133333332312321321',access_token)
// 设置接口链接
let API_URL = await api_keys.URL + "?access_token=" + access_token
console.log('API_URL', API_URL)
return {
  TOKEN_URL,
  TOKEN_GRANT_TYPE,
  TOKEN_CLIENT_ID,
  TOKEN_CLIENT_SECRET,
  API_URL
}

}
