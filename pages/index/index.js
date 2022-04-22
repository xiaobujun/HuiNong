// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    tabBarHeight: '',   // 这是 tabBar 高度。如果没找到其他方法直接取得，那么请保留这个值。
    cameraContainerIsShow: false,   // 这是控制相机容器实现隐藏的属性。用于实现 "广场讨论" 模块的抽屉效果。
    noAnsers: '这个问题还没有回答哦~',    // 这是没有回答的时候给出的提示信息
    endTips: '------ 到此为止了啦 o((>ω< ))o ------',     // 这是 scroll-view 组件滑到底之后给出的提示信息
    scrollViewHeight: 46,   // 这是 scroll-view 组件的高度。
    drawerAnimation: {},    // 存放抽屉动画的对象

    // piazzaContent 的数据目前保留用作测试。 后续按此格式从服务器端获取。
    piazzaContent:[
      {
        id: 0,    // id 是每张卡片的唯一标识。
        uBasicInfo: {   // uBasicInfo 是用户的基本信息组。
          uid: '15972893',    // uid 是用户的唯一标识。
          nickName: '零点能',   // nickName 是用户的昵称。
          avatarImgSrc: 'http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg',    // avatarImgSrc 是用户的头像地址。
          releaseDate: '2022-04-20 12:30 PM',   // releaseDate 是用户发布的时间。
          crop: '辣椒', 
        },
        question:{    // question 是问题的信息组。
          qBubbleImgSrc: '../icons/questionBubble@3x.png',    // qBubbleImgSrc 是问题的气泡图片地址。
          qDescription: '不知道什么原因这几天叶子变得很黄，还出现好多的虫子，打什么药才好呢？',   // qDescription 是问题的描述。
          qText: '问',
          qImgs: [    // qImgs 是问题的图片地址组。
            {
              src: 'http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png',
            }
          ]
        },
        answer: {   // answer 是回答的信息组。
          aBubbleImgSrc: '../icons/answerBubble@3x.png',    // aBubbleImgSrc 是回答的气泡图片地址。
          aText: '答',
          auid: '',   //  auid 是回答的用户(答主)的唯一标识。
          answerNickName: '长沙作物专家',     // answerNickName 是回答的用户(答主)的昵称。
          aAvatarImgSrc: 'http://i2.hdslb.com/bfs/face/c1bbee6d255f1e7fc434e9930f0f288c8b24293a.jpg',   // aAvatarImgSrc 是回答的用户(答主)的头像地址。
          aDescription: '叶片斑驳褪绿发黄,病毒呈病叶型症状,除种子带毒外蚜虫为害,即接触传染都会传染引起,肥料配比不科学,连作地阿巴阿巴阿巴阿巴.学习新思想,争做新青年'   // aDescription 是回答的内容。
        },
        totalView: '220',   // totalView 是回答的总浏览数。
        totalAnswer: '0',   // totalAnswer 是回答的总数。
      },
      {
        id: 1,
        uBasicInfo: {
          uid: '15431912',
          nickName: 'Lynnrin',
          avatarImgSrc: 'http://i2.hdslb.com/bfs/face/9e5eab47e37f315533d46934b0978cd7cc2b0acf.jpg',
          releaseDate: '2022-04-20 14:37 PM',
          crop: '西红柿',
        },
        question:{
          qBubbleImgSrc: '../icons/questionBubble@3x.png',
          qDescription: '不知道什么原因这几天叶子变得很黄，还出现好多的虫子，打什么药才好呢？',
          qText: '问',
          qImgs: [
            {
              src: 'http://i1.hdslb.com/bfs/face/e93dd9edfa7b9e18bf46fd8d71862327a2350923.png',
            },
            {
              src: 'http://i1.hdslb.com/bfs/face/e93dd9edfa7b9e18bf46fd8d71862327a2350923.png',
            },
            {
              src: 'http://i1.hdslb.com/bfs/face/e93dd9edfa7b9e18bf46fd8d71862327a2350923.png',
            }
          ]
        },
        answer: {
          aBubbleImgSrc: '../icons/answerBubble@3x.png',
          aText: '答',
          auid: '',
          answerNickName: '长沙作物专家',
          aAvatarImgSrc: 'http://i2.hdslb.com/bfs/face/ef0457addb24141e15dfac6fbf45293ccf1e32ab.jpg',
          aDescription: '叶片斑驳褪绿发黄,病毒呈病叶型症状,除种子带毒外蚜虫为害,即接触传染都会传染引起,肥料配比不科学,连作地阿巴阿巴阿巴阿巴.学习新思想,争做新青年'
        },
        totalView: '220',
        totalAnswer: '12',
      },
      {
        id: 2,
        uBasicInfo: {
          uid: '15972893',
          nickName: 'oooooomygosh',
          avatarImgSrc: 'http://i2.hdslb.com/bfs/face/54b2cb29d8222be20addda530fe954a53db4744b.jpg',
          releaseDate: '2022-04-20 14:49 PM',
          crop: '辣椒',
        },
        question:{
          qBubbleImgSrc: '../icons/questionBubble@3x.png',
          qDescription: '不知道什么原因这几天叶子变得很黄，还出现好多的虫子，打什么药才好呢？',
          qText: '问',
          qImgs: [
            {
              src: 'http://i2.hdslb.com/bfs/face/82896ff40fcb4e7c7259cb98056975830cb55695.png',
            },
            {
              src: 'http://i2.hdslb.com/bfs/face/82896ff40fcb4e7c7259cb98056975830cb55695.png',
            },
            {
              src: 'http://i2.hdslb.com/bfs/face/82896ff40fcb4e7c7259cb98056975830cb55695.png',
            }
          ]
        },
        answer: {
          aBubbleImgSrc: '../icons/answerBubble@3x.png',
          aText: '答',
          auid: '',
          answerNickName: '长沙作物专家',
          aAvatarImgSrc: 'http://i0.hdslb.com/bfs/face/d4de6a84557eea8f18510a3f61115d96832aa071.jpg',
          aDescription: '叶片斑驳褪绿发黄,病毒呈病叶型症状,除种子带毒外蚜虫为害,即接触传染都会传染引起,肥料配比不科学,连作地阿巴阿巴阿巴阿巴.学习新思想,争做新青年'
        },
        totalView: '220',
        totalAnswer: '12',
      },
      {
        id: 3,
        uBasicInfo: {
          uid: '15972893',
          nickName: '茂的模',
          avatarImgSrc: 'http://i0.hdslb.com/bfs/face/e8b9df8a86109dcbd1912013d1caf2118abf0578.jpg',
          releaseDate: '2022-04-20 14:50 PM',
          crop: '辣椒',
        },
        question:{
          qBubbleImgSrc: '../icons/questionBubble@3x.png',
          qDescription: '不知道什么原因这几天叶子变得很黄，还出现好多的虫子，打什么药才好呢？',
          qText: '问',
          qImgs: [
            {
              src: 'http://i0.hdslb.com/bfs/face/f6a31275029365ae5dc710006585ddcf1139bde1.png',
            },
            {
              src: 'http://i0.hdslb.com/bfs/face/f6a31275029365ae5dc710006585ddcf1139bde1.png',
            },
            {
              src: 'http://i0.hdslb.com/bfs/face/f6a31275029365ae5dc710006585ddcf1139bde1.png',
            }
          ]
        },
        answer: {
          aBubbleImgSrc: '../icons/answerBubble@3x.png',
          aText: '答',
          auid: '',
          answerNickName: '长沙作物专家',
          aAvatarImgSrc: 'http://i0.hdslb.com/bfs/face/79035c4f21e492b7f409de75354d07a2f581766b.jpg',
          aDescription: '叶片斑驳褪绿发黄,病毒呈病叶型症状,除种子带毒外蚜虫为害,即接触传染都会传染引起,肥料配比不科学,连作地阿巴阿巴阿巴阿巴.学习新思想,争做新青年'
        },
        totalView: '220',
        totalAnswer: '12',
      },
    ],
  },
  // 跳转到拍照页面
  takePhotoIcon: function (e) {

   wx.navigateTo({
     url: '../takePhoto/takePhoto',
   })
 },
 onLoad() {
  /**
   * 这里我是需要获取 tabBar 高度
   * 不然 scroll-view 组件显示不能完全显示
   * 显示效果欠佳
   */
  let that = this;
   wx.getSystemInfo({
    success(res) {
      that.setData({
        tabBarHeight: ((res.screenHeight - res.windowHeight - res.statusBarHeight) / res.pixelRatio) * 2
      })
    }
  })
  // 获取完毕
 },
 /**
  * 下面这个是 scroll-view 组件的滚动事件(滚动时触发)
  * 实现的是上拉到指定位置时,自动拉出,全屏显示
  * 下滑到指定位置时,自动收回,部分显示
  * 原理很简单直接,就是暴力的把除 scroll-view 组件外的其他组件都隐藏掉
  * 然后重设 scroll-view 组件的高度:D
  * 收回这个线性抽屉则将上述操作反向即可
  * 但是欠缺了动画XD
  */
 piazzaScrollMoving() {
  if (this.data.piazzaContent.length > 2 ) {    // 如果广场上卡片数量大于 2
    let that = this;    // this 另存为
    let piazzaScrQuery = wx.createSelectorQuery();    // 创建一个节点查询器
    piazzaScrQuery.select('#piazzaScroll').scrollOffset();    // 获取滚动条滚动的距离
    piazzaScrQuery.exec((res) => {    // 执行查询
      let lowerHeight = res[0].scrollHeight;
      let specifiedHeight = Math.floor(res[0].scrollHeight * 0.1);    // 计算指定位置的高度(必须是整数)
      if (res[0].scrollTop > specifiedHeight) {    // 如果滚动距离到达或超过指定位置
        that.setData({
          cameraContainerIsShow: true    // 隐藏其他组件
        })
        // --------- 动画,但是开发测试阶段
        let animation = wx.createAnimation({
          duration: 1000,
          timingFunction: 'ease',
        })
        this.animation = animation;
        animation.scale(1,1).height("55vh").opacity(1).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 46,
        })
        animation.scale(0.9,0.9).height("45vh").opacity(0.9).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 56,
        })
        animation.scale(0.8,0.8).height("30vh").opacity(0.8).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 61,
        })
        animation.scale(0.6,0.6).height("15vh").opacity(0.6).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 76,
        })
        animation.scale(0.4,0.4).height("9vh").opacity(0.4).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 85,
        })
        animation.scale(0.2,0.2).height("3vh").opacity(0.2).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 93,
        })
        animation.scale(0.1,0.1).height("1vh").opacity(0.1).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 100,
        })
        animation.scale(0,0).height("0vh").opacity(0).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 102,
        })
        // --------- 动画部分结束
        that.setData({
          // scrollViewHeight: 102,   // 设置 scroll-view 组件的高度
        })   
      } else {    // 反向执行上述操作
        that.setData({
          cameraContainerIsShow: false,
        })
        // --------- 动画,但是开发测试阶段
        let animation = wx.createAnimation({
          duration: 1000,
          timingFunction: 'ease',
        })
        this.animation = animation;
        animation.scale(0,0).height("0vh").opacity(0).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 102,
        })
        animation.scale(0.1,0.1).height("1vh").opacity(0.1).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 100,
        })
        animation.scale(0.2,0.2).height("3vh").opacity(0.2).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 93,
        })
        animation.scale(0.4,0.4).height("9vh").opacity(0.4).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 85,
        })
        animation.scale(0.6,0.6).height("15vh").opacity(0.6).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 76,
        })
        animation.scale(0.8,0.8).height("30vh").opacity(0.8).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 61,
        })
        animation.scale(0.9,0.9).height("45vh").opacity(0.9).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 56,
        })
        animation.scale(1,1).height("55vh").opacity(1).step();
        that.setData({
          drawerAnimation: animation.export(),
          scrollViewHeight: 46,
        })
        // ---------
        that.setData({
          // scrollViewHeight: 46,
        })
      }
    })
  } 
 },
})
