import { HVMonsterDatabase } from '../types';
import { getMonsterDatabaseCompatibleDate } from '../util/common';
import { MONSTER_NAME_ID_MAP } from './store';

const rMatchMonsterId = /MID=(\d+) \((.+)\)/;
const rMatchScan = /Scanning (.+?)\.\.\..+?Monster Class.+>([A-Z][a-z]+)(?:, Power Level (\d+)<|<).+?Monster Trainer:<\/strong><\/td><td>([^<>]*)<.+?<\/strong><\/td><td>([A-Za-z]+)<.+?Fire:.+?>([+-])(\d+)%<.+?Cold:.+?>([+-])(\d+)%<.+?Elec:.+?>([+-])(\d+)%<.+?Wind:.+?>([+-])(\d+)%<.+?Holy:.+?>([+-])(\d+)%<.+?Dark:.+?>([+-])(\d+)%<.+?Crushing:.+?>([+-])(\d+)%<.+?Slashing:.+?>([+-])(\d+)%<.+?Piercing:.+?>([+-])(\d+)%/;

export function parseMonsterNameAndId(singleLogText: string): {
  monsterId: number,
  monsterName: string
} | void {
  const matches = singleLogText.match(rMatchMonsterId);

  if (matches) {
    const monsterId = Number(matches[1]);
    const monsterName = matches[2];

    if (!Number.isNaN(monsterId)) {
      return { monsterId, monsterName };
    }
  }
}

const isPositiveOrNegative = (modifier: string): number => (modifier === '+' ? 1 : -1);

export async function parseScanResult(singleLogHtml: string): Promise<void | HVMonsterDatabase.MonsterInfo> {
  if (singleLogHtml.includes('Scanning')) {

    const matches = singleLogHtml.match(rMatchScan);

    if (matches) {
      const monsterName = matches[1];
      const monsterId = await MONSTER_NAME_ID_MAP.get(monsterName);
      const lastUpdate = getMonsterDatabaseCompatibleDate();

      // System Monster has no Power Level results in undefined
      // Treat it as PL 0 instead
      const plvl = Number(matches[3] ?? 0);

      const fire = Number(matches[7]) * isPositiveOrNegative(matches[6]);
      const cold = Number(matches[9]) * isPositiveOrNegative(matches[8]);
      const elec = Number(matches[11]) * isPositiveOrNegative(matches[10]);
      const wind = Number(matches[13]) * isPositiveOrNegative(matches[12]);
      const holy = Number(matches[15]) * isPositiveOrNegative(matches[14]);
      const dark = Number(matches[17]) * isPositiveOrNegative(matches[16]);
      const crushing = Number(matches[19]) * isPositiveOrNegative(matches[18]);
      const slashing = Number(matches[21]) * isPositiveOrNegative(matches[20]);
      const piercing = Number(matches[23]) * isPositiveOrNegative(matches[22]);

      if (![plvl, fire, cold, elec, wind, holy, dark, crushing, slashing, piercing].some(Number.isNaN) && monsterId) {
        return {
          monsterName, monsterId,
          monsterClass: matches[2] as HVMonsterDatabase.MonsterClass,
          plvl, trainer: matches[4],
          attack: matches[5] as HVMonsterDatabase.MonsterAttack,
          fire, cold, elec, wind, holy, dark,
          crushing, slashing, piercing,
          lastUpdate
        };
      }
    }
  }
}
