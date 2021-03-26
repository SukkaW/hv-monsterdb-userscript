import { inBattle, tasksRunOncePerPageLoad } from './lib/battle';
import { updateLocalDatabase } from './lib/localDataBase';
import { storeTmpValue } from './lib/store';
import { showPopup } from './util/common';
import { logger } from './util/logger';
import { polyfill } from './util/polyfill';

// Add possible requestAnimationFrame fallback & window.requestIdleCallback
polyfill();

(async () => {
  logger.setDebugMode(SETTINGS.debug);

  if (Boolean(window.fetch) && Promise && window.requestAnimationFrame) {
    if (document.getElementById('textlog')) {
      await tasksRunOncePerPageLoad();

      // Monsterbation dispatch "DOMContentLoaded" per round start.
      document.addEventListener('DOMContentLoaded', inBattle);
      // Both "HVReload" and "DOMContentLoaded" are listened by "HentaiVerse Chinese Translation" userscript during battle
      // I don't know what "HVReload" is, but I guess "something" will dispatch it per round start
      document.addEventListener('HVReload', inBattle);

      // Store in-memory value back to storage before window refresh / closes
      window.addEventListener('beforeunload', storeTmpValue);

      // In Battle
      inBattle();
    } else if (document.getElementById('riddlemaster')) {
      // Riddle Master, do nothing.
    } else {
      // Out of Battle

      // Trigger database update when out of battle.
      // "updateLocalDatabase" method will only update local database once a day.
      window.requestIdleCallback(() => updateLocalDatabase()); // Use window.requesrIdleCallback to avoid performance impact.
    }
  } else {
    showPopup('WARNING! You browser is too old to support the script!<br>Please update your browser or disable the script!', 'red');
  }
})();

export * from './lib/api';
export type { HVMonsterDatabase } from './types';
export type { EncodedMonsterDatabase } from './lib/monsterDataEncode';
