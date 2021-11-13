declare global {
  interface Window {
    mozRequestAnimationFrame?: typeof window.requestAnimationFrame
    msRequestAnimationFrame?: typeof window.requestAnimationFrame
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

  // A bare minimal fetch polyfill
  if (typeof fetch !== 'function') {
    globalThis.fetch = function (url, options = {}) {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const keys: string[] = [];
        const all: [string, string][] = [];
        const headers: { [key: string]: string } = {};

        const response = () => ({
          // eslint-disable-next-line no-bitwise
          ok: (request.status / 100 | 0) === 2, // 200-299
          statusText: request.statusText,
          status: request.status,
          url: request.responseURL,
          text: () => Promise.resolve(request.responseText),
          json: () => Promise.resolve(request.responseText).then(JSON.parse),
          blob: () => Promise.resolve(new Blob([request.response])),
          clone: response,
          headers: {
            keys: () => keys,
            entries: () => all,
            get: (n: string) => headers[n.toLowerCase()],
            has: (n: string) => n.toLowerCase() in headers
          }
        });

        request.open(options?.method || 'get', typeof url === 'string' ? url : url.url, true);

        request.onload = () => {
          request.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, (_, key, value) => {
            keys.push(key = key.toLowerCase());
            all.push([key, value]);
            headers[key] = headers[key] ? `${headers[key]},${value}` : value;
            return _;
          });
          resolve(response() as unknown as Response);
        };

        request.onerror = reject;

        request.withCredentials = options?.credentials === 'include';

        for (const i in options?.headers) {
          if (Object.prototype.hasOwnProperty.call(options?.headers, i)) {
            const headerContent = options?.headers[i as keyof typeof options.headers];
            if (typeof headerContent === 'string') {
              request.setRequestHeader(i, headerContent);
            }
          }
        }

        request.send(options?.body || null);
      });
    };
  }

  // GM v4 API Polyfill
  if (typeof GM === 'undefined' ?? GM == null) {
    globalThis.GM = {
      log: console.log.bind(console), // For Pale Moon compatibility
      info: {
        script: {
          ...globalThis.GM_info.script,
          resources: globalThis.GM_info.script.resources as Record<string, { name: string, url: string, mimetype: string }>,
          // @ts-expect-error ViolentMonkey uses runAt while TamperMonkey uses "run-at"
          runAt: (globalThis.GM_info.script.runAt ?? globalThis.GM_info.script['run-at']).replace('document-', '') as 'end' | 'start' | 'idle',
          // In case some userscript really need it. Always return a random uuid
          uuid: createUuid(),
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
    return function (...args: TArgs) {
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

// @ts-expect-error It is magic!
// eslint-disable-next-line no-mixed-operators, no-bitwise
function createUuid(a?: string): string { return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, createUuid); }
