// Master edit: scene placement in seconds.
export const JOKE = 1.2; // the "make no mistakes" beat pushes everything after 15s
const J = (t: number) => t + JOKE;

export const SCENES = [
  { name: "Hook", from: 0, to: 6.0 },
  { name: "Résumé", from: 6.0, to: 13.0 },
  { name: "Prompt", from: 13.0, to: J(15.05) },
  { name: "Proof", from: J(15.0), to: J(28.1) },
  { name: "Skills", from: J(28.1), to: J(31.4) },
  { name: "Bet", from: J(31.4), to: J(36.5) },
  { name: "Twist", from: J(36.5), to: J(42.0) },
  { name: "Ship", from: J(42.0), to: J(47.5) },
] as const;

// Built by scripts/build-voiceover.py from the ElevenLabs take (not committed).
export const VOICEOVER: string | null = "vo/voiceover.wav";
// Music is supplied by the user (generated in ElevenLabs or similar); the edit never generates it.
// Built by scripts/build-music.py (not committed). Odd Beats 01 by Lily J, Mixkit Stock Music Free License:
//   python3 scripts/build-music.py <722.mp3 from https://assets.mixkit.co/music/722/722.mp3> 0.05 public/music/odd-beats-01.wav
// Alternate: Electro Dreams by Arulo (https://assets.mixkit.co/music/190/190.mp3, offset -0.2).
export const MUSIC: string | null = "music/odd-beats-01.wav";
export const MUSIC_VOLUME = 0.72;
