Page({
  test(){
    var that=this;
    wx.chooseMedia({
      // 设置读取数据的类型
      count:1,
      mediaType:['image'],
      sourceType:['album'],
      sizeType:['original'],
      success:(res)=>{
        let url=res.tempFiles[0].tempFilePath
        wx.setStorageSync("res_imgurl", url);
        // 照片转成base64
        wx.getFileSystemManager().readFile({
          filePath: url,
          encoding: 'base64',
          success:(res)=>{
            // 更新数据
            let base64 = res.data;
            that.setData({
              base64: base64
            })
            // 发送数据
            that.getToken();
          },
          fail:(res)=>{
            console.log(res);
            console.log('格式转换失败');
          }
        });
        console.log(res.tempFiles);
      },
      fail:(res)=>{
        console.log('wx.chooseMedia()调用失败');
      }
    })
  },
  getToken() {
    let this_ = this
    // 鉴权认证
    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      data: {
        grant_type:'client_credentials',
        client_id:'mTzozXMfAjy0i2pugklNexRX',
        client_secret:'vSl3hpZiYX9YIX6HtfNiF7YalSYqULFB'
      },
      success: res => {
        // 设置access_token
        let token = res.data.access_token;
        this_.setData({
          access_token: token
        })
        // console.log('调用成功' + res.data.access_token);
        
        // 发送请求获取扫描信息
        wx.request({
          url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/classification/miao213?access_token=' + this_.data.access_token,
          header: {
            "Content-type": "application/json",
          },
          method: 'POST',
          data:{
            "image": this_.data.base64,
            "top_num": 3
          },
          // 成功获取了数据
          success:(res)=> {
            console.log(res)
            //console.log('识别成功跳转页面')
            // console.log(res.data.image)
            // console.log(res.data); //控制台输出识别后得到的数据中的结果
          },
          fail:(res)=>{
            // console.log(this.data.image)
            console.log('没有获取到数据')
          }
        });
      }
    })
  }
})