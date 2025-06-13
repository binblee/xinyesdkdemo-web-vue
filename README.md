# xinyesdkdemo-web-vue

## 项目简介

本项目配合安卓Webview演示如下内容：

- 芯烨打印 SDK 的集成与使用方法。
- Roid数字人显示与动作、表情控制
- 讯飞TTS语音合成

## 目录结构

导航与路由：
- `src/router/index.js`：Vue Router 路由配置
- `src/components/AppNavigator.vue`：主导航页面
- `src/components/BackButton.vue`：通用返回按钮组件

芯烨打印机：
- `src/utils/JSPrinterBridge.js`：封装与新烨打印 SDK 的 JS 桥接方法。
- `src/components/PrintView.vue`：打印功能的示例页面。

VRoid数字人：
- `src/components/VrmViewer.vue`：数字人演示页面
-  [https://taient.oss-cn-beijing.aliyuncs.com/vroid/AvatarZ.vrm](https://taient.oss-cn-beijing.aliyuncs.com/vroid/AvatarZ.vrm) ： 数字人模型（VRM格式），用在VrmViewer中。
- [https://taient.oss-cn-beijing.aliyuncs.com/vroid/model-avatarz.xroid](https://taient.oss-cn-beijing.aliyuncs.com/vroid/model-avatarz.xroid) ：VRoid Studio项目文件，用于编辑数字人并到处VRM模型。

- [https://vroid.com/en/studio](https://vroid.com/en/studio) ：VRoid Studio 官网。

讯飞TTS：
- `src/services/XunfeiTTS.js`：封装讯飞TTS API调用细节
- `src/components/XunfeiTtsDemo.vue`：讯飞TTS演示页面

多媒体测试组件：
- `src/components/CameraTestDemo.vue`：摄像头测试页面
- `src/components/MicrophoneTestDemo.vue`：麦克风测试页面
- `src/components/BarcodeReaderDemo.vue`：条码扫描器测试页面
- `src/components/VideoPlayerDemo.vue`：视频播放器演示页面
- `xunfei-proxy.js`：后端Proxy，如果讯飞对Web API调用CORS限制，可以使用这个proxy

## 打印机SDK集成

通过自定义Javascript Bridge将安卓平台上的打印机SDK功能开放给WebView中的Javascript。只有常用的几个打印功能定义了JSBridge，详见JSPrinterBridge.js文件。

### JSPrinterBridge.js 说明

`JSPrinterBridge.js` 文件用于封装与新烨打印 SDK 的交互逻辑，提供统一的 JS 接口，方便在 Vue 组件中调用。

主要功能包括：
- 创建JSBridge对象
- 发送打印任务
- 查询打印状态

### 主要方法示例

```js
// 创建JSBridge对象
this.jsPrinter = new JSPrinterBridge();

// 发送打印任务
this.jsPrinter.sizeMm(50.0, 15.0)
                .gapMm(2.0, 0.0)
                .cls()
                .density(10)
                .direction(TSPLConst.DIRECTION.FORWARD)
                .text(10, 10, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "你好 from printer bridge") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
                .print(1);

// 查询打印状态
const status = await this.jsPrinter.getPrinterStatus(5000);
```

## VRoid数字人

TBD

## 讯飞TTS

目前使用免费的账号，实测只能说很短的句子，选择有限的几个发音人（音库）。

在本地用http页面测试，讯飞TTS对于websocket调用没有CORS限制。调用textToSpeech()参数`useProxy`设置为`false`即可。
在HTTPS页面测试又CORS限制，必须启用proxy。

在本地启用proxy：需要在另外的窗口启动proxy：

```bash
node xunfei-proxy.js
```

proxy侦听在3001端口，vite-config.js中已配置好。

在cloudflare中，`src/worker.js` 用于cloudflare worker作为proxy转发语音合成请求。
