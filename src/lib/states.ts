import type { HVMonsterDatabase } from '../types';
import { isMonsterNeedScan, checkScanResultValidity, getMonsterHighlightColor } from './monster';
import { atom, map, computed } from 'nanostores';

const isTruthy = <T>(x: T | null | false | undefined): x is T => Boolean(x);

interface MonsterStore {
  [monsterName: string]: HVMonsterDatabase.MonsterInfo | null
}

interface MonstersAndMkeyStore {
  [monsterName: string]: string | undefined
}

interface MonstersLastUpdateStore {
  [mid: number]: number
}

const MonstersInCurrentRound = atom<MonsterStore>({});
const MonstersAndMkeysInCurrentRound = atom<MonstersAndMkeyStore>({});
const MonsterLastUpdate = map<MonstersLastUpdateStore>({});

const MonsterNeedScan = computed([
  MonstersInCurrentRound,
  MonstersAndMkeysInCurrentRound,
  MonsterLastUpdate
], (monsters, monsterAndMkey, monsterLastUpdate) => {
  return Object.entries(monsters).map(([monsterName, monsterInfo]) => {
    const mkey = monsterAndMkey[monsterName];
    if (mkey) {
      const isValidToScan = checkScanResultValidity(mkey);
      if (monsterInfo) {
        const mid = monsterInfo.monsterId;
        const lastUpdate = monsterLastUpdate[mid];

        if (isMonsterNeedScan(mkey, lastUpdate) && isValidToScan) {
          return {
            mkey,
            name: monsterName
          };
        }
      } else {
        if (isValidToScan) {
          return {
            name: monsterName,
            mkey
          };
        }
      }
    }

    return null;
  }).filter(isTruthy);
});

const isHighlightMonsterEnabled = SETTINGS.highlightMonster && Object.keys(SETTINGS.highlightMonster).length > 0;
const MonsterNeedHighlight = computed([
  MonstersInCurrentRound,
  MonstersAndMkeysInCurrentRound
], (monsters, monsterAndMkey) => {
  return Object.entries(monsters).map(([monsterName, monsterInfo]) => {
    if (isHighlightMonsterEnabled) {
      const mkey = monsterAndMkey[monsterName];
      const color = monsterInfo ? getMonsterHighlightColor(monsterInfo) : false;

      if (color && mkey) {
        return {
          mkey,
          color
        };
      }
    }

    return null;
  }).filter(isTruthy);
});

const StateSubscribed = atom(false);

export {
  MonstersInCurrentRound,
  MonstersAndMkeysInCurrentRound,
  MonsterLastUpdate,
  MonsterNeedScan,
  MonsterNeedHighlight,
  StateSubscribed
};
