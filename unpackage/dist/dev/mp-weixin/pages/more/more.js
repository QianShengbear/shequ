"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      postId: null,
      post: null,
      comments: [],
      commentText: "",
      currentUserId: "",
      currentUserInfo: {},
      replyingTo: null,
      // 正在回复的用户名
      replyingToId: null,
      // 正在回复的评论ID
      parentCommentId: null,
      // 父评论ID（主评论ID）
      placeholderText: "说点什么...",
      isInputFocused: false,
      expandedComments: []
      // 已展开回复的评论ID列表
    };
  },
  onLoad(options) {
    this.postId = options.postId;
    this.loadCurrentUser();
    this.loadPostDetail();
    this.loadComments();
  },
  methods: {
    // 获取会话ID（统一使用 currentSessionId）
    getSessionId() {
      let sessionId = common_vendor.index.getStorageSync("currentSessionId");
      if (!sessionId) {
        sessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        common_vendor.index.setStorageSync("currentSessionId", sessionId);
        common_vendor.index.__f__("log", "at pages/more/more.vue:168", "生成新会话ID:", sessionId);
      }
      return sessionId;
    },
    // 加载当前用户信息
    loadCurrentUser() {
      const sessionId = this.getSessionId();
      const storageKey = `userInfo_${sessionId}`;
      const userInfo = common_vendor.index.getStorageSync(storageKey);
      common_vendor.index.__f__("log", "at pages/more/more.vue:180", "加载用户信息，session:", sessionId);
      if (userInfo && userInfo.nickname) {
        this.currentUserInfo = userInfo;
        this.currentUserId = userInfo.id || sessionId;
      } else {
        this.currentUserId = sessionId;
        this.currentUserInfo = {
          id: sessionId,
          nickname: "匿名用户",
          avatar: ""
        };
      }
    },
    // 加载帖子详情（使用 posts_global）
    loadPostDetail() {
      try {
        const posts = common_vendor.index.getStorageSync("posts_global") || [];
        this.post = posts.find((p) => p.id == this.postId);
        if (!this.post) {
          common_vendor.index.showToast({
            title: "帖子不存在",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/more/more.vue:211", "加载帖子失败:", error);
      }
    },
    // 加载评论（评论是全局可见的，跟随帖子）
    loadComments() {
      try {
        const allComments = common_vendor.index.getStorageSync("comments_global") || {};
        this.comments = allComments[this.postId] || [];
        common_vendor.index.__f__("log", "at pages/more/more.vue:220", "加载评论，postId:", this.postId, "数量:", this.comments.length);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/more/more.vue:222", "加载评论失败:", error);
        this.comments = [];
      }
    },
    // 渲染内容（支持图文混排）
    renderContent(content) {
      if (!content)
        return "";
      if (typeof content === "string" && !content.includes("[img]") && !content.includes("<img")) {
        return content.replace(/\n/g, "<br>");
      }
      let html = content;
      html = html.replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" style="max-width:100%;display:block;margin:10px 0;">');
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;display:block;margin:10px 0;">');
      html = html.replace(/\n/g, "<br>");
      return html;
    },
    // 格式化时间
    formatTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      if (diff < 6e4)
        return "刚刚";
      if (diff < 36e5)
        return Math.floor(diff / 6e4) + "分钟前";
      if (diff < 864e5)
        return Math.floor(diff / 36e5) + "小时前";
      if (diff < 6048e5)
        return Math.floor(diff / 864e5) + "天前";
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    // 显示回复输入框
    showReplyInput(target) {
      this.replyingTo = target.nickname;
      this.replyingToId = target.id;
      this.parentCommentId = this.findParentCommentId(target.id);
      this.placeholderText = `回复 ${target.nickname}`;
      this.isInputFocused = true;
      this.commentText = "";
    },
    // 查找目标ID所属的主评论ID
    findParentCommentId(targetId) {
      const isMainComment = this.comments.find((c) => c.id === targetId);
      if (isMainComment)
        return targetId;
      for (let comment of this.comments) {
        if (comment.replies && comment.replies.some((r) => r.id === targetId)) {
          return comment.id;
        }
      }
      return null;
    },
    // 取消回复
    cancelReply() {
      this.replyingTo = null;
      this.replyingToId = null;
      this.parentCommentId = null;
      this.placeholderText = "说点什么...";
      this.commentText = "";
      this.isInputFocused = false;
    },
    // 提交评论
    submitComment() {
      if (!this.commentText.trim()) {
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      const newComment = {
        id: Date.now(),
        userId: this.currentUserId,
        nickname: this.currentUserInfo.nickname || "匿名用户",
        avatar: this.currentUserInfo.avatar || "",
        text: this.commentText.trim(),
        timestamp: Date.now()
      };
      if (this.replyingToId && this.parentCommentId !== this.replyingToId) {
        newComment.replyTo = this.replyingTo;
        newComment.replyToId = this.replyingToId;
      }
      try {
        const allComments = common_vendor.index.getStorageSync("comments_global") || {};
        let postComments = allComments[this.postId] || [];
        if (this.parentCommentId) {
          const parentComment = postComments.find((c) => c.id === this.parentCommentId);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.push(newComment);
          }
        } else {
          postComments.push(newComment);
        }
        allComments[this.postId] = postComments;
        common_vendor.index.setStorageSync("comments_global", allComments);
        const posts = common_vendor.index.getStorageSync("posts_global") || [];
        const postIndex = posts.findIndex((p) => p.id == this.postId);
        if (postIndex !== -1) {
          posts[postIndex].comments = (posts[postIndex].comments || 0) + 1;
          common_vendor.index.setStorageSync("posts_global", posts);
        }
        this.loadComments();
        this.cancelReply();
        common_vendor.index.showToast({
          title: "评论成功",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/more/more.vue:362", "评论失败:", error);
        common_vendor.index.showToast({
          title: "评论失败",
          icon: "none"
        });
      }
    },
    // 切换回复显示
    toggleReplies(commentId) {
      const index = this.expandedComments.indexOf(commentId);
      if (index > -1) {
        this.expandedComments.splice(index, 1);
      } else {
        this.expandedComments.push(commentId);
      }
    },
    // 滚动到指定回复
    scrollToReply(replyId) {
      if (!replyId)
        return;
      setTimeout(() => {
        common_vendor.index.pageScrollTo({
          selector: `#reply-${replyId}`,
          duration: 300
        });
      }, 100);
    }
  }
};
if (!Array) {
  const _easycom_u_avatar2 = common_vendor.resolveComponent("u-avatar");
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  (_easycom_u_avatar2 + _easycom_u_button2 + _easycom_u_icon2)();
}
const _easycom_u_avatar = () => "../../uni_modules/uview-plus/components/u-avatar/u-avatar.js";
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
if (!Math) {
  (_easycom_u_avatar + _easycom_u_button + _easycom_u_icon)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.post
  }, $data.post ? common_vendor.e({
    b: common_vendor.p({
      src: $data.post.avatar || "/static/logo.png",
      size: "60"
    }),
    c: common_vendor.t($data.post.nickname),
    d: common_vendor.t($options.formatTime($data.post.timestamp)),
    e: $options.renderContent($data.post.content),
    f: common_vendor.t($data.comments.length),
    g: $data.comments.length === 0
  }, $data.comments.length === 0 ? {} : {}, {
    h: common_vendor.f($data.comments, (comment, k0, i0) => {
      return common_vendor.e({
        a: "ac368486-1-" + i0,
        b: common_vendor.p({
          src: comment.avatar || "/static/logo.png",
          size: "40"
        }),
        c: common_vendor.t(comment.nickname),
        d: common_vendor.t($options.formatTime(comment.timestamp)),
        e: common_vendor.t(comment.text),
        f: common_vendor.o(($event) => $options.showReplyInput(comment), comment.id),
        g: comment.replies && comment.replies.length > 0
      }, comment.replies && comment.replies.length > 0 ? {
        h: common_vendor.t($data.expandedComments.includes(comment.id) ? "收起回复" : `查看${comment.replies.length}条回复`),
        i: common_vendor.o(($event) => $options.toggleReplies(comment.id), comment.id)
      } : {}, {
        j: $data.expandedComments.includes(comment.id) && comment.replies
      }, $data.expandedComments.includes(comment.id) && comment.replies ? {
        k: common_vendor.f(comment.replies, (reply, k1, i1) => {
          return common_vendor.e({
            a: "ac368486-2-" + i0 + "-" + i1,
            b: common_vendor.p({
              src: reply.avatar || "/static/logo.png",
              size: "32"
            }),
            c: common_vendor.t(reply.nickname),
            d: common_vendor.t($options.formatTime(reply.timestamp)),
            e: reply.replyToId
          }, reply.replyToId ? {
            f: common_vendor.t(reply.replyTo),
            g: common_vendor.o(($event) => $options.scrollToReply(reply.replyToId), reply.id)
          } : {}, {
            h: common_vendor.t(reply.text),
            i: common_vendor.o(($event) => $options.showReplyInput(reply), reply.id),
            j: reply.id,
            k: "reply-" + reply.id
          });
        })
      } : {}, {
        l: comment.id
      });
    })
  }) : {}, {
    i: $data.placeholderText,
    j: $data.isInputFocused,
    k: $data.commentText,
    l: common_vendor.o(($event) => $data.commentText = $event.detail.value, "b5"),
    m: common_vendor.o($options.submitComment, "ff"),
    n: common_vendor.p({
      type: "primary",
      disabled: !$data.commentText.trim(),
      customStyle: "width: 60px; height: 35px; font-size: 12px; padding: 0;"
    }),
    o: $data.replyingTo
  }, $data.replyingTo ? {
    p: common_vendor.t($data.replyingTo),
    q: common_vendor.o($options.cancelReply, "0d"),
    r: common_vendor.p({
      name: "close",
      size: "20"
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-ac368486"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/more/more.js.map
