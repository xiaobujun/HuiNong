/**
 * 
 * @param {_id} user_id 
 * @returns {object} user info
 */
module.exports = async (user_id) => {
  let db = wx.cloud.database();
  console.log("user id ====> ", user_id);

  return await new Promise((resolve, reject) => {
    db.collection("user").limit(1).where({
        _id: user_id,
      })
      .get({
          success: res => {
              resolve(res.data[0])
          },
          fail: res => {
              console.log("get user info error > ",res)
          }
      });
  })
  .then((res) => {
      return res
  })
};
