import type { HVMonsterDatabase } from '../types';

export function getStoredValue<T extends keyof HVMonsterDatabase.StoredValue>(key: T): Promise<HVMonsterDatabase.StoredValue[T] | undefined | null> {
  return GM.getValue(key) as Promise<HVMonsterDatabase.StoredValue[T] | undefined | null>;
}

export function setStoredValue<T extends keyof HVMonsterDatabase.StoredValue>(key: T, value: HVMonsterDatabase.StoredValue[T]): Promise<void> {
  return GM.setValue(key, value as GM.Value);
}

export function removeStoredValue(key: keyof HVMonsterDatabase.StoredValue): Promise<void> {
  return GM.deleteValue(key);
}
