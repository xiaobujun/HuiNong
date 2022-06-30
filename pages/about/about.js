// pages/about/about.js
const app=getApp()
Page({
  data: {
    about: [
      {
        id: 0,
        icon: '../icons/histories.png',
        title: '浏览历史',
        rightIco: '../icons/右.png'
      },
      {
        id: 1,
        icon: '../icons/feedback.png',
        title: '用户反馈',
        rightIco: '../icons/右.png'
      },
      {
        id: 2,
        icon: '../icons/setting.png',
        title: '分享',
        rightIco: '../icons/右.png'
      }
    ]
  },
  onLoad:function() {
    console.log('全局传过来的',app.globalData.userInfo)
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
  /**
   * 页面跳转
   * @param {} e 
   */
  skip: function (e) {
    var index = e.currentTarget.dataset.index;
    console.log(index);
    switch (index) {
      case 0:
        wx.navigateTo({
          url: '../personInfo/person',
        })
        break;
      case 1:
        wx.navigateTo({
          url: '../history/history',
        })
        break;
      case 2:
        wx.navigateTo({
          url: '../issue/issue',
        })
        break;
      case 3:
        wx.navigateTo({
          url: '../feedback/feedback',
        })
        break;
        case 4:
        wx.navigateTo({
          url: '../setting/setting',
        })
        break;
    }
  }

})