// pages/about/about.js
const app=getApp()
Page({
  data: {

  },
  onLoad:function() {
    this.setData({
      userInfo:app.globalData.userInfo
    }) 
  },
  /**
   * 用户登录
   */
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
        wx.cloud.database().collection('user').where({
          _openid:app.globalData.openid
        }).get({
          success(res) {
            console.log('成功获取到该oppenid下的所有数据', res)
            // 如果未注册则添加到数据库
            if (res.data.length == 0) {
              wx.cloud.database().collection('user').add({
                data: {
                  avatar: user.avatarUrl,
                  name: user.nickName
                },
                success(res) {
                  console.log('插入数据成功',res)
                  wx.showToast({
                    title: '登录成功',
                  })
                },
                fail(res){
                  wx.showToast({
                    title: '登录失败',
                    icon:'error'
                  })
                  console.log('失败啦')
                }
              })
            }else{   
              wx.showToast({
                title: '登录成功',
              }) 
              // 如果已注册则更新用户信息
              that.setData({
                userInfo:res.data[0]
              })
            }
          }
        })
      }
    })
  },
  /**
   * 退出登录
   */
  loginOut(){
    app.globalData.userInfo=null
    this.setData({
      userInfo:null
    })
  },

})