// ============================================================
// AMRITA – INDIA ELECTION ASSISTANT  |  Logic Engine v2
// ============================================================

// ---- STATE ----
let state = {
  flow: null,      // active flow name
  step: 0,         // step index within flow
  isFirstTime: null
};

// ---- HELPERS ----
const $  = id => document.getElementById(id);
const messagesEl   = $('chat-messages');
const quickRepliesEl = $('quick-replies');
const chatInput    = $('chat-input');
const chatForm     = $('chat-form');
const resetBtn     = $('reset-btn');

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/** Render a chat bubble. sender = 'bot' | 'user' */
function addMessage(html, sender) {
  const group = document.createElement('div');
  group.classList.add('msg-group', sender);

  const row = document.createElement('div');
  row.classList.add('msg-row');

  // Bot gets a mini avatar
  if (sender === 'bot') {
    const av = document.createElement('div');
    av.classList.add('msg-avatar');
    av.textContent = 'A';
    row.appendChild(av);
  }

  const bubble = document.createElement('div');
  bubble.classList.add('message');
  bubble.innerHTML = html.replace(/\n/g, '<br>');
  row.appendChild(bubble);

  group.appendChild(row);

  const time = document.createElement('div');
  time.classList.add('msg-time');
  time.textContent = getTime();
  group.appendChild(time);

  messagesEl.appendChild(group);
  scrollToBottom();
}

/** Show animated typing indicator */
function showTyping() {
  const wrap = document.createElement('div');
  wrap.classList.add('typing-wrap');
  wrap.id = 'typing-wrap';

  const av = document.createElement('div');
  av.classList.add('msg-avatar');
  av.textContent = 'A';
  wrap.appendChild(av);

  const ind = document.createElement('div');
  ind.classList.add('typing-indicator');
  ind.innerHTML = '<span></span><span></span><span></span>';
  wrap.appendChild(ind);

  messagesEl.appendChild(wrap);
  scrollToBottom();
}

function hideTyping() {
  const el = $('typing-wrap');
  if (el) el.remove();
}

/** Bot speaks after a short delay */
function botSay(html, chips = [], delay = 750) {
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(html, 'bot');
    setChips(chips);
  }, delay);
}

/** Render quick-reply chip buttons */
function setChips(labels) {
  quickRepliesEl.innerHTML = '';
  labels.forEach(label => {
    const btn = document.createElement('button');
    btn.classList.add('quick-reply-btn');
    btn.textContent = label;
    btn.addEventListener('click', () => handleInput(label));
    quickRepliesEl.appendChild(btn);
  });
}

function resetState() {
  state = { flow: null, step: 0, isFirstTime: null };
}

const MAIN_MENU_CHIPS = [
  '📝 Register as a voter',
  '✅ Check eligibility',
  '🗓️ Election timeline',
  '🗳️ Voting day process',
  '❓ FAQs'
];

function showMainMenu(intro = "What would you like to do today? 👇") {
  resetState();
  botSay(intro, MAIN_MENU_CHIPS);
}

// ---- LINK HELPER ----
function lnk(text, url) {
  return `<a href="${url}" target="_blank" rel="noopener" class="msg-link">${text}</a>`;
}

// ============================================================
// FLOW DATA
// ============================================================

// ---- 1. REGISTRATION ----
// Step 0: First-time?  → YES → Step 1Y  |  NO → Step 1N (experienced)
// Step 1: Docs ready?  → YES → Step 2Y  |  NO → Step 2N (gather docs)
// Step 2: Want steps?  → YES → show steps  |  NO → give link

