<template>
	<view style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100vh;">
		<view style="display: flex; flex-direction: column; align-items: center;">
			Toasts
			<button @click="handleShowNativeToast" class="action_btn">Show Android Toast</button>
			<button @click="handleSendDataToNative" class="action_btn">Send Data to Android & Get Response</button>
			<button @click="handleNotifyActivity" class="action_btn">Notify Activity</button>
		</view>
		<view style="display: flex; flex-direction: column; align-items: center;">
			Print Text
			<button @click="handlePrintSampleTextFromJSPrinterBridge" class="action_btn">打印文字</button>
			<button @click="handleMultiLineTextPrint" class="action_btn">多行文字打印</button>
		</view>
		<view style="display: flex; flex-direction: column; align-items: center;">
			Print Barcode
			<button @click="handleBarCodePrint_internal('0-ty12345abc', 0)" class="action_btn">BARCODE(0)</button>
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

import {TSPLConst, JSPrinterBridge} from '@/utils/JSPrinterBridge.js';

export default {
	methods: {
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
					.direction(TSPLConst.DIRECTION.FORWARD)
					.text(10, 10, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "你好 from printer bridge") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
					.print(1);
		},
		handleMultiLineTextPrint(){
			// Print multi-line text example:
			const jsPrinter = new JSPrinterBridge();
			jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(10)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.text(10, 10, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "你好") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
					.text(10, 10+24, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "from printer bridge") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
					.print(1);
		},
		handleBarCodePrint_internal(content, humanReadable) {
			const jsPrinter = new JSPrinterBridge();
			jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(7)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.barcode(10, 10,
						TSPLConst.BARCODE_TYPE.CODE128, humanReadable,
						50, 0, 2, 2, content)
					.print(1);
		},
		handleBarCodePrint(){
			this.handleBarCodePrint_internal('0-ty12345abc', 0);
			this.handleBarCodePrint_internal('1-ty12345abc', 1);
			this.handleBarCodePrint_internal('2-ty12345abc', 2);
			this.handleBarCodePrint_internal('3-ty12345abc', 3);
		},
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
