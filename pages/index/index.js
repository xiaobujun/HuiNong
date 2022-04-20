// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    tabBarHeight: '', // 这是 tabBar 高度。如果没找到其他方法直接取得，那么请保留这个值。
  },
  // 跳转到拍照页面
  takePhotoIcon: function (e) {

    wx.navigateTo({
      url: '../takePhoto/takePhoto',
    })
  },
  onLoad() {
    /**
     * 这里我是需要获取 tabBar 高度
     * 不然 scroll-view 组件显示不能完全显示
     * 显示效果欠佳
     */
    let that = this;
    wx.getSystemInfo({
      success(res) {
        that.setData({
          tabBarHeight: ((res.screenHeight - res.windowHeight - res.statusBarHeight) / res.pixelRatio) * 2
        })
      }
    })
    // 获取完毕
  },

})