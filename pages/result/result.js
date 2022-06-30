/*
 * @Author: Asuka
 * @Date: 2022-06-29 10:30:15
 * @LastEditTime: 2022-06-30 16:46:08
 */
var timeOut 
Page({
  /**
   * 页面的初始数据
   */
  data: {
    results: [],
  },
  /**
   * 生命周期函数--监听页面加载
   */

  goDetail: function (e) {
    let that = this;

    wx.navigateTo({
      url: "../detail/detail",
      success: (res) => {
        res.eventChannel.emit("plantDetail", {
          info: e.currentTarget.dataset.info.info,
          category: this.data.name,
        });
      },
    });
  },
  onLoad: async function (options) {
    wx.showLoading({
      title: "加载中",
      success: (res) => {
        timeOut = setTimeout(function () {
          wx.showToast({
            title: "超时",
            icon: "error",
            duration: 1000,
          });
          setTimeout(() => {
            wx.navigateBack({
              delta: 1,
            });
          }, 1000);
        }, 6000);
      },
    });

    let that = await this;
    const eventChannel = await this.getOpenerEventChannel();
    //  获取数据
    await eventChannel.on("paramResult", (res) => {
      console.log(res);
      this.setData({
        imgSrc: res.imgSrc,
        category: res.category,
        name: res.name,
      });
    });

    await wx.getFileSystemManager().readFile({
      filePath: this.data.imgSrc,
      encoding: "base64",
      success: (res) => {
        that.setData({
          base64: res.data,
        });
      },
      fail: (res) => {
        base64 = "ERROR BASE64";
      },
    });

    let get_url = require("../../common/parameterAPI/EasyDL");
    let ll = await get_url(this.data.category);
    console.log("ll ====> ", ll);
    let result = await require("../../common/recognition/PlantViruses")(
      that.data.base64,
      ll.API_URL,
      3
    );
    let fResult = require("../../common/formatResultsScore.js");
    let fresult = await fResult(result);

    console.log(fresult, "fresult");
    const db = await wx.cloud.database();
    await fresult.forEach((element) => {
      db.collection(that.data.name)
        .where({
          name: element.name,
        })
        .get({
          success: function (res) {
            console.log("res      ======> ", res);
            // res.data 是包含以上定义的两条记录的数组
            element.info = res.data[0];
            element.description = res.data[0].features;
            element.image =
              "cloud://cloud1-5g1in4pge4a7a57e.636c-cloud1-5g1in4pge4a7a57e-1310462165/plant/" +
              that.data.name +
              "/" +
              element.name +
              "/1.jpeg";
            console.log(
              "需要的图片数据格式",
              that.data.name + "/" + element.name
            );
            console.log("hui", res.data[0], element.description);
            that.setData({
              results: fresult,
            });
            clearTimeout(timeOut);
            wx.hideLoading();
          },
          fail: (res) => {
            console.log(
              "需要的图片数据格式",
              that.data.name + "/" + element.name
            );
            wx.hideLoading();
            wx.showToast({
              title: "数据待补充",
              icon: "error",
              duration: 1500,
            });

            console.log(res);
          },
        });
    });
  },
});
