Page({
  data: {
    width: 0,
    height: 0,
    // 使可移动盒子居中
    x:45
  },
    /**
   * 动态获取设备可用窗口宽高，创建cameraContext
   */
  onLoad: async function (options) {
    const db = wx.cloud.database()

    db.collection('strawberry').where({
      name:'草莓叶焦病'
      
    })
    .get({
      success: function(res) {
        // res.data 是包含以上定义的两条记录的数组
        console.log('hui',res.data)
      }
    })
  },


})