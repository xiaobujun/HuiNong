// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const CloudBase = require('@cloudbase/manager-node');

const {storage} = new CloudBase();

// 云函数入口函数
exports.main = async (event, context) => {
  let url = 'plant/' + event.a + '/' + event.b 
  const aPic = await storage.listDirectoryFiles(url);
  aPic.shift()
  let path = 'cloud://cloud1-5g1in4pge4a7a57e.636c-cloud1-5g1in4pge4a7a57e-1310462165/';
  let arrsUrl = new Array();

  aPic.forEach(e => {
    arrsUrl.push(path + e.Key)
  })
  return {
    arrsUrl
  }
}