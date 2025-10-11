// Safety detection service for identifying potentially harmful content
// This service scans messages for suicide/self-harm related content

export interface SafetyAlert {
  isEmergency: boolean;
  confidence: number; // 0-1 scale
  detectedTerms: string[];
  message: string;
}

// Keywords and phrases that indicate potential self-harm or suicide risk
const HIGH_RISK_KEYWORDS = [
  // Direct suicide mentions
  "suicide",
  "kill myself",
  "end my life",
  "take my life",
  "suicidal",
  "want to die",
  "better off dead",
  "not worth living",

  // Self-harm methods
  "hang myself",
  "overdose",
  "cut myself",
  "hurt myself",
  "jump off",
  "step in front of",
  "swallow pills",

  // Emotional distress indicators
  "no point living",
  "nothing to live for",
  "world be better without me",
  "everyone hates me",
  "burden on everyone",
  "worthless",

  // Planning/preparation
  "goodbye",
  "final goodbye",
  "last time",
  "ending it all",
  "final message",
  "last words",
];

const MEDIUM_RISK_KEYWORDS = [
  // Depression and hopelessness
  "hopeless",
  "helpless",
  "trapped",
  "stuck",
  "can't go on",
  "can't take it anymore",
  "overwhelmed",
  "drowning",
  "suffocating",
  "lost",

  // Self-blame and worthlessness
  "hate myself",
  "disgusting",
  "failure",
  "useless",
  "stupid",
  "pathetic",
  "weak",

  // Isolation
  "alone",
  "lonely",
  "nobody cares",
  "no one understands",
  "isolated",
  "abandoned",
];

const LOW_RISK_KEYWORDS = [
  // General sadness
  "sad",
  "depressed",
  "down",
  "blue",
  "miserable",
  "unhappy",
  "crying",

  // Stress and anxiety
  "stressed",
  "anxious",
  "worried",
  "scared",
  "panic",
  "overwhelmed",
];

/**
 * Analyze text for potential safety concerns
 */
export function analyzeSafetyRisk(text: string): SafetyAlert {
  const normalizedText = text.toLowerCase();
  const detectedTerms: string[] = [];

  // Check for high-risk keywords (immediate emergency)
  let highRiskCount = 0;
  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      detectedTerms.push(keyword);
      highRiskCount++;
    }
  }

  // Check for medium-risk keywords
  let mediumRiskCount = 0;
  for (const keyword of MEDIUM_RISK_KEYWORDS) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      detectedTerms.push(keyword);
      mediumRiskCount++;
    }
  }

  // Check for low-risk keywords
  let lowRiskCount = 0;
  for (const keyword of LOW_RISK_KEYWORDS) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      detectedTerms.push(keyword);
      lowRiskCount++;
    }
  }

  // Calculate confidence score
  let confidence = 0;
  let isEmergency = false;

  if (highRiskCount > 0) {
    // High-risk keywords indicate emergency
    isEmergency = true;
    confidence = Math.min(0.9, 0.6 + highRiskCount * 0.1);
  } else if (mediumRiskCount >= 2) {
    // Multiple medium-risk keywords might indicate emergency
    isEmergency = true;
    confidence = Math.min(0.8, 0.4 + mediumRiskCount * 0.1);
  } else if (mediumRiskCount > 0 || lowRiskCount >= 3) {
    // Single medium-risk or multiple low-risk keywords - not emergency but concerning
    isEmergency = false;
    confidence = Math.min(
      0.6,
      0.2 + mediumRiskCount * 0.15 + lowRiskCount * 0.1,
    );
  }

  // Generate appropriate message
  let message = "";
  if (isEmergency) {
    message =
      "I'm concerned about your safety. This sounds like a crisis situation that requires immediate professional help.";
  } else if (confidence > 0.3) {
    message =
      "I'm worried about how you're feeling. It's important to talk to someone who can help.";
  }

  return {
    isEmergency,
    confidence,
    detectedTerms,
    message,
  };
}

/**
 * Check if a message contains emergency-level safety concerns
 */
export function isEmergencyContent(text: string): boolean {
  const analysis = analyzeSafetyRisk(text);
  return analysis.isEmergency;
}

/**
 * Get safety recommendations based on risk level
 */
export function getSafetyRecommendation(
  analysis: SafetyAlert,
  _hasEmergencyContacts: boolean = true,
): string {
  if (analysis.isEmergency) {
    return "Please contact emergency services or a crisis helpline immediately. Your safety is the most important thing right now.";
  } else if (analysis.confidence > 0.3) {
    return "I encourage you to reach out to a mental health professional or trusted friend. You don't have to face this alone.";
  }

  return "";
}
