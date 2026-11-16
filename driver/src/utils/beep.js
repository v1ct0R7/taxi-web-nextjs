// Tingull i shkurtër kur vjen një kërkesë e re
let context

export function beep() {
  try {
    context = context || new (window.AudioContext || window.webkitAudioContext)()
    const now = context.currentTime
    ;[0, 0.22].forEach((offset) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(now + offset)
      oscillator.stop(now + offset + 0.2)
    })
    navigator.vibrate?.([200, 100, 200])
  } catch {
    // Shfletuesi mund ta bllokojë audion para ndërveprimit të parë
  }
}
