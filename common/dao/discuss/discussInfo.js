/**
 *
 * @param {element} element
 * @returns {uBasicInfo, question, answer} discuss
 */
module.exports = async (element) => {
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

  let answer = await require("./discussAnswer")(element.answerId);
  discuss.answer = answer;

  console.log("discuss ===> ",discuss)
  
  return discuss
};
