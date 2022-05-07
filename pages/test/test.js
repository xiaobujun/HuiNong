Page({
  data: {
    width: 0,
    height: 0,
    // 使可移动盒子居中
    x:45
  },
    /**
   * 动态获取设备可用窗口宽高，创建cameraContext
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
    console.log(this.data.width, this.data.height,this.data.x);
  },

  /**
   * 拍照
   */
  takePhpto:function(){
    var that = this
    that.ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        wx.setStorage({
          key: 'originalImagePath',
          // tempImagePath属性。照片文件的临时路径。
          data: res.tempImagePath,
        })
        wx.navigateTo({
          url: '../cut/cut?path=' + res.tempImagePath
        })
      }
    })
  }
})