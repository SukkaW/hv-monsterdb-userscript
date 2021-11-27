import { HVMonsterDatabase } from '../types';

export async function submitScanResults(payload: HVMonsterDatabase.MonsterInfo): Promise<Response> {
  return fetch('https://hvdata.lastmen.men/monsterdata/', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
      monsterId: payload.monsterId,
      monsterClass: payload.monsterClass,
      monsterName: payload.monsterName,
      plvl: payload.plvl,
      attack: payload.attack,
      trainer: payload.trainer,
      piercing: payload.piercing,
      crushing: payload.crushing,
      slashing: payload.slashing,
      cold: payload.cold,
      wind: payload.wind,
      elec: payload.elec,
      fire: payload.fire,
      dark: payload.dark,
      holy: payload.holy
    })
  });
}
