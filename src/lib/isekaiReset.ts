import { getStoredValue, setStoredValue } from '../util/store';
import { atom } from 'nanostores';

export const HowManyDaysSinceLastIsekaiReset = atom<number | null>(0);

export async function readHowManyDaysSinceLastIsekaiReset(): Promise<void> {
  const lastIsekaiReset = await getStoredValue('lastIsekaiReset') ?? null;

  if (lastIsekaiReset) {
    HowManyDaysSinceLastIsekaiReset.set((Date.now() - lastIsekaiReset) / 1000 / 60 / 60 / 24);
  }
}

export async function isIsekaiHaveBeenResetSinceLastVisit(): Promise<boolean> {
  const storedLevel = await getStoredValue('isekaiLevel');
  const currentLevel = Number(document.getElementById('level_readout')?.textContent?.match(/Lv.(\d+)/)?.[1]);
  if (currentLevel !== storedLevel) {
    await setStoredValue('isekaiLevel', currentLevel);

    if (storedLevel && currentLevel < storedLevel) {
      await setStoredValue('lastIsekaiReset', Date.now());

      // Isekai has been reset
      return true;
    }
  }

  return false;
}
