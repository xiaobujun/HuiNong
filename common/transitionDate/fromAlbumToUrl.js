let URL = "ERROR";
async function albumUrl() { 
  await new Promise(resolve => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['original'],
      success: (res) => {
        let url = res.tempFiles[0].tempFilePath
        resolve(url)
      },
      fail: (res) => {
        console.log('wx.chooseMedia()调用失败');
      }
    })
  }).then(url => {
    URL = url
  })
  // console.log(base64)
  return URL
};
module.exports = albumUrl