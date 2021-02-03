// Reduce overhead introduced by the Zone.js:

// Instructions:
// 1. Add this config in a different file, eg. zone-flags.ts
// 2. make sure to check that your app is not relying on an API before disabling it!!!
// 3. import ./zone-flags.ts in polyfills.ts

// Not needed for Angular
(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_canvas = true;
(window as any).__Zone_disable_Error = true;
(window as any).__Zone_disable_geolocation = true;
(window as any).__Zone_disable_toString = true;
(window as any).__Zone_disable_blocking = true;
(window as any).__Zone_disable_PromiseRejectionEvent = true;
(window as any).__Zone_disable_MutationObserver = true;
(window as any).__Zone_disable_Intersection = true;
(window as any).__Zone_disable_FileReader = true;
(window as any).__Zone_disable_IE_check = true;
(window as any).__Zone_disable_geolocation = true;
(window as any).__Zone_disable_mediaQuery = true;
(window as any).__Zone_disable_notification = true;
(window as any).__Zone_disable_MessagePort = true;
(window as any).__zone_symbol__UNPATCHED_EVENTS = ["scroll", "mousemove"];
(window as any).__Zone_enable_cross_context_check = false;

// Optional for Angular
(window as any).__Zone_disable_timers = true;
(window as any).__Zone_disable_XHR = true;
(window as any).__Zone_disable_on_property = true;

// Needed for Angular
(window as any).__Zone_disable_ZoneAwarePromise = false;
(window as any).__Zone_disable_EventTarget = false;
