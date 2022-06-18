/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-19 02:42:25
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
    HistoryAnswer: [], // 回答记录
  },

  onLoad(options) {
    let app = getApp();
    let discussionHistory = app.globalData.userInfo.discussionHistory; // 获取用户查询记录
    let answerHistory = app.globalData.userInfo.answerHistory;
    this.history(discussionHistory, this);
    this.history(answerHistory, this, "discussionAnswer");
  },

  // 查看讨论历史
  /**
   * @description:
   * @param {array} h // 历史记录 _id
   * @param {this} e // this
   * @param {string} db_name // 数据库名称
   * @return {*}
   */
  history: async (h, e, db_name = "discussion") => {
    let that = e;
    let discussionHistory = Array();
    console.log("h==>", h, db_name);
    for (let i = 0; i < h.length; i++) {
      let tt = await History(h[i], db_name);
      discussionHistory.push(tt);
    }

    if (db_name === "discussion") {
      that.setData({
        History: discussionHistory,
      });
    } else if (db_name === "discussionAnswer") {
      console.log("answerHistory", discussionHistory);
      that.setData({
        HistoryAnswer: discussionHistory,
      });
    }
  },

  // 查看详情页面
  GoDetail:async (e) => {
    let _id = e.target.dataset._id; // 详情页面 _id
    let answer = e.target.dataset.answer;
    console.log(answer);
    console.log(_id);
    if (answer === "true") {
      _id = await AnswerToDiscuss(_id)
    }
    console.log("_______id",_id)
    wx.navigateTo({
      url: "../discussionDetails/discussionDetails",
      success: (res) => {
        res.eventChannel.emit("discuss", {
          _id: _id,
        });
      },
    });
  },

  // 页面切换
  changeItem: function (e) {
    this.setData({
      item: e.target.dataset.item,
    });
  },
  // tab切换
  changeTab: function (e) {
    this.setData({
      tab: e.detail.current,
    });
  },
});
