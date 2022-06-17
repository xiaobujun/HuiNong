/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-18 02:44:20
 */

/**
 * @description:
 * @param {number} n discuss num
 * @param {number} an answer count
 * @param {number} anan answer on son answer count
 * @param {string} id discuss _id
 * @return {Array} piazzaContent
 */

module.exports = async (n, id = 0, an = null, anan = null, _id = null) => {
  let piazzaContent = new Array();

  let db_date = require("./getDbs");
  let dbs = await db_date(n, _id);
  let getDiscuss = require("./discussInfo");

  for (let i = 0; i < dbs.data.length; i++) {
    let discuss = await getDiscuss(dbs.data[i], an, anan);
    console.log("[DBS] ===> ", dbs.data[i]);
    discuss._id = dbs.data[i]._id;
    discuss.id = await id;
    id = (await id) + 1;
    // console.log("Main discuss",discuss)
    piazzaContent.push(discuss);
  }

  return piazzaContent;
};
