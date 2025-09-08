/**
 * TI-89 Calculator State Manager
 * Handles persistent storage of calculator state using IndexedDB
 */

class TI89StateManager {
    constructor() {
        this.dbName = 'TI89CalculatorDB';
        this.dbVersion = 1;
        this.storeName = 'calculatorState';
        this.db = null;
        this.iframe = null;
        this.stateKey = 'ti89_session';
        this.autoSaveInterval = null;
        this.lastStateHash = null;
        this.fallbackStorage = null;
        this.useIndexedDB = true;

        // Initialize storage
        this.initStorage();
    }

    /**
     * Initialize storage system (IndexedDB with localStorage fallback)
     */
    async initStorage() {
        try {
            await this.initDB();
            this.useIndexedDB = true;
        } catch (error) {
            console.log('IndexedDB not available, using localStorage fallback');
            this.useIndexedDB = false;
            this.fallbackStorage = new TI89StorageFallback();
        }
    }

    /**
     * Initialize IndexedDB database
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Set the iframe reference and setup communication
     */
    setIframe(iframe) {
        this.iframe = iframe;
        this.setupMessageListener();
    }

    /**
     * Setup message listener for iframe communication
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Verify origin for security
            if (event.origin !== 'https://ti89-simulator.com') {
                return;
            }

            if (event.data && event.data.type === 'TI89_STATE') {
                this.saveState(event.data.state);
            }
        });
    }

    /**
     * Save calculator state
     */
    async saveState(state) {
        if (!state) return;

        try {
            // Create a hash to avoid unnecessary saves
            const stateString = JSON.stringify(state);
            const stateHash = await this.hashString(stateString);

            if (this.lastStateHash === stateHash) {
                return; // No changes, skip save
            }

            let success = false;

            if (this.useIndexedDB && this.db) {
                // Try IndexedDB first
                try {
                    const transaction = this.db.transaction([this.storeName], 'readwrite');
                    const store = transaction.objectStore(this.storeName);

                    const stateData = {
                        key: this.stateKey,
                        state: state,
                        timestamp: Date.now(),
                        hash: stateHash
                    };

                    store.put(stateData);
                    success = true;
                    console.log('Calculator state saved to IndexedDB');

                } catch (error) {
                    console.warn('IndexedDB save failed, trying fallback:', error);
                    this.useIndexedDB = false; // Switch to fallback
                }
            }

            if (!success && this.fallbackStorage) {
                // Use localStorage fallback
                success = this.fallbackStorage.saveState(state);
            }

            if (success) {
                this.lastStateHash = stateHash;
                this.showSaveIndicator();
            }

        } catch (error) {
            console.error('Failed to save calculator state:', error);
        }
    }

    /**
     * Load calculator state
     */
    async loadState() {
        try {
            if (this.useIndexedDB && this.db) {
                // Try IndexedDB first
                try {
                    return new Promise((resolve, reject) => {
                        const transaction = this.db.transaction([this.storeName], 'readonly');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.get(this.stateKey);

                        request.onsuccess = () => {
                            const result = request.result;
                            if (result && result.state) {
                                console.log('Calculator state loaded from IndexedDB');
                                this.lastStateHash = result.hash;
                                resolve(result.state);
                            } else {
                                resolve(null);
                            }
                        };

                        request.onerror = () => {
                            console.warn('IndexedDB load failed, trying fallback:', request.error);
                            reject(request.error);
                        };
                    });
                } catch (error) {
                    console.warn('IndexedDB load failed, trying fallback:', error);
                    this.useIndexedDB = false;
                }
            }

            // Try fallback storage
            if (this.fallbackStorage) {
                return await this.fallbackStorage.loadState();
            }

            return null;

        } catch (error) {
            console.error('Failed to load calculator state:', error);
            return null;
        }
    }

    /**
     * Clear saved state
     */
    async clearState() {
        try {
            let cleared = false;

            if (this.useIndexedDB && this.db) {
                // Clear from IndexedDB
                try {
                    const transaction = this.db.transaction([this.storeName], 'readwrite');
                    const store = transaction.objectStore(this.storeName);
                    store.delete(this.stateKey);
                    cleared = true;
                    console.log('Calculator state cleared from IndexedDB');
                } catch (error) {
                    console.warn('IndexedDB clear failed:', error);
                }
            }

            // Clear from fallback storage
            if (this.fallbackStorage) {
                this.fallbackStorage.clearState();
                cleared = true;
            }

            if (cleared) {
                this.lastStateHash = null;
            }

        } catch (error) {
            console.error('Failed to clear calculator state:', error);
        }
    }

    /**
     * Request state from the calculator iframe
     */
    requestStateFromCalculator() {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage({
                type: 'REQUEST_STATE'
            }, 'https://ti89-simulator.com');
        }
    }

    /**
     * Send state to the calculator iframe
     */
    sendStateToCalculator(state) {
        if (this.iframe && this.iframe.contentWindow && state) {
            this.iframe.contentWindow.postMessage({
                type: 'RESTORE_STATE',
                state: state
            }, 'https://ti89-simulator.com');
        }
    }

    /**
     * Start auto-save functionality
     */
    startAutoSave(intervalMs = 30000) { // Save every 30 seconds
        this.stopAutoSave(); // Clear any existing interval

        this.autoSaveInterval = setInterval(() => {
            this.requestStateFromCalculator();
        }, intervalMs);

        console.log(`Auto-save started with ${intervalMs}ms interval`);
    }

    /**
     * Stop auto-save functionality
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Show visual indicator that state was saved
     */
    showSaveIndicator() {
        // Remove existing indicator
        const existingIndicator = document.getElementById('saveIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.textContent = 'Saved';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;

        document.body.appendChild(indicator);

        // Animate in and out
        setTimeout(() => indicator.style.opacity = '1', 10);
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    /**
     * Create a simple hash of a string
     */
    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get storage usage information
     */
    async getStorageInfo() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    available: estimate.quota,
                    usedMB: (estimate.usage / 1024 / 1024).toFixed(2),
                    availableMB: (estimate.quota / 1024 / 1024).toFixed(2)
                };
            }
        } catch (error) {
            console.error('Failed to get storage info:', error);
        }
        return null;
    }
}

// Export for use in main application
window.TI89StateManager = TI89StateManager;