const REG = {
  // Step 0 – first time?
  s0: {
    bot: "Great! Are you registering as a <strong>first-time voter</strong>? 🆕",
    chips: ["✅ Yes, first time", "🔄 No, I've voted before"]
  },

  // Step 1 – first-timer docs
  s1_firstTime: {
    bot: "Welcome, first-time voter! 🎉 You'll need to register on the <strong>NVSP portal</strong>.\n\nDo you have these documents ready?\n• 🪪 Aadhaar card (optional but helpful)\n• 🏠 Address proof (rental agreement, utility bill)\n• 📸 Passport-size photo (digital, JPG)",
    chips: ["✅ Yes, I have them", "❌ No, not yet"]
  },

  // Step 1 – experienced voter
  s1_experienced: {
    bot: "Welcome back! 👋 As an experienced voter, you may want to:\n• 📋 Update details (name, address) — <strong>Form 8</strong>\n• 🔄 Transfer to new constituency — <strong>Form 8A</strong>\n• 🆕 Re-register if deleted — <strong>Form 6</strong>\n\nDo you have your documents ready?",
    chips: ["✅ Yes, I have them", "❌ No, not yet"]
  },

  // Step 2 – if docs NOT ready
  s2_noDocs: {
    bot: "No problem! Here's what you need to collect first:\n\n• 🪪 Any government-issued ID (Aadhaar, Passport, DL)\n• 🏠 Address proof (utility bill, bank passbook, rent agreement)\n• 📸 Digital passport photo (JPG, under 2 MB)\n\nOnce ready, visit:\n🔗 " + lnk("voters.eci.gov.in", "https://voters.eci.gov.in") + "\n\nWould you like step-by-step guidance for later?",
    chips: ["✅ Yes, guide me", "🏠 Main Menu"]
  },

  // Step 2 – if docs ready
  s2_hasDocs: {
    bot: "You're all set! 🙌\n\nVisit the " + lnk("NVSP Portal", "https://voters.eci.gov.in") + " or use the <strong>Voter Helpline App</strong>.\nYou'll be filling <strong>Form 6</strong> (New Voter Registration).\n\nWould you like a step-by-step walkthrough?",
    chips: ["✅ Yes, show me steps", "🔗 Just the link is fine"]
  },

  // Step 3 – step-by-step
  s3_steps: {
    bot: "Here's your registration guide 🚀\n\n<strong>Step 1 —</strong> Open " + lnk("voters.eci.gov.in", "https://voters.eci.gov.in") + "\n<strong>Step 2 —</strong> Click <em>'New Voter Registration'</em>\n<strong>Step 3 —</strong> Fill <strong>Form 6</strong> with your details\n<strong>Step 4 —</strong> Upload scanned documents\n<strong>Step 5 —</strong> Submit and note your <strong>Application Reference Number</strong>\n\n🎉 Done! You'll receive an <strong>SMS confirmation</strong> from ECI.\n\n📞 Need help? Call <strong>Voter Helpline 1950</strong> (free, all states).",
    chips: ["🏠 Main Menu", "❓ FAQs"]
  },

  // No steps – just link
  s3_noSteps: {
    bot: "No problem! Here's the direct link:\n\n🔗 " + lnk("voters.eci.gov.in – Register Here", "https://voters.eci.gov.in") + "\n\n📞 Voter Helpline: <strong>1950</strong> (free call, all states)\n\n🗳️ <em>Happy Voting! Your vote matters 🇮🇳</em>",
    chips: ["🏠 Main Menu", "❓ FAQs"]
  }
};

// ---- 2. ELIGIBILITY ----
// Q1: Indian citizen?  YES→Q2  |  NO→ not eligible (explain)
// Q2: 18 or older?     YES→Q3  |  NO→ can register soon (explain)
// Q3: Permanent addr?  YES→eligible!  |  NO→ address issue (explain)

