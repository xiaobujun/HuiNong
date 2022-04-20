let percent = require("./getPercent")
function formatScore(results){
  let arr = results.filter(item => item.score > 0.3)
  arr.forEach((e) => {
    e.score = percent(e.score)
  });
  console.log("arr",arr)
  return arr
}

module.exports = formatScore