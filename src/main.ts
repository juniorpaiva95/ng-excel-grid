import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// import 'zone.js'; // Included with Angular CLI.

// // Disable passive event listeners for touch events
// const supportsPassive = (() => {
//   let supportsPassive = false;
//   try {
//     const opts = Object.defineProperty({}, 'passive', {
//       get: () => {
//         supportsPassive = true;
//         return true;
//       },
//     });
//     window.addEventListener('testPassive', null as any, opts);
//   } catch (e) {}
//   return supportsPassive;
// })();

// if (!supportsPassive) {
//   const originalAddEventListener = EventTarget.prototype.addEventListener;
//   EventTarget.prototype.addEventListener = function (type, listener, options) {
//     if (
//       typeof options === 'object' &&
//       options !== null &&
//       'passive' in options
//     ) {
//       options = { ...options, passive: false };
//     }
//     originalAddEventListener.call(this, type, listener, options);
//   };
// }

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
