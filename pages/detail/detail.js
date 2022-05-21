// pages/detail/detail.js
Page({

  data: {
    indicatorDots: true,
    autoplay: true,
    circular: true,
    interval: 4000,
    duration: 500,
    previousMargin: '0',
    nextMargin: '0',
    banner:[
      {
        id:1,
        imageSrc:'../icons/轮播图测试/雨.jpg',
      },
      {
        id:2,
        imageSrc:'../icons/轮播图测试/妹子.jpg',
      },
      {
        id:3,
        imageSrc:'../icons/轮播图测试/夏日.jpg',
      }
    ],
    nameOfDisease:'这是学名',
    classifyDetail:'这里是分类及别名内容',
    featuresDetail:'这里是形态特征内容',
    treatmentDetail:'这里是防治方法内容'
    // nameOfDisease:'测试名字',
    // classify:'别名',
    // features:'特征',
    // treatment:'防治方法'
    // detail:[
    //   {
    //     id:1,
    //     name:'学名',
    //     alias:'别名',
    //     features:'这里写特征',
    //     treatment:'这里写治疗方法'
    //   }
    // ]
  },
})