// 查看用户是否有登陆过
export async function user_info() {
  var app = getApp();
  console.log(app);
  var info = await wx.getStorageSync("user_info");
  console.log("user_info", info);

  // 没有用户缓存数据,不进行处理
  // if (value === ''){
  //     info = 'not '
  // }

  // 存在userinfo
  if (info != "") {
     app.globalData.userInfo = "info";
     console.log("app.globalData.userInfo", app.globalData);
  }
  return info;
}
