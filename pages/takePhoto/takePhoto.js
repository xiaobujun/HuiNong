import openCamera from "../../common/permissions/camera"
Page({
  data: {
    width: 0,
    height: 0,
  },

  /**
   * 动态获取设备屏幕宽高
   */
  onLoad: function (options) {
    console.log('拍照页面加载了');
    var that = this;
    that.ctx = wx.createCameraContext();
    wx.getSystemInfo({
      success(res) {
        that.setData({
          width: res.windowWidth,
          height: res.windowHeight,
        })
      },
    });
    console.log(this.data.width, this.data.height);
  },

  /**
   * 获取用户相机授权
   */
  onShow: function () {
    openCamera()
  },

  /**
   * 从相册选择
   */

  async photo() {
    // 打开相册把选择的照片转换成base64
    let albumToBase64 = require("../../common/transitionDate/fromAlbumToUrl")

    let url = await albumToBase64()

    wx.navigateTo({
      url: '../cut/cut',
      success: res => {
        console.log(url)
        res.eventChannel.emit('teleUrl',{
          url:url
        })
      }
    })
  },

  /**
   * 拍摄
   */
  async takePhoto() {
    let carmera = require("../../common/transitionDate/fromCarmeraToUrl")
    let url = await carmera(this.ctx)
    wx.navigateTo({
      url: '../cut/cut',
      success: res => {
<<<<<<< HEAD
        res.eventChannel.emit('teleUrl',{
=======
        res.eventChannel.emit('teleUrl  ',{
>>>>>>> origin/xiaobu_camera
          url:url
        })
      }
    })
  },
})