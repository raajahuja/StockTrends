import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Default feature flag configuration
const DEFAULT_FLAGS = {
    // Top-level features
    marquee: false,
    dailySnapshot: false,
    watchlist: false,
    marketTimeline: true,

    // Daily Snapshot sub-features
    dailySnapshot_sectors: true,
    dailySnapshot_equities: true,
    dailySnapshot_analytics: true,

    // Analytics tiles
    analytics_marketOverview: true,
    analytics_sectorPerformance: true,
    analytics_topGainers: true,
    analytics_topLosers: true,
    analytics_volumeLeaders: true,
    analytics_advanceDecline: true,
    analytics_marketBreadth: true,
    analytics_heatmap: true,

    // Market Timeline sub-features
    marketTimeline_timeline: true,
    marketTimeline_snapshot: true,

    // Timeline filters
    timeline_indices: true,
    timeline_sectors: true,
    timeline_equity: true,

    // Snapshot filters
    snapshot_indices: true,
    snapshot_sectors: true,
    snapshot_equity: true
};

// Feature hierarchy - defines parent-child relationships
const FEATURE_HIERARCHY = {
    dailySnapshot: ['dailySnapshot_sectors', 'dailySnapshot_equities', 'dailySnapshot_analytics'],
    dailySnapshot_analytics: [
        'analytics_marketOverview',
        'analytics_sectorPerformance',
        'analytics_topGainers',
        'analytics_topLosers',
        'analytics_volumeLeaders',
        'analytics_advanceDecline',
        'analytics_marketBreadth',
        'analytics_heatmap'
    ],
    marketTimeline: ['marketTimeline_timeline', 'marketTimeline_snapshot'],
    marketTimeline_timeline: ['timeline_indices', 'timeline_sectors', 'timeline_equity'],
    marketTimeline_snapshot: ['snapshot_indices', 'snapshot_sectors', 'snapshot_equity']
};

const STORAGE_KEY = 'stocktrends_feature_flags_v2';

const FeatureFlagContext = createContext(null);

export const FeatureFlagProvider = ({ children }) => {
    const [flags, setFlags] = useState(() => {
        // Load from localStorage or use defaults
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure new flags are included
                return { ...DEFAULT_FLAGS, ...parsed };
            }
        } catch (error) {
            console.error('Error loading feature flags:', error);
        }
        return DEFAULT_FLAGS;
    });

    // Save to localStorage whenever flags change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
        } catch (error) {
            console.error('Error saving feature flags:', error);
        }
    }, [flags]);

    // Listen for storage changes from other tabs (multi-tab sync)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const newFlags = JSON.parse(e.newValue);
                    setFlags({ ...DEFAULT_FLAGS, ...newFlags });
                } catch (error) {
                    console.error('Error syncing feature flags:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Check if a feature is enabled (considering hierarchy)
    const isFeatureEnabled = useCallback((flagKey) => {
        if (!flags[flagKey]) return false;

        // Check if any parent is disabled
        for (const [parent, children] of Object.entries(FEATURE_HIERARCHY)) {
            if (children.includes(flagKey) && !flags[parent]) {
                return false;
            }
        }

        return true;
    }, [flags]);

    // Toggle a single flag
    const toggleFlag = useCallback((flagKey) => {
        setFlags(prev => ({ ...prev, [flagKey]: !prev[flagKey] }));
    }, []);

    // Set a specific flag value
    const setFlag = useCallback((flagKey, value) => {
        setFlags(prev => ({ ...prev, [flagKey]: value }));
    }, []);

    // Enable all flags in a group
    const enableGroup = useCallback((groupKeys) => {
        setFlags(prev => {
            const updated = { ...prev };
            groupKeys.forEach(key => {
                updated[key] = true;
            });
            return updated;
        });
    }, []);

    // Disable all flags in a group
    const disableGroup = useCallback((groupKeys) => {
        setFlags(prev => {
            const updated = { ...prev };
            groupKeys.forEach(key => {
                updated[key] = false;
            });
            return updated;
        });
    }, []);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        setFlags(DEFAULT_FLAGS);
    }, []);

    // Export configuration
    const exportConfig = useCallback(() => {
        const dataStr = JSON.stringify(flags, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feature-flags-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [flags]);

    // Import configuration
    const importConfig = useCallback((configJson) => {
        try {
            const parsed = JSON.parse(configJson);
            setFlags({ ...DEFAULT_FLAGS, ...parsed });
            return true;
        } catch (error) {
            console.error('Error importing feature flags:', error);
            return false;
        }
    }, []);

    const value = {
        flags,
        isFeatureEnabled,
        toggleFlag,
        setFlag,
        enableGroup,
        disableGroup,
        resetToDefaults,
        exportConfig,
        importConfig,
        hierarchy: FEATURE_HIERARCHY,
        defaults: DEFAULT_FLAGS
    };

    return (
        <FeatureFlagContext.Provider value={value}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

// Hook to check if a specific feature is enabled
export const useFeatureFlag = (flagKey) => {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
    }
    return context.isFeatureEnabled(flagKey);
};

// Hook to access all feature flag functions
export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
    }
    return context;
};
