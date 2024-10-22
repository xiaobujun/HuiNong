/*
 * @Author: Asuka
 * @Date: 2022-06-12 01:45:37
 * @LastEditTime: 2022-06-12 02:14:46
 */
/**
 * @description: 
 * @param {*} id
 * @return {*}
 */
module.exports = async (id) => {
  let db = wx.cloud.database();
  return await new Promise((resolve, reject) => {
    db.collection("discussion")
      .where({
        _id: id,
      })
      .limit(1)
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
