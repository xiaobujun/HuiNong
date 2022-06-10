Page({
  /**
   * 页面的初始数据
   */
  data: {
    results: [],
  },
  /**
   * 生命周期函数--监听页面加载
   */

  goDetail: function (e) {
    let that = this
    console.log('hello')
    console.log('goDetail', e.currentTarget.dataset.info.info)
    wx.navigateTo({
      url: "../detail/detail",
      success: res => {
        res.eventChannel.emit('plantDetail', {
          info: e.currentTarget.dataset.info.info,
          category: this.data.name
        })
      }
    })
  },
  onLoad: async function (options) {
    let that = await this
    const eventChannel = await this.getOpenerEventChannel();
    //  获取数据
    await eventChannel.on("paramResult", (res) => {
      console.log(res)
      this.setData({
        imgSrc: res.imgSrc,
        category: res.category,
        name: res.name
      })
    });

    await wx.getFileSystemManager().readFile({
      filePath: this.data.imgSrc,
      encoding: 'base64',
      success: (res) => {
        that.setData({
          base64: res.data
        })
      },
      fail: (res) => {
        base64 = "ERROR BASE64"
      }
    })

    let get_url = require("../../common/parameterAPI/EasyDL")
    let ll = await get_url(this.data.category)
    let result = await require("../../common/recognition/PlantViruses")(that.data.base64, ll.API_URL, 3)
    let fResult = require("../../common/formatResultsScore.js")
    let fresult = await fResult(result)

    const db = await wx.cloud.database()
    console.log('ashduoshadiosahdiosah')
    await fresult.forEach(element => {
      db.collection(that.data.name).where({
          name: element.name
        })
        .get({
          success: function (res) {
            // res.data 是包含以上定义的两条记录的数组
            element.info = res.data[0]
            element.description = res.data[0].features
            element.image = 'cloud://cloud1-5g1in4pge4a7a57e.636c-cloud1-5g1in4pge4a7a57e-1310462165/plant/' + that.data.name + '/' + element.name + '/1.jpeg'
            console.log('hui', res.data[0], element.description)
            that.setData({
              results: fresult
            })

          },
          fail: res => {
            console.log(res)
          }
        })
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

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