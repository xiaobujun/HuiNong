let BASE64;
// ctx = wx.createCameraContext()
async function carmeraBase64(ctx){
  await new Promise(resolve => {
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        let url = res.tempImagePath
        // 将图片转换为base64格式
        wx.getFileSystemManager().readFile({
          filePath: url,
          encoding: 'base64',
          success(res) {
            //console.log('上传照片成功准备转码')
            // let base64 = res.data;
            resolve(res.data)
          }
        });
      }
    })
  }).then(base64 => {
    BASE64 = base64
  })
  return BASE64
}
module.exports = carmeraBase64