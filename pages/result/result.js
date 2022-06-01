Page({
  /**
   * 页面的初始数据
   */
  data: {},
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    let eventResults = this.getOpenerEventChannel();
    // 接收数据
    eventResults.on("getResults", res => {
      console.log(res)
      let results = require("../../common/formatResultsScore")(res.results)
      that.setData({
        results: results,
        base64: res.base64
      })
    })
    console.log(that.data.results)
    let base64ToImg = require("../../common/base64ToImg")
    that.setData({
      imgBase64: base64ToImg(that.data.base64)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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