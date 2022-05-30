Page({
  data: {
    width: 0,
    height: 0,
    // 使可移动盒子居中
    x: 45,
  },
  /**
   * 动态获取设备可用窗口宽高，创建cameraContext
   */
  onLoad: async function (options) {
    let test = await require("../../common/dao/discuss/discuss")(4);
    console.log("test discuss ======> ", test);
  }
  }
)