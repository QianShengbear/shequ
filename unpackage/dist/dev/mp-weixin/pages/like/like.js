"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      followedList: [],
      // 已关注的用户列表
      showPopup: false,
      // 是否显示弹窗
      searchKeyword: "",
      // 搜索关键词
      searchResults: [],
      // 搜索结果
      isSearched: false,
      // 是否已搜索
      // 模拟的用户数据库（实际应该从云数据库获取）
      mockUsers: [
        { id: 1, nickname: "张三", avatar: "", bio: "喜欢编程喜欢编程喜欢编程喜欢编程喜欢编程" },
        { id: 2, nickname: "李四", avatar: "", bio: "前端工程师" },
        { id: 3, nickname: "王五", avatar: "", bio: "全栈开发" },
        { id: 4, nickname: "赵六", avatar: "", bio: "UI设计师" },
        { id: 5, nickname: "小明", avatar: "", bio: "产品经理" }
      ]
    };
  },
  onShow() {
    this.loadFollowedList();
  },
  methods: {
    // 获取会话ID（统一使用 currentSessionId）
    getSessionId() {
      let sessionId = common_vendor.index.getStorageSync("currentSessionId");
      if (!sessionId) {
        sessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        common_vendor.index.setStorageSync("currentSessionId", sessionId);
        common_vendor.index.__f__("log", "at pages/like/like.vue:150", "生成新会话ID:", sessionId);
      }
      return sessionId;
    },
    // 加载关注列表（按会话隔离）
    loadFollowedList() {
      const sessionId = this.getSessionId();
      const followedKey = `followedList_${sessionId}`;
      const followed = common_vendor.index.getStorageSync(followedKey);
      common_vendor.index.__f__("log", "at pages/like/like.vue:162", "加载关注列表，session:", sessionId, "数量:", followed ? followed.length : 0);
      if (followed) {
        this.followedList = followed;
      } else {
        this.followedList = [];
      }
    },
    // 显示添加用户弹窗
    showAddUserPopup() {
      this.showPopup = true;
      this.searchKeyword = "";
      this.searchResults = [];
      this.isSearched = false;
    },
    // 关闭弹窗
    closePopup() {
      this.showPopup = false;
    },
    // 处理搜索
    handleSearch() {
      if (!this.searchKeyword.trim()) {
        common_vendor.index.showToast({
          title: "请输入搜索关键词",
          icon: "none"
        });
        return;
      }
      this.isSearched = true;
      this.searchResults = this.mockUsers.filter(
        (user) => user.nickname.includes(this.searchKeyword)
      );
      if (this.searchResults.length === 0) {
        common_vendor.index.showToast({
          title: "未找到相关用户",
          icon: "none"
        });
      }
    },
    // 判断是否已关注
    isFollowed(userId) {
      return this.followedList.some((user) => user.id === userId);
    },
    // 关注用户
    followUser(user) {
      const sessionId = this.getSessionId();
      if (this.isFollowed(user.id)) {
        common_vendor.index.showToast({
          title: "已经关注过了",
          icon: "none"
        });
        return;
      }
      this.followedList.push({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio
      });
      try {
        const followedKey = `followedList_${sessionId}`;
        common_vendor.index.setStorageSync(followedKey, this.followedList);
        common_vendor.index.__f__("log", "at pages/like/like.vue:240", "关注成功，session:", sessionId, "followed:", user.nickname);
        common_vendor.index.showToast({
          title: "关注成功",
          icon: "success"
        });
        this.searchResults = this.searchResults.filter((u) => u.id !== user.id);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/like/like.vue:250", "保存失败:", error);
        common_vendor.index.showToast({
          title: "关注失败",
          icon: "none"
        });
      }
    },
    // 取关用户
    unfollowUser(user) {
      common_vendor.index.showModal({
        title: "提示",
        content: `确定要取消关注"${user.nickname}"吗？`,
        success: (res) => {
          if (res.confirm) {
            this.performUnfollow(user.id);
          }
        }
      });
    },
    // 执行取关操作
    performUnfollow(userId) {
      const sessionId = this.getSessionId();
      try {
        this.followedList = this.followedList.filter((user) => user.id !== userId);
        const followedKey = `followedList_${sessionId}`;
        common_vendor.index.setStorageSync(followedKey, this.followedList);
        common_vendor.index.__f__("log", "at pages/like/like.vue:282", "取关成功，session:", sessionId);
        common_vendor.index.showToast({
          title: "已取消关注",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/like/like.vue:289", "取关失败:", error);
        common_vendor.index.showToast({
          title: "取关失败",
          icon: "none"
        });
      }
    },
    // 跳转到聊天页面
    goToChat(user) {
      common_vendor.index.navigateTo({
        url: `/pages/chat/chat?userId=${user.id}&nickname=${encodeURIComponent(user.nickname)}&avatar=${encodeURIComponent(user.avatar || "")}`
      });
    },
    // 加载更多（预留分页功能）
    loadMore() {
      common_vendor.index.__f__("log", "at pages/like/like.vue:307", "加载更多");
    }
  }
};
if (!Array) {
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  const _easycom_u_avatar2 = common_vendor.resolveComponent("u-avatar");
  const _easycom_u_search2 = common_vendor.resolveComponent("u-search");
  const _easycom_u_popup2 = common_vendor.resolveComponent("u-popup");
  (_easycom_u_button2 + _easycom_u_icon2 + _easycom_u_avatar2 + _easycom_u_search2 + _easycom_u_popup2)();
}
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
const _easycom_u_avatar = () => "../../uni_modules/uview-plus/components/u-avatar/u-avatar.js";
const _easycom_u_search = () => "../../uni_modules/uview-plus/components/u-search/u-search.js";
const _easycom_u_popup = () => "../../uni_modules/uview-plus/components/u-popup/u-popup.js";
if (!Math) {
  (_easycom_u_button + _easycom_u_icon + _easycom_u_avatar + _easycom_u_search + _easycom_u_popup)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.showAddUserPopup, "f3"),
    b: common_vendor.p({
      type: "primary",
      icon: "plus"
    }),
    c: $data.followedList.length === 0
  }, $data.followedList.length === 0 ? {
    d: common_vendor.p({
      name: "account",
      size: "80",
      color: "#ccc"
    })
  } : {}, {
    e: common_vendor.f($data.followedList, (user, index, i0) => {
      return common_vendor.e({
        a: "03e14ebf-2-" + i0,
        b: common_vendor.p({
          src: user.avatar || "/static/logo.png",
          size: "60"
        }),
        c: common_vendor.t(user.nickname),
        d: user.bio
      }, user.bio ? {
        e: common_vendor.t(user.bio)
      } : {}, {
        f: common_vendor.o(($event) => $options.goToChat(user), user.id),
        g: "03e14ebf-3-" + i0,
        h: common_vendor.o(($event) => $options.unfollowUser(user), user.id),
        i: user.id
      });
    }),
    f: common_vendor.p({
      name: "close-circle",
      color: "#ff4d4f",
      size: "24"
    }),
    g: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args), "c4"),
    h: common_vendor.o($options.closePopup, "47"),
    i: common_vendor.p({
      name: "close",
      size: "24",
      color: "#999"
    }),
    j: common_vendor.o($options.handleSearch, "73"),
    k: common_vendor.o($options.handleSearch, "37"),
    l: common_vendor.o(($event) => $data.searchKeyword = $event, "e5"),
    m: common_vendor.p({
      placeholder: "请输入昵称搜索",
      ["show-action"]: false,
      modelValue: $data.searchKeyword
    }),
    n: $data.isSearched && $data.searchResults.length === 0
  }, $data.isSearched && $data.searchResults.length === 0 ? {} : {}, {
    o: common_vendor.f($data.searchResults, (user, k0, i0) => {
      return common_vendor.e({
        a: "03e14ebf-7-" + i0 + ",03e14ebf-4",
        b: common_vendor.p({
          src: user.avatar || "/static/logo.png",
          size: "50"
        }),
        c: common_vendor.t(user.nickname),
        d: user.bio
      }, user.bio ? {
        e: common_vendor.t(user.bio)
      } : {}, {
        f: !$options.isFollowed(user.id)
      }, !$options.isFollowed(user.id) ? {
        g: common_vendor.o(($event) => $options.followUser(user), user.id),
        h: "03e14ebf-8-" + i0 + ",03e14ebf-4",
        i: common_vendor.p({
          name: "plus-circle",
          size: "28",
          color: "#2867CE"
        })
      } : {
        j: "03e14ebf-9-" + i0 + ",03e14ebf-4",
        k: common_vendor.p({
          name: "checkmark-circle",
          size: "28",
          color: "#999"
        })
      }, {
        l: user.id
      });
    }),
    p: common_vendor.o($options.closePopup, "3a"),
    q: common_vendor.p({
      show: $data.showPopup,
      mode: "center",
      round: "20"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-03e14ebf"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/like/like.js.map
