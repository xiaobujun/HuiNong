/*
 * @Author: Asuka
 * @Date: 2022-06-29 10:30:15
 * @LastEditTime: 2022-06-29 14:29:54
 */
const app = getApp();
Page({
  data: {
    active: 0,
    agriculture: [], // 农科知识
    policy: [], // 农业政策
  },

  onLoad() {
    var that = this;
    wx.cloud
      .database()
      .collection("information")
      .get({
        success: (res) => {
          that.setData({
            agriculture: res.data,
          });
        },
      });
    wx.cloud
      .database()
      .collection("policy")
      .get({
        success: (res) => {
          that.setData({
            policy: res.data,
          });
        },
      });
  },

  /**
   * @description: 文章详情页面
   * @return {*}
   */
  toDetail(event) {
    let that = this;
    let src = event.currentTarget.dataset.src; // 网站链接
    wx.navigateTo({
      url: "../pageDetail/index",
      success: (res) => {
        res.eventChannel.emit("src", {
          src: src,
        });
        let id = app.globalData.userInfo._id; // 用户id
        let iid = event.currentTarget.dataset.iid; // 资讯id
        that.addHistory(id, iid);
      },
    });
  },

  /**
   * @description: 添加历史记录
   * @param {*} id 用户id
   * @param {*} iid 阅读资讯id
   * @return {*}
   */
  addHistory(id, iid) {
    console.log(id, iid);
    let db = wx.cloud.database();
    let _ = db.command;

    db.collection("user")
      .doc(id)
      .update({
        data: {
          informationHistory: _.unshift(iid),
        },
        success: function(res){
          console.log(res)
        }
      });
  },
});
