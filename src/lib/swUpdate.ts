let listener: ((apply: () => void) => void) | null = null;
let pendingApply: (() => void) | null = null;

export function notifyUpdateAvailable(apply: () => void) {
  if (listener) listener(apply);
  else pendingApply = apply;
}

export function onUpdateAvailable(cb: (apply: () => void) => void) {
  listener = cb;
  if (pendingApply) {
    cb(pendingApply);
    pendingApply = null;
  }
  return () => {
    if (listener === cb) listener = null;
  };
}
