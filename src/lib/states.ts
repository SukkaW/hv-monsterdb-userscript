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

interface MonstersHtmlStore {
  [mkey: string]: string | undefined
}

interface MonstersAndTheirRandomnessStore {
  [monsterName: string]: number
}

interface MonstersLastUpdateStore {
  [mid: number]: number
}

export const MonstersInCurrentRound = map<MonsterStore>({});
// Store element id instead of element itself, as HentaiVerse always replace the whole element every turn
export const MonstersAndMkeysInCurrentRound = atom<MonstersAndMkeyStore>({});
export const MonstersHtmlStore = map<MonstersHtmlStore>({});
export const MonsterLastUpdate = map<MonstersLastUpdateStore>({});
export const MonstersAndTheirRandomness = atom<MonstersAndTheirRandomnessStore>({});

export const MonsterEntriesInCurrentRound = computed(MonstersInCurrentRound, (monsters) => Object.entries(monsters));

export const MonsterNeedScan = computed([
  MonsterEntriesInCurrentRound,
  MonstersHtmlStore,
  MonstersAndMkeysInCurrentRound,
  MonsterLastUpdate,
  MonstersAndTheirRandomness
], (
  monstersEntries,
  monsterHtmls,
  monsterAndMkey,
  monsterLastUpdate,
  monstersAndTheirRandomness
) => {
  return monstersEntries.map(([monsterName, monsterInfo]) => {
    const mkey = monsterAndMkey[monsterName];
    const randomness = monstersAndTheirRandomness[monsterName];
    if (mkey) {
      const monsterHtml = monsterHtmls[mkey];
      if (monsterHtml && checkScanResultValidity(monsterHtml)) {
        // If there is no monsterInfo, it means the monster need to be scanned
        if (!monsterInfo) return { name: monsterName, mkey };
        // If monster is dead, no need to scan
        if (monsterHtml.includes('nbardead.png')) return null;

        const lastUpdate = monsterLastUpdate[monsterInfo.monsterId];
        if (isMonsterNeedScan(randomness, lastUpdate)) {
          return { mkey, name: monsterName };
        }
      }
    }

    return null;
  }).filter(isTruthy);
});

export const MonsterNeedHighlight = computed([
  MonsterEntriesInCurrentRound,
  MonstersAndMkeysInCurrentRound
], (monstersEntries, monsterAndMkey) => {
  return monstersEntries.map(([monsterName, monsterInfo]) => {
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

export const StateSubscribed = atom(false);