const ELIG = {
  q1: {
    bot: "Let's check your eligibility! 🔍\n\nFirst — are you an <strong>Indian citizen</strong>?",
    chips: ["✅ Yes, I am", "❌ No, I'm not"]
  },
  q1_no: {
    bot: "❌ <strong>Indian citizenship is required</strong> to vote in Indian elections.\n\nThis applies to:\n• Foreign nationals\n• OCI / PIO card holders\n\nIf you recently acquired citizenship, you can register at " + lnk("voters.eci.gov.in", "https://voters.eci.gov.in") + ".\n\n📞 Queries: call <strong>1950</strong>.",
    chips: ["🏠 Main Menu"]
  },
  q2: {
    bot: "✅ Great! Are you <strong>18 years of age or older</strong>?\n\n<em>(As of 1st January of the enrollment year)</em>",
    chips: ["✅ Yes, I'm 18+", "❌ No, not yet"]
  },
  q2_no: {
    bot: "📅 You're almost there! You can register as a voter once you turn <strong>18</strong>.\n\nHere's what to know:\n• <strong>Cutoff date:</strong> 1st January of the enrollment year\n• Check ECI's website closer to your 18th birthday\n• Registration is free and quick!\n\nBookmark: " + lnk("voters.eci.gov.in", "https://voters.eci.gov.in") + "\n\nI'll be here when you're ready! 😊",
    chips: ["🏠 Main Menu"]
  },
  q3: {
    bot: "✅ Almost done! Do you have a <strong>permanent address in India</strong>?",
    chips: ["✅ Yes, I do", "❌ No, I recently moved"]
  },
  q3_no: {
    bot: "⚠️ You can only vote in the constituency of your <strong>registered address</strong>.\n\nIf you've moved:\n• Fill <strong>Form 8A</strong> to transfer your registration\n• Visit " + lnk("voters.eci.gov.in", "https://voters.eci.gov.in") + "\n• Your old registration remains valid until transfer is done\n\n📞 Call <strong>1950</strong> for free assistance.",
    chips: ["🏠 Main Menu", "📝 Register / Transfer"]
  },
  eligible: {
    bot: "🎉 <strong>You are eligible to vote in Indian elections!</strong>\n\n✅ Indian citizen\n✅ 18 years or older\n✅ Permanent address in India\n\nWould you like to register now?",
    chips: ["📝 Register Now", "🏠 Main Menu"]
  }
};

// ---- 3. TIMELINE ----
const TIMELINE = {
  ask: {
    bot: "Election dates vary across states and are announced by the <strong>Election Commission of India (ECI)</strong>. 🗓️\n\nWhich type would you like to know about?",
    chips: ["🇮🇳 General (Lok Sabha) Elections", "🏛️ State (Vidhan Sabha) Elections", "🏙️ Local Body Elections"]
  },
  general: `🇮🇳 <strong>General (Lok Sabha) Elections</strong> are held every <strong>5 years</strong>.\n\nThe ECI follows this process:\n\n📢 <strong>1. Announcement</strong> — ECI releases the schedule & Model Code of Conduct begins\n📋 <strong>2. Nomination</strong> — Candidates file papers (2–4 weeks)\n🎤 <strong>3. Campaigning</strong> — Parties campaign (approx. 2 weeks per phase)\n🗳️ <strong>4. Voting Day</strong> — Conducted in multiple phases across India\n📊 <strong>5. Counting & Results</strong> — Votes counted; results declared\n\n📅 For current schedules: ` + lnk("eci.gov.in", "https://eci.gov.in"),
  state: `🏛️ <strong>State (Vidhan Sabha) Elections</strong> are held every <strong>5 years</strong> per state.\n\nThe process mirrors general elections but is state-specific:\n\n📢 ECI announces the schedule\n📋 Nomination & candidate scrutiny\n🎤 Campaign period (2–3 weeks)\n🗳️ Voting Day (usually 1 phase)\n📊 Counting & Results\n\n📅 Check your state's schedule: ` + lnk("eci.gov.in/elections", "https://eci.gov.in"),
  local: `🏙️ <strong>Local Body Elections</strong> (Municipal Corporations, Panchayats, etc.) are managed by <strong>State Election Commissions</strong> — not the central ECI.\n\nSchedules vary by state and city.\n\n📅 Contact your State Election Commission or check your state government's official website for dates.`
};

// ---- 4. VOTING DAY ----
const VOTING_DAY = `🗳️ <strong>Your Voting Day Checklist</strong>\n\n<strong>Step 1 —</strong> 🔍 Find your polling booth at ` + lnk("electoralsearch.eci.gov.in", "https://electoralsearch.eci.gov.in") + ` or check your Voter Slip\n<strong>Step 2 —</strong> 🪪 Carry <strong>any one</strong> approved ID:\n&nbsp;&nbsp;&nbsp;(Voter ID, Aadhaar, Passport, Driving Licence, PAN Card, etc.)\n<strong>Step 3 —</strong> ✅ Tell the polling officer your name; they verify the voter list\n<strong>Step 4 —</strong> 🖊️ Get an <strong>indelible ink mark</strong> on your left index finger\n<strong>Step 5 —</strong> 🖥️ Press the button next to your candidate on the <strong>EVM</strong>\n<strong>Step 6 —</strong> 🖨️ A <strong>VVPAT slip</strong> shows for 7 seconds — confirm your vote\n\n✅ <strong>Done!</strong> Your vote is cast <em>secretly and securely</em>.\n📞 Polling issues? Call <strong>1950</strong>.`;

