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
}
