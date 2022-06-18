/*
 * @Author: Asuka
 * @Date: 2022-06-18 16:37:28
 * @LastEditTime: 2022-06-19 02:45:29
 */

import { timeFormat } from '../../../format/TimeFormat'
/**
 * @description: 
 * @param {string} _id 用户id
 * @param {string} db_name 数据库名称，默认discuss
 * @return {*}
 */
export async function History(id: string, db_name: string = "discussion") {
    type HistoryType = {
        _id: string,
        cover: string;  // 封面
        title: string;  // 标题
        date: string;   // 日期
    };
    let db = wx.cloud.database();

    let history: HistoryType;

    return await new Promise(async (resolve, reject) => {
        await db.collection(db_name)
            .where({
                _id: id
            })
            .get({
                success: async res => {
                    console.log(db_name, res)
                    let date = res.data[0].date;
                    let format = timeFormat(date)   // 格式化时间
                    if (db_name === "discussion") {
                        history = {
                            _id: id,
                            cover: res.data[0].qImgs[0],
                            title: res.data[0].qDescription,
                            date: format
                        };
                    } else if (db_name === "discussionAnswer") {
                        history = {
                            _id: id,
                            cover: res.data[0].imgs[0],
                            title: res.data[0].aDescription,
                            date: format
                        };
                    }
                    resolve(history)
                }
            })
    })
        .then(res => {
            console.log("history", res)
            return res
        })
}