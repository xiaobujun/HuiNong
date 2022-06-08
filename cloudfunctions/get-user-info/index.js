const cloud = require('wx-server-sdk');

cloud.init();

// 云函数入口函数
exports.main = async event => {
  const { ENV, OPENID, UNIONID, APPID } = cloud.getWXContext();
  // 更新默认配置，将默认访问环境设为当前云函数所在环境
  cloud.updateConfig({
    env: ENV,
  });

  const db = cloud.database();

  try {
    // 查询有没用户数据
    const result = await db
      .collection('users')
      .where({
        openid: OPENID,
      })
      .get();

    return result.data[0];
  } catch (e) {
    return {
      message: e.message,
      code: 1,
    };
  }
};
