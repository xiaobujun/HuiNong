// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    
  },
  // 跳转到拍照页面
 takePhotoIcon:function(e){
   
   wx.navigateTo({
     url: '../takePhoto/takePhoto',
   })
 }

})
