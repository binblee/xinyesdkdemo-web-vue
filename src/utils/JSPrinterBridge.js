
// JavaScript constants mirroring the provided Java TSPLConst class

const TSPLConst = {
    BARCODE_TYPE: {
        CODE_128: "128",        // Code 128
        // CODE_128M: "128M",      // Code 128 with Checksum
        // EAN128: "EAN128",       // EAN128 (also known as GS1-128)
        // CODE_25: "25",          // Code 25 (Interleaved 2 of 5)
        // CODE_25C: "25C",        // Code 25 with Checksum
        // CODE_39: "39",          // Code 39
        // CODE_39C: "39C",        // Code 39 with Checksum
        // CODE_93: "93",          // Code 93
        // EAN13: "EAN13",         // EAN13 (European Article Number)
        // EAN13_2: "EAN13+2",     // EAN13 with 2-digit add-on
        // EAN13_5: "EAN13+5",     // EAN13 with 5-digit add-on
        // EAN8: "EAN8",           // EAN8 (European Article Number)
        // EAN8_2: "EAN8+2",       // EAN8 with 2-digit add-on
        // EAN8_5: "EAN8+5",       // EAN8 with 5-digit add-on
        // CODA: "CODA",           // Codabar
        // POST: "POST",           // Postnet
        // UPCA: "UPCA",           // UPC-A (Universal Product Code)
        // UPCA_2: "UPCA+2",       // UPCA with 2-digit add-on
        // UPCA_5: "UPCA+5",       // UPCA with 5-digit add-on
        // UPCE: "UPCE",           // UPCE (compressed UPC-A)
        // UPCE_2: "UPCE+2",       // UPCE with 2-digit add-on
        // UPCE_5: "UPCE+5",       // UPCE with 5-digit add-on
        // CPOST: "CPOST",         // China Postal Code
        // MSI: "MSI",
        // MSIC: "MSIC",           // MSI with Checksum
        // PLESSEY: "PLESSEY",     // Plessey Code
        // ITF14: "ITF14",         // ITF-14 (Interleaved 2 of 5)
        // EAN14: "EAN14",         // EAN-14 (similar to ITF-14, often used for GTIN-14)
        // CODE_11: "11",          // Code 11
        // TELEPEN: "TELEPEN",     // Telepen Alpha
        // TELEPENN: "TELEPENN",   // Telepen Numeric
        // PLANET: "PLANET",       // Planet Code
        // CODE49: "CODE49",       // Code 49
        // DPI: "DPI",             // Deutsche Post Identcode
        // DPL: "DPL"              // Deutsche Post Leitcode
    },
    //todo: need to check if these are correct 
    BARCODE_HUMAN_READABLE: {
        NONE: 0,
        DEFAULT_ALIGN: 1, // Typically 'Below' for linear. 
                          // Corresponds to Xinye SDK's READABLE_LEFT 
                          // if it implies default.
        // ALIGN_LEFT: 1,    // As Xinye SDK Java constants
        // ALIGN_CENTER: 2,
        // ALIGN_RIGHT: 3,

        // Standard TSPL human readable options:
        // NONE_STANDARD: 0, // No human readable text
        // BELOW_STANDARD: 1,// Human readable text below barcode
        // ABOVE_STANDARD: 2 // Human readable text above barcode (not always supported)
    },

    ROTATION: {
        ANGLE_0: 0,
        // ANGLE_90: 90,
        // ANGLE_180: 180,
        // ANGLE_270: 270
    },

    // TEXT_ALIGNMENT: { // For TEXT command, if SDK supports alignment parameter directly
    //                   // (Often alignment is done by calculating X position)
    //     LEFT: 1,
    //     CENTER: 2,
    //     RIGHT: 3
    // },

    DIRECTION: {
        FORWARD: 0, // Normal printing direction
        REVERSE: 1  // Content printed in reverse order
    },

    FONT: {
        FNT_8_12: "1",    // Font 1 (typically 8x12 dots)
        FNT_12_20: "2",   // Font 2 (typically 12x20 dots)
        FNT_16_24: "3",   // Font 3 (typically 16x24 dots)
        FNT_24_32: "4",   // Font 4 (typically 24x32 dots)
        FNT_32_48: "5",   // Font 5 (typically 32x48 dots)
        FNT_14_19: "6",   // Font 6
        FNT_14_25: "7",   // Font 7 (some call this OCR-B)
        FNT_21_27: "8",   // Font 8 (some call this OCR-A)
        SIMPLIFIED_CHINESE: "TSS24.BF2", // Simplified Chinese font file
        TRADITIONAL_CHINESE: "TST24.BF2",// Traditional Chinese font file
        KOREAN: "K"       // Korean font identifier
    },

    QRCODE_ECC_LEVEL: { // Error Correction Code Level
        L: "L", // Low (7%)
        M: "M", // Medium (15%)
        Q: "Q", // Quartile (25%)
        H: "H"  // High (30%)
    },

    QRCODE_MODE: {
        AUTO: "A",   // Automatic encoding
        MANUAL: "M"  // Manual encoding (requires more parameters)
    },

    // QRCODE_MODEL: { // For QR Code, typically Model 1 (original) or Model 2 (enhanced)
    //     M1: "M1",
    //     M2: "M2"
    // }

    // CODE_PAGE: { // International character sets / Code Pages
    //     PAGE_437: 437,    // USA, Standard Europe
    //     PAGE_850: 850,    // Multilingual
    //     PAGE_852: 852,    // Latin 2 (Central Europe)
    //     PAGE_860: 860,    // Portuguese
    //     PAGE_863: 863,    // Canadian/French
    //     PAGE_865: 865,    // Nordic
    //     PAGE_1250: 1250,  // Windows Central Europe
    //     PAGE_1252: 1252,  // Windows Latin 1 (ANSI)
    //     PAGE_1253: 1253,  // Windows Greek
    //     PAGE_1254: 1254   // Windows Turkish
    // },

    // BITMAP_MODE: { // For PUTBMP or BITMAP commands
    //     OVERWRITE: 0,
    //     OR: 1,
    //     XOR: 2,
    //     // Xinye SDK Java constants have _C versions, e.g., BMP_MODE_OVERWRITE_C.
    //     // It's unclear what "_C" signifies without SDK context (Color? Compressed?).
    //     // Assuming they are distinct modes:
    //     OVERWRITE_C: 3,
    //     OR_C: 4,
    //     XOR_C: 5
    // },

    // STATUS: { // General status indicators
    //     CONNECTED: 1,
    //     DISCONNECTED: 0
    // }
};