// ---- 5. FAQs ----
const FAQS = {
  'voter id': `✅ <strong>Yes, you can vote without a Voter ID card!</strong>\n\nThe ECI accepts any of these as proof of identity:\n• 🪪 Aadhaar Card\n• 🛂 Passport\n• 🚗 Driving Licence\n• 💳 PAN Card\n• 🏦 Bank / Post Office Passbook (with photo)\n• 💼 MNREGA Job Card\n• 🏥 Health Insurance Smart Card (RSBY)\n• 📋 Smart Card issued by RGI\n\nAny <strong>one</strong> of these is sufficient.`,

  'another city': `❌ <strong>No, you can only vote in your registered constituency.</strong>\n\nIf you've moved to another city:\n• Fill <strong>Form 8A</strong> to transfer registration\n• Visit ` + lnk("voters.eci.gov.in", "https://voters.eci.gov.in") + `\n\nUntil transfer is done, you must travel to your original constituency to vote.`,

  'aadhaar': `ℹ️ <strong>No, Aadhaar is NOT mandatory.</strong>\n\nAadhaar is:\n• ✅ Helpful for faster voter registration\n• ✅ One of many accepted IDs on voting day\n• ✅ Optional to link with voter ID\n\nYour vote is completely valid without Aadhaar.`,

  'deleted': `📋 If your name is missing from the voter list:\n\n1. Check at ` + lnk("electoralsearch.eci.gov.in", "https://electoralsearch.eci.gov.in") + `\n2. If deleted, fill <strong>Form 6</strong> to re-register\n3. Visit your local BLO (Booth Level Officer) for help\n4. Call <strong>1950</strong> for assistance`,

  'blind': `♿ <strong>Yes! Voters with disabilities have full support:</strong>\n• 🚗 Free transport to polling booths (in most states)\n• 👁️ Blind voters may bring a trusted companion\n• ♿ Ramps and accessible booths are arranged\n• Priority queuing at polling stations\n\nContact your local ERO (Electoral Registration Officer) in advance.`
};

const MYTHS = `📚 <strong>Myths vs. Facts — Busted!</strong>\n\n━━━━━━━━━━━━━━━━━━━━━━\n❌ <strong>Myth:</strong> Voting is compulsory.\n✅ <strong>Fact:</strong> Voting is your <em>right</em>, not an obligation. But it is a valued civic duty!\n\n━━━━━━━━━━━━━━━━━━━━━━\n❌ <strong>Myth:</strong> You need a Voter ID card to vote.\n✅ <strong>Fact:</strong> 8 alternative IDs are accepted, including Aadhaar and Passport.\n\n━━━━━━━━━━━━━━━━━━━━━━\n❌ <strong>Myth:</strong> Your vote is not secret.\n✅ <strong>Fact:</strong> Voting is <strong>100% confidential</strong>. The EVM never links your identity to your vote.\n\n━━━━━━━━━━━━━━━━━━━━━━\n❌ <strong>Myth:</strong> You can't register after the deadline.\n✅ <strong>Fact:</strong> The voter roll is updated continuously — you can register anytime!\n\n━━━━━━━━━━━━━━━━━━━━━━\n❌ <strong>Myth:</strong> EVMs can be hacked.\n✅ <strong>Fact:</strong> EVMs are <strong>standalone machines</strong> — not connected to the internet.`;

const FAQ_CHIPS = [
  "🪪 Vote without Voter ID?",
  "🏙️ Vote in another city?",
  "📋 Aadhaar mandatory?",
  "📋 Name deleted from roll?",
  "♿ Voting with disability?",
  "📚 Myths vs Facts",
  "🏠 Main Menu"
];

