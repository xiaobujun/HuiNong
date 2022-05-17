Page({
  //点击显示底部弹框
  clickme: function () {
    this.showModal();
  },

  //弹框动画
  showModal: function () {
    // 显示遮罩
    var animation = wx.createAnimation({
      duration: 400,
      timingFunction: "ease",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
      showModalStatus: true
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 200)
  },
  //隐藏弹框
  hideModal: function () {
    // 隐藏遮罩
    var animation = wx.createAnimation({
      duration: 400,
      timingFunction: "ease",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        showModalStatus: false
      })
    }.bind(this), 200)
  }
})