export const INTENTS = {
  NAVIGATE_HOME:          'NAVIGATE_HOME',
  NAVIGATE_DASHBOARD:     'NAVIGATE_DASHBOARD',
  NAVIGATE_LESSONS:       'NAVIGATE_LESSONS',
  NAVIGATE_LOGIN:         'NAVIGATE_LOGIN',
  NAVIGATE_TALK_TO_AI:    'NAVIGATE_TALK_TO_AI',
  NAVIGATE_BACK:          'NAVIGATE_BACK',
  ENABLE_EYE_TRACKER:     'ENABLE_EYE_TRACKER',
  DISABLE_EYE_TRACKER:    'DISABLE_EYE_TRACKER',
  ENABLE_HAND_TRACKER:    'ENABLE_HAND_TRACKER',
  DISABLE_HAND_TRACKER:   'DISABLE_HAND_TRACKER',
  INCREASE_FONT:          'INCREASE_FONT',
  DECREASE_FONT:          'DECREASE_FONT',
  ENABLE_CONTRAST:        'ENABLE_CONTRAST',
  DISABLE_CONTRAST:       'DISABLE_CONTRAST',
  ENABLE_CAPTIONS:        'ENABLE_CAPTIONS',
  DISABLE_CAPTIONS:       'DISABLE_CAPTIONS',
  ENABLE_FOCUS:           'ENABLE_FOCUS',
  DISABLE_FOCUS:          'DISABLE_FOCUS',
  SCROLL_UP:              'SCROLL_UP',
  SCROLL_DOWN:            'SCROLL_DOWN',
  STOP_LISTENING:         'STOP_LISTENING',
  ENABLE_VOICE:           'ENABLE_VOICE',
  
  SET_VISUAL_MODE:        'SET_VISUAL_MODE',
  SET_HEARING_MODE:       'SET_HEARING_MODE',
  SET_MOTOR_MODE:         'SET_MOTOR_MODE',
  SET_COGNITIVE_MODE:     'SET_COGNITIVE_MODE',
  RESET_DISABILITY_MODE:  'RESET_DISABILITY_MODE',
};




