// 获取数据集合
module.exports = async (n) => {
  let db = wx.cloud.database();
  return await new Promise((resolve, reject) => {
    db.collection("discussion")
      .limit(4)
      .get({
        success: (res) => {
          resolve(res);
        },
        fail: (res) => {
          console.log(res);
        },
      });
  }).then((res) => {
    return res;
  });
};
