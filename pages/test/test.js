Page({
  test(){
    var that=this;
    wx.chooseMedia({
      count:1,
      mediaType:['image'],
      sourceType:['album'],
      sizeType:['original'],
      success:(res)=>{
        let url=res.tempFiles[0].tempFilePath
        wx.setStorageSync("res_imgurl", url);
        wx.getFileSystemManager().readFile({
          filePath: url,
          encoding: 'base64',
          success:(res)=>{
            let base64 = res.data;
              that.getToken(base64);
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
  getToken(base64) {
    // 鉴权认证
    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      data: {
        grant_type: 'client_credentials',
        client_id: 'qw9jD3DnZvpHtcoT6dnc2Wjb',
        client_secret: 'NfflGfhhxikgh3abKAYaLOutqwkqkGGc',
      },
      success: (res) => {
        let token = res.data.access_token;
        console.log('调用成功' + res.data.access_token);
        // 调用动物识别API
        wx.request({
          url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/classification/huinong',
          header: {
            "Content-type": "application/json",
          },
          method: 'post',
          data: {
            image: 111,
            access_token: token,
            top_num: 2
          },
          success:(res)=> {
            //console.log('识别成功跳转页面')
            console.log(res.data.image)
            console.log(res.data); //控制台输出识别后得到的数据中的结果
          },
          fail:(res)=>{
            console.log(this.data.image)
            console.log('调用错误')
          }
        });
      }
    })
  }
})