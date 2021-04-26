import { HVMonsterDatabase } from '../types';
import { getUTCDate, isIsekai, showPopup } from '../util/common';
import { logger } from '../util/logger';
import { getStoredValue, setStoredValue } from '../util/store';
import { convertMonsterInfoToEncodedMonsterInfo } from './monsterDataEncode';
import { setLocalDatabaseTmpValue } from './store';

interface ApiResponse {
  monsters: (HVMonsterDatabase.MonsterInfo & {
    /**
     * @description Last time update (can be parsed through Date)
     */
    lastUpdate: string
  })[]
}

export async function updateLocalDatabase(force = false): Promise<void> {
  const currentDate = getUTCDate();
  const lastUpdateDate = await getStoredValue('lastUpdate');

  if (!force) {
    logger.info(`Local database last updated: ${lastUpdateDate}`);
    // Only update the data once per day.
    if (lastUpdateDate === currentDate) {
      logger.info('There is no need to update local database.');
      return;
    }
  }

  try {
    logger.info('Downloading Monster Database...');

    const resp = isIsekai()
      // In Isekai
      ? await fetch('https://hvdata.lastmen.men/exportgzipisekaimonsterdata/')
      // In Persistent
      : await fetch('https://hvdata.lastmen.men/exportgzipmonsterdata/');

    const data: ApiResponse = await resp.json();

    // Use window.requestIdleCallback again since conevrt database is a CPU intensive task.
    window.requestIdleCallback(async () => {
      logger.info('Processing Monster Database...');

      // Update Monster ID Map as well.
      const monsterIdMap = new Map(Object.entries(await getStoredValue('monsterIdMap') || {}));

      const db = Object.fromEntries(data.monsters.map(monster => {
        monsterIdMap.set(monster.monsterName, monster.monsterId);

        const EncodedMonsterInfo = convertMonsterInfoToEncodedMonsterInfo(monster);
        return [monster.monsterName, EncodedMonsterInfo];
      }));

      logger.info(`${data.monsters.length} monsters' information processed.`);

      // This fix an edge case: When try to update database during battle,
      // it is possible that storage will be overwritten by in-memory data
      // By foring update in-memory data the edge case can be bypassed.
      setLocalDatabaseTmpValue(db);
      if (isIsekai()) {
        await setStoredValue('databaseIsekai', db);
      } else {
        await setStoredValue('database', db);
      }

      // Store monster id map back to storage again.
      await setStoredValue('monsterIdMap', Object.fromEntries(monsterIdMap));
      // Update lastUpdate
      await setStoredValue('lastUpdate', getUTCDate());
    }, { timeout: 10000 });
  } catch (e) {
    logger.error(e);

    showPopup('There is something wrong when trying to update the local database from the server!');
  }
}
