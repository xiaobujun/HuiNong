/*
 * @Author: Asuka
 * @Date: 2022-06-20 00:54:31
 * @LastEditTime: 2022-06-20 01:25:39
 */
// pages/pageDetail/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    src: '' //网站地址
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    const eventChannel = await this.getOpenerEventChannel();
    await eventChannel.on("src", (res) => {
      console.log(res);
      //  获取数据信息
      this.setData({
        src: res.src,
      });
    });
  },

})