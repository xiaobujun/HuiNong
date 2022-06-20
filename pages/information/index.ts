/*
 * @Author: Asuka
 * @Date: 2022-06-19 23:39:46
 * @LastEditTime: 2022-06-20 01:59:34
 */
// pages/information/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    active: 0,
    pages: [
      {
        thumb: 'https://pansci.asia/wp-content/uploads/2022/05/Three-color_image_of_galaxy_HD1-1020x574.jpeg',
        title: '極目遠眺的意義：天文學家為何追尋第一代星系',
        desc: '近日，來自東京大學和倫敦大學學院的科學家 播金優一（Yuichi Harikane） 在天文物理期刊《The Astrophysical Journal》發表了一篇論文，宣稱他們可能找到目前最遠的星系（名為 HD-1，紅移值 z 約為 13），打破了原本最遠（GNz-11，z 約為 11）的紀錄。',
        date: '2022/05/15 ',
        src:'https://pansci.asia/archives/348113'
      },
      {
        thumb: 'https://pansci.asia/wp-content/uploads/2022/05/Three-color_image_of_galaxy_HD1-1020x574.jpeg',
        title: '極目遠眺的意義：天文學家為何追尋第一代星系',
        desc: '近日，來自東京大學和倫敦大學學院的科學家 播金優一（Yuichi Harikane） 在天文物理期刊《The Astrophysical Journal》發表了一篇論文，宣稱他們可能找到目前最遠的星系（名為 HD-1，紅移值 z 約為 13），打破了原本最遠（GNz-11，z 約為 11）的紀錄。',
        date: '2022/05/15 ',
        src:'https://pansci.asia/archives/348113'
      }
    ],  // 文章
    videos:[
      {
        thumb: 'https://gimg0.baidu.com/gimg/src=http%3A%2F%2Ff7.baidu.com%2Fit%2Fu%3D2431097757%2C2579495832%26fm%3D222%26app%3D108%26f%3DJPEG&refer=http%3A%2F%2Fwww.baidu.com&app=2026&size=f672_448&n=0&g=0n&q=80?sec=0&t=89aea5a23a52b5baa964afb75ee80655',
        title: '几个实用种植小技巧一般人我都不告诉！学到就是赚到',
        desc: '近日，來自東京大學和倫敦大學學院的科學家 播金優一（Yuichi Harikane） 在天文物理期刊《The Astrophysical Journal》發表了一篇論文，宣稱他們可能找到目前最遠的星系（名為 HD-1，紅移值 z 約為 13），打破了原本最遠（GNz-11，z 約為 11）的紀錄。',
        date: '2022/05/15 ',
        src:'https://haokan.baidu.com/v?vid=16234512078844016411'
      }
    ]// 视频
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * @description: 文章详情页面
   * @return {*}
   */
  toDetail(event) {
    let src = event.currentTarget.dataset.src

    console.log(src)
    wx.navigateTo({
      url: "../pageDetail/index",
      success: (res) => {
        res.eventChannel.emit("src", {
          src: src,
        });
      },
    });
  }
})