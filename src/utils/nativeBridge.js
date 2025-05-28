export const startSampleTsplPrint = () => {
	if (window.Android && typeof window.Android.startSampleTsplPrint === 'function') {
		window.Android.startSampleTsplPrint();
	} else {
		console.warn('Android interface not available, cannot call startSampleTsplPrint.');
	}
};

export const printSampleBarcode = () => {
	if (window.Android && typeof window.Android.printSampleBarcode === 'function') {
		window.Android.printSampleBarcode();
	} else {
		console.warn('Android interface not available, cannot call printSampleBarcode.');
	}
};

export const showNativeToast = (message) => {
	if (window.Android && typeof window.Android.showToast === 'function') {
		window.Android.showToast(message);
	} else {
		console.warn('Android interface not available, cannot call showToast.');
	}
};

export const sendDataToNative = (data) => {
	if (window.Android && typeof window.Android.processData === 'function') {
		var response = window.Android.processData(data);
		alert("Response from Android: " + response); // Show response in a JS alert
		// document.getElementById('responseDiv').innerText = "Android processed: " + response;
		return response; // Optionally return the response
	} else {
		console.warn('Android interface not available, cannot call processData.');
		return null; // Optionally return null or throw an error
	}
};

export const notifyActivity = (message) => {
	if (window.Android && typeof window.Android.sendMessageToActivity === 'function') {
		window.Android.sendMessageToActivity(message);
	} else {
		console.warn('Android interface not available, cannot call sendMessageToActivity.');
	}
};
