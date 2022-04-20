import {
  API_URL
} from "../parameterAPI/EasyDL"

let results;
async function plantVireusesResults(base64, access_token, top_num) {
  await new Promise(resolve => {
    wx.request({
      url: API_URL(access_token),
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
module.exports = plantVireusesResults