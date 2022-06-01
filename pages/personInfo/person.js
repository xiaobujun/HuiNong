// pages/personInfo/person.js
Page({
  
  data: {
    profile:[1,2,3,4,5],
    flag: 0,
    radioItems: [
      { name: '男', value: 'male',checked: 'true'},
      { name: '女', value: 'female',  },
    ],
    hidden: false
  },
  
  bindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      flag: e.detail.value
    })
  },
})