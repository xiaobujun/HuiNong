function base64ToImg (base64){
  console.log('转换base64图片')
  let base64Data = wx.arrayBufferToBase64(wx.base64ToArrayBuffer(base64))
  let base64ImgUrl = "data:image/png;base64," + base64Data
  return base64ImgUrl
}

module.exports = base64ToImg