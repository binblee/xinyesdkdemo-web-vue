<template>
	<view style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100vh;">
		<view style="display: flex; flex-direction: column; align-items: center;">
			Toasts
			<button @click="showNativeToast" class="action_btn">Show Android Toast</button>
			<button @click="sendDataToNative" class="action_btn">Send Data to Android & Get Response</button>
			<button @click="notifyActivity" class="action_btn">Notify Activity</button>
		</view>
		<view style="display: flex; flex-direction: column; align-items: center;">
			Print
			<button @click="startSampleTsplPrint" class="action_btn">startSampleTsplPrint</button>
			<button @click="printSampleBarcode" class="action_btn">printSampleBarcode</button>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		startSampleTsplPrint() {
			if (window.Android && typeof window.Android.showToast === 'function') {
				// Calls the showToast method in your WebAppInterface
				window.Android.startSampleTsplPrint();
			} else {
				console.warn('Android interface not available, cannot call startSampleTsplPrint.');
			}

		},
		printSampleBarcode() {
			if (window.Android && typeof window.Android.showToast === 'function') {
				// Calls the showToast method in your WebAppInterface
				window.Android.printSampleBarcode();
			} else {
				console.warn('Android interface not available, cannot call printSampleBarcode.');
			}

		},
		showNativeToast() {
			if (window.Android && typeof window.Android.showToast === 'function') {
				// Calls the showToast method in your WebAppInterface
				window.Android.showToast('Hello from JavaScript in the web page!');
			} else {
				console.warn('Android interface not available, cannot call showToast.');
			}
		},
		sendDataToNative() {
			if (window.Android && typeof window.Android.showToast === 'function') {
                var data = "Important Information from JS";
                // Calls processData and gets a return value
                var response = window.Android.processData(data);
                alert("Response from Android: " + response); // Show response in a JS alert
                // document.getElementById('responseDiv').innerText = "Android processed: " + response;
			} else {
				console.warn('Android interface not available, cannot call processData.');
			}
		},
		notifyActivity() {
			if (window.Android && typeof window.Android.showToast === 'function') {
                window.Android.sendMessageToActivity("User clicked a special button!");
			} else {
				console.warn('Android interface not available, cannot call sendMessageToActivity.');
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
