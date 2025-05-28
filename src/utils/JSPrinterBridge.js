/**
 * JSPrinterBridge.js
 *
 * A JavaScript bridge to interact with a native TSPLPrinter.
 * Assumes a global object (e.g., `AndroidTSPLPrinter`) is injected by the native WebView
 * that exposes methods to call the Kotlin TSPLPrinter.
 */
class JSPrinterBridge {
    constructor() {
        // `AndroidTSPLPrinter` is the object exposed by Android's addJavascriptInterface
        if (typeof AndroidTSPLPrinter === 'undefined') {
            console.error("AndroidTSPLPrinter interface not found. Make sure it's exposed from native code.");
            // You might want to throw an error or have a no-op mode
        }
    }

    /**
     * Sets the label size in millimeters.
     * @param {number} widthMm Label width in mm.
     * @param {number} heightMm Label height in mm.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    sizeMm(widthMm, heightMm) {
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.sizeMm) {
            AndroidTSPLPrinter.sizeMm(widthMm, heightMm);
        } else {
            console.warn("JSPrinterBridge: sizeMm called but native interface is not available or method is missing.");
        }
        return this; // Enable chaining
    }

    /**
     * Sets the gap between labels in millimeters.
     * @param {number} feedMm Gap feed distance in mm.
     * @param {number} offsetMm Gap offset distance in mm.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    gapMm(feedMm, offsetMm) {
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.gapMm) {
            AndroidTSPLPrinter.gapMm(feedMm, offsetMm);
        } else {
            console.warn("JSPrinterBridge: gapMm called but native interface is not available or method is missing.");
        }
        return this;
    }

    /**
     * Clears the image buffer.
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    cls() {
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.cls) {
            AndroidTSPLPrinter.cls();
        } else {
            console.warn("JSPrinterBridge: cls called but native interface is not available or method is missing.");
        }
        return this;
    }

    /**
     * Sets the print density.
     * @param {number} level Density level (typically 0-15).
     * @returns {JSPrinterBridge} this instance for chaining.
     */
    density(level) {
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.density) {
            AndroidTSPLPrinter.density(level);
        } else {
            console.warn("JSPrinterBridge: density called but native interface is not available or method is missing.");
        }
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
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.direction) {
            AndroidTSPLPrinter.direction(directionValue);
        } else {
            console.warn("JSPrinterBridge: direction called but native interface is not available or method is missing.");
        }
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
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.text) {
            // Note: TSPLConst values for font need to be passed as their actual values
            // e.g., if TSPLConst.FNT_8_12 is "1", pass "1".
            AndroidTSPLPrinter.text(x, y, fontIdentifier, rotation, xMultiplier, yMultiplier, content);
        } else {
            console.warn("JSPrinterBridge: text called but native interface is not available or method is missing.");
        }
        return this;
    }

    /**
     * Prints multi-line text using the AndroidTSPLPrinter interface.
     * @param {object} printerInterface - The AndroidTSPLPrinter instance (e.g., window.AndroidTSPLPrinter).
     * @param {number} x X-coordinate in dots.
     * @param {number} y Y-coordinate in dots.
     * @param {string} fontIdentifier Font identifier (e.g., "TSS24.BF2" for Simplified Chinese).
     * @param {number} rotation Rotation angle (0, 90, 180, 270).
     * @param {number} xMultiplier Horizontal magnification.
     * @param {number} yMultiplier Vertical magnification.
     * @param {number} lineHeightPx - The approximate height of a single line of text in printer dots (pixels)
     *                                for the given font and yMultiplier. This is crucial!
     * @param {string} multiLineContent - The string containing newlines (\n).
     * @returns {JSPrinterBridge} this instance for chaining.
     */
     textMultiLines(
        printerInterface,
        x,
        y,
        fontIdentifier,
        rotation,
        xMultiplier,
        yMultiplier,
        lineHeightPx, // You MUST determine this value
        multiLineContent
    ) {
        if (typeof printerInterface === 'undefined' || !printerInterface.text) {
           console.error("AndroidTSPLPrinter interface or text method not found!");
            return;
        }
        if (typeof multiLineContent !== 'string') {
            console.error("Content must be a string.");
            return;
        }
        if (lineHeightPx <= 0) {
            console.warn("lineHeightPx should be a positive value. Spacing might be incorrect.");
            // Default to a small value if not provided, but it's better to require it
            lineHeightPx = 20; // Example default, likely incorrect
        }

        const lines = multiLineContent.split('\n');
        let currentY = y;

        lines.forEach(line => {
            // You might want to trim the line or handle empty lines specifically
            if (line.trim() !== "") { // Example: Skip printing if line is only whitespace
                try {
                    text(
                        x,
                        currentY,
                        fontIdentifier,
                        rotation,
                        xMultiplier,
                        yMultiplier,
                        line
                    );
                } catch (e) {
                    console.error(`Error printing line "${line}" via native interface:`, e);
                    // Decide if you want to stop or continue
                }
            }
            currentY += lineHeightPx; // Increment Y for the next line
        });
    }    

    /**
     * Executes the print job for a specified number of labels.
     * @param {number} quantity Number of labels to print.
     * @returns {JSPrinterBridge} this instance for chaining (though typically print is the last call).
     */
    print(quantity) {
        if (typeof AndroidTSPLPrinter !== 'undefined' && AndroidTSPLPrinter.print) {
            AndroidTSPLPrinter.print(quantity);
        } else {
            console.warn("JSPrinterBridge: print called but native interface is not available or method is missing.");
        }
        return this; // Usually last, but still return for consistency
    }



    // --- Potential alternative: Command Batching ---
    // If making many individual native calls is too slow, you could batch them.
    // This makes the JS slightly less of a direct mirror of the Kotlin chaining.

    // _commandQueue = [];

    // sizeMmWithQueue(widthMm, heightMm) {
    //     this._commandQueue.push({ command: 'sizeMm', args: [widthMm, heightMm] });
    //     return this;
    // }
    // ... other methods add to queue ...
    //
    // executeQueue() {
    //     if (AndroidTSPLPrinter && AndroidTSPLPrinter.executeCommandQueue) {
    //         AndroidTSPLPrinter.executeCommandQueue(JSON.stringify(this._commandQueue));
    //         this._commandQueue = []; // Clear queue
    //     }
    //     return this;
    // }
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
// Print multi-line text example:
// const jsPrinter = new JSPrinterBridge();
// jsPrinter.sizeMm(50.0, 15.0)
//          .gapMm(2.0, 0.0)
//          .cls()
//          .density(10)
//          .direction(0); // 0 is TSPLConst.DIRECTION_FORWARD

//          jsPrinter.textMultiLines(10, 10, "TSS24.BF2", 0, 1, 1, 24, "你好，\nprint from JS printer bridge"); // "0" for a default font, "TSS24.BF2" for Simplified Chinese
//          jsPrinter.print(1);


export default JSPrinterBridge; // Add this line to export the class as default