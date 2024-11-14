declare global {
  interface Window {
    webkitRequestAnimationFrame?: typeof window.requestAnimationFrame,
    mozRequestAnimationFrame?: typeof window.requestAnimationFrame,
    msRequestAnimationFrame?: typeof window.requestAnimationFrame,
    webkitCancelAnimationFrame?: typeof window.cancelAnimationFrame,
    mozCancelAnimationFrame?: typeof window.requestAnimationFrame,
    msCancelAnimationFrame?: typeof window.requestAnimationFrame
  }
}

export function polyfill(): void {
  // globalThis is the "safeWindow" (no "un" here!)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- polyfill for palemoon
  globalThis.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- polyfill for palemoon
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

  // GM v4 API Polyfill
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- we are polyfilling when GM not exists
  if (typeof GM === 'undefined' || GM == null) {
    globalThis.GM = {
      // eslint-disable-next-line no-console -- polyfill
      log: console.log.bind(console), // For Pale Moon compatibility
      info: {
        script: {
          ...globalThis.GM_info.script,
          resources: globalThis.GM_info.script.resources as Record<string, { name: string, url: string, mimetype: string }>,
          // @ts-expect-error ViolentMonkey uses runAt while TamperMonkey uses "run-at"
          runAt: (globalThis.GM_info.script.runAt ?? globalThis.GM_info.script['run-at']).replace('document-', '') as 'end' | 'start' | 'idle',
          // In case some userscript really need it. Always return a static uuid
          uuid: '5be3dfb9-dcd3-433c-8a28-f3996861b7c6',
          version: globalThis.GM_info.script.version
        },
        scriptMetaStr: globalThis.GM_info.scriptMetaStr,
        scriptHandler: 'GreaseMonkey V4 Standard API Polyfill',
        version: globalThis.GM_info.version
      },
      setValue: promisify(globalThis.GM_setValue),
      getValue: promisify(globalThis.GM_getValue),
      deleteValue: promisify(globalThis.GM_deleteValue),
      listValues: promisify(globalThis.GM_listValues),
      getResourceUrl: promisify(globalThis.GM_getResourceURL),
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- prefer GM3 notification before polyfill
      notification: globalThis.GM_notification ?? createNotification,
      openInTab: globalThis.GM_openInTab,
      registerMenuCommand: globalThis.GM_registerMenuCommand,
      setClipboard: globalThis.GM_setClipboard,
      // @ts-expect-error @types/greasemonkey@3 is completely bullshit
      xmlHttpRequest: globalThis.GM_xmlhttpRequest
    };
  }
}

function promisify<TArgs extends any[], TResult>(fn: (...args: TArgs) => TResult): (...args: TArgs) => Promise<TResult>;
function promisify(fn: undefined): undefined;
function promisify<TArgs extends any[], TResult>(fn?: (...args: TArgs) => TResult): ((...args: TArgs) => Promise<TResult>) | undefined {
  if (fn) {
    return function (...args) {
      return new Promise((resolve, reject) => {
        try {
          resolve(Reflect.apply(fn, globalThis, args));
        } catch (e) {
          reject(e as Error);
        }
      });
    };
  }
}

function createNotification(options: {
  text: string,
  title: string,
  image?: string,
  onClick?: () => void
}) {
  globalThis.Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      const notification = new globalThis.Notification(options.title, {
        body: options.text,
        icon: options.image
      });
      if (options.onClick) {
        notification.addEventListener('click', options.onClick);
      }
    }
  }).catch(console.error);
}
