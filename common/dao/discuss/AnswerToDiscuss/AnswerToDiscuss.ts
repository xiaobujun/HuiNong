/*
 * @Author: Asuka
 * @Date: 2022-06-19 02:02:39
 * @LastEditTime: 2022-06-19 02:54:41
 */

/**
 * @description: 查询 answer 的 discuss _id
 * @param {string} id answer _id
 * @return {string} discuss _id 
 */
 export async function AnswerToDiscuss(id: string) {
    let db = wx.cloud.database();
    let discuss_id;
    return new Promise(async(resolve, reject) => {
        await db.collection("discussion")
        .where({
            answerId: id
        })
        .get({
            success: res => {
                console.log("AnswerToDiscuss ===> ",res)
                discuss_id = res.data[0]._id

                resolve(discuss_id)
            }
        })
    })
    .then(res => {
        console.log("return ====> ",res)
        return res;
    })
}