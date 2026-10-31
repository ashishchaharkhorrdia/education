import API_BASE from '../utils/api';

const getToken = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored)?.token : null;
  } catch {
    return null;
  }
};

export const resolveVoiceIntent = async (alternatives = []) => {
  const phrases = alternatives
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (phrases.length === 0) return null;

  const token = getToken();
  const response = await fetch(`${API_BASE}/api/ai/voice-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      transcript: phrases[0],
      alternatives: phrases,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Voice intent request failed');
  }

  const data = await response.json();
  return typeof data?.intent === 'string' ? data.intent : null;
};
