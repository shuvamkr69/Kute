// List of mystical/magical adjectives and nouns for random name generation
const adjectives = [
  'Mysterious', 'Shadow', 'Whispered', 'Enigmatic', 'Veiled', 'Hidden', 'Secret', 
  'Arcane', 'Mystic', 'Ethereal', 'Phantom', 'Ghostly', 'Silent', 'Elusive',
  'Cryptic', 'Furtive', 'Cloaked', 'Masked', 'Shrouded', 'Spectral', 'Cosmic',
  'Ancient', 'Forgotten', 'Lost', 'Wandering', 'Drifting', 'Nocturnal', 'Lunar',
  'Stellar', 'Celestial', 'Twilight', 'Dawn', 'Midnight', 'Glowing', 'Shimmering',
  'Whispering', 'Echoing', 'Fleeting', 'Transient', 'Eternal', 'Timeless'
];

const nouns = [
  'Wanderer', 'Seeker', 'Oracle', 'Sage', 'Mystic', 'Phantom', 'Spirit', 'Wraith',
  'Guardian', 'Keeper', 'Watcher', 'Observer', 'Dreamer', 'Voyager', 'Pilgrim',
  'Scholar', 'Scribe', 'Monk', 'Hermit', 'Raven', 'Wolf', 'Fox', 'Owl', 'Cat',
  'Butterfly', 'Moth', 'Firefly', 'Star', 'Moon', 'Comet', 'Nebula', 'Galaxy',
  'Wind', 'Mist', 'Rain', 'Storm', 'Lightning', 'Thunder', 'Echo', 'Shadow',
  'Flame', 'Ember', 'Spark', 'Crystal', 'Jewel', 'Pearl', 'Diamond', 'Rose',
  'Lily', 'Iris', 'Willow', 'Oak', 'Pine', 'Cedar', 'Sage', 'Thyme'
];

/**
 * Generates a random mystical name for chamber users
 * @returns {string} A random name in format "Adjective Noun"
 */
export const generateRandomName = () => {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
};

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
