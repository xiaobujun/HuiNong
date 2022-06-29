
Page({
  data: {
    active: 0,
    agriculture:[],  // 农科知识
    policy:[]       // 农业政策
  },

  onLoad(){
    var that = this;
    wx.cloud.database().collection('information').get({
      success:res=>{
        that.setData({
          agriculture:res.data,
        })
      }
    })
    wx.cloud.database().collection('policy').get({
      success:res=>{
        that.setData({
          policy:res.data,
        })  
      }
    })
  },


  /**
   * @description: 文章详情页面
   * @return {*}
   */
  toDetail(event) {
    let src = event.currentTarget.dataset.src

    console.log(src)
    wx.navigateTo({
      url: "../pageDetail/index",
      success: (res) => {
        res.eventChannel.emit("src", {
          src: src,
        });
      },
    });
  }
})