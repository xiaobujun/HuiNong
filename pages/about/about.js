// pages/about/about.js
Page({

  data: {
    about: [{
        id: 0,
        icon: '../icons/个人.png',
        title: '个人信息',
        rightIco: '../icons/右.png'
      },
      {
        id: 1,
        icon: '../icons/histories.png',
        title: '浏览历史',
        rightIco: '../icons/右.png'
      },
      {
        id: 2,
        icon: '../icons/send.png',
        title: '我的发布',
        rightIco: '../icons/右.png'
      },
      {
        id: 3,
        icon: '../icons/feedback.png',
        title: '用户反馈',
        rightIco: '../icons/右.png'
      },
      {
        id: 4,
        icon: '../icons/setting.png',
        title: '设置',
        rightIco: '../icons/右.png'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const db = await wx.cloud.database()

    // TODO 判断缓存
    db.collection('user').where({
      name:'ask'
    })
    .get({
      success: res => {
        console.log(res)
        this.setData({
          user_info: res.data[0]
        })
      }
    })
  },
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
          url: '../setting/seting',
        })
        break;
    }
  }

})