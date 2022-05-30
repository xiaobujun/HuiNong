// 设置需要有多少个讨论_数组
module.exports = async (n,id) => {
  let piazzaContent = new Array();

  let db_date = require("./getDbs");
  let dbs = await db_date(n);
  // console.log("dbs ====> ",dbs,typeof(dbs))
  let getDiscuss = require("./discussInfo")
  await dbs.data.forEach(async (element) => {
    let discuss = await getDiscuss(element)
    discuss.id = await id;
    id = await id + 1
    // console.log("Main discuss",discuss)
    piazzaContent.push(discuss)
  });

  console.log('piazzaContent',piazzaContent)
  return piazzaContent;
};
