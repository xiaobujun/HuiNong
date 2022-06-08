// pages/test/test.js
const app = getApp();
Page({
  data: {

  },
  onLoad() {},
  login() {
    var that = this
    // 获取用户信息
    wx.getUserProfile({
      desc: '登录',
      success: (res) => {
        console.log('成功获取到用户信息', res.userInfo)
        var user = res.userInfo
        that.setData({
          userInfo: user
        })
        // 判断先前是否已经注册过
        wx.cloud.database().collection('users').where({
          _openid:app.globalData.oppenid
        }).get({
          success(res) {
            console.log('成功获取到该oppenid下的所有数据', res)
            // 如果未注册则添加到数据库
            if (res.data.length == 0) {
              wx.cloud.database().collection('users').add({
                data: {
                  avatarUrl: user.avatarUrl,
                  nickName: user.nickName
                },
                success(res) {
                  console.log('插入数据成功',res)
                  wx.showToast({
                    title: '登录成功',
                  })
                },
                fail(res){
                  console.log('失败啦')
                }
              })
            }else{    // 如果已注册则更新用户信息
              that.setData({
                userInfo:res.data[0]
              })
            }
          }
        })
      }
    })
  }

})