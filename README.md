# xinyesdkdemo-web-vue

## 项目简介

本项目是一个基于 Vue 的 Web 演示项目，主要用于演示新烨打印 SDK 的集成与使用方法。

## 目录结构

- `src/utils/JSPrinterBridge.js`：封装与新烨打印 SDK 的 JS 桥接方法。
- `src/components/print-view/PrintView.vue`：打印功能的示例页面。

## JSPrinterBridge.js 说明

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

## PrintView.vue 示例代码

在 `PrintView.vue` 组件中演示了调用 JSPrinterBridge 进行打印。

