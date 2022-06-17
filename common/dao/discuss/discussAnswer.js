/*
 * @Author: Asuka
 * @Date: 2022-06-10 22:59:49
 * @LastEditTime: 2022-06-18 02:55:01
 */
module.exports = async (_id) => {
  let answer = new Object();

  let desc = await require("./discussDesc")(_id);
  // console.log("desc ==> ", desc);

  answer.aDescription = desc.aDescription;
  answer.aImgs = desc.imgs;
  answer.liked = desc.liked;

  let user = await require("./discussUser")(desc.user);
//   console.log("user", user);

  answer.answerNickName = user.name;
  answer.aAvatarImgSrc = user.avatar;
  answer._id = _id;
  return answer;
};
