import { useState, useEffect } from 'react';

const ipc = window.api;

/**
 * Custom hook for managing application settings with electron-store
 * Replaces localStorage usage with persistent electron-store
 * Provides similar API to useState: [value, setValue, loading]
 */
export function useSettings(settingKey, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial value
    const loadSetting = async () => {
      try {
        const storedValue = await ipc.settings.get(settingKey);
        setValue(storedValue ?? defaultValue);
      } catch (error) {
        console.error(`Error loading setting ${settingKey}:`, error);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadSetting();

    // Listen for changes from other components
    const unsubscribe = ipc.settings.onChange(({ key, value: newValue }) => {
      if (key === settingKey) {
        setValue(newValue);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [settingKey, defaultValue]);

  const updateSetting = async (newValue) => {
    try {
      await ipc.settings.set(settingKey, newValue);
      setValue(newValue);
    } catch (error) {
      console.error(`Error updating setting ${settingKey}:`, error);
      throw error;
    }
  };

  return [value, updateSetting, loading];
}

/**
 * Hook to get all settings at once
 */
export function useAllSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const allSettings = await ipc.settings.getAll();
        setSettings(allSettings);
      } catch (error) {
        console.error('Error loading all settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for any setting changes
    const unsubscribe = ipc.settings.onChange(({ key, value }) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return [settings, loading];
}
