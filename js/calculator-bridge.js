/**
 * Calculator Bridge Script
 * This script can be injected into the TI-89 calculator iframe to enable state persistence
 * It acts as a bridge between the calculator and our state management system
 */

(function () {
    'use strict';

    let lastScreenCapture = null;
    let captureInterval = null;
    let stateRequestPending = false;

    /**
     * Capture the current visual state of the calculator
     */
    function captureCalculatorState() {
        try {
            const state = {
                timestamp: Date.now(),
                url: window.location.href,
                // Try to capture canvas state if available
                canvasData: captureCanvasData(),
                // Try to capture any input fields
                inputs: captureInputs(),
                // Try to capture local storage
                localStorage: captureLocalStorage(),
                // Try to capture session storage
                sessionStorage: captureSessionStorage(),
                // Screenshot as fallback
                screenshot: null // We'll add this if other methods don't work
            };

            // Only send if state has changed
            const stateString = JSON.stringify(state);
            if (stateString !== lastScreenCapture) {
                lastScreenCapture = stateString;

                // Send state to parent window
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'TI89_STATE',
                        state: state
                    }, '*');
                }
            }

        } catch (error) {
            console.log('State capture failed:', error);
        }
    }

    /**
     * Capture canvas data (calculator display)
     */
    function captureCanvasData() {
        const canvases = document.querySelectorAll('canvas');
        const canvasData = [];

        canvases.forEach((canvas, index) => {
            try {
                canvasData.push({
                    index: index,
                    width: canvas.width,
                    height: canvas.height,
                    dataURL: canvas.toDataURL(),
                    id: canvas.id,
                    className: canvas.className
                });
            } catch (e) {
                // Canvas might be tainted or have cross-origin data
                console.log(`Cannot capture canvas ${index}:`, e);
            }
        });

        return canvasData;
    }

    /**
     * Capture input field values
     */
    function captureInputs() {
        const inputs = document.querySelectorAll('input, textarea, select');
        const inputData = [];

        inputs.forEach((input, index) => {
            inputData.push({
                index: index,
                type: input.type,
                value: input.value,
                id: input.id,
                name: input.name,
                className: input.className
            });
        });

        return inputData;
    }

    /**
     * Capture localStorage data
     */
    function captureLocalStorage() {
        try {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
            }
            return data;
        } catch (error) {
            return {};
        }
    }

    /**
     * Capture sessionStorage data
     */
    function captureSessionStorage() {
        try {
            const data = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                data[key] = sessionStorage.getItem(key);
            }
            return data;
        } catch (error) {
            return {};
        }
    }

    /**
     * Restore calculator state
     */
    function restoreCalculatorState(state) {
        try {
            console.log('Attempting to restore calculator state:', state);

            // Restore canvas data
            if (state.canvasData) {
                restoreCanvasData(state.canvasData);
            }

            // Restore input values
            if (state.inputs) {
                restoreInputs(state.inputs);
            }

            // Restore localStorage
            if (state.localStorage) {
                restoreLocalStorage(state.localStorage);
            }

            // Restore sessionStorage
            if (state.sessionStorage) {
                restoreSessionStorage(state.sessionStorage);
            }

            console.log('Calculator state restored successfully');

        } catch (error) {
            console.error('Failed to restore calculator state:', error);
        }
    }

    /**
     * Restore canvas data
     */
    function restoreCanvasData(canvasData) {
        canvasData.forEach(data => {
            const canvas = document.querySelectorAll('canvas')[data.index];
            if (canvas && data.dataURL) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = function () {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = data.dataURL;
            }
        });
    }

    /**
     * Restore input values
     */
    function restoreInputs(inputData) {
        inputData.forEach(data => {
            const input = document.querySelectorAll('input, textarea, select')[data.index];
            if (input && input.type === data.type) {
                input.value = data.value;
                // Trigger change event
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    /**
     * Restore localStorage
     */
    function restoreLocalStorage(data) {
        try {
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
        } catch (error) {
            console.error('Failed to restore localStorage:', error);
        }
    }

    /**
     * Restore sessionStorage
     */
    function restoreSessionStorage(data) {
        try {
            Object.keys(data).forEach(key => {
                sessionStorage.setItem(key, data[key]);
            });
        } catch (error) {
            console.error('Failed to restore sessionStorage:', error);
        }
    }

    /**
     * Start automatic state capture
     */
    function startStateCapture(intervalMs = 5000) {
        if (captureInterval) {
            clearInterval(captureInterval);
        }

        captureInterval = setInterval(captureCalculatorState, intervalMs);
        console.log(`Calculator state capture started with ${intervalMs}ms interval`);
    }

    /**
     * Stop automatic state capture
     */
    function stopStateCapture() {
        if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
        }
    }

    /**
     * Handle messages from parent window
     */
    function handleParentMessage(event) {
        if (!event.data || !event.data.type) return;

        switch (event.data.type) {
            case 'REQUEST_STATE':
                if (!stateRequestPending) {
                    stateRequestPending = true;
                    setTimeout(() => {
                        captureCalculatorState();
                        stateRequestPending = false;
                    }, 100);
                }
                break;

            case 'RESTORE_STATE':
                if (event.data.state) {
                    restoreCalculatorState(event.data.state);
                }
                break;

            case 'START_AUTO_CAPTURE':
                startStateCapture(event.data.interval || 5000);
                break;

            case 'STOP_AUTO_CAPTURE':
                stopStateCapture();
                break;
        }
    }

    // Setup message listener
    window.addEventListener('message', handleParentMessage);

    // Wait for page to fully load, then start capturing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                startStateCapture(10000); // Capture every 10 seconds
                // Send initial state after a delay
                setTimeout(captureCalculatorState, 2000);
            }, 1000);
        });
    } else {
        setTimeout(() => {
            startStateCapture(10000);
            setTimeout(captureCalculatorState, 2000);
        }, 1000);
    }

    // Capture state when page is about to be hidden/closed
    window.addEventListener('beforeunload', () => {
        captureCalculatorState();
    });

    window.addEventListener('pagehide', () => {
        captureCalculatorState();
    });

    // Capture state when visibility changes (app backgrounded/foregrounded)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            captureCalculatorState();
        }
    });

    console.log('TI-89 Calculator Bridge loaded successfully');

})();
