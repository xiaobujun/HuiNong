/*
 * @Author: Asuka
 * @Date: 2022-06-20 16:43:06
 * @LastEditTime: 2022-06-20 17:17:24
 */
// pages/talkIssue/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    show: false,
    status: ">",
    fileList: [],
    actions: [
      {
        name: '选项',
      },
      {
        name: '选项',
      },
      {
        name: '选项',
        subname: '描述信息',
        openType: 'share',
      },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },
  onSwitch() {
    let show = !this.data.show;
    console.log(show) 
    this.setData({ show: show });
  },
  onClose() {
    this.setData({ show: false });
  },

  onSelect(event) {
    console.log(event.detail);
  },
  afterRead(event) {
    const { file } = event.detail;
    // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
    wx.uploadFile({
      url: 'https://example.weixin.qq.com/upload', // 仅为示例，非真实的接口地址
      filePath: file.url,
      name: 'file',
      formData: { user: 'test' },
      success(res) {
        // 上传完成需要更新 fileList
        const { fileList = [] } = this.data;
        fileList.push({ ...file, url: res.data });
        this.setData({ fileList });
      },
    });
  },
})