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
			<button @click="handleBarCodePrint('ty1234567890123')" class="action_btn">BARCODE</button>
		</view>
		<view style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
            Printer Status
            <button @click="handleGetPrinterStatus" class="action_btn">Get Printer Status</button>
            <view v-if="printerStatus">Status: {{ printerStatus }}</view>
            <view v-if="statusError">Error: {{ statusError }}</view>
        </view>
	</view>
</template>

<script>
import {
	showNativeToast,
	sendDataToNative,
	notifyActivity
} from '@/utils/nativeBridge.js';

import {TSPLConst, JSPrinterBridge} from '@/utils/JSPrinterBridge.js';

export default {
	data() {
        return {
            printerStatus: null,
            statusError: null,
            jsPrinter: null // To store the JSPrinterBridge instance
        };
    },
	created() {
        // Initialize the printer bridge when the component is created
        this.jsPrinter = new JSPrinterBridge();
        if (!this.jsPrinter.isAvailable()) {
            console.warn("PrintView: Native printer interface not available on component creation.");
            // You could set a data property here to inform the user
        }
    },
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
			this.jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(10)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.text(10, 10, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "你好 from printer bridge") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
					.print(1);
		},
		handleMultiLineTextPrint(){
			// Print multi-line text example:
			this.jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(10)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.text(5, 10, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "你好") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
					.text(5, 10+24, TSPLConst.FONT.SIMPLIFIED_CHINESE, 0, 1, 1, "from printer bridge") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
					.print(1);
		},
		handleBarCodePrint(content, quantity = 1 ) {
			this.jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(7)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.barcode(10, 10, TSPLConst.BARCODE_TYPE.CODE_128, 50, content)
					.print(quantity);
		},
		async handleGetPrinterStatus() {
            this.printerStatus = null; // Reset previous status
            this.statusError = null;   // Reset previous error

            if (!this.jsPrinter || !this.jsPrinter.isAvailable()) {
                this.statusError = "Printer interface is not available.";
                console.error("handleGetPrinterStatus: Printer interface not available.");
                return;
            }

            console.log("Requesting printer status...");
            try {
                // Call getPrinterStatus, it returns a Promise
                // You can pass an optional timeout in milliseconds
                const status = await this.jsPrinter.getPrinterStatus(5000); // 5-second timeout for the native call

                this.printerStatus = typeof status === 'object' ? JSON.stringify(status) : status;
                console.log("Printer status received:", status);
            } catch (error) {
                this.statusError = typeof error === 'object' ? JSON.stringify(error) : error;
                console.error("Failed to get printer status:", error);
            }
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
