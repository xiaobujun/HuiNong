/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-14 01:54:41
 */
let percent = require("./getPercent")
function formatScore(results){

  console.log('results',results)
  let arr = results.filter(item => item.score > 0.05)
  arr.forEach((e) => {
    
    e.score = percent(e.score)
  });
  console.log("arr",arr)
  return arr
}

module.exports = formatScore