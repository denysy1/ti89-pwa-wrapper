/**
 * iOS-Compatible State Manager for TI-89 Calculator
 * Uses URL tracking, local storage, and iframe URL monitoring for persistence
 */

class iOSStateManager {
    constructor() {
        this.storageKey = 'ti89_ios_state';
        this.urlStorageKey = 'ti89_last_url';
        this.iframe = null;
        this.lastUrl = '';
        this.urlMonitorInterval = null;
        this.autoSaveInterval = null;
        this.lastSaveTime = 0;

        // Initialize
        this.initStorage();
        console.log('iOS State Manager initialized');
    }

    /**
     * Initialize storage and check availability
     */
    initStorage() {
        try {
            // Test localStorage availability
            const test = '__ios_storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            this.storageAvailable = true;
            console.log('localStorage available on iOS');
        } catch (e) {
            this.storageAvailable = false;
            console.warn('localStorage not available on iOS');
        }
    }

    /**
     * Set iframe reference and start monitoring
     */
    setIframe(iframe) {
        this.iframe = iframe;
        this.startUrlMonitoring();
        console.log('iOS: iframe set and monitoring started');
    }

    /**
     * Start monitoring iframe URL changes
     */
    startUrlMonitoring() {
        if (this.urlMonitorInterval) {
            clearInterval(this.urlMonitorInterval);
        }

        this.urlMonitorInterval = setInterval(() => {
            this.captureIframeState();
        }, 2000); // Check every 2 seconds

        console.log('iOS: URL monitoring started');
    }

    /**
     * Stop URL monitoring
     */
    stopUrlMonitoring() {
        if (this.urlMonitorInterval) {
            clearInterval(this.urlMonitorInterval);
            this.urlMonitorInterval = null;
        }
    }

    /**
     * Capture iframe state (URL-based approach for iOS)
     */
    captureIframeState() {
        if (!this.iframe || !this.storageAvailable) return;

        try {
            // Try to get iframe URL (may be blocked by CORS)
            let currentUrl = '';
            try {
                currentUrl = this.iframe.contentWindow.location.href;
            } catch (e) {
                // CORS blocked - use the iframe src instead
                currentUrl = this.iframe.src;
            }

            if (currentUrl && currentUrl !== this.lastUrl && currentUrl !== 'about:blank') {
                this.lastUrl = currentUrl;

                const state = {
                    url: currentUrl,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                };

                this.saveState(state);
            }
        } catch (error) {
            // Silently handle CORS errors
            console.debug('iOS: Could not capture iframe state (expected on iOS)');
        }
    }

    /**
     * Save state to localStorage
     */
    saveState(state) {
        if (!this.storageAvailable || !state) return false;

        try {
            const stateData = {
                state: state,
                timestamp: Date.now(),
                version: '1.1'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(stateData));
            localStorage.setItem(this.urlStorageKey, state.url || '');

            this.lastSaveTime = Date.now();
            this.showSaveIndicator();

            console.log('iOS: State saved successfully');
            return true;

        } catch (error) {
            console.error('iOS: Failed to save state:', error);
            return false;
        }
    }

    /**
     * Load saved state
     */
    loadState() {
        if (!this.storageAvailable) return null;

        try {
            const stored = localStorage.getItem(this.storageKey);
            const storedUrl = localStorage.getItem(this.urlStorageKey);

            if (stored) {
                const data = JSON.parse(stored);
                console.log('iOS: State loaded from localStorage');
                return data;
            }

            if (storedUrl) {
                console.log('iOS: Found stored URL:', storedUrl);
                return {
                    state: { url: storedUrl, timestamp: Date.now() },
                    timestamp: Date.now()
                };
            }

            return null;

        } catch (error) {
            console.error('iOS: Failed to load state:', error);
            return null;
        }
    }

    /**
     * Restore calculator state (iOS-specific approach)
     */
    restoreState() {
        const savedData = this.loadState();

        if (savedData && savedData.state && savedData.state.url) {
            console.log('iOS: Attempting to restore calculator state...');

            // For iOS, we'll try to navigate to the saved URL
            // This may not work perfectly due to calculator state, but it's the best we can do
            const savedUrl = savedData.state.url;

            if (savedUrl && savedUrl !== this.iframe.src && savedUrl !== 'about:blank') {
                console.log('iOS: Restoring URL:', savedUrl);

                // Try to restore the URL (this is limited on iOS but worth trying)
                setTimeout(() => {
                    if (this.iframe) {
                        this.iframe.src = savedUrl;
                        this.showRestoreIndicator();
                    }
                }, 1000);

                return true;
            }
        }

        return false;
    }

