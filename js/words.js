/**
 * Curated word banks and sentence collections for corporate, technical, 
 * and tricky spelling typing practice.
 */

const WORD_BANKS = {
  corporate: [
    "stakeholders", "deliverables", "feasibility", "bandwidth", "collaborate",
    "acknowledgement", "synergy", "paradigm", "accommodate", "compliance",
    "benchmarking", "milestone", "prioritize", "streamline", "optimization",
    "sustainability", "governance", "procurement", "confidentiality", "remuneration",
    "competency", "contingency", "utilization", "leverage", "strategic",
    "initiative", "methodology", "facilitate", "comprehensive", "transparency",
    "accountability", "delegation", "synergistic", "restructuring", "feasibility",
    "scalability", "monetization", "quarterly", "proactive", "performance",
    "appraisal", "requisition", "infrastructure", "operational", "reorganization",
    "consolidation", "diversification", "stakeholder", "engagement", "synchronize",
    "alignment", "reimbursement", "implementation", "recommendation", "clarification",
    "communication", "negotiation", "productivity", "orientation", "empowerment"
  ],

  technical: [
    "asynchronous", "architecture", "authentication", "infrastructure", "optimization",
    "scalability", "repository", "concurrency", "deployment", "microservices",
    "polymorphism", "encapsulation", "inheritance", "abstraction", "middleware",
    "orchestration", "kubernetes", "virtualization", "containerization", "continuous",
    "integration", "refactoring", "serialization", "deserialization", "idempotent",
    "synchronous", "dependency", "injection", "cryptography", "distributed",
    "throughput", "latency", "bottleneck", "elasticsearch", "websockets",
    "loadbalancer", "multithreading", "deterministic", "declarative", "imperative",
    "immutability", "declarative", "vectorization", "normalization", "denormalization",
    "transactional", "observability", "telemetry", "prometheus", "elasticsearch"
  ],

  trickySpellings: [
    { word: "definitely", hint: "d-e-f-i-n-i-t-e-l-y (no 'a')", def: "Without doubt; certainly." },
    { word: "accommodate", hint: "Double 'c' and double 'm'", def: "Provide lodging or sufficient space for." },
    { word: "maintenance", hint: "m-a-i-n-t-e-n-a-n-c-e", def: "The process of preserving or maintaining." },
    { word: "separate", hint: "Look for 'a rat' in sep-a-rat-e", def: "Forming or viewed as a unit by itself." },
    { word: "calendar", hint: "Ends with '-ar', not '-er'", def: "A chart showing the days, weeks, and months." },
    { word: "privilege", hint: "p-r-i-v-i-l-e-g-e (no 'd')", def: "A special right, advantage, or immunity." },
    { word: "liaison", hint: "l-i-a-i-s-o-n (double 'i')", def: "Communication or cooperation between organizations." },
    { word: "pronunciation", hint: "p-r-o-n-u-n-c-i-a-t-i-o-n", def: "The way in which a word is pronounced." },
    { word: "receive", hint: "Remember 'i before e except after c'", def: "Be given, presented with, or paid." },
    { word: "conscious", hint: "c-o-n-s-c-i-o-u-s", def: "Aware of and responding to one's surroundings." },
    { word: "embarrass", hint: "Double 'r' and double 's'", def: "Cause someone to feel awkward or ashamed." },
    { word: "occurrence", hint: "Double 'c' and double 'r', ends with -ence", def: "An incident or event." },
    { word: "millennium", hint: "Double 'l' and double 'n'", def: "A period of a thousand years." },
    { word: "questionnaire", hint: "Double 'n' followed by 'aire'", def: "A set of printed or written questions." },
    { word: "hierarchy", hint: "h-i-e-r-a-r-c-h-y", def: "A system in which members are ranked." },
    { word: "schedule", hint: "s-c-h-e-d-u-l-e", def: "A plan for carrying out process or events." },
    { word: "bureaucracy", hint: "b-u-r-e-a-u-c-r-a-c-y", def: "A system of government or management." },
    { word: "entrepreneur", hint: "e-n-t-r-e-p-r-e-n-e-u-r", def: "A person who sets up a business." },
    { word: "consensus", hint: "c-o-n-s-e-n-s-u-s", def: "A general agreement." },
    { word: "guarantee", hint: "g-u-a-r-a-n-t-e-e", def: "A formal promise or assurance." },
    { word: "indispensable", hint: "Ends with '-able', not '-ible'", def: "Absolutely necessary." },
    { word: "supersede", hint: "s-u-p-e-r-s-e-d-e (with 's', not 'c')", def: "Take the place of a person or thing." },
    { word: "miscellaneous", hint: "m-i-s-c-e-l-l-a-n-e-o-u-s", def: "Items or people of various types." },
    { word: "fluorescent", hint: "f-l-u-o-r-e-s-c-e-n-t", def: "Giving off bright light when exposed to radiation." }
  ],

  corporateSentences: [
    "Please find attached the updated project roadmap and milestone deliverables for your review.",
    "Let us schedule a quick sync tomorrow morning to align on the technical requirements and deliverables.",
    "I appreciate your timely feedback and will incorporate the requested revisions into the documentation.",
    "Could you please confirm your availability for the cross-functional sprint planning session next week?",
    "We need to optimize our backend database queries to minimize latency and enhance user experience.",
    "The engineering team is actively investigating the production incident and will deploy a hotfix shortly.",
    "Please ensure all relevant stakeholders are kept in the loop regarding this architectural decision.",
    "Our primary objective for this fiscal quarter is to enhance customer retention and system stability.",
    "I would like to propose a comprehensive audit of our cloud infrastructure to reduce operational overhead.",
    "Thank you for your collaboration on this critical initiative; your contribution was invaluable.",
    "We have scheduled a retrospective meeting on Friday to discuss key learnings and process improvements.",
    "Please verify the pull request and ensure that all automated unit and integration tests pass seamlessly.",
    "Effective asynchronous communication enables distributed engineering teams to operate with high velocity.",
    "We must adhere strictly to compliance guidelines and data security standards across all services.",
    "Let us table this discussion for our one-on-one session to prioritize current sprint commitments."
  ]
};

/**
 * Returns a randomized list of words or sentences based on selected category & target word count.
 */
function getPracticeText(category, count = 50) {
  let pool = [];

  switch (category) {
    case "corporate":
      pool = WORD_BANKS.corporate;
      break;
    case "technical":
      pool = WORD_BANKS.technical;
      break;
    case "mixed":
      pool = [...WORD_BANKS.corporate, ...WORD_BANKS.technical];
      break;
    case "tricky":
      pool = WORD_BANKS.trickySpellings.map(item => item.word);
      break;
    case "sentences":
      return getRandomSentences(Math.min(8, Math.max(3, Math.ceil(count / 15))));
    default:
      pool = [...WORD_BANKS.corporate, ...WORD_BANKS.technical];
  }

  const result = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result.push(pool[randomIndex]);
  }
  return result.join(" ");
}

function getRandomSentences(numSentences = 4) {
  const shuffled = [...WORD_BANKS.corporateSentences].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numSentences).join(" ");
}

if (typeof window !== 'undefined') {
  window.WORD_BANKS = WORD_BANKS;
  window.getPracticeText = getPracticeText;
  window.getRandomSentences = getRandomSentences;
}
