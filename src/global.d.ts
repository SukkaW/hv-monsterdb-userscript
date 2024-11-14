import type { ISettings } from './types';

declare global {
  const SETTINGS: ISettings;

  const __buildMatrix__: 'es2016' | 'es2020';

  // eslint-disable-next-line @typescript-eslint/naming-convention -- global type
  function GM_notification(
    text: string,
    title: string,
    image?: string,
    onClick?: () => void
  ): void;
}

export {};
