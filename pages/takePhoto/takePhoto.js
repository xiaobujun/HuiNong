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
    let albumToBase64 = require("../../common/transitionDate/fromAlbumToBase64")
    // 获取access_token
    let getAccessToken = require("../../common/optimset/easydlToken")
    // 获取识别结果
    let getResult = require("../../common/recognition/PlantViruses")

    let base64 = await albumToBase64()
    let access_token = await getAccessToken()
    let results = await getResult(base64, access_token, 3)

    wx.navigateTo({
      url: '../result/index',
      success: res => {
        res.eventChannel.emit('getResults', {
          results: results,
          base64: base64
        })
      }
    })
    console.log("results", results)
  },

  /**
   * 拍摄
   */
  async takePhoto() {
    let carmera = require("../../common/transitionDate/fromCameraToBase64")
    let getAccessToken = require("../../common/optimset/easydlToken")
    let getResult = require("../../common/recognition/PlantViruses")

    let base64 = await carmera(this.ctx)
    let access_token = await getAccessToken()
    let results = await getResult(base64, access_token, 3)
    console.log("base64", results)

    wx.navigateTo({
      url: '../result/index',
      success: res => {
        res.eventChannel.emit('getResults', {
          results: results,
          base64: base64
        })
      }
    })
  },

})