// pages/discussionDetails/discussionDetails.js
import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
Page({
  textareaValue: "",
  data: {
    // piazzaContent 的数据目前保留用作测试。 后续按此格式从服务器端获取。
    discussionContent: {
      id: 114514, // id 是每张卡片的唯一标识。 == comments.oid
      uBasicInfo: {
        // uBasicInfo 是用户的基本信息组。
        uid: "15972893", // uid 是用户的唯一标识。
        nickName: "零点能", // nickName 是用户的昵称。
        avatarImgSrc:
          "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg", // avatarImgSrc 是用户的头像地址。
        releaseDate: "2022-04-20 12:30 PM", // releaseDate 是用户发布的时间。
        crop: "辣椒",
      },
      question: {
        // question 是问题的信息组。
        qDescription:
          "不知道什么原因这几天叶子变得很黄，还出现好多的虫子，打什么药才好呢？", // qDescription 是问题的描述。
        qImgs: [
          // qImgs 是问题的图片地址组。
          "http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png",
          "http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png",
          "http://i2.hdslb.com/bfs/face/032bce9fd6dcb562d83b60f8a8719362b18a0afb.png",
        ],
        liked: 114, // liked 是问题被点赞的数量。
        likeStatus: false, // likeStatus 是用户是否点赞过该问题。
      },
      answer: {
        // answer 是回答的信息组。
        auid: "", //  auid 是回答的用户(答主)的唯一标识。
        answerNickName: "长沙作物专家", // answerNickName 是回答的用户(答主)的昵称。
        aAvatarImgSrc:
          "http://i2.hdslb.com/bfs/face/c1bbee6d255f1e7fc434e9930f0f288c8b24293a.jpg", // aAvatarImgSrc 是回答的用户(答主)的头像地址。
        aDescription:
          "叶片斑驳褪绿发黄,病毒呈病叶型症状,除种子带毒外蚜虫为害,即接触传染都会传染引起,肥料配比不科学,连作地阿巴阿巴阿巴阿巴.学习新思想,争做新青年", // aDescription 是回答的内容。
        liked: 514, // liked 是问题被点赞的数量。
        likeStatus: false, // likeStatus 是用户是否点赞过该问题。
      },
    },
    comments: {
      // 评论。评论 json 格式参照 B 站评论 JSON 格式
      page: {
        status: 0, // 页面状态，指示前端渲染的内容情况
        count: 2, // count 是根评论条数。根评论不包括回复
        acount: 3, // acount 是评论的总数。包括回复
      },
      config: {},
      commentList: [
        {
          rpid: 10010, // rpid 是评论的唯一标识。评论 rpid
          fid: 0,
          /* fid 是评论的对象的唯一标识。
                                                        fid 为 0 表示为当前评论区的一级评论，代表本评论是在 oid 下的评论区的。 
                                                        该属性不为 0 说明是从属于 fid 的二级评论。此时 fid 等于从属一级评论的 rpid */
          oid: 114514, // oid 是评论的对象的唯一标识。评论区对象 id
          count: 0, // 二级评论条数
          rcount: 0, // 回复评论条数
          liked: 32, // 点赞数
          likeStatus: false, // 用户是否点赞过该评论
          ctime: 1653763638, // 评论发送时间(时间戳)
          user: {
            // 评论用户信息
            uid: "15972893", // 用户唯一标识
            nickName: "爱种菜的小瑶", // 用户昵称
            avatarImgSrc:
              "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg", // 用户头像地址
            identity: "", // 用户身份
          },
          content: "我觉得这种情况就是太干了，受天气影响。", // 评论内容
          replies: [
            // 为本评论的递归嵌套 仅可嵌套一层
            {
              rpid: 10011, // rpid 是评论的唯一标识。评论 rpid
              fid: 10010,
              /* fid 是评论的对象的唯一标识。
                                                                                fid 为 0 表示为当前评论区的一级评论，代表本评论是在 oid 下的评论区的。 
                                                                                该属性不为 0 说明是从属于 fid 的二级评论。此时 fid 等于从属一级评论的 rpid */
              oid: 114514, // oid 是评论的对象的唯一标识。评论区对象 id
              count: 0, // 二级评论条数
              rcount: 0, // 回复评论条数
              liked: 7, // 点赞数
              likeStatus: false, // 用户是否点赞过该评论
              ctime: 1654014517, // 评论发送时间(时间戳)
              user: {
                // 评论用户信息
                uid: "15972893", // 用户唯一标识
                nickName: "长沙小农", // 用户昵称
                avatarImgSrc:
                  "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg", // 用户头像地址
                identity: "作者", // 用户身份
              },
              content: "对，天公不作美。", // 评论内容
              replies: null,
              reply_control: {
                time_desc: "26天前发布",
              },
            },
          ],
          reply_control: {
            // 评论提示文案信息
            sub_reply_entry_text: "共1条回复", // 回复提示
            sub_reply_title_text: "相关回复共1条", // 回复提示
            time_desc: "26天前发布", //时间提示
          },
        },
        {
          rpid: 10086,
          fid: 0,
          oid: 114514,
          count: 0,
          rcount: 0,
          liked: 16,
          likeStatus: false,
          ctime: 1654011900,
          user: {
            uid: "15972893",
            nickName: "零点能",
            avatarImgSrc:
              "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg",
            identity: "",
          },
          content: "我觉得这种情况就是太干了，受天气影响。",
          replies: [],
          reply_control: {
            time_desc: "26天前发布",
          },
        },
      ],
    },
    pageHeight: "",
    showPop: false,
  },
  getReleaseDateTime(res) {
    let rtime, dayCount, hourCount, minuteCount, secondCount, rt;
    rtime = res * 1000;
    dayCount = parseInt((new Date().getTime() - rtime) / (1000 * 60 * 60 * 24));
    hourCount = parseInt((new Date().getTime() - rtime) / (1000 * 60 * 60));
    minuteCount = parseInt((new Date().getTime() - rtime) / (1000 * 60));
    secondCount = parseInt((new Date().getTime() - rtime) / 1000);
    rt =
      dayCount < 0 || hourCount < 0 || minuteCount < 0 || secondCount < 0
        ? "时间来自未来"
        : dayCount > 1
        ? new Date(rtime).getFullYear() +
          "年" +
          (new Date(rtime).getMonth() + 1) +
          "月" +
          new Date(rtime).getDate() +
          "日" +
          " " +
          new Date(rtime).getHours() +
          ":" +
          new Date(rtime).getMinutes()
        : dayCount == 1
        ? "昨天 " +
          new Date(rtime).getHours() +
          ":" +
          new Date(rtime).getMinutes()
        : hourCount >= 1
        ? hourCount + "小时前"
        : minuteCount >= 1
        ? minuteCount + "分钟前"
        : secondCount + "秒前";
    return rt;
    // }
  },
  addLike(res) {
    let likeFlag,
      operator = 1;
    switch (res.target.dataset.part) {
      case "question":
        {
          likeFlag = this.data.discussionContent.question.likeStatus;
          if (likeFlag) operator = -1;
          this.setData({
            "discussionContent.question.liked":
              this.data.discussionContent.question.liked + 1 * operator,
            "discussionContent.question.likeStatus": !likeFlag,
          });
        }
        break;
      case "answer":
        {
          likeFlag = this.data.discussionContent.answer.likeStatus;
          if (likeFlag) operator = -1;
          this.setData({
            "discussionContent.answer.liked":
              this.data.discussionContent.answer.liked + 1 * operator,
            "discussionContent.answer.likeStatus": !likeFlag,
          });
        }
        break;
      case "comments":
        {
          let index = res.target.dataset.index;
          likeFlag = this.data.comments.commentList[index].likeStatus;
          if (likeFlag) operator = -1;
          this.setData({
            [`comments.commentList[${index}].liked`]:
              this.data.comments.commentList[index].liked + 1 * operator,
            [`comments.commentList[${index}].likeStatus`]: !likeFlag,
          });
        }
        break;
      case "replies":
        {
          let index = res.target.dataset.index;
          let fidx = this.getCommentSubID(res.target.dataset.fid);
          likeFlag =
            this.data.comments.commentList[fidx].replies[index].likeStatus;
          if (likeFlag) operator = -1;
          this.setData({
            [`comments.commentList[${fidx}].replies[${index}].liked`]:
              this.data.comments.commentList[fidx].replies[index].liked +
              1 * operator,
            [`comments.commentList[${fidx}].replies[${index}].likeStatus`]:
              !likeFlag,
          });
        }
        break;
    }
  },
  getCommentSubID(fid) {
    for (let i = 0; i < this.data.comments.commentList.length; i++) {
      if (this.data.comments.commentList[i].rpid == fid) return i;
    }
  },
  setPopup() {
    this.setData({
      showPop: !this.data.showPop,
    });
  },
  taInput(res) {
    this.textareaValue = res.detail.value;
  },
  pubComment(res) {
    let content = this.textareaValue;
    if (content == "") {
      this.setPopup();
      Dialog.alert({
        message: "评论内容不能为空",
        theme: "round-button",
      }).then(() => {});
      return;
    }
    // 发送评论 to commentList
    let comment = {
      rpid: 10010,
      fid: 0,
      oid: 114514,
      count: 0,
      rcount: 0,
      liked: 0,
      likeStatus: false,
      ctime: 1654799932,
      user: {
        uid: "15972893",
        nickName: "零点能",
        avatarImgSrc:
          "http://i2.hdslb.com/bfs/face/8fc169c4fd7594cc7895694e6c3f0dc836d49b31.jpg",
        identity: "",
      },
      content: this.textareaValue,
      replies: [],
      reply_control: {},
    };

    this.setData({
      "comments.commentList": this.data.comments.commentList.concat(comment),
    });
    this.textareaValue = "";
    this.decodeComment();
    this.setPopup();
  },
  decodeComment() {
    let commentBasicPath = this.data.comments.commentList;
    for (let i = 0; i < commentBasicPath.length; i++) {
      this.setData({
        [`comments.commentList[${i}].ctime`]: this.getReleaseDateTime(
          commentBasicPath[i].ctime
        ),
      });
      try {
        this.setData({
          [`comments.commentList[${i}].replies[${i}].ctime`]:
            this.getReleaseDateTime(commentBasicPath[i].replies[i].ctime),
        });
      } catch (error) {
        // 此处捕获的异常很有可能是未获取到 ctime 导致的，这是正常现象，我就不打印错误信息了
      }
    }
  },
  onReady() {
    this.decodeComment();
  },
  async onLoad(res) {
    let that = this;
    const eventChannel = await this.getOpenerEventChannel();
    await eventChannel.on("discuss", (res) => {
      console.log(res);
      //  获取数据信息
      this.setData({
        _id: res._id,
      });
    });
    let titleQuery = wx.createSelectorQuery();
    let sendCommentQuery = wx.createSelectorQuery();
    let titleHeight, sendCommentHeight;
    titleQuery.select(".title").boundingClientRect();
    sendCommentQuery.select(".sendComment").boundingClientRect();

    titleHeight = new Promise((resolve, reject) => {
      titleQuery.exec((res) => {
        let height = res[0].height;
        resolve(height);
      });
    });

    sendCommentHeight = new Promise((resolve, reject) => {
      sendCommentQuery.exec((res) => {
        let height = res[0].height;
        resolve(height);
      });
    });

    Promise.all([titleHeight, sendCommentHeight]).then((res) => {
      let that = this;
      let winHeight = wx.getSystemInfoSync().windowHeight;
      that.setData({
        pageHeight: winHeight - res[0] - res[1], //474
      });
    });

    // TODO 加载详情页数据
    let discuss = require("../../common/dao/discuss/discuss");
    let discuss_info = await discuss(1, 0, 2, 2, this.data._id);
    console.log("xxxx =>>", discuss_info);
    this.setData({
      answerLength: discuss_info[0].answer.length
    })
    this.setData({
      discussionContent: discuss_info[0],
    });
    // 这里需要向后端请求帖子 ID (即 oid) 为 res.id 的帖子详情 json 数据
    // 请求成功后，将数据赋值给 this.data.comments
    // 随后进入 onReady() 周期预处理数据，等待页面被渲染
    // 若返回无数据或找不到数据，至少给 this.data.comments 中 page 的 status 赋值为 -404
    // 页面将给出“讨论不存在”提示
  },
});
