import { inBattle, tasksRunOncePerPageLoad } from './lib/battle';
import { updateLocalDatabase } from './lib/localDataBase';
import { storeTmpValue } from './lib/store';
import { logger } from './util/logger';
import { polyfill } from './util/polyfill';

// Add possible requestAnimationFrame fallback & window.requestIdleCallback
polyfill();

/**
 * A value to prevent adding event listener again and again.
 *
 * I haven't fully read Monsterbation code, and I have no choice to inspect Riddlemaster throughly
 * (I am poor, can't afford Energy Drink, I just don't want to lose any stamina). So I don't know
 * if the page is going to be reloaded after RiddleMaster submission. Instead, I use a specific value
 * to prevent the race condition, which will be reseted everytime the page is ever loaded.
 */
let HAS_IN_BATTLE_EVENT_BEEN_BINDED = false;

(async () => {
  logger.setDebugMode(SETTINGS.debug);

  const hasTextLog = Boolean(document.getElementById('textlog'));
  const hasRiddleMaster = Boolean(document.getElementById('riddlemaster'));

  if (hasTextLog || hasRiddleMaster) {
    await tasksRunOncePerPageLoad();

    // Store in-memory value back to storage before window refresh / closes
    window.addEventListener('beforeunload', storeTmpValue);

    // Monsterbation dispatch "DOMContentLoaded" per round start.
    /**
     * TamperMonkey on Chrome will inject the userscript after DOMContentLoaded event is fired
     * TamperMonkey on Firefox will inject the userscript after document.readyState changed and
     * before DOMContentLoaded event is fired. So in order to prevent the function being invoked
     * twice on Firefox, only listen to the event after the page is loaded.
     *
     * P.S. It is also a comfirmed tampermonkey bug, see https://github.com/Tampermonkey/tampermonkey/issues/1218
     */
    const bindInBattleToDOMContentLoaded = () => {
      logger.debug('The handler is now attached to DOMContentLoaded, the script should works well with ajaxRound!');

      document.addEventListener('DOMContentLoaded', inBattle);
      // Both "HVReload" and "DOMContentLoaded" are listened by "HentaiVerse Chinese Translation" userscript during battle
      // I don't know what "HVReload" is, but I guess "something" will dispatch it per round start
      document.addEventListener('HVReload', inBattle);

      HAS_IN_BATTLE_EVENT_BEEN_BINDED = true;
      // Remove event listener, prevent listening over and over again
      document.removeEventListener('DOMContentLoaded', bindInBattleToDOMContentLoaded);
    };

    if (!HAS_IN_BATTLE_EVENT_BEEN_BINDED) {
      if (document.readyState !== 'loading') {
        bindInBattleToDOMContentLoaded();
      } else {
        document.addEventListener('DOMContentLoaded', bindInBattleToDOMContentLoaded);
      }
    } else {
      logger.debug('The handler has already been attached to DOMContentLoaded!');
    }

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
