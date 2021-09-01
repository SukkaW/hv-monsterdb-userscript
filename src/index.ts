import { inBattle } from './lib/battle';
import { isIsekaiHaveBeenResetSinceLastVisit, readHowManyDaysSinceLastIsekaiReset } from './lib/isekaiReset';
import { updateLocalDatabase } from './lib/localDataBase';
import { retrieveTmpValue, storeTmpValue } from './lib/store';
import { isFightingInBattle } from './util/common';
import { logger } from './util/logger';
import { polyfill } from './util/polyfill';

// Add possible requestAnimationFrame fallback & window.requestIdleCallback
polyfill();

(async () => {
  logger.setDebugMode(SETTINGS.debug);

  const hasTextLog = isFightingInBattle();
  const hasRiddleMaster = Boolean(document.getElementById('riddlemaster'));

  // Load monster database & monster id => name map
  await retrieveTmpValue();
  // Read how many days since last isekai reset for further usage
  await readHowManyDaysSinceLastIsekaiReset();

  if (hasTextLog || hasRiddleMaster) {
    // Store in-memory value back to storage before window refresh / closes
    window.addEventListener('beforeunload', storeTmpValue);

    document.addEventListener('DOMContentLoaded', inBattle);
    // Both "HVReload" and "DOMContentLoaded" are listened by "HentaiVerse Chinese Translation" userscript during battle
    // I don't know what "HVReload" is, but I guess "something" will dispatch it per round start
    document.addEventListener('HVReload', inBattle);

    if (hasTextLog) {
      // In Battle
      /**
       * We will listen 'DOMContentLoaded' soon. If the browser inject the script right before
       * DOMContentLoaded event, we won't call inBattle(), and let event handler does its job.
       */
      inBattle();
    }
  } else {
    // Out of Battle

    // Just check if Isekai has been reset
    await isIsekaiHaveBeenResetSinceLastVisit();

    // Trigger database update when out of battle.
    // "updateLocalDatabase" method will only update local database once a day.
    window.requestIdleCallback(() => updateLocalDatabase()); // Use window.requesrIdleCallback to avoid performance impact.
  }
})();

export * from './lib/api';
export type { EncodedMonsterDatabase } from './lib/monsterDataEncode';
export type { HVMonsterDatabase } from './types';
