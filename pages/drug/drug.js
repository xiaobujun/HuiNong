Page({
  data: {
    options: [{
      city_id: '001',
      city_name: '北京'
    }, {
      city_id: '002',
      city_name: '上海'
    }, {
      city_id: '003',
      city_name: '深圳'
    }],
    selected: {},
    drugSet:[
      {
        id:1,
        drugIcon:'../icons/农药.jpg',
        drugName:'药名',
        drugPrice:'20￥'
      },{
        id:2,
        drugIcon:'../icons/农药.jpg',
        drugName:'药名',
        drugPrice:'20￥'
      }
    ]
  },
  change (e) {
    this.setData({
      selected: { ...e.detail }
    })
    wx.showToast({
      title: `${this.data.selected.id} - ${this.data.selected.name}`,
      icon: 'success',
      duration: 1000
    })
  },
  close () {
    // 关闭select
    this.selectComponent('.select').close()
  }
})