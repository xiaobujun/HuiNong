// pages/plantInfo/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      "test":"test"
    })
    let this_ = this
    let eventResults = this.getOpenerEventChannel();
    eventResults.on("plantInfo", res => {
      console.log(res.plant)
      this_.setData({
        plant: res.plant
      })
    })
    console.log(this.data)
    wx.setNavigationBarTitle({
      title: this_.data.plant,
    })
    let db = wx.cloud.database();
    console.log(this_.data.plant)
    db.collection('Plants').where({
      name:this_.data.plant
      })
      .get({
        success: res => {
          console.log(res.data[0])
          this_.setData({
            plant: res.data[0]
          })

          console.log('this_',this_.data.info)
        },
        fail: res => {
          console.log('获取失败', res)
        }
      })
      console.log("onLoad")
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onReady",this.data)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onShow",this.data)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})