// ============================================================
// INTENT ROUTER
// ============================================================
function routeIntent(t) {
  if (t.includes('register') || t.includes('📝') || t === '1') return 'registration';
  if (t.includes('eligible') || t.includes('eligib') || t.includes('✅ check') || t === '2') return 'eligibility';
  if (t.includes('timeline') || t.includes('when') || t.includes('election') || t.includes('🗓') || t === '3') return 'timeline';
  if (t.includes('voting day') || t.includes('how to vote') || t.includes('🗳️ voting day') || t === '4') return 'voting';
  if (t.includes('faq') || t.includes('help') || t.includes('❓') || t === '5') return 'faq';
  return null;
}

// ============================================================
// FLOW STARTERS
// ============================================================
function startFlow(name) {
  state.flow = name;
  state.step = 0;

  switch (name) {
    case 'registration':
      botSay(REG.s0.bot, REG.s0.chips);
      break;
    case 'eligibility':
      botSay(ELIG.q1.bot, ELIG.q1.chips);
      break;
    case 'timeline':
      botSay(TIMELINE.ask.bot, TIMELINE.ask.chips);
      break;
    case 'voting':
      botSay(VOTING_DAY, ['🏠 Main Menu', '❓ FAQs', '📝 Register as a voter']);
      resetState();
      break;
    case 'faq':
      botSay("Here are some common questions about voting in India. Choose one 👇", FAQ_CHIPS);
      break;
  }
}

// ============================================================
// FLOW HANDLERS
// ============================================================

// --- REGISTRATION ---
function handleRegistration(t) {
  if (state.step === 0) {
    const firstTime = t.includes('yes') || t.includes('first');
    state.isFirstTime = firstTime;
    state.step = 1;
    const d = firstTime ? REG.s1_firstTime : REG.s1_experienced;
    botSay(d.bot, d.chips);

  } else if (state.step === 1) {
    const hasDocs = t.includes('yes') || t.includes('have');
    state.step = 2;
    if (hasDocs) {
      botSay(REG.s2_hasDocs.bot, REG.s2_hasDocs.chips);
    } else {
      botSay(REG.s2_noDocs.bot, REG.s2_noDocs.chips);
    }

  } else if (state.step === 2) {
    const wantsSteps = t.includes('yes') || t.includes('show') || t.includes('guide') || t.includes('step');
    if (wantsSteps) {
      botSay(REG.s3_steps.bot, REG.s3_steps.chips);
    } else {
      botSay(REG.s3_noSteps.bot, REG.s3_noSteps.chips);
    }
    resetState();

  } else {
    showMainMenu();
  }
}

// --- ELIGIBILITY ---
function handleEligibility(t) {
  const isYes = t.includes('yes') || t.includes('✅');

  if (state.step === 0) {
    // Q1: Indian citizen?
    if (isYes) {
      state.step = 1;
      botSay(ELIG.q2.bot, ELIG.q2.chips);
    } else {
      botSay(ELIG.q1_no.bot, ELIG.q1_no.chips);
      resetState();
    }

  } else if (state.step === 1) {
    // Q2: 18+?
    if (isYes) {
      state.step = 2;
      botSay(ELIG.q3.bot, ELIG.q3.chips);
    } else {
      botSay(ELIG.q2_no.bot, ELIG.q2_no.chips);
      resetState();
    }

  } else if (state.step === 2) {
    // Q3: Permanent address?
    if (isYes) {
      botSay(ELIG.eligible.bot, ELIG.eligible.chips);
    } else {
      botSay(ELIG.q3_no.bot, ELIG.q3_no.chips);
    }
    resetState();

  } else {
    showMainMenu();
  }
}

// --- TIMELINE ---
function handleTimeline(t) {
  if (t.includes('general') || t.includes('lok') || t.includes('🇮🇳')) {
    botSay(TIMELINE.general, ['🏠 Main Menu', '🗳️ Voting day process', '❓ FAQs']);
  } else if (t.includes('state') || t.includes('vidhan') || t.includes('🏛')) {
    botSay(TIMELINE.state, ['🏠 Main Menu', '🗳️ Voting day process', '❓ FAQs']);
  } else if (t.includes('local') || t.includes('municipal') || t.includes('panchayat') || t.includes('🏙')) {
    botSay(TIMELINE.local, ['🏠 Main Menu', '❓ FAQs']);
  } else {
    botSay(TIMELINE.ask.bot, TIMELINE.ask.chips);
    return;
  }
  resetState();
}

