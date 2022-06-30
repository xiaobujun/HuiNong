/*
 * @Author: Asuka
 * @Date: 2022-06-29 10:30:15
 * @LastEditTime: 2022-06-30 15:45:35
 */

Page({

  data: {
    History: [],          // 历史记录
    informationHistory:[] // 文章id
  },
  /**
   * 从用户表中获取文章id 
   */
  onShow(options) {
    let app = getApp();
    wx.cloud.database().collection('user').where({
      _openid:app.globalData.openid
    })
    .get({
      success:res=>{
        console.log('拿来把你',res.data[0].informationHistory)
        this.setData({
          informationHistory:res.data[0].informationHistory
        })
        let inforHistory = this.data.informationHistory; // 
        this.addHistory(inforHistory);
      }
    })
  },
  /**
   * 将拿到的数据存储到History数组中
   */
  async addHistory(h) {
    let that = this;
    let arr = new Array();
    let db = wx.cloud.database();
    for (let i = 0; i < h.length; i++) {
      let xx = await that.getInformation(db, h[i]);
       arr.push(xx)
       console.log(arr)
    }
    this.setData({
      History: arr
    })
  },
  /**
   * 通过文章id获取到文章的信息
   * @param {数据库操作对象} db 
   * @param {文章id} id 
   */
  async getInformation(db, id) {
    return new Promise(resolve => { 
      db.collection("information")
      .doc(id)
      .get({
        success: function (res) {
          resolve(res)    
        },
        fail: function (res) { console.log('',res) }
      })
    })
    .then(res => {
      return res.data;
    })
  },
  /**
   * 跳转详情页
   */
  toDetail(event) {
    let src = event.currentTarget.dataset.src; // 网站链接
    wx.navigateTo({
      url: "../pageDetail/index",
      success: (res) => {
        res.eventChannel.emit("src", {
          src: src,
        });
      },
    });
  },
});