    /**
     * Clear saved state
     */
    clearState() {
        if (!this.storageAvailable) return;

        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.urlStorageKey);
            this.lastUrl = '';
            console.log('iOS: State cleared');
        } catch (error) {
            console.error('iOS: Failed to clear state:', error);
        }
    }

    /**
     * Start auto-save functionality
     */
    startAutoSave(intervalMs = 10000) { // More frequent on iOS
        this.stopAutoSave();

        this.autoSaveInterval = setInterval(() => {
            // Force a state capture attempt
            this.captureIframeState();

            // Also save basic session info
            this.saveBasicState();
        }, intervalMs);

        console.log(`iOS: Auto-save started with ${intervalMs}ms interval`);
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Save basic session state (fallback for iOS)
     */
    saveBasicState() {
        const basicState = {
            sessionId: this.getSessionId(),
            lastActive: Date.now(),
            url: this.iframe ? this.iframe.src : '',
            userAgent: navigator.userAgent.substring(0, 100) // Truncate to save space
        };

        this.saveState(basicState);
    }

    /**
     * Get or create session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('ti89_session_id');
        if (!sessionId) {
            sessionId = 'ios_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
            sessionStorage.setItem('ti89_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Handle app lifecycle events (iOS-specific)
     */
    setupiOSLifecycleHandlers() {
        // Save on visibility change (app backgrounding)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('iOS: App going to background, saving state...');
                this.captureIframeState();
                this.saveBasicState();
            } else {
                console.log('iOS: App returning from background');
                // Try to restore state when coming back
                setTimeout(() => {
                    this.restoreState();
                }, 1000);
            }
        });

        // Handle page hide (important for iOS)
        window.addEventListener('pagehide', (_event) => {
            console.log('iOS: Page hide event, saving state...');
            this.captureIframeState();
            this.saveBasicState();
        });

        // Handle page show (iOS specific)
        window.addEventListener('pageshow', (event) => {
            console.log('iOS: Page show event');
            if (event.persisted) {
                // Page was restored from cache
                setTimeout(() => {
                    this.restoreState();
                }, 500);
            }
        });

        // Handle focus/blur events
        window.addEventListener('focus', () => {
            console.log('iOS: Window focused');
        });

        window.addEventListener('blur', () => {
            console.log('iOS: Window blurred, saving state...');
            this.captureIframeState();
        });

        // Handle orientation change (mobile specific)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.captureIframeState();
            }, 500);
        });

        console.log('iOS: Lifecycle handlers setup complete');
    }

    /**
     * Show save indicator
     */
    showSaveIndicator() {
        this.showIndicator('💾 Saved', '#4CAF50');
    }

    /**
     * Show restore indicator
     */
    showRestoreIndicator() {
        this.showIndicator('↩️ Restored', '#2196F3');
    }

    /**
     * Show indicator helper
     */
    showIndicator(text, color) {
        // Remove existing indicator
        const existingIndicator = document.getElementById('iOSStateIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.id = 'iOSStateIndicator';
        indicator.textContent = text;
        indicator.style.cssText = `
            position: fixed;
            top: env(safe-area-inset-top, 20px);
            right: 20px;
            background: ${color};
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(indicator);

        // Animate in and out
        setTimeout(() => indicator.style.opacity = '1', 10);
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }, 2000);
    }

    /**
     * Get diagnostic information for troubleshooting
     */
    getDiagnostics() {
        return {
            storageAvailable: this.storageAvailable,
            userAgent: navigator.userAgent,
            isStandalone: window.navigator.standalone === true,
            hasIframe: !!this.iframe,
            lastUrl: this.lastUrl,
            lastSaveTime: this.lastSaveTime,
            sessionId: this.getSessionId(),
            savedState: this.loadState(),
            timestamp: Date.now()
        };
    }

    /**
     * Manual save trigger (for debugging)
     */
    forceSave() {
        console.log('iOS: Force save triggered');
        this.captureIframeState();
        this.saveBasicState();
        return this.getDiagnostics();
    }

    /**
     * Manual restore trigger (for debugging)
     */
    forceRestore() {
        console.log('iOS: Force restore triggered');
        return this.restoreState();
    }
}

// Export for use in main application
window.iOSStateManager = iOSStateManager;