/**
 *
 * A JavaScript bridge to interact with a native TSPLPrinter.
 * Assumes a global object (e.g., `AndroidTSPLPrinter`) is injected by the native WebView
 * that exposes methods to call the Kotlin TSPLPrinter.
 */

class JSPrinterBridge {
    constructor() {
        this.interfaceName = "AndroidTSPLPrinter"; // Name of the interface exposed by native code
        this._isNativeAvailable = window[this.interfaceName] !== 'undefined';
        if (!this._isNativeAvailable) {
            console.warn(`JSPrinterBridge: Native interface "${this.interfaceName}" is not available on the window object. Printer functionality will be simulated or unavailable.`);
        }
    }
    
    /**
     * Checks if the native printer interface is available.
     * @returns {boolean} True if the native interface is detected, false otherwise.
     */
    isAvailable() {
        return this._isNativeAvailable && window[this.interfaceName];
    }

    /**
     * Internal helper to safely call a native method.
     * @param {string} methodName The name of the method on the native interface.
     * @param {any[]} args Arguments to pass to the native method.
     * @param {string} [warningMessageIfMissing] Optional warning if the method is not found on the interface.
     * @returns {boolean} True if the call was attempted (even if method missing but interface exists), false if native interface itself is missing.
     */
    _callNative(methodName, args = [], warningMessageIfMissing) {
        if (!this.isAvailable()) {
            console.warn(`JSPrinterBridge: Native interface "${this.interfaceName}" not available for calling "${methodName}".`);
            return false;
        }
        const nativeInterface = window[this.interfaceName];
        if (typeof nativeInterface[methodName] === 'function') {
            nativeInterface[methodName](...args);
            return true;
        } else {
            const message = warningMessageIfMissing || `JSPrinterBridge: Native method "${methodName}" is not available on "${this.interfaceName}".`;
            console.warn(message);
            return true; // Interface exists, but method is missing.
        }
    }

