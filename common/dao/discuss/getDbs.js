/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-12 02:33:08
 */

/**
 * @description:
 * @param {*} n discuss count
 * @param {*} id discuss _id
 * @return {*}
 */
module.exports = async (n, id) => {
  let db = wx.cloud.database();
  return await new Promise((resolve, reject) => {
    if (id === null) {
      db.collection("discussion")
        .limit(n)
        .get({
          success: (res) => {
            resolve(res);
          },
          fail: (res) => {
            console.log(res);
          },
        });
    }else{
      db.collection("discussion")
      .where({
        _id: id
      })
      .limit(n)
      .get({
        success: (res) => {
          resolve(res);
        },
        fail: (res) => {
          console.log(res);
        },
      }); 
    }
  }).then((res) => {
    return res;
  });
};
