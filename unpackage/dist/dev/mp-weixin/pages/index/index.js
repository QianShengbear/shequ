"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      posts: [],
      // 帖子列表
      showPopup: false,
      // 是否显示发布弹窗
      postContent: "",
      // 帖子内容
      currentUserId: "",
      // 当前用户ID（会话ID）
      currentUserInfo: {},
      // 当前用户信息
      followedList: [],
      // 已关注的用户列表
      likedPosts: []
      // 已点赞的帖子ID列表
    };
  },
  computed: {
    // 按点赞数排序的帖子列表
    sortedPosts() {
      return [...this.posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
  },
  onLoad() {
    this.loadCurrentUser();
    this.loadPosts();
    this.loadFollowedList();
    this.loadLikedPosts();
  },
  onShow() {
    this.loadCurrentUser();
    this.loadPosts();
    this.loadFollowedList();
    this.loadLikedPosts();
  },
  methods: {
    // 获取会话ID（统一使用 currentSessionId）
    getSessionId() {
      let sessionId = common_vendor.index.getStorageSync("currentSessionId");
      if (!sessionId) {
        sessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        common_vendor.index.setStorageSync("currentSessionId", sessionId);
        common_vendor.index.__f__("log", "at pages/index/index.vue:163", "生成新会话ID:", sessionId);
      }
      return sessionId;
    },
    // 加载当前用户信息
    loadCurrentUser() {
      const sessionId = this.getSessionId();
      const storageKey = `userInfo_${sessionId}`;
      const userInfo = common_vendor.index.getStorageSync(storageKey);
      common_vendor.index.__f__("log", "at pages/index/index.vue:175", "加载用户信息，session:", sessionId, "data:", userInfo);
      if (userInfo && userInfo.nickname) {
        this.currentUserInfo = userInfo;
        this.currentUserId = userInfo.id || sessionId;
        common_vendor.index.__f__("log", "at pages/index/index.vue:180", "使用保存的用户信息:", this.currentUserInfo);
      } else {
        this.currentUserId = sessionId;
        this.currentUserInfo = {
          id: sessionId,
          nickname: "匿名用户",
          avatar: ""
        };
        common_vendor.index.__f__("log", "at pages/index/index.vue:189", "使用默认用户信息:", this.currentUserInfo);
      }
    },
    // 加载帖子列表
    loadPosts() {
      try {
        const savedPosts = common_vendor.index.getStorageSync("posts_global");
        if (savedPosts) {
          this.posts = savedPosts.sort((a, b) => b.timestamp - a.timestamp);
          common_vendor.index.__f__("log", "at pages/index/index.vue:201", "加载全局帖子列表，数量:", this.posts.length);
        } else {
          this.posts = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:206", "加载帖子失败:", error);
        this.posts = [];
      }
    },
    // 加载关注列表（按会话隔离）
    loadFollowedList() {
      const sessionId = this.getSessionId();
      const storageKey = `followedList_${sessionId}`;
      const followed = common_vendor.index.getStorageSync(storageKey);
      if (followed) {
        this.followedList = followed;
      } else {
        this.followedList = [];
      }
      common_vendor.index.__f__("log", "at pages/index/index.vue:223", "加载关注列表，session:", sessionId, "数量:", this.followedList.length);
    },
    // 显示发布弹窗
    showPublishPopup() {
      this.showPopup = true;
      this.postContent = "";
    },
    // 关闭弹窗
    closePopup() {
      this.showPopup = false;
      this.postContent = "";
    },
    // 发布帖子
    publishPost() {
      if (!this.postContent.trim()) {
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      const newPost = {
        id: Date.now(),
        // 使用时间戳作为唯一ID
        userId: this.currentUserId,
        sessionId: this.currentUserId,
        // 记录发布者会话ID
        nickname: this.currentUserInfo.nickname || "匿名用户",
        avatar: this.currentUserInfo.avatar || "",
        content: this.postContent.trim(),
        timestamp: Date.now(),
        likes: 0,
        comments: 0
      };
      this.posts.unshift(newPost);
      try {
        common_vendor.index.setStorageSync("posts_global", this.posts);
        common_vendor.index.__f__("log", "at pages/index/index.vue:267", "发布帖子成功，全局可见:", newPost);
        common_vendor.index.showToast({
          title: "发布成功",
          icon: "success"
        });
        this.closePopup();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:277", "保存失败:", error);
        common_vendor.index.showToast({
          title: "发布失败",
          icon: "none"
        });
      }
    },
    // 判断是否已关注
    isFollowed(userId) {
      return this.followedList.some((user) => user.id === userId);
    },
    // 关注用户
    followUser(post) {
      if (this.isFollowed(post.userId)) {
        common_vendor.index.showToast({
          title: "已经关注过了",
          icon: "none"
        });
        return;
      }
      this.followedList.push({
        id: post.userId,
        nickname: post.nickname,
        avatar: post.avatar
      });
      try {
        const sessionId = this.getSessionId();
        const storageKey = `followedList_${sessionId}`;
        common_vendor.index.setStorageSync(storageKey, this.followedList);
        common_vendor.index.__f__("log", "at pages/index/index.vue:313", "关注成功，session:", sessionId, "用户:", post.nickname);
        common_vendor.index.showToast({
          title: "关注成功",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:320", "保存失败:", error);
        common_vendor.index.showToast({
          title: "关注失败",
          icon: "none"
        });
      }
    },
    // 格式化时间
    formatTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      if (diff < 6e4) {
        return "刚刚";
      }
      if (diff < 36e5) {
        return Math.floor(diff / 6e4) + "分钟前";
      }
      if (diff < 864e5) {
        return Math.floor(diff / 36e5) + "小时前";
      }
      if (diff < 6048e5) {
        return Math.floor(diff / 864e5) + "天前";
      }
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    // 提取纯文本内容（去除图片标记）
    extractTextContent(content) {
      if (!content)
        return "";
      return content.replace(/\[img\][^\[]*\[\/img\]/g, "").replace(/!\[.*?\]\(.*?\)/g, "").replace(/<img[^>]*>/g, "").trim();
    },
    // 点赞功能
    likePost(post) {
      const sessionId = this.getSessionId();
      const likedKey = `likedPosts_${sessionId}`;
      const likedPosts = common_vendor.index.getStorageSync(likedKey) || [];
      if (likedPosts.includes(post.id)) {
        common_vendor.index.showToast({
          title: "已经点过赞了",
          icon: "none"
        });
        return;
      }
      post.likes = (post.likes || 0) + 1;
      likedPosts.push(post.id);
      try {
        common_vendor.index.setStorageSync("posts_global", this.posts);
        common_vendor.index.setStorageSync(likedKey, likedPosts);
        common_vendor.index.__f__("log", "at pages/index/index.vue:400", "点赞成功，session:", sessionId);
        common_vendor.index.showToast({
          title: "点赞成功",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:407", "点赞失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    },
    // 加载点赞记录
    loadLikedPosts() {
      const sessionId = this.getSessionId();
      const likedKey = `likedPosts_${sessionId}`;
      const liked = common_vendor.index.getStorageSync(likedKey);
      if (liked) {
        this.likedPosts = liked;
      } else {
        this.likedPosts = [];
      }
    },
    // 判断是否已点赞
    hasLiked(postId) {
      return this.likedPosts.includes(postId);
    },
    // 跳转到详情页
    goToDetail(post) {
      common_vendor.index.navigateTo({
        url: `/pages/more/more?postId=${post.id}`
      });
    }
  }
};
if (!Array) {
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  const _easycom_u_avatar2 = common_vendor.resolveComponent("u-avatar");
  const _easycom_u_popup2 = common_vendor.resolveComponent("u-popup");
  (_easycom_u_button2 + _easycom_u_icon2 + _easycom_u_avatar2 + _easycom_u_popup2)();
}
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
const _easycom_u_avatar = () => "../../uni_modules/uview-plus/components/u-avatar/u-avatar.js";
const _easycom_u_popup = () => "../../uni_modules/uview-plus/components/u-popup/u-popup.js";
if (!Math) {
  (_easycom_u_button + _easycom_u_icon + _easycom_u_avatar + _easycom_u_popup)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.showPublishPopup, "a6"),
    b: common_vendor.p({
      type: "primary",
      icon: "edit-pen"
    }),
    c: $options.sortedPosts.length === 0
  }, $options.sortedPosts.length === 0 ? {
    d: common_vendor.p({
      name: "file-text",
      size: "80",
      color: "#ccc"
    })
  } : {}, {
    e: common_vendor.f($options.sortedPosts, (post, index, i0) => {
      return common_vendor.e({
        a: "1cf27b2a-2-" + i0,
        b: common_vendor.p({
          src: post.avatar || "/static/logo.png",
          size: "50"
        }),
        c: common_vendor.t(post.nickname),
        d: common_vendor.t($options.formatTime(post.timestamp)),
        e: post.userId !== $data.currentUserId && !$options.isFollowed(post.userId)
      }, post.userId !== $data.currentUserId && !$options.isFollowed(post.userId) ? {
        f: common_vendor.o(($event) => $options.followUser(post), post.id),
        g: "1cf27b2a-3-" + i0,
        h: common_vendor.p({
          name: "plus-circle",
          size: "26",
          color: "#2867CE"
        })
      } : post.userId !== $data.currentUserId && $options.isFollowed(post.userId) ? {
        j: "1cf27b2a-4-" + i0,
        k: common_vendor.p({
          name: "checkmark-circle",
          size: "26",
          color: "#999"
        })
      } : {}, {
        i: post.userId !== $data.currentUserId && $options.isFollowed(post.userId),
        l: common_vendor.t($options.extractTextContent(post.content)),
        m: "1cf27b2a-5-" + i0,
        n: common_vendor.p({
          name: "thumb-up",
          size: "20",
          color: $options.hasLiked(post.id) ? "#ff6b6b" : "#999"
        }),
        o: common_vendor.t(post.likes || 0),
        p: $options.hasLiked(post.id) ? "#ff6b6b" : "#999",
        q: common_vendor.o(($event) => $options.likePost(post), post.id),
        r: "1cf27b2a-6-" + i0,
        s: common_vendor.t(post.comments || 0),
        t: common_vendor.o(($event) => $options.goToDetail(post), post.id),
        v: post.id
      });
    }),
    f: common_vendor.p({
      name: "chat",
      size: "20",
      color: "#999"
    }),
    g: common_vendor.o((...args) => $options.closePopup && $options.closePopup(...args), "f5"),
    h: common_vendor.o($options.publishPost, "05"),
    i: common_vendor.p({
      type: "primary",
      size: "mini",
      disabled: !$data.postContent.trim()
    }),
    j: $data.postContent,
    k: common_vendor.o(($event) => $data.postContent = $event.detail.value, "c9"),
    l: common_vendor.t($data.postContent.length),
    m: common_vendor.o($options.closePopup, "7a"),
    n: common_vendor.p({
      show: $data.showPopup,
      mode: "bottom",
      round: "20"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
