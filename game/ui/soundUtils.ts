export const playUISound = (key: string, volume: number = 0.8) => {
  window.dispatchEvent(new CustomEvent('play-sound', { detail: { key, config: { volume } } }));
};
