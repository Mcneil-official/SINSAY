export const MABINI_GENERAL_FACTS = [
  "Mabini, Batangas, is home to Anilao, a well-known destination for scuba diving and underwater photography.",
  "The Verde Island Passage surrounding Mabini is recognized by marine scientists as the Center of the Center of Marine Shorefish Biodiversity on Earth.",
  "Anilao is celebrated as the birthplace of Philippine sport diving, with pioneers exploring its reefs since the mid-1960s.",
  "Mabini's registered dive sites and Marine Protected Areas (MPAs) are actively monitored for coral health.",
  "The SINSAY Eco-Dive Pass directly supports local coastal law enforcement, reef patrols, and community marine conservation projects.",
  "Night diving in Anilao reveals bioluminescent plankton, hunting moray eels, and rare nocturnal nudibranchs found nowhere else.",
  "Mabini's coral reefs provide essential shoreline protection and sustain the livelihood of local coastal communities.",
];

export const SITE_DID_YOU_KNOW: Record<string, string> = {
  "Cathedral Rock":
    "In 1983, a bronze cross was planted underwater between two giant coral rock formations here, blessed by Pope John Paul II.",
  "Twin Rocks":
    "Twin Rocks is one of Mabini's oldest Marine Protected Areas (MPAs) and is home to giant clams and schooling jacks.",
  "Arthur's Rock":
    "Arthur's Rock is a marine sanctuary famed for crinoid gardens where pygmy seahorses hide among gorgonian sea fans.",
  "Sombrero Island":
    "Sombrero Island gets its name from its hat-shaped silhouette above water, while underneath lies a dramatic wall of gorgonians and pelagic fish.",
  "Kirby's Rock":
    "Kirby's Rock features an abrupt drop-off with a 30-meter wall hosting ghost pipefish, pygmy seahorses, and vibrant soft corals.",
  "Mainit Point":
    "'Mainit' means hot in Tagalog—named for natural geothermal underwater warm water vents trickling through the sand.",
  "Beatrice Rock":
    "Renowned for thrilling drift diving where powerful currents attract large schools of anthias, jacks, and sea turtles.",
  "Ligpo Island":
    "Ligpo Island sits at the entrance of Balayan Bay, featuring a coral plateau with deep caverns and nudibranch colonies.",
  "Sepoc Wall":
    "Sepoc Wall descends past 30 meters, blanketed with barrel sponges and frequently visited by hawksbill turtles.",
  "Eagle Point":
    "Eagle Point is known for its shallow coral gardens leading into deep sandy channels rich in macro critters.",
  "Dap-Dap":
    "Dap-Dap features gentle sloping reefs that serve as an important nursery for juvenile reef fish and sea anemones.",
  "Koala":
    "Koala was named after the distinctive shape of the shoreline tree canopy and features calm waters ideal for beginner divers.",
};

export const DEFAULT_SITE_DID_YOU_KNOW =
  "This dive site is part of Mabini's municipal marine reserve network. Practicing neutral buoyancy helps protect these fragile reefs for generations to come.";

export function getSiteDidYouKnow(siteName: string): string {
  if (!siteName) return DEFAULT_SITE_DID_YOU_KNOW;
  // Match exact name or partial substring; tolerate ' vs ’ apostrophes
  // (DB stores "Arthur’s Rock" with U+2019).
  const normalize = (s: string) =>
    s.replace(/[\u2018\u2019]/g, "'").toLowerCase();
  const target = normalize(siteName);
  const matchedKey = Object.keys(SITE_DID_YOU_KNOW).find((k) =>
    target.includes(normalize(k))
  );
  return matchedKey ? SITE_DID_YOU_KNOW[matchedKey] : DEFAULT_SITE_DID_YOU_KNOW;
}

export interface PromptStarter {
  label: string;
  query: string;
}

export const AI_TRIVIA_STARTERS: PromptStarter[] = [
  {
    label: "Why is Mabini part of the Verde Island Passage?",
    query: "Why is Mabini part of the Verde Island Passage, and why is it ecologically significant?",
  },
  {
    label: "What makes Cathedral Rock famous?",
    query: "What makes Cathedral Rock in Mabini famous for scuba divers?",
  },
  {
    label: "Best macro photo spots in Mabini?",
    query: "What are the best dive sites in Mabini for macro and muck underwater photography?",
  },
  {
    label: "How does the Eco-Dive Pass protect Mabini?",
    query: "How does the SINSAY Eco-Dive Pass and carrying capacity management protect Mabini reefs?",
  },
];
