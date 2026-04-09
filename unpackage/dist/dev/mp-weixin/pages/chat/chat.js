"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      targetUser: {
        id: "",
        nickname: "",
        avatar: ""
      },
      currentUserId: "",
      // 当前用户ID（从本地存储获取）
      currentUserAvatar: "",
      // 当前用户头像
      messages: [],
      // 消息列表
      inputContent: "",
      // 输入内容
      scrollIntoView: ""
      // 滚动到指定元素
    };
  },
  onLoad(options) {
    if (options.userId) {
      this.targetUser.id = options.userId;
      this.targetUser.nickname = options.nickname ? decodeURIComponent(options.nickname) : "未知用户";
      this.targetUser.avatar = options.avatar ? decodeURIComponent(options.avatar) : "";
    } else {
      common_vendor.index.showToast({
        title: "参数错误",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
      return;
    }
    this.loadCurrentUser();
    this.loadMessages();
  },
  methods: {
    // 加载当前用户信息
    loadCurrentUser() {
      const sessionId = this.getSessionId();
      const storageKey = `userInfo_${sessionId}`;
      const userInfo = common_vendor.index.getStorageSync(storageKey);
      common_vendor.index.__f__("log", "at pages/chat/chat.vue:154", "聊天页加载用户信息，session:", sessionId, "data:", userInfo);
      if (userInfo) {
        this.currentUserId = userInfo.id || sessionId;
        this.currentUserAvatar = userInfo.avatar || "";
      } else {
        this.currentUserId = sessionId;
      }
    },
    // 获取会话ID
    getSessionId() {
      let sessionId = common_vendor.index.getStorageSync("currentSessionId");
      if (!sessionId) {
        sessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        common_vendor.index.setStorageSync("currentSessionId", sessionId);
        common_vendor.index.__f__("log", "at pages/chat/chat.vue:172", "生成新会话ID:", sessionId);
      }
      return sessionId;
    },
    // 加载历史消息
    loadMessages() {
      try {
        const sessionId = this.getSessionId();
        const chatStorageKey = `chatMessages_${sessionId}`;
        const allMessages = common_vendor.index.getStorageSync(chatStorageKey);
        if (!allMessages || typeof allMessages !== "object") {
          this.messages = [];
          return;
        }
        const chatKey = this.getChatKey();
        if (allMessages[chatKey] && Array.isArray(allMessages[chatKey])) {
          this.messages = allMessages[chatKey];
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } else {
          this.messages = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/chat/chat.vue:207", "加载消息失败:", error);
        this.messages = [];
      }
    },
    // 发送消息
    sendMessage() {
      const messageContent = this.inputContent.trim();
      if (!messageContent) {
        common_vendor.index.showToast({
          title: "请输入消息内容",
          icon: "none"
        });
        return;
      }
      const message = {
        senderId: this.currentUserId,
        receiverId: this.targetUser.id,
        content: messageContent,
        type: "text",
        // 'text' 或 'image'
        timestamp: Date.now()
      };
      this.messages.push(message);
      this.saveMessages();
      this.inputContent = "";
      this.$nextTick(() => {
        this.scrollToBottom();
      });
      common_vendor.index.showToast({
        title: "发送成功",
        icon: "success",
        duration: 1e3
      });
    },
    // 选择图片
    chooseImage() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          const message = {
            senderId: this.currentUserId,
            receiverId: this.targetUser.id,
            content: tempFilePath,
            type: "image",
            timestamp: Date.now()
          };
          this.messages.push(message);
          this.saveMessages();
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/chat/chat.vue:284", "选择图片失败:", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      });
    },
    // 预览图片
    previewImage(url) {
      common_vendor.index.previewImage({
        urls: [url],
        current: url
      });
    },
    // 保存消息到本地存储
    saveMessages() {
      try {
        const sessionId = this.getSessionId();
        const chatStorageKey = `chatMessages_${sessionId}`;
        const allMessages = common_vendor.index.getStorageSync(chatStorageKey) || {};
        const chatKey = this.getChatKey();
        allMessages[chatKey] = this.messages;
        common_vendor.index.setStorageSync(chatStorageKey, allMessages);
        common_vendor.index.__f__("log", "at pages/chat/chat.vue:312", "保存聊天记录，session:", sessionId, "chatKey:", chatKey);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/chat/chat.vue:314", "保存消息失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    },
    // 获取聊天键值（用于区分不同的聊天会话）
    getChatKey() {
      const ids = [this.currentUserId, this.targetUser.id].sort();
      return `${ids[0]}_${ids[1]}`;
    },
    // 滚动到底部
    scrollToBottom() {
      if (this.messages.length > 0) {
        this.$nextTick(() => {
          this.scrollIntoView = "msg-" + (this.messages.length - 1);
        });
      }
    },
    // 加载更多消息（向上滚动时触发）
    loadMoreMessages() {
      common_vendor.index.__f__("log", "at pages/chat/chat.vue:341", "加载更多历史消息");
    },
    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  }
};
if (!Array) {
  const _easycom_u_avatar2 = common_vendor.resolveComponent("u-avatar");
  const _easycom_u_image2 = common_vendor.resolveComponent("u-image");
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  (_easycom_u_avatar2 + _easycom_u_image2 + _easycom_u_icon2 + _easycom_u_button2)();
}
const _easycom_u_avatar = () => "../../uni_modules/uview-plus/components/u-avatar/u-avatar.js";
const _easycom_u_image = () => "../../uni_modules/uview-plus/components/u-image/u-image.js";
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
if (!Math) {
  (_easycom_u_avatar + _easycom_u_image + _easycom_u_icon + _easycom_u_button)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      src: $data.targetUser.avatar || "/static/logo.png",
      size: "40"
    }),
    b: common_vendor.t($data.targetUser.nickname),
    c: $data.messages.length === 0
  }, $data.messages.length === 0 ? {} : {}, {
    d: common_vendor.f($data.messages, (msg, index, i0) => {
      return common_vendor.e({
        a: msg.senderId !== $data.currentUserId
      }, msg.senderId !== $data.currentUserId ? common_vendor.e({
        b: msg.type === "text" || msg.type === "click"
      }, msg.type === "text" || msg.type === "click" ? {
        c: common_vendor.t(msg.content)
      } : msg.type === "image" ? {
        e: common_vendor.o(($event) => $options.previewImage(msg.content), index + "_" + msg.timestamp),
        f: "0a633310-1-" + i0,
        g: common_vendor.p({
          src: msg.content,
          width: "400rpx",
          height: "300rpx",
          mode: "aspectFill",
          ["border-radius"]: "10rpx"
        })
      } : {}, {
        d: msg.type === "image"
      }) : common_vendor.e({
        h: msg.type === "text" || msg.type === "click"
      }, msg.type === "text" || msg.type === "click" ? {
        i: common_vendor.t(msg.content)
      } : msg.type === "image" ? {
        k: common_vendor.o(($event) => $options.previewImage(msg.content), index + "_" + msg.timestamp),
        l: "0a633310-2-" + i0,
        m: common_vendor.p({
          src: msg.content,
          width: "400rpx",
          height: "300rpx",
          mode: "aspectFill",
          ["border-radius"]: "10rpx"
        })
      } : {}, {
        j: msg.type === "image"
      }), {
        n: common_vendor.t($options.formatTime(msg.timestamp)),
        o: index + "_" + msg.timestamp,
        p: "msg-" + index
      });
    }),
    e: $data.scrollIntoView,
    f: common_vendor.o((...args) => $options.loadMoreMessages && $options.loadMoreMessages(...args), "89"),
    g: common_vendor.p({
      name: "photo",
      size: "28",
      color: "#2867CE"
    }),
    h: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args), "9d"),
    i: $data.inputContent,
    j: common_vendor.o(($event) => $data.inputContent = $event.detail.value, "1b"),
    k: common_vendor.o($options.sendMessage, "f4"),
    l: common_vendor.p({
      type: "primary",
      disabled: !$data.inputContent.trim(),
      customStyle: "width: 60px; height: 35px; font-size: 12px; padding: 0;"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-0a633310"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/chat/chat.js.map
