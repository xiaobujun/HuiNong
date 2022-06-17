/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-18 02:59:11
 */
/**
 * @description:
 * @param {*} element
 * @param {*} an
 * @param {*} anan
 * @return {*}
 */
module.exports = async (element, an, anan) => {
  // console.log("element", element);
  const discuss = new Object();

  discuss.totalView = element.brows;  // 流浪数量
  discuss.totalAnswer = element.answerNum;  // 回复数量
  // discuss.liked = element.liked;  // 点赞数量
  // console.log("点赞数量", discuss.liked)
  // uBasicInfo
  let uBasicInfo = await require("./discussBasic")(element);
  // console.log("uBasicInfo", uBasicInfo);
  discuss.uBasicInfo = uBasicInfo;

  let question = await require("./discussQuestion")(element);
  question.liked = element.liked; // 点赞数量
  // console.log("question", question);
  discuss.question = question;
  let answer = Array();
  for (let i = 0; i < an; i++) {
    answer.push( await require("./discussAnswer")(element.answerId[i]));
  }
  console.log("answer", answer)
  discuss.answer = answer;

  console.log("discuss",discuss)
  return discuss;
};
