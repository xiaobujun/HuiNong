App({
  // 云开发初始化
  async onLaunch() {
    var that = this;
    if(!wx.cloud){
      console.error(' 请使用 2.2.3 或以上的基础库以使用云能力')
    }else{
      wx.cloud.init({
        env:"cloud1-5g1in4pge4a7a57e",
        traceUser:true
      })
    }


    // 获取用户的openid
    wx.cloud.callFunction({
      name:'getOpenId',
      success(res){
        console.log('小程序一加载即获取用户的openid',res)
        that.globalData.openid=res.result.openid
        // 实现自动登录及自动更新
        wx.cloud.database().collection('user').where({
          _openid:res.result.openid
        }).get({
          success(result){
            console.log('自动更新',result)
            that.globalData.userInfo=result.data[0]
            console.log('传过来了没有',that.globalData.userInfo)
          }
        })
      }
    })
  },
  globalData:{
    userInfo:null,
    openid:null
  }
})