export const COMMAND_MAP = {
  [INTENTS.ENABLE_VOICE]: [
    'voice command on', 'voice on', 'वॉइस कमांड ऑन', 'आवाज चालू करो', 
    'voice chalu karo', 'kuch bolo', 'hey equaled', 'वॉयस कमांड ऑन',
  ],
  [INTENTS.NAVIGATE_HOME]: [
    'go to home', 'home page', 'open home', 'home kholo', 'ghar jao',
    'होम खोलो', 'होम पेज', 'होम पर जाओ', 'home par jao', 'landing page',
  ],
  [INTENTS.NAVIGATE_DASHBOARD]: [
    'go to dashboard', 'open dashboard', 'dashboard kholo', 'dashboard par jao',
    'डैशबोर्ड खोलो', 'डैशबोर्ड पर जाओ', 'show dashboard', 'mera dashboard',
    'dashboard open karo', 'डैशबोर्ड ओपन करो', 'डैशबोर्ड दिखाओ',
    'गो टू डैशबोर्ड', 'ओपन डैशबोर्ड', 'डैशबोर्ड', 
  ],
  [INTENTS.NAVIGATE_LESSONS]: [
    'go to lessons', 'open lessons', 'show lessons', 'lessons kholo',
    'lesson par jao', 'पाठ खोलो', 'lesson dikhao', 'my lessons',
    'lesson open karo', 'लेसन ओपन करो', 'लेसन दिखाओ',
    'गो टू लेसन', 'ओपन लेसन', 'लेसन',
  ],
  [INTENTS.NAVIGATE_LOGIN]: [
    'login', 'log in', 'sign in', 'signin', 'sign-in', 'login karo', 'open login', 'go to login', 
    'लॉगिन', 'लॉग इन', 'लॉगिन पेज खोलो', 'sign in page',
  ],
  [INTENTS.NAVIGATE_TALK_TO_AI]: [
    'talk to ai', 'ai assistant', 'open ai', 'ai se baat karo', 'open talk to ai', 'start ai',
    'एआई से बात करो', 'एआई असिस्टेंट', 'बात करो एआई से', 'ask ai', 'ai page'
  ],
  [INTENTS.NAVIGATE_BACK]: [
    'go back', 'back jao', 'wapis jao', 'previous page', 'pichhe jao',
    'वापस जाओ', 'पीछे जाओ', 'undo navigation',
  ],
  [INTENTS.ENABLE_EYE_TRACKER]: [
    'turn on eye tracker', 'enable eye tracker', 'eye tracker on',
    'aankh tracker chalu karo', 'eye tracking on karo',
    'आई ट्रैकर चालू करो', 'आई ट्रैकर ऑन करो', 'eye tracker chalu karo',
    'टर्न ऑन आई ट्रैकर', 'इनेबल आई ट्रैकर', 'आई ट्रैकर',
  ],
  [INTENTS.DISABLE_EYE_TRACKER]: [
    'turn off eye tracker', 'disable eye tracker', 'eye tracker off',
    'aankh tracker band karo', 'eye tracking off karo',
    'आई ट्रैकर बंद करो', 'eye tracker band karo',
    'टर्न ऑफ आई ट्रैकर', 'डिसेबल आई ट्रैकर',
  ],
  [INTENTS.ENABLE_HAND_TRACKER]: [
    'turn on hand tracker', 'enable hand tracker', 'hand tracker on',
    'hand tracker chalu karo', 'hand control on karo',
    'हैंड ट्रैकर चालू करो', 'हाथ ट्रैकर ऑन करो',
  ],
  [INTENTS.DISABLE_HAND_TRACKER]: [
    'turn off hand tracker', 'disable hand tracker', 'hand tracker off',
    'hand tracker band karo', 'hand control off karo',
    'हैंड ट्रैकर बंद करो', 'हाथ ट्रैकर बंद करो',
  ],
  [INTENTS.INCREASE_FONT]: [
    'increase font', 'font bada karo', 'make text bigger', 'text zoom in',
    'फॉन्ट बड़ा करो', 'akshar bade karo', 'bada karo', 'font size up',
    'font increase karo', 'फॉन्ट इंक्रीज करो', 'big font',
    'इंक्रीज फॉन्ट', 'फॉन्ट साइज बढ़ाओ', 'फॉन्ट',
  ],
  [INTENTS.DECREASE_FONT]: [
    'decrease font', 'font chota karo', 'make text smaller', 'text zoom out',
    'फॉन्ट छोटा करो', 'akshar chote karo', 'chota karo', 'font size down',
    'font decrease karo', 'फॉन्ट डिक्रीज करो', 'small font',
  ],
  [INTENTS.ENABLE_CONTRAST]: [
    'enable contrast', 'high contrast on', 'contrast on karo', 'dark mode',
    'कॉन्ट्रास्ट चालू करो', 'contrast chalu karo', 'high contrast mode',
  ],
  [INTENTS.DISABLE_CONTRAST]: [
    'disable contrast', 'high contrast off', 'contrast off karo', 'light mode',
    'कॉन्ट्रास्ट बंद करो', 'contrast band karo',
  ],
  [INTENTS.ENABLE_CAPTIONS]: [
    'enable captions', 'turn on captions', 'subtitles on', 'captions on karo',
    'कैप्शन चालू करो', 'subtitle on karo',
  ],
  [INTENTS.DISABLE_CAPTIONS]: [
    'disable captions', 'turn off captions', 'subtitles off', 'captions off karo',
    'कैप्शन बंद करो', 'subtitle off karo',
  ],
  [INTENTS.ENABLE_FOCUS]: [
    'enable focus mode', 'focus mode on', 'focus on karo', 'dhyan mode',
    'फोकस मोड चालू करो', 'focus chalu karo',
  ],
  [INTENTS.DISABLE_FOCUS]: [
    'disable focus mode', 'focus mode off', 'focus band karo',
    'फोकस मोड बंद करो', 'focus band karo',
  ],
  [INTENTS.SCROLL_UP]: [
    'scroll up', 'page up', 'upar jao', 'upar scroll karo',
    'ऊपर जाओ', 'ऊपर स्क्रॉल करो',
  ],
  [INTENTS.SCROLL_DOWN]: [
    'scroll down', 'page down', 'neeche jao', 'neeche scroll karo',
    'नीचे जाओ', 'नीचे स्क्रॉल करो',
  ],
  [INTENTS.STOP_LISTENING]: [
    'stop listening', 'voice off', 'voice band karo', 'quiet',
    'आवाज बंद करो', 'sunaai band karo', 'stop', 'sleep mode',
    'voice control off', 'turn off voice control', 'वॉइस कंट्रोल ऑफ', 'वॉयस कंट्रोल ऑफ'
  ],
  
  [INTENTS.SET_VISUAL_MODE]: [
    'visual mode', 'enable visual mode', 'visual mode on', 'blind mode',
    'drishti mode', 'visual accessibility', 'आंखों का मोड', 'visual on',
    'vision mode', 'visual impairment mode', 'drashti mode',
  ],
  [INTENTS.SET_HEARING_MODE]: [
    'hearing mode', 'enable hearing mode', 'hearing mode on', 'deaf mode',
    'shravaan mode', 'hearing accessibility', 'बहरापन मोड', 'hearing on',
    'caption mode', 'subtitle mode',
  ],
  [INTENTS.SET_MOTOR_MODE]: [
    'motor mode', 'enable motor mode', 'motor mode on', 'mobility mode',
    'haath mode', 'motor accessibility', 'motor impairment mode', 'motor on',
    'physical mode',
  ],
  [INTENTS.SET_COGNITIVE_MODE]: [
    'cognitive mode', 'enable cognitive mode', 'focus mode on', 'learning mode',
    'dhyan mode', 'cognitive accessibility', 'cognitive on', 'concentration mode',
  ],
  [INTENTS.RESET_DISABILITY_MODE]: [
    'reset mode', 'normal mode', 'default mode', 'disable mode',
    'mode band karo', 'reset accessibility', 'samaanya mode', 'सामान्य मोड',
    'no mode', 'clear mode',
  ],
};




