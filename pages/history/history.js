/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-29 15:47:59
 */

import { History } from "../../common/dao/discuss/History/History";
import { _addLike } from "../../common/dao/discuss/LikeOnDiscuss/AddLike";
import { AnswerToDiscuss } from "../../common/dao/discuss/AnswerToDiscuss/AnswerToDiscuss";
Page({
  /**
   * 页面的初始数据
   */
  data: {
    History: [], // 历史记录
  },

  onLoad(options) {
    let app = getApp();
    let informationHistory = app.globalData.userInfo.informationHistory; // 获取用户查询记录
    this.addHistory(informationHistory);
  },

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

  async getInformation(db, id) {
    return new Promise(resolve => { 
      db.collection("information")
      .doc(id)
      .get({
        success: function (res) {
          resolve(res)    
        },
        fail: function (res) { console.log(res) }
      })
    })
    .then(res => {
      return res.data;
    })
  },

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
