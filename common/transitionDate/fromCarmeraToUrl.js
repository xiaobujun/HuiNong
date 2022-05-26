let URL;
// ctx = wx.createCameraContext()
async function carmeraURL(ctx){
  await new Promise(resolve => {
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        let url = res.tempImagePath
        // 将图片转换为base64格式
        resolve(url)
      }
    })
  }).then(url => {
    URL = url
  })
  .catch(err => {
    console.log(err)
  })
  return URL
}
module.exports = carmeraURL