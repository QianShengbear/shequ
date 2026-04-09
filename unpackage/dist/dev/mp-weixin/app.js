"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const uni_modules_uviewPlus_index = require("./uni_modules/uview-plus/index.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/like/like.js";
  "./pages/my/my.js";
  "./pages/chat/chat.js";
  "./pages/more/more.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:8", "App Launch");
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:11", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:14", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(uni_modules_uviewPlus_index.uviewPlus);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
