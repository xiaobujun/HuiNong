/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-12 04:12:54
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

  discuss.totalView = element.brows;
  discuss.totalAnswer = element.answerNum;

  // uBasicInfo
  let uBasicInfo = await require("./discussBasic")(element);
  // console.log("uBasicInfo", uBasicInfo);
  discuss.uBasicInfo = uBasicInfo;

  let question = await require("./discussQuestion")(element);
  // console.log("question", question);
  discuss.question = question;
  let answer;
  for (let i = 0; i < an; i++) {
    answer = await require("./discussAnswer")(element.answerId[i]);
    console.log("answer", answer)
  }
  discuss.answer = answer;

  console.log("discuss",discuss)
  return discuss;
};
