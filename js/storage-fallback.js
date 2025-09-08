/**
 * Storage Fallback for TI-89 Calculator
 * Provides localStorage-based fallback when IndexedDB is not available
 */

class TI89StorageFallback {
    constructor() {
        this.storageKey = 'ti89_calculator_state';
        this.maxStates = 5; // Keep only the last 5 states to manage storage size
    }

    /**
     * Check if localStorage is available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Save state to localStorage
     */
    async saveState(state) {
        if (!this.isAvailable() || !state) return;

        try {
            const stateData = {
                state: state,
                timestamp: Date.now(),
                version: 1
            };

            // Get existing states
            const existingStates = this.getAllStates();

            // Add new state
            existingStates.push(stateData);

            // Keep only the most recent states
            const recentStates = existingStates
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, this.maxStates);

            localStorage.setItem(this.storageKey, JSON.stringify({
                current: stateData,
                history: recentStates
            }));

            console.log('State saved to localStorage fallback');
            return true;

        } catch (error) {
            console.error('Failed to save state to localStorage:', error);

            // If storage is full, try to clear old data
            if (error.name === 'QuotaExceededError') {
                this.clearOldStates();
                // Try again with just the current state
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify({
                        current: { state, timestamp: Date.now(), version: 1 },
                        history: []
                    }));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save even minimal state:', retryError);
                }
            }
            return false;
        }
    }

    /**
     * Load state from localStorage
     */
    async loadState() {
        if (!this.isAvailable()) return null;

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;

            const data = JSON.parse(stored);

            if (data.current && data.current.state) {
                console.log('State loaded from localStorage fallback');
                return data.current.state;
            }

            return null;

        } catch (error) {
            console.error('Failed to load state from localStorage:', error);
            return null;
        }
    }

    /**
     * Clear saved state
     */
    async clearState() {
        if (!this.isAvailable()) return;

        try {
            localStorage.removeItem(this.storageKey);
            console.log('State cleared from localStorage fallback');
        } catch (error) {
            console.error('Failed to clear state from localStorage:', error);
        }
    }

    /**
     * Get all saved states
     */
    getAllStates() {
        if (!this.isAvailable()) return [];

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return [];

            const data = JSON.parse(stored);
            return data.history || [];

        } catch (error) {
            console.error('Failed to get states from localStorage:', error);
            return [];
        }
    }

    /**
     * Clear old states to free up space
     */
    clearOldStates() {
        if (!this.isAvailable()) return;

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return;

            const data = JSON.parse(stored);

            // Keep only the most recent state
            if (data.current) {
                localStorage.setItem(this.storageKey, JSON.stringify({
                    current: data.current,
                    history: []
                }));
            }

            console.log('Old states cleared from localStorage');

        } catch (error) {
            console.error('Failed to clear old states:', error);
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        if (!this.isAvailable()) return null;

        try {
            const stored = localStorage.getItem(this.storageKey);
            const usedBytes = stored ? new Blob([stored]).size : 0;

            return {
                used: usedBytes,
                usedKB: (usedBytes / 1024).toFixed(2),
                type: 'localStorage'
            };

        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * Estimate total localStorage usage
     */
    getTotalStorageUsage() {
        if (!this.isAvailable()) return null;

        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            return {
                totalBytes: totalSize,
                totalKB: (totalSize / 1024).toFixed(2),
                totalMB: (totalSize / 1024 / 1024).toFixed(2)
            };

        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
            return null;
        }
    }

    /**
     * Export state data for backup
     */
    exportData() {
        const data = {
            timestamp: Date.now(),
            states: this.getAllStates(),
            current: null
        };

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                data.current = parsed.current;
            }
        } catch (error) {
            console.error('Failed to export data:', error);
        }

        return data;
    }

    /**
     * Import state data from backup
     */
    importData(exportedData) {
        if (!exportedData || !this.isAvailable()) return false;

        try {
            const importData = {
                current: exportedData.current,
                history: exportedData.states || []
            };

            localStorage.setItem(this.storageKey, JSON.stringify(importData));
            console.log('Data imported to localStorage fallback');
            return true;

        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}

// Export for use in main application
window.TI89StorageFallback = TI89StorageFallback;
