const ipc = window.api;

/**
 * Migrates settings from localStorage to electron-store
 * Should be called once on app initialization
 */
export async function migrateLocalStorageToElectronStore() {
  try {
    // Check if migration already completed
    const allSettings = await ipc.settings.getAll();
    if (allSettings.migrationCompleted) {
      console.log('Settings migration already completed');
      return { success: true, migrated: false };
    }

    const settingsToMigrate = [
      { key: 'taxRate', defaultValue: '8.00' },
      { key: 'productStylistId', defaultValue: '' },
      { key: 'saleDate', defaultValue: new Date().toISOString() }
    ];

    let migratedCount = 0;

    for (const { key, defaultValue } of settingsToMigrate) {
      const localStorageValue = localStorage.getItem(key);

      if (localStorageValue !== null) {
        // Migrate from localStorage to electron-store
        await ipc.settings.set(key, localStorageValue);
        console.log(`Migrated ${key}:`, localStorageValue);
        migratedCount++;
      } else {
        // No localStorage value, check if electron-store has one
        const currentValue = await ipc.settings.get(key);
        if (currentValue === undefined || currentValue === null) {
          await ipc.settings.set(key, defaultValue);
          console.log(`Set default for ${key}:`, defaultValue);
        }
      }
    }

    // Mark migration as completed
    await ipc.settings.set('migrationCompleted', true);

    // Clear localStorage to prevent confusion
    settingsToMigrate.forEach(({ key }) => {
      localStorage.removeItem(key);
    });

    console.log(`Settings migration completed. Migrated ${migratedCount} settings.`);
    return { success: true, migrated: true, count: migratedCount };
  } catch (error) {
    console.error('Error during settings migration:', error);
    return { success: false, error: error.message };
  }
}
