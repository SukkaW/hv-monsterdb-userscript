import { inBattle, tasksRunOncePerPageLoad } from './lib/battle';
import { updateLocalDatabase } from './lib/localDataBase';
import { storeTmpValue } from './lib/store';
import { logger } from './util/logger';
import { polyfill } from './util/polyfill';

// Add possible requestAnimationFrame fallback & window.requestIdleCallback
polyfill();

(async () => {
  logger.setDebugMode(SETTINGS.debug);

  const hasTextLog = Boolean(document.getElementById('textlog'));
  const hasRiddleMaster = Boolean(document.getElementById('riddlemaster'));

  if (hasTextLog || hasRiddleMaster) {
    await tasksRunOncePerPageLoad();

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

    // Trigger database update when out of battle.
    // "updateLocalDatabase" method will only update local database once a day.
    window.requestIdleCallback(() => updateLocalDatabase()); // Use window.requesrIdleCallback to avoid performance impact.
  }
})();

export * from './lib/api';
export type { HVMonsterDatabase } from './types';
export type { EncodedMonsterDatabase } from './lib/monsterDataEncode';
