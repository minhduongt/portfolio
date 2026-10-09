import { useSyncExternalStore } from 'react';
import { pinnedToolsKey, readPinnedTools } from './toolPreferences';

const changed = 'portfolio:tool-pins-changed';
let current;
const stored = () => { try { return readPinnedTools(localStorage); } catch { return []; } };
const snapshot = () => current ?? (current = stored());
function subscribe(notify) {
  const update = event => {
    if (event.key === pinnedToolsKey || event.key === null) { current = stored(); notify(); }
  };
  window.addEventListener(changed, notify);
  window.addEventListener('storage', update);
  return () => { window.removeEventListener(changed, notify); window.removeEventListener('storage', update); };
}
function togglePin(id) {
  const pins = snapshot();
  current = pins.includes(id) ? pins.filter(value => value !== id) : [...pins, id];
  let saved = true;
  try { localStorage.setItem(pinnedToolsKey, JSON.stringify(current)); } catch { saved = false; }
  window.dispatchEvent(new Event(changed));
  return saved;
}
export default function usePinnedTools() {
  return [useSyncExternalStore(subscribe, snapshot), togglePin];
}
