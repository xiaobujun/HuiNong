// index.js
// 获取应用实例
const app = getApp();
// 数据
const db = wx.cloud.database();
Page({
  data: {
    tabBarHeight: "", // 这是 tabBar 高度。如果没找到其他方法直接取得，那么请保留这个值。
    cameraContainerIsShow: "display", // 这是控制相机容器实现隐藏的属性。用于实现 "广场讨论" 模块的抽屉效果。
    noAnsers: "这个问题还没有回答哦~", // 这是没有回答的时候给出的提示信息
    endTips: "------ 到此为止了啦 o((>ω< ))o ------", // 这是 scroll-view 组件滑到底之后给出的提示信息
    scrollViewHeight: 100, // 这是 scroll-view 组件的高度。
    drawerAnimation: {}, // 存放抽屉动画的对象
    cameraAnimation: {}, // 存放主页上方的动画对象
    drawerFlag: false, // 这是用于判定抽屉是否被打开的开关变量。false 说明没拉开抽屉， true 为抽屉被拉开。
    indexTouchStartX: 0,
    indexTouchStartY: 0,
    id: 0,
    // piazzaContent 的数据目前保留用作测试。 后续按此格式从服务器端获取。
    piazzaContent: [],
  },
  // 跳转到拍照页面
  takePhotoIcon: function (e) {
    wx.navigateTo({
      url: "../takePhoto/takePhoto",
    });
  },
  onLoad: async function () {
    /**
     * 这里我是需要获取 tabBar 高度
     * 不然 scroll-view 组件显示不能完全显示
     * 显示效果欠佳
     */

    let that = this;

    let discuss = require("../../common/dao/discuss/discuss");

    let arr = await discuss(4, this.data.id, 1);

    console.log("dhasxxxxxxx=========", arr);

    that.setData({
      piazzaContent: arr,
    });
    console.log(this.data.piazzaContent);
    wx.getSystemInfo({
      success(res) {
        that.setData({
          tabBarHeight:
            ((res.screenHeight - res.windowHeight - res.statusBarHeight) /
              res.pixelRatio) *
            2,
        });
      },
    });
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
  piazzaScrollMoving(scrRes) {
    console.log(scrRes);
    if (this.data.piazzaContent.length > 2) {
      // 如果广场上卡片数量大于 2
      let that = this; // this 另存为
      let cameraBoxHeight; // 定义一个变量,用来存储主页上方拍照区域盒子的高度
      let piazzaScrQuery = wx.createSelectorQuery(); // 创建一个节点查询器
      let cameraBoxQuery = wx.createSelectorQuery();
      let animation = wx.createAnimation({
        // 创建一个动画对象
        duration: 1200,
        timingFunction: "ease",
        delay: 0,
      });
      // 获取 window.innerHeight
      wx.getSystemInfo({
        success(res) {
          that.setData({
            piazzaScrollHeight: res.windowHeight, // 设置 scroll-view 组件的高度
          });
        },
      });

      piazzaScrQuery.select("#piazzaScroll").scrollOffset(); // 获取滚动条滚动的距离
      cameraBoxQuery.select(".camera_container").boundingClientRect(); // 获取拍照区域盒子的高度
      cameraBoxQuery.exec((res) => {
        // 执行查询
        cameraBoxHeight = res[0].height; // 获取拍照区域盒子的高度
      });
      piazzaScrQuery.exec((res) => {
        // 执行查询
        let specifiedHeight = Math.floor(res[0].scrollHeight * 0.24); // 计算指定位置的高度(必须是整数)
        if (
          (res[0].scrollTop > specifiedHeight &&
            !that.data.drawerFlag &&
            scrRes.detail.deltaY < 0) ||
          scrRes.type == "tap"
        ) {
          // 如果滚动距离到达或超过指定位置
          // --------- 动画,但是开发测试阶段
          this.animation = animation; // 这句和下面 else 里的那句不建议单独提出来，因为很有可能导致动画播放不同步。
          animation.translateY(-1 * cameraBoxHeight).step();
          that.setData({
            drawerFlag: true,
            drawerAnimation: animation.export(),
          });
          that.cameraAnimation(cameraBoxHeight); // 这句和下面 else 里的那句不建议单独提出来，因为很有可能导致动画播放出现问题，会导致动画上的bug
        } else {
          if (
            res[0].scrollTop <= Math.floor(res[0].scrollHeight * 0.0) &&
            that.data.drawerFlag &&
            scrRes.detail.deltaY > 0
          ) {
            // 反向执行上述操作
            // --------- 动画,但是开发测试阶段
            this.animation = animation;
            animation.translateY(0).step();
            that.setData({
              drawerFlag: false,
              drawerAnimation: animation.export(),
            });
            that.cameraAnimation(0);
          }
        }
      });
    }
  },
  cameraAnimation(res) {
    let that = this;
    let animation = wx.createAnimation({
      duration: 1200,
      timingFunction: "ease",
      delay: 0,
    });
    this.animation = animation;
    if (that.data.drawerFlag) {
      animation.translateY(-1 * res).step();
      that.setData({
        cameraAnimation: animation.export(),
      });
    } else {
      animation.translateY(0).step();
      that.setData({
        cameraAnimation: animation.export(),
      });
    }
  },
  //计算滑动角度 start 起点坐标 end 终点坐标
  angle(start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y;
    //返回角度 Math.atan()返回数字的反正切值
    return (360 * Math.atan(_Y / _X)) / (2 * Math.PI);
  },
  indexTouchStart(res) {
    this.setData({
      indexTouchStartX: res.touches[0].clientX,
      indexTouchStartY: res.touches[0].clientY,
    });
  },
  indexTouchEnd(res) {
    let startX = this.data.indexTouchStartX,
      startY = this.data.indexTouchStartY;
    let endX = res.changedTouches[0].clientX,
      endY = res.changedTouches[0].clientY;
    let slidingRange = 45; // 滑动范围
    let angle = this.angle(
      {
        X: startX,
        Y: startY,
      },
      {
        X: endX,
        Y: endY,
      }
    );
    if (Math.abs(angle) > slidingRange && endY < startY) {
      this.piazzaScrollMoving({
        type: "tap",
      });
    }
  },
  toDetails(res) {
    console.log("item _id", res);
    console.log("[INFO] toDetails - res: ", res.currentTarget.dataset.infoid);
    let _id = res.currentTarget.dataset.infoid;
    console.log("已执行转跳");
    let oid = res.target.dataset.id;
    wx.navigateTo({
      url: "../discussionDetails/discussionDetails",
      success: (res) => {
        res.eventChannel.emit("discuss", {
          _id: _id,
        });
      },
    });
  },
});
