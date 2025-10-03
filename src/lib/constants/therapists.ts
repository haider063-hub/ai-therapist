export interface Therapist {
  id: string;
  name: string;
  title: string;
  language: string;
  languageCode: string;
  specialization: string;
  focus: string[];
  description: string;
  voiceType:
    | "alloy"
    | "ash"
    | "ballad"
    | "coral"
    | "echo"
    | "sage"
    | "shimmer"
    | "verse";
  avatar?: string;
}

export const THERAPISTS: Therapist[] = [
  {
    id: "sofia-martinez",
    name: "Dr. Sofia Martinez",
    title: "Trauma & Anxiety Specialist",
    language: "English • Spanish",
    languageCode: "es",
    specialization: "Trauma Recovery",
    focus: ["Trauma Recovery", "Anxiety Disorders", "PTSD"],
    description: "Warm, compassionate, and deeply empathetic",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/sofia-martinez.jpg",
  },
  {
    id: "yuki-tanaka",
    name: "Dr. Yuki Tanaka",
    title: "Mindfulness & Stress Management",
    language: "English • Japanese",
    languageCode: "ja",
    specialization: "Mindfulness",
    focus: ["Mindfulness", "Stress Management", "Meditation"],
    description: "Serene, thoughtful, and grounding",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/yuki-tanaka.jpg",
  },
  {
    id: "ahmed-al-rashid",
    name: "Dr. Ahmed Al-Rashid",
    title: "Depression & Relationship Counselor",
    language: "English • Arabic",
    languageCode: "ar",
    specialization: "Depression",
    focus: ["Depression", "Couples Therapy", "Family Counseling"],
    description: "Patient, wise, and culturally sensitive",
    voiceType: "echo", // Male voice
    avatar: "/therapists/ahmed-al-rashid.jpg",
  },
  {
    id: "marcel-dubois",
    name: "Dr. Marcel Dubois",
    title: "Existential & Philosophical Therapy",
    language: "English • French",
    languageCode: "fr",
    specialization: "Existential Therapy",
    focus: ["Existential Therapy", "Life Purpose", "Meaning"],
    description: "Intellectual, sophisticated, and deeply reflective",
    voiceType: "echo", // Male voice
    avatar: "/therapists/marcel-dubois.jpg",
  },
  {
    id: "emma-johnson",
    name: "Dr. Emma Johnson",
    title: "CBT & Behavioral Change Specialist",
    language: "English",
    languageCode: "en",
    specialization: "CBT",
    focus: ["Cognitive Behavioral Therapy", "Habit Change", "Goal Setting"],
    description: "Practical, supportive, and action-oriented",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/emma-johnson.jpg",
  },
  {
    id: "hans-mueller",
    name: "Dr. Hans Mueller",
    title: "Cognitive Behavioral Specialist",
    language: "English • German",
    languageCode: "de",
    specialization: "CBT & OCD",
    focus: ["CBT", "OCD", "Systematic Approach"],
    description: "Methodical, thorough, and systematically supportive",
    voiceType: "echo", // Male voice
    avatar: "/therapists/hans-mueller.jpg",
  },
  {
    id: "priya-sharma",
    name: "Dr. Priya Sharma",
    title: "Holistic & Spiritual Wellness",
    language: "English • Hindi",
    languageCode: "hi",
    specialization: "Holistic Therapy",
    focus: ["Holistic Therapy", "Spiritual Counseling", "Ayurveda"],
    description: "Nurturing, wise, and spiritually grounded",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/priya-sharma.jpg",
  },
  {
    id: "elena-volkov",
    name: "Dr. Elena Volkov",
    title: "Depth Psychology & Dreams",
    language: "English • Russian",
    languageCode: "ru",
    specialization: "Jungian Analysis",
    focus: ["Jungian Analysis", "Dream Work", "Shadow Work"],
    description: "Insightful, deep, and psychologically perceptive",
    voiceType: "coral", // Female voice
    avatar: "/therapists/elena-volkov.jpg",
  },
];

export const getTherapistById = (id: string): Therapist | undefined => {
  return THERAPISTS.find((t) => t.id === id);
};
