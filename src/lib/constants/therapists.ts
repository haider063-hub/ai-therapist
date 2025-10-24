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
    title: "Trauma & CBT Specialist",
    language: "English • Spanish",
    languageCode: "es",
    specialization: "Trauma Recovery",
    focus: [
      "Trauma / Grief",
      "CBT",
      "Supportive Counseling",
      "Depression",
      "Relationship Issues",
    ],
    description: "Warm, compassionate, and deeply empathetic",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/sofia-martinez.jpg",
  },
  {
    id: "yuki-tanaka",
    name: "Dr. Yuki Tanaka",
    title: "Stress & Mindfulness Expert",
    language: "English • Japanese",
    languageCode: "ja",
    specialization: "Mindfulness",
    focus: [
      "Stress Management",
      "Mindfulness",
      "CBT",
      "Relationship Issues",
      "Addiction Recovery",
    ],
    description: "Serene, thoughtful, and grounding",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/yuki-tanaka.jpg",
  },
  {
    id: "ahmed-al-rashid",
    name: "Dr. Ahmed Al-Rashid",
    title: "Depression & Supportive Therapy",
    language: "English • Arabic",
    languageCode: "ar",
    specialization: "Depression",
    focus: [
      "Depression",
      "Supportive Counseling",
      "Psychodynamic",
      "Anxiety",
      "Addiction Recovery",
    ],
    description: "Patient, wise, and culturally sensitive",
    voiceType: "echo", // Male voice
    avatar: "/therapists/ahmed-al-rashid.jpg",
  },
  {
    id: "marcel-dubois",
    name: "Dr. Marcel Dubois",
    title: "Anxiety & Psychodynamic Therapy",
    language: "English • French",
    languageCode: "fr",
    specialization: "Psychodynamic Therapy",
    focus: [
      "Anxiety",
      "Psychodynamic",
      "Supportive Counseling",
      "Relationship Issues",
      "Trauma / Grief",
    ],
    description: "Intellectual, sophisticated, and deeply reflective",
    voiceType: "echo", // Male voice
    avatar: "/therapists/marcel-dubois.jpg",
  },
  {
    id: "emma-johnson",
    name: "Dr. Emma Johnson",
    title: "Stress & CBT Specialist",
    language: "English",
    languageCode: "en",
    specialization: "CBT",
    focus: [
      "Stress Management",
      "CBT",
      "Depression",
      "Anxiety",
      "Addiction Recovery",
    ],
    description: "Practical, supportive, and action-oriented",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/emma-johnson.jpg",
  },
  {
    id: "hans-mueller",
    name: "Dr. Hans Mueller",
    title: "Depression & CBT Expert",
    language: "English • German",
    languageCode: "de",
    specialization: "CBT & Depression",
    focus: [
      "Depression",
      "CBT",
      "Mindfulness",
      "Relationship Issues",
      "Trauma / Grief",
    ],
    description: "Methodical, thorough, and systematically supportive",
    voiceType: "echo", // Male voice
    avatar: "/therapists/hans-mueller.jpg",
  },
  {
    id: "priya-sharma",
    name: "Dr. Priya Sharma",
    title: "Trauma & Mindfulness Specialist",
    language: "English • Hindi",
    languageCode: "hi",
    specialization: "Mindfulness & Trauma",
    focus: [
      "Trauma / Grief",
      "Mindfulness",
      "Supportive Counseling",
      "Stress Management",
      "Anxiety",
    ],
    description: "Nurturing, wise, and spiritually grounded",
    voiceType: "shimmer", // Female voice
    avatar: "/therapists/priya-sharma.jpg",
  },
  {
    id: "elena-volkov",
    name: "Dr. Elena Volkov",
    title: "Stress & Psychodynamic Expert",
    language: "English • Russian",
    languageCode: "ru",
    specialization: "Psychodynamic Therapy",
    focus: [
      "Stress Management",
      "Psychodynamic",
      "CBT",
      "Mindfulness",
      "Addiction Recovery",
    ],
    description: "Insightful, deep, and psychologically perceptive",
    voiceType: "coral", // Female voice
    avatar: "/therapists/elena-volkov.jpg",
  },
];

export const getTherapistById = (id: string): Therapist | undefined => {
  return THERAPISTS.find((t) => t.id === id);
};

/**
 * Get recommended therapists based on user preferences
 * Returns up to 2 therapists that match the user's therapy needs and approach
 */
export const getRecommendedTherapists = (
  therapyNeed: string,
  therapyApproach: string,
): Therapist[] => {
  // Map therapy need values to display labels for matching
  const therapyNeedLabels: Record<string, string> = {
    stress: "Stress Management",
    anxiety: "Anxiety",
    depression: "Depression",
    trauma: "Trauma / Grief",
    relationship: "Relationship Issues",
    addiction: "Addiction Recovery",
  };

  // Map therapy approach values to display labels for matching
  const therapyApproachLabels: Record<string, string> = {
    cbt: "CBT",
    mindfulness: "Mindfulness",
    supportive: "Supportive Counseling",
    psychodynamic: "Psychodynamic",
  };

  const therapyNeedLabel = therapyNeedLabels[therapyNeed];
  const therapyApproachLabel = therapyApproachLabels[therapyApproach];

  if (!therapyNeedLabel || !therapyApproachLabel) {
    return [];
  }

  // Find therapists that match both therapy need and approach
  const matchingTherapists = THERAPISTS.filter(
    (therapist) =>
      therapist.focus.includes(therapyNeedLabel) &&
      therapist.focus.includes(therapyApproachLabel),
  );

  // If we have exact matches, return up to 3
  if (matchingTherapists.length >= 2) {
    return matchingTherapists.slice(0, 3);
  }

  // If we have 1 exact match, try to find a second one with either matching need or approach
  if (matchingTherapists.length === 1) {
    const secondMatch = THERAPISTS.find(
      (therapist) =>
        therapist.id !== matchingTherapists[0].id &&
        (therapist.focus.includes(therapyNeedLabel) ||
          therapist.focus.includes(therapyApproachLabel)),
    );

    if (secondMatch) {
      return [matchingTherapists[0], secondMatch];
    }
    return matchingTherapists;
  }

  // If no exact matches, find therapists with either matching need or approach
  const partialMatches = THERAPISTS.filter(
    (therapist) =>
      therapist.focus.includes(therapyNeedLabel) ||
      therapist.focus.includes(therapyApproachLabel),
  );

  return partialMatches.slice(0, 3);
};
