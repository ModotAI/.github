const AVATAR_COLORS = [
  "#6c5ce7", "#00cec9", "#fd79a8", "#e17055",
  "#00b894", "#0984e3", "#d63031", "#e84393",
  "#fdcb6e", "#55a3e4", "#a29bfe", "#fab1a0",
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ANONYMOUS_NAMES = [
  "Shadow Fox", "Night Owl", "Storm Wolf", "Dark Phoenix",
  "Ghost Rider", "Cyber Hawk", "Steel Raven", "Ice Dragon",
  "Thunder Cat", "Neon Viper", "Void Walker", "Star Dust",
  "Pixel Ghost", "Data Ninja", "Code Panther", "Quantum Bear",
  "Mystic Lynx", "Ember Crow", "Frost Tiger", "Solar Falcon",
  "Moon Serpent", "Wind Rider", "Fire Moth", "Crystal Wolf",
  "Shadow Crane", "Iron Eagle", "Velvet Bat", "Cobalt Lion",
  "Jade Panda", "Ruby Shark", "Onyx Sphinx", "Silver Beetle",
];

export function generateAnonymousName(): string {
  return ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)];
}
