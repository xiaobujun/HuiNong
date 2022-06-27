Page({
  data: {
    title:'',     // 标题
    description:'',   // 描述
    previewSize: 160, // 预览大小
    maxCount: 2,      // 上传数量限制
    index:5,          // 帖子类别起始下标
    species:["未选","虫害","番茄","草莓","豆角","白菜","玉米","大蒜","茄子","南瓜","辣椒","萝卜"],    // 帖子类别
    fileList: [],
    photoTemp:[],
  },
  // 图片预览
  afterRead(event) {
    console.log('传',event)
    const {
      file
    } = event.detail;
    const {
      fileList = []
    } = this.data;
    fileList.push({
      ...file
    });
    this.setData({
      fileList
    });
  },
  // 删除图片
  delete(e) {
    let index = e.detail.index
    let fileList = this.data.fileList
    fileList.splice(index, 1)
    this.setData({
      fileList
    })
  },
  // 类别选择
  categoryPicker(e){
    this.setData({
      index: e.detail.value
    })
  },
  // 提交表单
  postForm(){
    var that=this
    let title=this.data.title;
    let index=this.data.index;
    let description=this.data.description;
    let fileLength=this.data.fileList.length
    if(!title){           // 先进行表单验证
      wx.showToast({
        title: '请填写标题',
        icon:'error',
      })
    }else if(index==0){
      wx.showToast({
        title: '请选择类别',
        icon:'error',
      })
    }else if(!description){
      wx.showToast({
        title: '请填写描述',
        icon:'error',
      })
    }else if(!fileLength){
      wx.showToast({
        title: '请添加图片',
        icon:'error',
      })
    }else{                // 再上传到云存储
        //上传图片到云存储及给帖子表添加相应记录
        wx.showLoading({
          title: '上传中',
          mask:'true'
        })
        for(let i=0;i<fileLength;++i){
          let photoUrl=this.data.fileList[i]
          wx.cloud.uploadFile({
            cloudPath:i+'.jpg',
            filePath:photoUrl.url,
            success:res=>{
              console.log(res)
              wx.hideLoading()
              wx.showToast({
                title: '上传成功',
                icon:'success'
              })
            },
            fail:res=>{
              console.log(res)
              wx.hideLoading({
                success: (res) => {
                  wx.showToast({
                    title: '上传失败',
                    icon:'error'
                  })
                },
              })
            }
          })
        }
    }
  }
})