module.exports = async (_id) => {
  let answer = new Object();

  let desc = await require("./discussDesc")(_id);
//   console.log("desc ==> ", desc);

  answer.aDescription = desc.aDescription;
  answer.aImgs = desc.imgs;

  let user = await require("./discussUser")(desc.user);
//   console.log("user", user);

  answer.answerNickName = user.name;
  answer.aAvatarImgSrc = user.avatar;

  return answer;
};
