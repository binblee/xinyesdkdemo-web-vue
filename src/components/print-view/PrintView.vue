<template>
	<view style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100vh;">
		<view style="display: flex; flex-direction: column; align-items: center;">
			Content inside webview
			<button @click="sendMessageToHostApp" class="action_btn">Send Message to Host</button>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		sendMessageToHostApp() {
			if (window.parent !== window) {
				// Ensure we are in an iframe/webview
				window.parent.postMessage({ type: 'messageFromWebview', payload: 'Hello from PrintView!' }, '*');
			} else {
				console.warn('Not running in a webview or iframe, cannot post message to parent window.');
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
