module.exports = async (desc_id) => {
    let db = wx.cloud.database();

    return await new Promise((resolve, reject) => {
        db.collection("discussionAnswer").limit(1).where({
            _id: desc_id,
          })
          .get({
              success: res => {
                  resolve(res.data[0])
              },
              fail: res => {
                  console.log("get desc info error > ",res)
              }
          });
    })
    .then (res => {
        return res
    })
}