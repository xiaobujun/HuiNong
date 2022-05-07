Page({
  toMd5: e => {
    var md5 = require('md5');
 
    console.log(md5('message'));
  }    
  ,
  addF: () => {
    wx.cloud.callFunction({
      name:'add',
      data:{
        a:1,
        b:2
      },
      success: res => {
        console.log(res)
      }
    })
  }
})