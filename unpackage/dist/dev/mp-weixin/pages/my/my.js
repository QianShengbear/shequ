"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        id: "",
        // 添加ID字段
        avatar: "",
        nickname: "",
        bio: "",
        gender: "male"
        // 默认男性
      }
    };
  },
  onLoad() {
    this.loadUserInfo();
  },
  methods: {
    // 获取当前设备上的用户列表
    getDeviceUsers() {
      const users = common_vendor.index.getStorageSync("deviceUsers") || [];
      return users;
    },
    // 设置当前活跃用户
    setActiveUser(userId) {
      common_vendor.index.setStorageSync("activeUserId", userId);
    },
    // 获取当前活跃用户ID
    getActiveUserId() {
      return common_vendor.index.getStorageSync("activeUserId") || "";
    },
    // 加载用户信息
    loadUserInfo() {
      const sessionId = this.getSessionId();
      const storageKey = `userInfo_${sessionId}`;
      const savedInfo = common_vendor.index.getStorageSync(storageKey);
      common_vendor.index.__f__("log", "at pages/my/my.vue:99", "读取用户信息，session:", sessionId, "data:", savedInfo);
      if (savedInfo) {
        this.userInfo = savedInfo;
        if (!this.userInfo.id) {
          this.userInfo.id = sessionId;
          common_vendor.index.__f__("log", "at pages/my/my.vue:107", "为旧数据生成ID:", this.userInfo.id);
        }
      } else {
        this.userInfo.id = sessionId;
        common_vendor.index.__f__("log", "at pages/my/my.vue:112", "初始化新用户ID:", this.userInfo.id);
      }
    },
    // 获取会话ID（小程序场景下使用 openid 或生成的唯一ID）
    getSessionId() {
      let sessionId = common_vendor.index.getStorageSync("currentSessionId");
      if (!sessionId) {
        sessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        common_vendor.index.setStorageSync("currentSessionId", sessionId);
        common_vendor.index.__f__("log", "at pages/my/my.vue:125", "生成新会话ID:", sessionId);
      }
      return sessionId;
    },
    // 选择头像
    chooseAvatar() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.userInfo.avatar = tempFilePath;
          common_vendor.index.showToast({
            title: "头像已选择，请点击保存",
            icon: "none"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/my/my.vue:147", "选择图片失败:", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      });
    },
    // 性别改变
    onGenderChange(e) {
      this.userInfo.gender = e.detail.value;
    },
    // 保存用户信息
    saveUserInfo() {
      if (!this.userInfo.nickname || this.userInfo.nickname.trim() === "") {
        common_vendor.index.showToast({
          title: "请输入昵称",
          icon: "none"
        });
        return;
      }
      if (!this.userInfo.id) {
        this.userInfo.id = this.getSessionId();
      }
      const sessionId = this.userInfo.id;
      const storageKey = `userInfo_${sessionId}`;
      common_vendor.index.__f__("log", "at pages/my/my.vue:181", "准备保存用户信息，session:", sessionId, "data:", this.userInfo);
      try {
        common_vendor.index.setStorageSync(storageKey, this.userInfo);
        common_vendor.index.setStorageSync("currentSessionId", sessionId);
        const verifyData = common_vendor.index.getStorageSync(storageKey);
        common_vendor.index.__f__("log", "at pages/my/my.vue:192", "验证保存的数据:", verifyData);
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:199", "保存失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.userInfo.avatar || "/static/logo.png",
    b: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args), "59"),
    c: $data.userInfo.nickname,
    d: common_vendor.o(($event) => $data.userInfo.nickname = $event.detail.value, "81"),
    e: $data.userInfo.bio,
    f: common_vendor.o(($event) => $data.userInfo.bio = $event.detail.value, "52"),
    g: $data.userInfo.gender === "male",
    h: $data.userInfo.gender === "female",
    i: common_vendor.o((...args) => $options.onGenderChange && $options.onGenderChange(...args), "2b"),
    j: common_vendor.o((...args) => $options.saveUserInfo && $options.saveUserInfo(...args), "8b")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-2f1ef635"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my/my.js.map
