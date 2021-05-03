import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
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
  /** randomness */
  private _randomness: number;

  constructor(name: string, mkey: string) {
    this.name = name;
    this.mkey = mkey;
    this.mid = MONSTER_NAME_ID_MAP.get(name);

    // To prevent multiple users scan the same monster over and over again, some randomness has been added.
    // Generate it once per monster
    this._randomness = Math.floor(Math.random() * Math.floor(SETTINGS.scanExpireDays / 5)) + 1;
  }

  get element(): HTMLElement | null {
    return document.getElementById(this.mkey);
  }

  get info(): HVMonsterDatabase.MonsterInfo | undefined {
    if (LOCAL_MONSTER_DATABASE && this.mid) {
      const monsterInfo = LOCAL_MONSTER_DATABASE[this.mid];
      if (monsterInfo) {
        return convertEncodedMonsterInfoToMonsterInfo(this.mid, monsterInfo);
      }
    }
  }

  get lastUpdate(): number | undefined {
    if (LOCAL_MONSTER_DATABASE && this.mid) {
      const encodedMonsterInfo = LOCAL_MONSTER_DATABASE[this.mid];

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

    const { lastUpdate } = this;
    // When lastUpdate is undefined, it means it is not in local database.
    // That also means it requires scan.
    if (lastUpdate) {
      if (isIsekai()) {
        // In isekai monsters won't get update. If lastUpdate is not undefined,
        // it means the monster is already in the database, no need to scan it again
        return false;
      }

      const passedDays = Math.round((NOW - lastUpdate) / (24 * 60 * 60 * 1000));
      if (passedDays < (SETTINGS.scanExpireDays + this._randomness)) {
        return false;
      }
    }

    return true;
  }
}
