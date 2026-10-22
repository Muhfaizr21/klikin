/**
 * Navigation utility for HTML5 History API routing without external router dependencies.
 * Dispatches popstate events to keep React state synchronized across components.
 */

export function navigateTo(path) {
  if (window.location.pathname !== path || window.location.search || window.location.hash) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export function replaceTo(path) {
  if (window.location.pathname !== path || window.location.search || window.location.hash) {
    window.history.replaceState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