    /**
     * Sets the label size in millimeters.
     * @param {number} widthMm Label width in mm.
     * @param {number} heightMm Label height in mm.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    sizeMm(widthMm, heightMm) {
        this._callNative('sizeMm', [widthMm, heightMm]);
        return this;
    }

    /**
     * Sets the gap between labels in millimeters.
     * @param {number} feedMm Gap feed distance in mm.
     * @param {number} offsetMm Gap offset distance in mm.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    gapMm(feedMm, offsetMm) {
        this._callNative('gapMm', [feedMm, offsetMm]);
        return this;
    }

    /**
     * Clears the image buffer.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    cls() {
        this._callNative('cls');
        return this;
    }

    /**
     * Sets the print density.
     * @param {number} level Density level (typically 0-15).
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    density(level) {
        this._callNative('density', [level]);
        return this;
    }

    /**
     * Sets the print direction.
     * @param {number} direction Use TSPLConst.DIRECTION_FORWARD or TSPLConst.DIRECTION_BACKWARD
     *                         (You'll need to pass the numeric value from JS).
     *                         Example: 0 for backward, 1 for forward. Consult your TSPLConst.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    direction(directionValue) {
        this._callNative('direction', [directionValue]);
        return this;
    }

    /**
     * Prints text on the label.
     * @param {number} x X-coordinate in dots.
     * @param {number} y Y-coordinate in dots.
     * @param {string} fontIdentifier Font identifier (e.g., "TSS24.BF2" for Simplified Chinese).
     * @param {number} rotation Rotation angle (0, 90, 180, 270).
     * @param {number} xMultiplier Horizontal magnification.
     * @param {number} yMultiplier Vertical magnification.
     * @param {string} content The text content to print.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    text(x, y, fontIdentifier, rotation, xMultiplier, yMultiplier, content) {
        this._callNative('text', [x, y, fontIdentifier, rotation, xMultiplier, yMultiplier, content]);
        return this;
    }

    /**
     * Prints a solid bar (filled rectangle) on the label.
     * @param x The X-coordinate (in dots) for the upper-left corner of the bar.
     * @param y The Y-coordinate (in dots) for the upper-left corner of the bar.
     * @param width The width of the bar (in dots).
     * @param height The height of the bar (in dots).
     */
    bar(x, y, width, height){
        this._callNative('bar', [x, y, width, height]);
        return this;
    }

    /**
     * Prints a box (rectangle outline) on the label.
     *
     * @param x The X-coordinate (in dots) for the upper-left corner of the box.
     * @param y The Y-coordinate (in dots) for the upper-left corner of the box.
     * @param width The width of the box (in dots).
     * @param height The height of the box (in dots).
     * @param thickness The line thickness of the box border (in dots).
     */
    box(x, y, width, height, thickness){
        this._callNative('box', [x, y, width, height, thickness]);
        return this;
    }
    
    /**
     * Prints a barcode.
     *
     * @param {number} x The horizontal starting position in dots.
     * @param {number} y The vertical starting position in dots.
     * @param {string} codeType The type of barcode (e.g., "128", "EAN13", "QRCODE").
     *                 Check your printer's TSPL manual for supported types.
     * @param {number} height The height of the barcode in dots.
     * @param {string} content The data to be encoded in the barcode.
     */
    barcode(
        x, y, codeType, height, content
    ) {
        this._callNative('barcode', [x, y, codeType, height, content]);
        return this;        
    }

