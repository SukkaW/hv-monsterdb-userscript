declare global {
  interface Window {
    webkitRequestAnimationFrame?: typeof window.requestAnimationFrame
    mozRequestAnimationFrame?: typeof window.requestAnimationFrame
    msRequestAnimationFrame?: typeof window.requestAnimationFrame
    webkitCancelAnimationFrame?: typeof window.cancelAnimationFrame
    mozCancelAnimationFrame?: typeof window.requestAnimationFrame
    msCancelAnimationFrame?: typeof window.requestAnimationFrame
  }
}

export function polyfill(): void {
  // globalThis is the "safeWindow" (no "un" here!)

  globalThis.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

  globalThis.requestIdleCallback = window.requestIdleCallback || (cb => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  });

  globalThis.cancelIdleCallback = window.cancelIdleCallback || (id => {
    clearTimeout(id);
  });

  // GM v4 API Polyfill
  if (typeof GM === 'undefined' || GM == null) {
    globalThis.GM = {
      // eslint-disable-next-line no-console
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
      // @ts-expect-error @types/greasemonkey@3 is completely bullshit
      getValue: promisify(globalThis.GM_getValue),
      deleteValue: promisify(globalThis.GM_deleteValue),
      listValues: promisify(globalThis.GM_listValues),
      getResourceUrl: promisify(globalThis.GM_getResourceURL),
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
          reject(e);
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
        notification.onclick = options.onClick;
      }
    }
  });
}
