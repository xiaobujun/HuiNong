/*
 * @Author: Asuka
 * @Date: 2022-04-20 02:06:46
 * @LastEditTime: 2022-06-14 10:52:53
 */
function getPercent(number) {
  if (number < 0.5){
    return "可信度低";
  }else if (number <= 0.8 && number >= 0.5 ){
    return "可信度中";
  }
  return "可信度高";
}

module.exports = getPercent;