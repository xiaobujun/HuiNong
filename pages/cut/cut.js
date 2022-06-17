//获取应用实例
const app = getApp();
Page({
  data: {
    sele: -1,
    src: "",
    width: 250, //宽度
    height: 250, //高度
    max_width: 300,
    max_height: 300,
    disable_rotate: true, //是否禁用旋转
    disable_ratio: false, //锁定比例
    limit_move: true, //是否限制移动
    bottom_flag: true,
    isFocus: false,
    cropMap: [
      {
        cropId: 0, // 图标id
        cropIcon: "../icons/虫害.png",
        cropName: "虫害",
        name: "pestis"
      },
      {
        cropId: 1,
        cropIcon: "../icons/番茄.png",
        cropName: "番茄",
        name: "tomato"
      },
      {
        cropId: 2,
        cropIcon: "../icons/草莓.png",
        cropName: "草莓",
        name: "strawberry"
      },{
        cropId: 3, // 图标id
        cropIcon: "../icons/豆角.png",
        cropName: "豆角",

      },
      {
        cropId: 4,
        cropIcon: "../icons/白菜.png",
        cropName: "白菜",
        name: "tomato"
      },
      {
        cropId: 5,
        cropIcon: "../icons/玉米.png",
        cropName: "玉米",
        name: "strawberry"
      },{
        cropId: 6, // 图标id
        cropIcon: "../icons/大蒜.png",
        cropName: "大蒜",
      },
      {
        cropId: 7,
        cropIcon: "../icons/茄子.png",
        cropName: "茄子",
        name: "tomato"
      },
      {
        cropId: 8,
      cropIcon: "../icons/南瓜.png",
        cropName: "南瓜",
        name: "strawberry"
      },{
        cropId: 9, // 图标id
        cropIcon: "../icons/辣椒.png",
        cropName: "辣椒",
      },
      {
        cropId: 10,
        cropIcon: "../icons/萝卜.png",
        cropName: "萝卜",
        name: "tomato"
      },
      {
        cropId: 11,
        cropIcon: "../icons/番薯.png",
        cropName: "番薯",
        name: "strawberry"
      }
    ]
  },
  // 获取传递的临时地址
  onLoad: async function (options) {
    this.cropper = await this.selectComponent("#image-cropper");
    // this.setData({
    //   src: options.path

    const eventChannel = await this.getOpenerEventChannel();
    await eventChannel.on("teleUrl", (res) => {
      this.setData({
        src: res.url,
      });
    });
  },

  cropperload(e) {
    console.log("cropper加载完成");
  },
  loadimage(e) {
    wx.hideLoading();
    console.log("图片");
    this.cropper.imgReset();
  },
  clickcut(e) {
    console.log(e.detail.url);
    //图片预览
    wx.previewImage({
      current: e.detail.url, // 当前显示图片的http链接
      urls: [e.detail.url], // 需要预览的图片http链接列表
    });
  },

  submit() {
    this.cropper.getImg((obj) => {
      app.globalData.imgSrc = obj.url;
    });
  },
  rotate() {
    //旋转90°
    this.cropper.setAngle((this.cropper.data.angle += 90));
  },

  //弹框动画
  showModal: async function () {
   
    await this.cropper.getImg((obj) => {
      app.globalData.imgSrc = obj.url;
      console.log(app.globalData.imgSrc)
      this.setData({
        imgSrc:app.globalData.imgSrc
      })
    })
    // 显示遮罩
    var animation = wx.createAnimation({
      duration: 400,
      timingFunction: "ease",
      delay: 0,
    });
    this.animation = animation;
    animation.translateY(300).step();
    this.setData({
      animationData: animation.export(),
      showModalStatus: true,
      bottom_flag: false,
    });
    setTimeout(
      function () {
        animation.translateY(0).step();
        this.setData({
          animationData: animation.export(),
        });
      }.bind(this),
      200
    );
  },
  //隐藏弹框
  hideModal: function () {
    // 隐藏遮罩
    var animation = wx.createAnimation({
      duration: 400,
      timingFunction: "ease",
      delay: 0,
    });
    this.animation = animation;
    animation.translateY(300).step();
    this.setData({
      animationData: animation.export(),
    });
    setTimeout(
      function () {
        animation.translateY(0).step();
        this.setData({
          animationData: animation.export(),
          showModalStatus: false,
          bottom_flag: true,
        });
      }.bind(this),
      200
    );
  },

  // 选中效果
  cropSpecies: async function (e) {
    let that = this;
    new Promise((resolve) => {
      //  console.log(e)
      let sele = e.currentTarget.dataset.sele;
      resolve(sele);
    }).then((sele) => {
      // console.log(sele)
      that.setData({
        sele: sele,
      });

      console.log("sele", this.data.sele);
    });
  },
  goResult: async function () {
    let that = this
    if (this.data.sele > this.data.cropMap || this.data.sele < 0) {
      wx.showToast({
        title: "选择不正确",
        icon: "error",
      });
    } else {
      await wx.navigateTo({
        url: "../result/result",
        success: res => {
          res.eventChannel.emit('paramResult', {
            imgSrc: this.data.imgSrc,
            category: this.data.cropMap[this.data.sele].cropName,
            name: this.data.cropMap[this.data.sele].name,
          })
        }
      });
    }

    
    ;
  },
});