// --- FAQ ---
function handleFAQ(t) {
  if (t.includes('myth') || t.includes('fact')) {
    botSay(MYTHS, ['🏠 Main Menu', '❓ More Questions']);
    return;
  }
  if (t.includes('voter id') || t.includes('without') || t.includes('🪪')) {
    botSay(FAQS['voter id'], ['🏠 Main Menu', '❓ More Questions']);
    return;
  }
  if (t.includes('city') || t.includes('another') || t.includes('🏙')) {
    botSay(FAQS['another city'], ['🏠 Main Menu', '❓ More Questions']);
    return;
  }
  if (t.includes('aadhaar') || t.includes('aadhar') || t.includes('mandatory')) {
    botSay(FAQS['aadhaar'], ['🏠 Main Menu', '❓ More Questions']);
    return;
  }
  if (t.includes('deleted') || t.includes('missing') || t.includes('roll') || t.includes('📋')) {
    botSay(FAQS['deleted'], ['🏠 Main Menu', '❓ More Questions']);
    return;
  }
  if (t.includes('disab') || t.includes('blind') || t.includes('wheelchair') || t.includes('♿')) {
    botSay(FAQS['blind'], ['🏠 Main Menu', '❓ More Questions']);
    return;
  }
  // If nothing matched, re-show FAQ menu
  botSay("I didn't quite catch that. Please choose a question below 👇", FAQ_CHIPS);
}

// ============================================================
// MAIN INPUT HANDLER
// ============================================================
function handleInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  quickRepliesEl.innerHTML = '';
  addMessage(trimmed, 'user');

  const t = trimmed.toLowerCase();

  // ---- Global shortcuts ----
  if (t.includes('main menu') || t.includes('🏠') || t.includes('start over') || t.includes('restart')) {
    showMainMenu("What else can I help you with? 👇");
    return;
  }
  if (t.includes('register now') || t.includes('📝 register now')) {
    startFlow('registration');
    return;
  }
  if (t.includes('register / transfer') || t.includes('register/transfer')) {
    startFlow('registration');
    return;
  }
  if (t.includes('more question') || t.includes('❓ more')) {
    state.flow = 'faq';
    state.step = 0;
    botSay("Sure! Pick another question 👇", FAQ_CHIPS);
    return;
  }

  // ---- If no active flow, route by intent ----
  if (!state.flow) {
    const intent = routeIntent(t);
    if (intent) {
      startFlow(intent);
    } else {
      botSay(
        "Hmm, I didn't quite understand that. 😊\nNo worries — please choose one of the options below:",
        MAIN_MENU_CHIPS
      );
    }
    return;
  }

  // ---- Route to active flow handler ----
  switch (state.flow) {
    case 'registration': handleRegistration(t); break;
    case 'eligibility':  handleEligibility(t);  break;
    case 'timeline':     handleTimeline(t);     break;
    case 'faq':          handleFAQ(t);           break;
    default: {
      const intent = routeIntent(t);
      if (intent) startFlow(intent);
      else showMainMenu();
    }
  }
}

// ============================================================
// EVENTS
// ============================================================
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (val) { handleInput(val); chatInput.value = ''; }
});

resetBtn.addEventListener('click', () => {
  messagesEl.innerHTML = '';
  quickRepliesEl.innerHTML = '';
  init();
});

// ============================================================
// INIT
// ============================================================
function init() {
  resetState();
  // Date chip
  const dateChip = document.createElement('div');
  dateChip.classList.add('date-chip');
  dateChip.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  messagesEl.appendChild(dateChip);

  setTimeout(() => {
    addMessage(
      "👋 Hi! I'm <strong>Amrita</strong> — your official election guide. 🇮🇳<br><br>" +
      "I'm here to help you <strong>register as a voter</strong>, check your <strong>eligibility</strong>, understand <strong>election timelines</strong>, and walk you through <strong>voting day</strong>.<br><br>" +
      "All information follows official <strong>Election Commission of India</strong> guidelines. Let's get started!",
      'bot'
    );
    setChips(MAIN_MENU_CHIPS);
  }, 400);
}

init();
