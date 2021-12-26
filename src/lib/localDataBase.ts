import { HVMonsterDatabase } from '../types';
import { getUTCDate, isIsekai, showPopup } from '../util/common';
import { logger } from '../util/logger';
import { getStoredValue, removeStoredValue, setStoredValue } from '../util/store';
import { convertMonsterInfoToEncodedMonsterInfo, EncodedMonsterDatabase } from './monsterDataEncode';
import { MONSTER_NAME_ID_MAP, LOCAL_MONSTER_DATABASE_PERSISTENT, LOCAL_MONSTER_DATABASE_ISEKAI } from './store';

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
  const lastUpdateDate = await getStoredValue('lastUpdateV2');
  const lastUpdateIsekaiDate = await getStoredValue('lastUpdateIsekaiV2');

  if (isIsekai()) {
    logger.info(`Local database (isekai) last updated: ${lastUpdateIsekaiDate}`);
  } else {
    logger.info(`Local database last updated: ${lastUpdateDate}`);
  }

  const needUpdateLocalDatabaseFromRemoteServer = force
    || (isIsekai() ? lastUpdateIsekaiDate : lastUpdateDate) !== currentDate
    || (
      (await (
        isIsekai()
          ? LOCAL_MONSTER_DATABASE_ISEKAI
          : LOCAL_MONSTER_DATABASE_PERSISTENT
      ).get(20))?.[EncodedMonsterDatabase.EMonsterInfo.monsterName] !== 'Konata'
    );

  if (needUpdateLocalDatabaseFromRemoteServer) {
    try {
      logger.info('Downloading Monster Database from the server...');

      const resp = await fetch(isIsekai() ? 'https://hvdata.lastmen.men/exportgzipisekaimonsterdata/' : 'https://hvdata.lastmen.men/exportgzipmonsterdata/');
      const data: ApiResponse = await resp.json();

      // Use window.requestIdleCallback again since conevrt database is a CPU intensive task.
      window.requestIdleCallback(async () => {
        logger.info('Processing Monster Database...');
        MONSTER_NAME_ID_MAP.updateMany(data.monsters.map(monster => [monster.monsterName, monster.monsterId]));

        const db = data.monsters.map(monster => {
          const EncodedMonsterInfo = convertMonsterInfoToEncodedMonsterInfo(monster);
          return [monster.monsterId, EncodedMonsterInfo] as [number, EncodedMonsterDatabase.MonsterInfo];
        });

        logger.info(`${data.monsters.length} monsters' information processed.`);

        if (isIsekai()) {
          await Promise.all([
            LOCAL_MONSTER_DATABASE_ISEKAI.updateMany(db),
            setStoredValue('lastUpdateIsekaiV2', currentDate)
          ]);
        } else {
          await Promise.all([
            LOCAL_MONSTER_DATABASE_PERSISTENT.updateMany(db),
            setStoredValue('lastUpdateV2', currentDate)
          ]);
        }
      }, { timeout: 10000 });
    } catch (e) {
      logger.error(e);

      showPopup(`There is something wrong when trying to update the local database from the server!\n\n${JSON.stringify(e)}`);
    }
  } else {
    logger.info('There is no need to update local database.');

    /** Database Migration, only do when no need to download the remote database */
    databaseMigration();
  }
}

async function databaseMigration() {
  // Migrate all old userscript storage to IndexedDB
  const [monsterIdMap, databaseV2, databaseIsekaiV2] = await Promise.all([getStoredValue('monsterIdMap'), getStoredValue('databaseV2'), getStoredValue('databaseIsekaiV2')]);

  return Promise.all([
    monsterIdMap && (
      logger.debug('Migrating old monsterIdMap to IndexedDB'),
      MONSTER_NAME_ID_MAP.updateMany(Object.entries(monsterIdMap))
    ),
    databaseV2 && (
      logger.debug('Migrating old databaseV2 to IndexedDB'),
      LOCAL_MONSTER_DATABASE_PERSISTENT.updateMany(Object.entries(databaseV2).map(([k, v]) => {
        const newId = Number(k);
        if (Number.isInteger(newId)) return [newId, v];
        return null;
      }))
    ),
    databaseIsekaiV2 && (
      logger.debug('Migrating old databaseIsekaiV2 to IndexedDB'),
      LOCAL_MONSTER_DATABASE_ISEKAI.updateMany(Object.entries(databaseIsekaiV2).map(([k, v]) => {
        const newId = Number(k);
        if (Number.isInteger(newId)) return [newId, v];
        return null;
      }))
    ),
    // Remove version 2 from the userscript storage
    removeStoredValue('monsterIdMap'),
    removeStoredValue('databaseV2'),
    removeStoredValue('databaseIsekaiV2'),
    // Remove old version 1 database
    removeStoredValue('database'),
    removeStoredValue('databaseIsekai'),
    removeStoredValue('lastUpdate'),
    removeStoredValue('lastUpdateIsekai')
  ]);
}