    /**
     * Adds a QR Code to the label using the dedicated native qrcode interface.
     * @param {number} x The X-coordinate for the top-left corner of the QR Code.
     * @param {number} y The Y-coordinate for the top-left corner of the QR Code.
     * @param {'L'|'M'|'Q'|'H'} Error Correction Level (defined in QRCODE.ECC_LEVEL).
     * @param {number} The width of each module (dot) in the QR code (e.g., 2-10).
     * @param {string} ['M'|'A'] QR code mode (e.g., "M" for Manual, "A" for Auto, defined in  QRCODE.MODE).
     * @param {0|90|180|270} Rotation angle (0, 90, 180, 270, defined in ROTATION).
     * @param {string} content The data to encode in the QR Code.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    qrcode(x, y,
        eccLevel,   // eg. TSPLConst.QRCODE_ECC_LEVEL.H,
        cellWidth,  // eg. 4,
        mode,       // eg. TSPLConst.QRCODE_MODE.MANUAL,
        rotation,   // eg. TSPLConst.ROTATION.ANGLE_0,
        content) {

        // Ensure parameters are in the exact order expected by the native Kotlin qrcode function
        this._callNative(
            'qrcode', [x, y, eccLevel, cellWidth, mode, rotation, content],
            `JSPrinterBridge: Native method "qrcode" is not available or has incorrect parameters.`
        );
        return this;
    }


    /**
     * Executes the print job for a specified number of labels.
     * @param {number} quantity Number of labels to print.
     * @returns {JSPrinterBridge} this instance for chaining (though typically print is the last call).
     */
    print(quantity) {
        this._callNative('print', [quantity]);
        return this; // Usually last, but still return for consistency
    }

    /**
     * Requests the printer status from the native interface.
     * @param {number} [timeoutMs=7000] Optional timeout for the native call to get a response.
     *                                   This is the timeout passed TO the native Android code.
     * @returns {Promise<Object|string>} A promise that resolves with the printer status object
     *                                   or rejects with an error object/message.
     */
    getPrinterStatus(timeoutMs = 7000) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable()) {
                console.warn(`JSPrinterBridge: Native interface "${this.interfaceName}" not available for "getPrinterStatus".`);
                // Reject with a specific error structure if desired
                reject({ error: 'NativeInterfaceUnavailable', message: `Native interface "${this.interfaceName}" not available.` });
                return;
            }

            const nativeInterface = window[this.interfaceName];
            if (typeof nativeInterface.getPrinterStatus !== 'function') {
                console.warn(`JSPrinterBridge: Native method "getPrinterStatus" is not available on "${this.interfaceName}".`);
                reject({ error: 'NativeMethodUnavailable', message: `Native method "getPrinterStatus" is not available.` });
                return;
            }

            // Create a unique callback name to avoid conflicts if multiple calls are made.
            const callbackFunctionName = `_${this.interfaceName}_statusCallback_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

            // Define the callback function on the window object
            window[callbackFunctionName] = (error, status) => {
                // Clean up the global callback function once it's called
                try {
                    delete window[callbackFunctionName];
                } catch (e) {
                    // In some strict environments, deleting from window might fail or warn
                    window[callbackFunctionName] = undefined;
                }

                if (error) {
                    console.error('JSPrinterBridge: getPrinterStatus callback received error:', error);
                    reject(error); // Error object directly from native code
                } else {
                    console.log('JSPrinterBridge: getPrinterStatus callback received status:', status);
                    resolve(status); // Status object/string from native code
                }
            };

            try {
                // Call the native method, passing the name of our dynamically created callback
                // and the user-provided timeout.
                nativeInterface.getPrinterStatus(callbackFunctionName, timeoutMs);
            } catch (e) {
                console.error('JSPrinterBridge: Error invoking native getPrinterStatus:', e);
                // Clean up callback if the immediate call throws
                try {
                    delete window[callbackFunctionName];
                } catch (delErr) {
                    window[callbackFunctionName] = undefined;
                }
                reject({ error: 'NativeCallFailed', message: `Error calling native getPrinterStatus: ${e.message}`, cause: e });
            }
        });
    }
 
}

// Example Usage in JavaScript:
// const jsPrinter = new JSPrinterBridge();
// jsPrinter.sizeMm(50.0, 15.0)
//          .gapMm(2.0, 0.0)
//          .cls()
//          .density(10)
//          .direction(0) // 0 is TSPLConst.DIRECTION_FORWARD
//          .text(10, 10, "TSS24.BF2", 0, 1, 1, "你好，from printer bridge") // "0" for a default font, "TSS24.BF2" for Simplified Chinese
//          .print(1);

export { JSPrinterBridge, TSPLConst };