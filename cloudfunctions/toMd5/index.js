
exports.main = async (event, context) => {

  console.log("toMd5")
  var md5 = require('md5');
  return md5(event.pwd)
}