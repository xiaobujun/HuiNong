/**
 * @Main 返回识别结果
 * @param 图片base64 access_token 结果数量
 */
let results;

module.exports = async (base64, access_token, top_num) => {
  await new Promise(resolve => {
    wx.request({
      url: access_token,
      header: {
        "Content-type": "application/json",
      },
      method: 'POST',
      data: {
        "image": base64,
        "top_num": top_num
      },
      success: res => {
        resolve(res.data.results)
      },
      fail: _ => {
        results = null
      }
    })
  }).then(arr => {
    results = arr
  })
  return results
}