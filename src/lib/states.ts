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

interface MonstersAndTheirRandomnessStore {
  [monsterName: string]: number
}

interface MonstersLastUpdateStore {
  [mid: number]: number
}

const MonstersInCurrentRound = map<MonsterStore>({});
const MonstersAndMkeysInCurrentRound = atom<MonstersAndMkeyStore>({});
const MonsterLastUpdate = map<MonstersLastUpdateStore>({});
const MonstersAndTheirRandomness = atom<MonstersAndTheirRandomnessStore>({});

const MonsterNeedScan = computed([
  MonstersInCurrentRound,
  MonstersAndMkeysInCurrentRound,
  MonsterLastUpdate,
  MonstersAndTheirRandomness
], (
  monsters,
  monsterAndMkey,
  monsterLastUpdate,
  monstersAndTheirRandomness
) => {
  return Object.entries(monsters).map(([monsterName, monsterInfo]) => {
    const mkey = monsterAndMkey[monsterName];
    const randomness = monstersAndTheirRandomness[monsterName];
    if (mkey) {
      if (checkScanResultValidity(mkey)) {
        // If there is no monsterInfo, it means the monster need to be scanned
        if (!monsterInfo) return { name: monsterName, mkey };

        const mid = monsterInfo.monsterId;
        const lastUpdate = monsterLastUpdate[mid];
        if (isMonsterNeedScan(mkey, randomness, lastUpdate)) {
          return { mkey, name: monsterName };
        }
      }
    }

    return null;
  }).filter(isTruthy);
});

const MonsterNeedHighlight = computed([
  MonstersInCurrentRound,
  MonstersAndMkeysInCurrentRound
], (monsters, monsterAndMkey) => {
  return Object.entries(monsters).map(([monsterName, monsterInfo]) => {
    const mkey = monsterAndMkey[monsterName];
    const color = monsterInfo ? getMonsterHighlightColor(monsterInfo) : false;

    if (color && mkey) {
      return {
        mkey,
        color
      };
    }

    return null;
  }).filter(isTruthy);
});

const StateSubscribed = atom(false);

export {
  MonstersInCurrentRound,
  MonstersAndMkeysInCurrentRound,
  MonstersAndTheirRandomness,
  MonsterLastUpdate,
  MonsterNeedScan,
  MonsterNeedHighlight,
  StateSubscribed
};
