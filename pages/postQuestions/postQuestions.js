// pages/postQuestions/postQuestions.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // issueClasses 是提问类别。建议采用全中文且字数不要超过12个中文字符
    issueClasses: ['选择提问的类别','类一','ClassTwo','ClassThree','ClassFour','ClassFive'],
    issueClassIdx: 0,
    // 用户上传的图片，建议不超过 9 张
    uploadImages: [
    'http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png',
    ],   // 上传的图片
  },
  pickerChange(res) {
    this.setData({
      issueClassIdx: res.detail.value
    })
  },
})