const FILLER = [
  'please', 'karo', 'kardo', 'ok', 'okay', 'hey', 'hello',
  'zara', 'jara', 'toh', 'to', 'na', 'aur', 'bhi',
];

export const normalize = (text = '') => {
  let t = text
    .toLowerCase()
    .replace(/[।,.!?'"]/g, ' ')  // punctuation
    .replace(/\s+/g, ' ')
    .trim();

  // Remove filler words (only standalone words)
  FILLER.forEach(f => {
    t = t.replace(new RegExp(`\\b${f}\\b`, 'g'), ' ');
  });

  return t.replace(/\s+/g, ' ').trim();
};

// ─── Fuzzy / substring matching ────────────────────────────────────
// Returns the best matching intent or null.
// Strategy:
//   ① Exact phrase match
//   ② Command phrase is substring of speech (or vice-versa)
export const processCommand = (rawText) => {
  if (!rawText) return null;
  const text = normalize(rawText);

  let bestIntent = null;
  let bestScore  = 0;

  for (const [intent, phrases] of Object.entries(COMMAND_MAP)) {
    for (const phrase of phrases) {
      const p = normalize(phrase);
      if (!p) continue;

      let score = 0;

      if (text === p) {
        score = 100;                      // exact
      } else if (text.includes(p)) {
        score = 80 + p.length;           // speech contains phrase
      } else if (p.includes(text) && text.length > 3) {
        score = 60 + text.length;        // phrase contains speech fragment
      } else {
        // Word-overlap score
        const tw = new Set(text.split(' ').filter(Boolean));
        const pw = p.split(' ').filter(Boolean);
        const overlap = pw.filter(w => tw.has(w)).length;
        if (overlap > 0) score = overlap * 20;
      }

      if (score > bestScore) {
        bestScore  = score;
        bestIntent = intent;
      }
    }
  }

  // Minimum threshold
  return bestScore >= 20 ? bestIntent : null;
};

// ─── Human-readable feedback messages ─────────────────────────────
export const FEEDBACK = {
  [INTENTS.NAVIGATE_HOME]:        { en: 'Going to Home page',         hi: 'होम पेज खोल रहा हूँ...' },
  [INTENTS.NAVIGATE_DASHBOARD]:   { en: 'Opening Dashboard',          hi: 'डैशबोर्ड खोल रहा हूँ...' },
  [INTENTS.NAVIGATE_LESSONS]:     { en: 'Opening Lessons',            hi: 'पाठ खोल रहा हूँ...' },
  [INTENTS.NAVIGATE_LOGIN]:       { en: 'Going to Login page',        hi: 'लॉगिन पेज खोल रहा हूँ...' },
  [INTENTS.NAVIGATE_TALK_TO_AI]:  { en: 'Opening AI Assistant',       hi: 'एआई असिस्टेंट खोल रहा हूँ...' },
  [INTENTS.NAVIGATE_BACK]:        { en: 'Going Back',                 hi: 'वापस जा रहा हूँ...' },
  [INTENTS.ENABLE_EYE_TRACKER]:   { en: 'Eye Tracker enabled',        hi: 'आई ट्रैकर चालू हो रहा है...' },
  [INTENTS.DISABLE_EYE_TRACKER]:  { en: 'Eye Tracker disabled',       hi: 'आई ट्रैकर बंद हो रहा है...' },
  [INTENTS.ENABLE_HAND_TRACKER]:  { en: 'Hand Control enabled',       hi: 'हाथ नियंत्रण चालू हो रहा है...' },
  [INTENTS.DISABLE_HAND_TRACKER]: { en: 'Hand Control disabled',      hi: 'हाथ नियंत्रण बंद हो रहा है...' },
  [INTENTS.INCREASE_FONT]:        { en: 'Font size increased',        hi: 'फॉन्ट बड़ा हो रहा है...' },
  [INTENTS.DECREASE_FONT]:        { en: 'Font size decreased',        hi: 'फॉन्ट छोटा हो रहा है...' },
  [INTENTS.ENABLE_CONTRAST]:      { en: 'High contrast enabled',      hi: 'हाई कॉन्ट्रास्ट चालू है' },
  [INTENTS.DISABLE_CONTRAST]:     { en: 'Contrast disabled',          hi: 'कॉन्ट्रास्ट बंद है' },
  [INTENTS.ENABLE_CAPTIONS]:      { en: 'Captions enabled',           hi: 'कैप्शन चालू है' },
  [INTENTS.DISABLE_CAPTIONS]:     { en: 'Captions disabled',          hi: 'कैप्शन बंद है' },
  [INTENTS.ENABLE_FOCUS]:         { en: 'Focus mode enabled',         hi: 'फोकस मोड चालू है' },
  [INTENTS.DISABLE_FOCUS]:        { en: 'Focus mode disabled',        hi: 'फोकस मोड बंद है' },
  [INTENTS.SCROLL_UP]:            { en: 'Scrolling up',               hi: 'ऊपर स्क्रॉल हो रहा है' },
  [INTENTS.SCROLL_DOWN]:          { en: 'Scrolling down',             hi: 'नीचे स्क्रॉल हो रहा है' },
  [INTENTS.STOP_LISTENING]:       { en: 'Voice control stopped',      hi: 'आवाज नियंत्रण बंद है' },
  [INTENTS.ENABLE_VOICE]:         { en: 'Voice control activated',    hi: 'वॉइस कंट्रोल चालू हो गया है' },
  [INTENTS.SET_VISUAL_MODE]:      { en: 'Visual mode enabled',        hi: 'विज़ुअल मोड चालू है' },
  [INTENTS.SET_HEARING_MODE]:     { en: 'Hearing mode enabled',       hi: 'सुनने का मोड चालू है' },
  [INTENTS.SET_MOTOR_MODE]:       { en: 'Motor mode enabled',         hi: 'मोटर मोड चालू है' },
  [INTENTS.SET_COGNITIVE_MODE]:   { en: 'Cognitive mode enabled',     hi: 'कॉग्निटिव मोड चालू है' },
  [INTENTS.RESET_DISABILITY_MODE]:{ en: 'Accessibility reset',        hi: 'सब वापस सामान्य है' },
  NOT_UNDERSTOOD:                  { en: "Command not understood",     hi: 'कमांड समझ में नहीं आई' },
};

export const getFeedback = (intent, lang = 'en') => {
  const entry = FEEDBACK[intent] || FEEDBACK.NOT_UNDERSTOOD;
  return lang === 'hi' ? entry.hi : entry.en;
};
