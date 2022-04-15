Page({
    data: {
      width: 0,
      height: 0,
      gap: 0,
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
            gap: 40
          })
        },
      });
      console.log(this.data.width + this.data.height);
    },

    /**
     * 获取用户相机授权
     */
    onShow: function () {
      wx.authorize({
        scope: 'scope.camera',
        success: function (res) {
          console.log("获取权限成功")
        },
        fail: function (res) {
          console.log("" + res);
          wx.showModal({
            title: '请求授权您的摄像头',
            content: '如需正常使用此小程序功能，请您按确定并在设置页面授权用户信息',
            confirmText: '确定',
            success: res => {
              if (res.confirm) {
                wx.openSetting({
                  success: function (res) {
                    console.log('成功');
                    console.log(res);
                    if (res.authSetting['scope.camera']) {
                      console.log('设置允许获取摄像头');
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      });
                    } else { //不允许
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      });
                      wx.navigateBack({
                        delta: 1
                      });
                      console.log("获取权限失败");
                    }
                  }
                });
              } else {
                console.log("获取权限失败");
                wx.showToast({
                  title: '授权失败',
                  icon: 'none',
                  duration: 1000
                });
                wx.navigateBack({
                  delta: 1
                });
              }
            },
          })
        }
      })
    },

    /**
     * 从相册选择
     */
    photo(){

    },

    /**
     * 拍摄及格式转换
     */
    takePhoto: function () {
      var that = this
      that.ctx.takePhoto({
          quality: 'high',
          success: (res) => {
            let url = res.tempImagePath
            // 将图片转换为base64格式
            wx.getFileSystemManager().readFile({
              filePath: url,
              encoding: 'base64',
              success(res) {
                //console.log('上传照片成功准备转码')
                let base64 = res.data;
                that.getToken(base64);
              }
            });
          }
        })
      },

    /**
     * 调用百度API
     */
    getToken(base64) {
      // 鉴权认证
      wx.request({
        url: 'https://aip.baidubce.com/oauth/2.0/token',
        data: {
          grant_type: 'client_credentials',
          client_id: 'G1UAnOBAk3Qp3iqbQULIi50G',
          client_secret: 'uXQxPYyfAI4ArralVcLKaue4VdSEBCBt',
        },
        success: (res) => {
          let token = res.data.access_token;
          console.log('调用成功' + res.data.access_token);
          // 调用动物识别API
          wx.request({
            url: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/animal',
            header: {
              "Content-type": "application/x-www-form-urlencoded",
            },
            method: 'post',
            data: {
              image: base64,
              access_token: token,
              baike_num: 1
            },
            success: function (res) {
              //console.log('识别成功跳转页面')
              console.log(res.data.result); //控制台输出识别后得到的数据中的结果
            }
          });
        }
      })
    }
  })