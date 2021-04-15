import { inBattle, tasksRunOncePerPageLoad } from './lib/battle';
import { updateLocalDatabase } from './lib/localDataBase';
import { storeTmpValue } from './lib/store';
import { logger } from './util/logger';
import { polyfill } from './util/polyfill';

// Add possible requestAnimationFrame fallback & window.requestIdleCallback
polyfill();

(async () => {
  logger.setDebugMode(SETTINGS.debug);

  if (document.getElementById('textlog')) {
    await tasksRunOncePerPageLoad();

    // In Battle
    /**
     * We will listen 'DOMContentLoaded' soon. If the browser inject the script right before
     * DOMContentLoaded event, we won't call inBattle(), and let event handler does its job.
     */
    inBattle();

    // Monsterbation dispatch "DOMContentLoaded" per round start.
    /**
     * TamperMonkey on Chrome will inject the userscript after DOMContentLoaded event is fired
     * TamperMonkey on Firefox will inject the userscript after document.readyState changed and
     * before DOMContentLoaded event is fired. So in order to prevent the function being invoked
     * twice on Firefox, only listen to the event after the page is loaded.
     */
    const bindInBattleToDOMContentLoaded = () => {
      document.addEventListener('DOMContentLoaded', inBattle);
      // Both "HVReload" and "DOMContentLoaded" are listened by "HentaiVerse Chinese Translation" userscript during battle
      // I don't know what "HVReload" is, but I guess "something" will dispatch it per round start
      document.addEventListener('HVReload', inBattle);
      // Remove event listener, prevent listening over and over again
      window.removeEventListener('load', bindInBattleToDOMContentLoaded);
    };

    window.addEventListener('load', bindInBattleToDOMContentLoaded);
    // Store in-memory value back to storage before window refresh / closes
    window.addEventListener('beforeunload', storeTmpValue);
  } else if (document.getElementById('riddlemaster')) {
    // Riddle Master, do nothing.
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
