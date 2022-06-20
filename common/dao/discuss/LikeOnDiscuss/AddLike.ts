/*
 * @Author: Asuka
 * @Date: 2022-06-18 00:39:00
 * @LastEditTime: 2022-06-18 01:47:42
 */


// 添加点赞数量
/**
 * @description: 
 * @param {string} _id 数据库id，默认 discussion 数据库
 * @param {string} db_name 数据库名称
 * @return {*}
 */
export function _addLike(_id: string, db_name: string = "discussion"): void {
    // console.log("_addLike 被调用了", _id, db_name);
    
    let db = wx.cloud.database();

    let _ = db.command;
    db.collection(db_name)
        .doc(_id)
        .update({
            data:{
                liked: _.inc(1)
            },
            success: res => {
                console.log("更新成功",res)
            },
            fail: res => {
                console.log("更新失败",res)
            }
        })

}