// pages/history/history.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    diease:[
      {
        date:'5月20日',
        dieaseImage:[
          '../icons/轮播图测试/background1.jpg',
          '../icons/轮播图测试/background1.jpg',
          '../icons/轮播图测试/background1.jpg',
          '../icons/轮播图测试/background1.jpg',
          '../icons/轮播图测试/background1.jpg',
      ]
      },
      {
        date:'5月21日',
        dieaseImage:[
          '../icons/轮播图测试/background1.jpg',
          '../icons/轮播图测试/background1.jpg',
      ]
      }
    ],
  },
    // 页面切换
    changeItem: function(e) {
      this.setData({
        item: e.target.dataset.item,
      })
    },
    // tab切换
    changeTab: function(e) {
      this.setData({
        tab: e.detail.current
      })
    },
})