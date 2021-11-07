import { getStoredValue, setStoredValue } from '../util/store';

let HOW_MANY_DAYS_SINCE_LAST_ISEKAI_RESET: number | null = null;

export async function readHowManyDaysSinceLastIsekaiReset(): Promise<void> {
  const lastIsekaiReset = await getStoredValue('lastIsekaiReset') ?? null;

  if (lastIsekaiReset) {
    HOW_MANY_DAYS_SINCE_LAST_ISEKAI_RESET = (new Date().getTime() - lastIsekaiReset) / 1000 / 60 / 60 / 24;
  }
}

export function getHowManyDaysSinceLastIsekaiReset(): number | null {
  return HOW_MANY_DAYS_SINCE_LAST_ISEKAI_RESET;
}

export async function isIsekaiHaveBeenResetSinceLastVisit(): Promise<boolean> {
  const storedLevel = await getStoredValue('isekaiLevel');
  const currentLevel = Number(document.getElementById('level_readout')?.textContent?.match(/Lv.(\d+)/)?.[1]);
  if (currentLevel !== storedLevel) {
    await setStoredValue('isekaiLevel', currentLevel);

    if (storedLevel && currentLevel < storedLevel) {
      await setStoredValue('lastIsekaiReset', new Date().getTime());

      // Isekai has been reset
      return true;
    }
  }

  return false;
}
