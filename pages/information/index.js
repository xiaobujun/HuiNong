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
    flag:''
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
        that.judgeIsReocrd(id, iid);
      },
    });
  },

  /**
   * @description: 判断是否存在该记录
   * @param {*} id 用户id
   * @param {*} iid 阅读资讯id
   * @return {*}
   */
  judgeIsReocrd(id, iid) {
    let userId = id
    let articleId = iid
    let that = this
    let db = wx.cloud.database({
      throwOnNotFound: false
    });
    let _ = db.command;
    wx.showLoading({
      title: '加载中',
    })
    db.collection("user").doc(id).get({
      success(res) {
        let array = res.data.informationHistory;
        console.log(array, '读')
        if (array == null) {
          console.log('没有数据')
          that.addHistory(userId, articleId)
        } else {
          let length=array.length
          console.log(array.length)
          for (let i = 0; i < length; i++) {
            if (array[i] == iid) {
              console.log('数据已存在')
              wx.hideLoading()
              that.setData({
                flag : false
              })
            } else {
              that.setData({
                flag :true
              })
            }
          }
          if (that.data.flag == true) {
            console.log('添加啊啊')
            that.addHistory(userId, articleId)
          }
        }
      },
      fail(res) {
        console.log("查询失败", res)
      }
    })
  },
  /**
   * 添加历史记录
   */
  addHistory(id, iid) {
    console.log("添加", id, iid)
    let db = wx.cloud.database({
      throwOnNotFound: false
    })
    let _ = db.command;
    db.collection('user')
      .doc(id)
      .update({
        data: {
          informationHistory: _.unshift(iid),
        },
        success: function (res) {
          wx.hideLoading()
          console.log(res, '添加成功')
        },
        fail: function (res) {
          wx.hideLoading()
          console.log(res, '添加失败')
        }
      })
  }
});