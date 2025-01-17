// 获取easydl access_token
let token;

module.exports = async (TOKEN_URL,TOKEN_GRANT_TYPE,TOKEN_CLIENT_ID,TOKEN_CLIENT_SECRET) => {
  await new Promise(resolve =>{
    wx.request({
      url: TOKEN_URL,
      data: {
        grant_type: TOKEN_GRANT_TYPE,
        client_id: TOKEN_CLIENT_ID,
        client_secret: TOKEN_CLIENT_SECRET
      },
      success: res => {
        resolve(res.data.access_token)
      },
      fail: res => {
        access_token = null
      }
    })
  }).then(t => {
    token = t
  })
  console.log('token',token)
  return token
}