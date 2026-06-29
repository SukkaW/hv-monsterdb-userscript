import type { HVMonsterDatabase } from '../types';
import { getMonsterDatabaseCompatibleDate } from '../util/common';
import { MONSTER_NAME_ID_MAP } from './store';

const rMatchMonsterId = /MID=(\d+) \((.+)\)/;
// eslint-disable-next-line regexp/no-super-linear-backtracking -- legacy format: Class → Trainer → Attack → Resists
const rMatchScanLegacy = /Scanning (.+?)\.\.\..+?Monster Class.+>([A-Z][a-z]+)(?:, Power Level (\d+)<|<).+?Monster Trainer:<\/strong><\/td><td>([^<>]*)<.+?<\/strong><\/td><td>([A-Za-z]+)<.+?Fire:.+?>([+-])(\d+)%<.+?Cold:.+?>([+-])(\d+)%<.+?Elec:.+?>([+-])(\d+)%<.+?Wind:.+?>([+-])(\d+)%<.+?Holy:.+?>([+-])(\d+)%<.+?Dark:.+?>([+-])(\d+)%<.+?Crushing:.+?>([+-])(\d+)%<.+?Slashing:.+?>([+-])(\d+)%<.+?Piercing:.+?>([+-])(\d+)%/;
// eslint-disable-next-line regexp/no-super-linear-backtracking -- new format: Trainer → Class → Melee Attack → Resists
const rMatchScanNew = /Scanning (.+?)\.\.\.[\S\s]+?Monster Trainer:<\/strong><\/td><td[^>]*>([^<>]*)<[\S\s]+?Monster Class:<\/strong><\/td>\s*<td[^>]*>([A-Z][a-z]+)(?:, Power Level (\d+))?<[\S\s]+?Melee Attack:<\/strong><\/td>\s*<td[^>]*>([A-Za-z]+)[;<][\S\s]+?Fire:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Cold:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Elec:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Wind:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Holy:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Dark:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Crushing:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Slashing:[\S\s]+?>([+-])(\d+)%<[\S\s]+?Piercing:[\S\s]+?>([+-])(\d+)%/;

export function parseMonsterNameAndId(singleLogText: string): {
  monsterId: number,
  monsterName: string
} | null {
  const matches = rMatchMonsterId.exec(singleLogText);

  if (matches) {
    const monsterId = Number(matches[1]);
    const monsterName = matches[2];

    if (!Number.isNaN(monsterId)) {
      return { monsterId, monsterName };
    }
  }

  return null;
}

const isPositiveOrNegative = (modifier: string): 1 | -1 => (modifier === '+' ? 1 : -1);

export async function parseScanResult(singleLogHtml: string): Promise<void | HVMonsterDatabase.MonsterInfo> {
  if (singleLogHtml.includes('Scanning')) {
    const legacyMatches = rMatchScanLegacy.exec(singleLogHtml);
    const newMatches = rMatchScanNew.exec(singleLogHtml);

    // Legacy: [1]=name [2]=class [3]=plvl [4]=trainer [5]=attack [6..23]=resists
    // New:    [1]=name [2]=trainer [3]=class [4]=plvl [5]=attack [6..23]=resists
    const monsterName = legacyMatches?.[1] ?? newMatches?.[1];
    const monsterClass = legacyMatches?.[2] ?? newMatches?.[3];
    const rawPlvl = legacyMatches?.[3] ?? newMatches?.[4];
    const trainer = legacyMatches?.[4] ?? newMatches?.[2];
    const attack = legacyMatches?.[5] ?? newMatches?.[5];
    const matches = legacyMatches ?? newMatches;

    if (monsterName && monsterClass && trainer != null && attack && matches) {
      const monsterId = await MONSTER_NAME_ID_MAP.get(monsterName);
      const lastUpdate = getMonsterDatabaseCompatibleDate();

      // System Monster has no Power Level results in undefined
      // Treat it as PL 0 instead
      const plvl = Number(rawPlvl ?? 0);

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
          monsterClass: monsterClass as HVMonsterDatabase.MonsterClass,
          plvl, trainer,
          attack: attack as HVMonsterDatabase.MonsterAttack,
          fire, cold, elec, wind, holy, dark,
          crushing, slashing, piercing,
          lastUpdate
        };
      }
    }
  }
}
