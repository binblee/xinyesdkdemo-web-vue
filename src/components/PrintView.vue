<template>
	<view class="container">
		<!-- Back Button -->
		<BackButton />
		
		<view class="section">
			<text class="section-title">原生桥接通信</text>
			<button @click="handleShowNativeToast" class="action-btn">显示Toast</button>
			<button @click="handleSendDataToNative" class="action-btn">发送数据并获取响应</button>
			<button @click="handleNotifyActivity" class="action-btn">通知活动</button>
		</view>

		<view class="section">
			<text class="section-title">文本打印</text>
			<button @click="handlePrintSampleTextFromJSPrinterBridge" class="action-btn">打印示例文本</button>
			<button @click="handleMultiLineTextPrint" class="action-btn">打印多行文本</button>
		</view>

		<view class="section">
			<text class="section-title">条码打印</text>
			<button @click="handleBarCodePrint('ty1234567890123')" class="action-btn">打印条码</button>
			<button @click="handleQRCodePrint('https://ibm.com')" class="action-btn">打印二维码</button>
		</view>

		<view class="section">
			<text class="section-title">线条与框形</text>
			<button @click="handleBarAndBoxPrint" class="action-btn">打印线条与框形</button>
		</view>

		<view class="section">
			<text class="section-title">打印机状态</text>
			<button @click="handleGetPrinterStatus" class="action-btn">获取打印机状态</button>
			<view v-if="printerStatus !== null || statusError !== null" class="status-display">
				<text v-if="printerStatus" class="status-text success">状态: {{ printerStatus }}</text>
				<text v-if="statusError" class="status-text error">错误: {{ statusError }}</text>
			</view>
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
import BackButton from './BackButton.vue';

export default {
	components: {
		BackButton
	},
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
			// This prints two lines of text, one below the other
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
		handleQRCodePrint(content, quantity = 1){
			this.jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(7)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.qrcode(10, 5,
						TSPLConst.QRCODE_ECC_LEVEL.M,
						4,
						TSPLConst.QRCODE_MODE.MANUAL,
						TSPLConst.ROTATION.ANGLE_0,
						content)
					.print(quantity);
		},
		handleBarAndBoxPrint(){
			this.jsPrinter.sizeMm(50.0, 15.0)
					.gapMm(2.0, 0.0)
					.cls()
					.density(7)
					.direction(TSPLConst.DIRECTION.FORWARD)
					.bar(10, 10, 100, 20)
					.box(5, 5, 110, 50, 2)
					.print();

		},
		async handleGetPrinterStatus() {
            this.printerStatus = null; // Reset previous status
            this.statusError = null;   // Reset previous error

            if (!this.jsPrinter || !this.jsPrinter.isAvailable()) {
                this.statusError = "打印机接口不可用。";
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
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px;
	font-family: sans-serif;
	background-color: #f4f7f6; /* Light background for the whole page */
	min-height: 100vh;
}

.section {
	display: flex;
	flex-direction: column;
	align-items: stretch; /* Make buttons in a section have same width */
	width: 100%;
	max-width: 400px; /* Max width for content sections */
	background-color: #ffffff; /* White background for sections */
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
}

.section-title {
	font-size: 1.2rem;
	font-weight: bold;
	color: #333;
	margin-bottom: 15px;
	text-align: center;
}

.action-btn {
	background-color: #007bff; /* A more modern blue */
	color: white;
	border: none;
	padding: 12px 15px;
	margin-top: 10px;
	border-radius: 5px;
	font-size: 0.95rem;
	text-align: center;
	cursor: pointer;
	transition: background-color 0.2s ease-in-out;
}

.action-btn:hover {
	background-color: #0056b3; /* Darker blue on hover */
}

/* Specific hover class if needed, otherwise covered by .action-btn:hover */
.action_btn_hover {
	background-color: #0056b3;
	opacity: 0.9;
}

.status-display {
	margin-top: 15px;
	padding: 10px;
	border-radius: 5px;
	width: 100%;
	text-align: left;
}

.status-text {
	display: block;
	word-wrap: break-word;
}

.status-text.success {
	color: #28a745; /* Green for success */
	background-color: #e9f7ef; /* Light green background */
	padding: 8px;
	border-radius: 4px;
}

.status-text.error {
	color: #dc3545; /* Red for error */
	background-color: #fce8e6; /* Light red background */
	padding: 8px;
	border-radius: 4px;
}

/* Responsive adjustments if needed */
@media (max-width: 600px) {
	.container {
		padding: 10px;
	}
	.section {
		padding: 15px;
	}
	.action-btn {
		font-size: 0.9rem;
		padding: 10px 12px;
	}
}
</style>
