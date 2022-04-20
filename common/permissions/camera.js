export default ()=>{
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
}