import { ISettings } from './types';

declare global {
  const SETTINGS: ISettings;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __buildMatrix__: 'modern' | 'legacy';

  // eslint-disable-next-line @typescript-eslint/naming-convention
  function GM_notification(
    text: string,
    title: string,
    image?: string,
    onClick?: () => void
  ): void;
}

export {};
