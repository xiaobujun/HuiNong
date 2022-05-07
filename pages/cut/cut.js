// pages/cut/cut.js
Page({
  data: {
    width:0, // 可用窗口宽
    height:0, // 可用窗口高
    photoPath:'', // 图片路径
    // x,y为截取框的偏移量
    x:0, 
    y:0,
    scale:0, // 缩放比率
    // 裁剪框大小
    cutWidth:0,
    cutHeight:0,
    canvas:null,
    ctx:null
  },

  /**
   * 获取图片截取所需要的参数
   * @param {takePhoto传过来的照片路径} options 
   */
  onLoad: function (options) {
    var that = this
    // 获取相片路径
    that.path = options.path
    this.setData({
      photoPath:this.path
    })
    // 动态获取可用窗口宽高来调整图片大小
    wx.getSystemInfo({
      success(res) {
        that.setData({
          width: res.windowWidth,
          height: res.windowHeight-140,
        })  
      },
    });

    // 获取canvans实例，并传给init()
    wx.createSelectorQuery()
    .select('#canvas')
    .fields({
      id:true,
      node: true,
      size: true
    })
    .exec(this.init.bind(this))
    console.log(this.data.width, this.data.height,this.data.photoPath);
  },

  /**
   * 动态获取裁剪内容
   */
  move:function(e){             // 捕捉移动变化
    var xOffseted=e.detail.x;
    var yOffseted=e.detail.y;
    console.log(xOffseted,yOffseted)
    this.setData({
      x:xOffseted,
      y:yOffseted
    })
    console.log(this.data.x,this.data.y)
  },

  scale:function(e){            // 捕捉缩放变化
    var xOffseted=e.detail.x;
    var yOffseted=e.detail.y;
    var scaled=e.detail.scale;
    console.log(xOffseted,yOffseted,scaled)
    this.setData({
      x:xOffseted,
      y:yOffseted,
      scale:scaled
    })
  },

  /**
   * 画布初始化
   */
  init:function(res){
    var that=this
    console.log(res)
    const canvas = res[0].node
    const ctx = canvas.getContext('2d')
      //新接口需显示设置画布宽高，宽高同照片一致；
      canvas.width = this.data.width
      canvas.height =this.data.height
    this.setData({
          canvas,
          ctx
    });
    // 向画布载入图片的方法
    // that.canvasDraw(); 
    console.log('ctx',this.data.ctx)
  },
  canvasDraw() {
    let img = this.data.canvas.createImage(); // 创建img对象
    img.src = this.data.photoPath;
    let x=this.data.x
    let width=this.data.width
    let height=this.data.height
    
    img.onload = () => {
         // img.complete表示图片是否加载完成，结果返回true和false;
          console.log('内部'+img.complete);//true
          this.data.ctx.drawImage(img, x, y, width, height);
    }
    console.log('外部'+img.complete);//false
  },

  /**
   * 确定截取
   */
  sure() {
  let that = this
  that.canvasDraw()
  draw(false)
  var canvas=this.data.canvas
    this.data.ctx.draw(false,wx.canvasToTempFilePath({
    canvas: canvas,
    canvasId: 'canvas',
    destHeight: this.data.height,  // 输出高
    destWidth: this.data.width,        // 输出宽
    fileType: 'jpg',
    // height: this.data.height-300,      // 画布高，默认为canvs高-y
    quality: 1,
    // width: this.data.width,            // 画布宽
    x: this.data.width*0.05+this.data.x,   // 画布的x轴
    y: this.data.height*0.2+this.data.y,    // 画布的y轴
    success: (res) => {
      console.log(res,'截取成功')
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success(e) {
          wx.showToast({
            title: '保存成功',
            icon: 'none',
            duration: 2000
          })
        },
        fail(e) {
          wx.getSetting({
            success(res) {
              if (!res.authSetting["scope.writePhotosAlbum"]) {
                wx.showModal({
                  title: '警告',
                  content: '请打开相册权限，否则无法保存图片到相册',
                  success(res) {
                    if (res.confirm) {
                      wx.openSetting({
                        success(res) {
                          console.log(res)
                        }
                      })
                    } else if (res.cancel) {
                      wx.showToast({
                        title: '取消授权',
                        icon: "none",
                        duration: 2000
                      })
                    }
                  }
                })
              }
            }
          })
        }
      })
    },
    fail: (res) => {
      console.log(res,'截取失败')
    },
  }, this))
 },

 /**
  * 取消
  */
 cancel(){
   wx.navigateBack({
     delta: 1,
   })
 }

})