//获取应用实例
const app = getApp()
Page({
  data: {
    src: '',
    width: 250, //宽度
    height: 250, //高度
    max_width: 300,
    max_height: 300,
    disable_rotate: true, //是否禁用旋转
    disable_ratio: false, //锁定比例
    limit_move: true, //是否限制移动
    bottom_flag: true,
    isFocus: false,
    cropSet: [{
        id: 1,  // 行id
        crop: [{
            cropId: 1,  // 图标id
            cropIcon: '../icons/pesticide.png',
            cropName: '1'
          },
          {
            cropId: 2,
            cropIcon: '../icons/photo.png',
            cropName: '2'
          },
          {
            cropId: 3,
            cropIcon: '../icons/pepper.png',
            cropName: '3'
          }
        ]
      },{
        id: 2,
        crop: [{
            cropId: 4,
            cropIcon: '../icons/pesticide.png',
            cropName: '4'
          },
          {
            cropId: 5,
            cropIcon: '../icons/photo.png',
            cropName: '5'
          },
          {
            cropId: 6,
            cropIcon: '../icons/pepper.png',
            cropName: '6'
          }
        ]
      },{
        id: 3,
        crop: [{
            cropId: 7,
            cropIcon: '../icons/pesticide.png',
            cropName: '7'
          },
          {
            cropId: 8,
            cropIcon: '../icons/photo.png',
            cropName: '8'
          },
          {
            cropId: 9,
            cropIcon: '../icons/pepper.png',
            cropName: '9'
          }
        ]
      }
    ]
  },
  onLoad: function (options) {
    this.cropper = this.selectComponent("#image-cropper");
    this.setData({
      src: options.path
    });
    if (!options.imgSrc) {
      this.cropper.upload(); //上传图片
    }
  },
  loadimage(e) {
    wx.hideLoading();
    console.log('图片');
    this.cropper.imgReset();
  },
  clickcut(e) {
    console.log(e.detail);
    //图片预览
    wx.previewImage({
      current: e.detail.url, // 当前显示图片的http链接
      urls: [e.detail.url] // 需要预览的图片http链接列表
    })
  },
  rotate() {
    //旋转90°
    this.cropper.setAngle(this.cropper.data.angle += 90);
  },

  //弹框动画
  showModal: function () {
    this.cropper.getImg((obj) => {
      app.globalData.imgSrc = obj.url;
    console.log(app.globalData.imgSrc)
  });
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
      showModalStatus: true,
      bottom_flag: false
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
        showModalStatus: false,
        bottom_flag: true
      })
    }.bind(this), 200)
  },

  // 选中效果
  cropSpecies: function () {
    this.setData({
      isFocus: 'gray'
    })
  }
})