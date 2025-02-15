/* eslint-disable @typescript-eslint/prefer-enum-initializers -- safe encode */
import type { HVMonsterDatabase } from '../types';
import { getMonsterDatabaseCompatibleDate } from '../util/common';

export namespace EncodedMonsterDatabase {
  export enum EMonsterClass {
    Arthropod,
    Avion,
    Beast,
    Celestial,
    Daimon,
    Dragonkin,
    Elemental,
    Giant,
    Humanoid,
    Mechanoid,
    Reptilian,
    Sprite,
    Undead,
    Rare,
    Legendary,
    Ultimate,
    Common
  }

  export enum EMonsterAttack {
    Piercing,
    Crushing,
    Slashing,
    Fire,
    Cold,
    Wind,
    Elec,
    Holy,
    Dark,
    Void
  }

  // eslint-disable-next-line sukka/no-export-const-enum -- TODO
  export const enum EMonsterInfo {
    monsterName,
    monsterId,
    monsterClass,
    plvl,
    attack,
    trainer,
    piercing,
    crushing,
    slashing,
    cold,
    wind,
    elec,
    fire,
    dark,
    holy,
    lastUpdate
  }

  export interface MonsterInfo {
    /** Monster Name */
    [EMonsterInfo.monsterName]: string,
    /** Monster Class */
    [EMonsterInfo.monsterClass]: EMonsterClass,
    /** Monster PL */
    [EMonsterInfo.plvl]: number,
    /** Attack Mode */
    [EMonsterInfo.attack]: EMonsterAttack,
    /** Trainer */
    [EMonsterInfo.trainer]: string,
    /** Piercing */
    [EMonsterInfo.piercing]: number,
    /** Crushing */
    [EMonsterInfo.crushing]: number,
    /** Slashing */
    [EMonsterInfo.slashing]: number,
    /** Cold */
    [EMonsterInfo.cold]: number,
    /** Wind */
    [EMonsterInfo.wind]: number,
    /** Elec */
    [EMonsterInfo.elec]: number,
    /** Fire */
    [EMonsterInfo.fire]: number,
    /** Dark */
    [EMonsterInfo.dark]: number,
    /** Holy */
    [EMonsterInfo.holy]: number,
    /** Last time update timestamp */
    [EMonsterInfo.lastUpdate]: number
  }
}

export function convertMonsterInfoToEncodedMonsterInfo(monster: HVMonsterDatabase.MonsterInfo): EncodedMonsterDatabase.MonsterInfo {
  return {
    [EncodedMonsterDatabase.EMonsterInfo.monsterName]: monster.monsterName,
    [EncodedMonsterDatabase.EMonsterInfo.monsterClass]: EncodedMonsterDatabase.EMonsterClass[monster.monsterClass],
    [EncodedMonsterDatabase.EMonsterInfo.plvl]: monster.plvl,
    [EncodedMonsterDatabase.EMonsterInfo.attack]: EncodedMonsterDatabase.EMonsterAttack[monster.attack],
    [EncodedMonsterDatabase.EMonsterInfo.trainer]: monster.trainer,
    [EncodedMonsterDatabase.EMonsterInfo.piercing]: monster.piercing,
    [EncodedMonsterDatabase.EMonsterInfo.crushing]: monster.crushing,
    [EncodedMonsterDatabase.EMonsterInfo.slashing]: monster.slashing,
    [EncodedMonsterDatabase.EMonsterInfo.cold]: monster.cold,
    [EncodedMonsterDatabase.EMonsterInfo.wind]: monster.wind,
    [EncodedMonsterDatabase.EMonsterInfo.elec]: monster.elec,
    [EncodedMonsterDatabase.EMonsterInfo.fire]: monster.fire,
    [EncodedMonsterDatabase.EMonsterInfo.dark]: monster.dark,
    [EncodedMonsterDatabase.EMonsterInfo.holy]: monster.holy,
    [EncodedMonsterDatabase.EMonsterInfo.lastUpdate]: monster.lastUpdate ? new Date(monster.lastUpdate).getTime() : new Date('1970-1-1').getTime()
  };
}

export function convertEncodedMonsterInfoToMonsterInfo(monsterId: number, simpleMonster: EncodedMonsterDatabase.MonsterInfo): HVMonsterDatabase.MonsterInfo {
  return {
    monsterId,
    monsterName: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.monsterName],
    monsterClass: EncodedMonsterDatabase.EMonsterClass[simpleMonster[EncodedMonsterDatabase.EMonsterInfo.monsterClass]] as HVMonsterDatabase.MonsterClass,
    plvl: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.plvl],
    attack: EncodedMonsterDatabase.EMonsterAttack[simpleMonster[EncodedMonsterDatabase.EMonsterInfo.attack]] as HVMonsterDatabase.MonsterAttack,
    trainer: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.trainer],
    piercing: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.piercing],
    crushing: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.crushing],
    slashing: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.slashing],
    cold: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.cold],
    wind: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.wind],
    elec: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.elec],
    fire: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.fire],
    dark: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.dark],
    holy: simpleMonster[EncodedMonsterDatabase.EMonsterInfo.holy],
    lastUpdate: getMonsterDatabaseCompatibleDate(simpleMonster[EncodedMonsterDatabase.EMonsterInfo.lastUpdate])
  };
}
