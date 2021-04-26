import { HVMonsterDatabase } from '../types';
import { convertEncodedMonsterInfoToMonsterInfo, EncodedMonsterDatabase } from './monsterDataEncode';
import { LOCAL_MONSTER_DATABASE, MONSTER_NAME_ID_MAP } from './store';

const EFFECTS_AFFECTING_SCAN_REAULT = ['nbardead.png', 'imperil.png', 'firedot.png', 'coldslow.png', 'coldslow.png', 'windmiss.png', 'holybreach.png', 'darknerf.png'];

const NOW = new Date().getTime();

export class MonsterStatus {
  /** Monster Name */
  public name: string;
  /** Monster Mkey */
  public mkey: string;
  /** Monster MID */
  public mid?: number;
  /** Monster Element */
  public element: HTMLElement | null;

  constructor(name: string, mkey: string) {
    this.name = name;
    this.mkey = mkey;
    this.mid = MONSTER_NAME_ID_MAP.get(name);
    this.element = document.getElementById(this.mkey);
  }

  get info(): HVMonsterDatabase.MonsterInfo | undefined {
    if (LOCAL_MONSTER_DATABASE) {
      const monsterInfo = LOCAL_MONSTER_DATABASE[this.name];
      if (monsterInfo) {
        return convertEncodedMonsterInfoToMonsterInfo(this.name, monsterInfo);
      }
    }
  }

  get lastUpdate(): number | undefined {
    if (LOCAL_MONSTER_DATABASE) {
      const encodedMonsterInfo = LOCAL_MONSTER_DATABASE[this.name];

      if (encodedMonsterInfo) {
        return encodedMonsterInfo[EncodedMonsterDatabase.EMonsterInfo.lastUpdate];
      }
    }
  }

  get isDead(): boolean {
    return Boolean(this.element?.innerHTML.includes('nbardead.png'));
  }

  checkScanResultValidity(): boolean {
    const monsterHtml = this.element?.innerHTML;
    if (monsterHtml) {
      return !EFFECTS_AFFECTING_SCAN_REAULT.some(effectImg => monsterHtml.includes(effectImg));
    }

    return false;
  }

  get isNeedScan(): boolean {
    if (this.isDead) return false;

    // Update latst info from
    const lastUpdate = this.lastUpdate;
    if (lastUpdate) {
      const passedDays = Math.round((NOW - lastUpdate) / (24 * 60 * 60 * 1000));
      if (passedDays < SETTINGS.scanExpireDays) {
        return false;
      }
    }

    return true;
  }
}
