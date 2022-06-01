// pages/discussionDetails/discussionDetails.js


Page({

  data: {
    // piazzaContent 的数据目前保留用作测试。 后续按此格式从服务器端获取。
    "discussionContent":
    {
      "id": 0,    // id 是每张卡片的唯一标识。
      "uBasicInfo": {   // uBasicInfo 是用户的基本信息组。
        "uid": '15972893',    // uid 是用户的唯一标识。
        "nickName": '零点能',   // nickName 是用户的昵称。
        "avatarImgSrc": 'http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg',    // avatarImgSrc 是用户的头像地址。
        "releaseDate": '2022-04-20 12:30 PM',   // releaseDate 是用户发布的时间。
        "crop": '辣椒',
      },
      "question": {    // question 是问题的信息组。
        "qDescription": '不知道什么原因这几天叶子变得很黄，还出现好多的虫子，打什么药才好呢？',   // qDescription 是问题的描述。
        "qImgs": [    // qImgs 是问题的图片地址组。
          "http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png",
          "http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png",
          "http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png",
        ]
      },
      "answer": {   // answer 是回答的信息组。
        "auid": '',   //  auid 是回答的用户(答主)的唯一标识。
        "answerNickName": '长沙作物专家',     // answerNickName 是回答的用户(答主)的昵称。
        "aAvatarImgSrc": 'http://i2.hdslb.com/bfs/face/c1bbee6d255f1e7fc434e9930f0f288c8b24293a.jpg',   // aAvatarImgSrc 是回答的用户(答主)的头像地址。
        "aDescription": '叶片斑驳褪绿发黄,病毒呈病叶型症状,除种子带毒外蚜虫为害,即接触传染都会传染引起,肥料配比不科学,连作地阿巴阿巴阿巴阿巴.学习新思想,争做新青年'   // aDescription 是回答的内容。
      },
    },
    "comments": {   // 评论。评论 json 格式参照 B 站评论 JSON 格式
      "page": {
        "count": 2,   // count 是根评论条数。根评论不包括回复
        "acount": 3,    // acount 是评论的总数。包括回复
      },
      "config": {},
      "commentList": [
        {
          "rpid": 10010,    // rpid 是评论的唯一标识。评论 rpid
          "oid": 114514,    // oid 是评论的对象的唯一标识。评论区对象 id	
          "count": 0,   // 二级评论条数
          "rcount": 0,    // 回复评论条数
          "ctime": 1653763638,  // 评论发送时间(时间戳)
          "user": {   // 评论用户信息
            "uid": "15972893",    // 用户唯一标识
            "nickName": "爱种菜的小瑶",   // 用户昵称
            "avatarImgSrc": "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg",    // 用户头像地址
            "identity": "",   // 用户身份
          },
          "content": "我觉得这种情况就是太干了，受天气影响。",    // 评论内容
          "replies": [    // 为本评论的递归嵌套 仅可嵌套一层
            {
              "count": 0,   // 二级评论条数
              "rcount": 0,    // 回复评论条数
              "ctime": 1654014517,  // 评论发送时间(时间戳)
              "user": {   // 评论用户信息
                "uid": "15972893",    // 用户唯一标识
                "nickName": "长沙小农",   // 用户昵称
                "avatarImgSrc": "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg",    // 用户头像地址
                "identity": "作者",   // 用户身份
              },
              "content": "对，天公不作美。",    // 评论内容
              "replies": null,
              "reply_control": {
                "time_desc": "26天前发布"
              }
            },
          ],
          "reply_control": {    // 评论提示文案信息	
            "sub_reply_entry_text": "共1条回复",    // 回复提示	
            "sub_reply_title_text": "相关回复共1条",    // 回复提示	
            "time_desc": "26天前发布"   //时间提示	
          }
        },
        {
          "rpid": 10086,
          "oid": 114514,
          "count": 0,
          "rcount": 0,
          "ctime": 1654011900,
          "user": {
            "uid": "15972893",
            "nickName": "零点能",
            "avatarImgSrc": "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg",
            "identity": "",
          },
          "content": "我觉得这种情况就是太干了，受天气影响。",
          "replies": [],
          "reply_control": {
            "time_desc": "26天前发布"
          }
        }
      ],
    },
    testTop: {
      testMid: [
        {
          testInside: 0,
        },
        {
          testInside: 1,
        }
      ]
    }
  },
  getReleaseDateTime(res) {
    let rtime, dayCount, hourCount, minuteCount, secondCount, rt;
    rtime = res * 1000;
    dayCount = parseInt((new Date().getTime() - rtime) / (1000 * 60 * 60 * 24));
    hourCount = parseInt((new Date().getTime() - rtime) / (1000 * 60 * 60));
    minuteCount = parseInt((new Date().getTime() - rtime) / (1000 * 60));
    secondCount = parseInt((new Date().getTime() - rtime) / 1000);
    rt = (dayCount < 0 || hourCount < 0 || minuteCount < 0 || secondCount < 0) ? "时间来自未来"
      : dayCount > 1 ? new Date(rtime).getFullYear() + '年' + (new Date(rtime).getMonth() + 1) + '月' + new Date(rtime).getDate() + '日' + ' ' + new Date(rtime).getHours() + ':' + new Date(rtime).getMinutes()
        : dayCount == 1 ? '昨天 ' + new Date(rtime).getHours() + ':' + new Date(rtime).getMinutes()
          : hourCount >= 1 ? hourCount + '小时前'
            : minuteCount >= 1 ? minuteCount + '分钟前'
              : secondCount + '秒前';
    return rt;
    // }
  },
  onReady() {
    let commentBasicPath = this.data.comments.commentList;
    for (let i = 0; i < commentBasicPath.length; i++) {
      this.setData({
        [`comments.commentList[${i}].ctime`]: this.getReleaseDateTime(commentBasicPath[i].ctime)
      })
      try {
        this.setData({
          [`comments.commentList[${i}].replies[${i}].ctime`]: this.getReleaseDateTime(commentBasicPath[i].replies[i].ctime)
        })
      } catch (error) {
        // 此处捕获的异常很有可能是未获取到 ctime 导致的，这是正常现象，我就不打印错误信息了
      }
    }
  }
})