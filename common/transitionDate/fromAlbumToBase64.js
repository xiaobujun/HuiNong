let base64 = "ERROR";
async function albumBase64() { 
  await new Promise(resolve => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['original'],
      success: (res) => {
        let url = res.tempFiles[0].tempFilePath
        wx.setStorageSync("res_imgurl", url);
        wx.getFileSystemManager().readFile({
          filePath: url,
          encoding: 'base64',
          success: (res) => {
            resolve(res.data)
          },
          fail: (res) => {
            base64 = "ERROR BASE64"
          }
        });
      },
      fail: (res) => {
        console.log('wx.chooseMedia()调用失败');
      }
    })
  }).then(data => {
    base64 = data
  })
  // console.log(base64)
  return base64
};
module.exports = albumBase64