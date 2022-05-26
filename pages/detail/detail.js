// pages/detail/detail.js
Page({

  data: {
    indicatorDots: true,
    autoplay: true,
    circular: true,
    interval: 4000,
    duration: 500,
    previousMargin: '0',
    nextMargin: '0'
  },
  onLoad: async function (options) {
    let that = this;

    const eventChannel = await this.getOpenerEventChannel();
    
    await eventChannel.on("plantDetail", (res) => {
      console.log(res)
      this.setData({
        info: res.info,
        category: res.category
      })
    });

    await wx.cloud.callFunction({
      name:'exhibition_Images',
      data: {
        a: this.data.category,
        b: this.data.info.name
      },
      success: res => {
        console.log(res)
        this.setData({
          arrsUrl: res.result.arrsUrl
        })
        console.log('arr',this.data.arrsUrl[1])
        console.log('arr222',this.data.arrsUrl)
      }
    })
    console.log(this.data.arrsUrl)
  }
})