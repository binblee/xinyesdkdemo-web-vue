<template>
	<view style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100vh;">
		<view style="display: flex; flex-direction: column; align-items: center;">
			Toasts
			<button @click="handleShowNativeToast" class="action_btn">Show Android Toast</button>
			<button @click="handleSendDataToNative" class="action_btn">Send Data to Android & Get Response</button>
			<button @click="handleNotifyActivity" class="action_btn">Notify Activity</button>
		</view>
		<view style="display: flex; flex-direction: column; align-items: center;">
			Print
			<button @click="handleStartSampleTsplPrint" class="action_btn">startSampleTsplPrint</button>
			<button @click="handlePrintSampleBarcode" class="action_btn">printSampleBarcode</button>
		</view>
		<view style="display: flex; flex-direction: column; align-items: center;">
			Print with JSPrinterBridge
			<button @click="handlePrintSampleTextFromJSPrinterBridge" class="action_btn">printSampleTextFromJSPrinterBridge</button>
		</view>
	</view>
</template>

<script>
import {
	startSampleTsplPrint,
	printSampleBarcode,
	showNativeToast,
	sendDataToNative,
	notifyActivity
} from '@/utils/nativeBridge.js';

import JSPrinterBridge from '@/utils/JSPrinterBridge.js';

export default {
	methods: {
		handleStartSampleTsplPrint() {
			startSampleTsplPrint();
		},
		handlePrintSampleBarcode() {
			printSampleBarcode();
		},
		handleShowNativeToast() {
			showNativeToast('Hello from JavaScript in the web page!');
		},
		handleSendDataToNative() {
			const data = "Important Information from JS";
			sendDataToNative(data);
		},
		handleNotifyActivity() {
			notifyActivity("User clicked a special button!");
		},
		handlePrintSampleTextFromJSPrinterBridge(){
			const jsPrinter = new JSPrinterBridge();
			jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(10)
					.direction(0) // 0 is TSPLConst.DIRECTION_FORWARD
					.text(10, 10, "0", 0, 1, 1, "Hello from JS!") // "0" for a default font
					.print(1);
		}
	}
}
</script>

<style>
.action_btn {
	background: rgb(69, 147, 228);
	color: white;
	border: none;
	flex: 1;
	margin-top: 40rpx;
	margin-left: 20rpx;
	margin-right: 20rpx;
	font-size: 0.9rem;
}

.action_btn_hover {
	background: rgb(69, 147, 228);
	color: white;
	border: none;
	flex: 1;
	opacity: 0.7;
}
</style>
