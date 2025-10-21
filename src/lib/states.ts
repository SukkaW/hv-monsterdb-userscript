import type { HVMonsterDatabase } from '../types';
import { isMonsterNeedScan, checkScanResultValidity, getMonsterHighlightColor } from './monster';
import { atom, map, computed } from 'nanostores';

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

export const MonsterNeedScan = computed(
  [
    MonsterEntriesInCurrentRound,
    MonstersHtmlStore,
    MonstersAndMkeysInCurrentRound,
    MonsterLastUpdate,
    MonstersAndTheirRandomness
  ],
  (
    monstersEntries,
    monsterHtmls,
    monsterAndMkey,
    monsterLastUpdate,
    monstersAndTheirRandomness
  ) => monstersEntries
    .reduce<Array<{ name: string, mkey: string }>>(
      (acc, [monsterName, monsterInfo]) => {
        const mkey = monsterAndMkey[monsterName];
        const randomness = monstersAndTheirRandomness[monsterName];
        if (mkey) {
          const monsterHtml = monsterHtmls[mkey];
          if (monsterHtml && checkScanResultValidity(monsterHtml)) {
          // If there is no monsterInfo, it means the monster need to be scanned
            if (!monsterInfo) {
              acc.push({ name: monsterName, mkey });
              return acc;
            }
            // If monster is dead, no need to scan
            if (monsterHtml.includes('nbardead.png')) return acc;

            const lastUpdate = monsterLastUpdate[monsterInfo.monsterId];
            if (isMonsterNeedScan(randomness, lastUpdate)) {
              acc.push({ mkey, name: monsterName });
              return acc;
            }
          }
        }

        return acc;
      },
      []
    )
);

export const MonsterNeedHighlight = computed(
  [
    MonsterEntriesInCurrentRound,
    MonstersAndMkeysInCurrentRound
  ],
  (
    monstersEntries,
    monsterAndMkey
  ) => monstersEntries.reduce<Array<{ mkey: string, color: string }>>(
    (acc, [monsterName, monsterInfo]) => {
      const mkey = monsterAndMkey[monsterName];
      const color = monsterInfo ? getMonsterHighlightColor(monsterInfo) : false;

      if (color && mkey) {
        acc.push({
          mkey,
          color
        });
      }

      return acc;
    },
    []
  )
);
