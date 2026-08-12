let guestMode = false;

export function enableGuestMode() {
  guestMode = true;
  window.dispatchEvent(new Event('guest-mode'));
}

export function isGuestMode() {
  return guestMode;
}
