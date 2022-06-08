/**
 *
 * @param  element
 * @returns {nickName, avatarImgSrc, releaseDate, crop} uBasicInfo
 */
module.exports = async (element) => {
  let uBasicInfo = new Object();
  console.log("element ===> ",element)
  // 获取用户信息
  let user = await require("./discussUser")(element.user);
  console.log("user > ", user);
  uBasicInfo.avatarImgSrc = user.avatar;
  uBasicInfo.nickName = user.name;
  uBasicInfo.crop = element.crop;
  uBasicInfo.releaseDate = element.date;  
  return uBasicInfo;
};
