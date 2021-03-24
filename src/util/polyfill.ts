declare global {
  interface Window {
    mozRequestAnimationFrame: (callback: FrameRequestCallback) => number
    webkitRequestAnimationFrame: (callback: FrameRequestCallback) => number
    msRequestAnimationFrame: (callback: FrameRequestCallback) => number
  }
}

export function polyfill(): void {
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  window.requestIdleCallback = window.requestIdleCallback || (cb => {
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

  window.cancelIdleCallback = window.cancelIdleCallback || (id => {
    clearTimeout(id);
  });
}
