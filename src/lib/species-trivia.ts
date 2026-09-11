// True/False conservation trivia, keyed by species symbol (see
// supabase/seed.sql / scripts/sync-species.ts). Like the sync script's
// curated IUCN fallback, this is authored from general knowledge, not
// pulled from a live source — treat as "probably right, spot-check before
// relying on it" rather than authoritative. Update as species data changes.
//
// GENERIC_TRIVIA is used for any species not listed here (e.g. future
// additions, or the Phase 1 "Shark" placeholder) so the mining flow never
// has a species with no questions.

export type TriviaQuestion = {
  question: string;
  answer: boolean;
  fact: string;
};

export const SPECIES_TRIVIA: Record<string, TriviaQuestion[]> = {
  GST: [
    { question: "Green Sea Turtles are the only sea turtle species that is herbivorous as an adult.", answer: true, fact: "Adults graze mainly on seagrass and algae, unlike most other sea turtles." },
    { question: "Green Sea Turtles can retract their head fully into their shell.", answer: false, fact: "Like all sea turtles, they cannot retract their head or limbs — that ability is limited to some land and freshwater turtles." },
    { question: "Female Green Sea Turtles return to the same beach where they hatched to lay their own eggs.", answer: true, fact: "This is called natal homing, and it's one reason beach development is so disruptive to nesting populations." },
  ],
  HBT: [
    { question: "Hawksbill Turtles get their name from their narrow, hooked beak.", answer: true, fact: "Their beak shape helps them reach into crevices in coral reefs to feed on sponges." },
    { question: "Hawksbill Turtles are one of the least endangered sea turtle species.", answer: false, fact: "They're Critically Endangered, largely due to historical demand for tortoiseshell products." },
    { question: "Hawksbill Turtles feed mainly on sea sponges.", answer: true, fact: "They're one of the few predators able to eat toxic sponge species other animals avoid." },
  ],
  LBT: [
    { question: "Leatherback Turtles are the largest sea turtle species.", answer: true, fact: "They can weigh over 500kg — their soft, leathery carapace (not a hard shell) is unique among sea turtles." },
    { question: "Leatherback Turtles have a hard, bony shell like other sea turtles.", answer: false, fact: "Their carapace is made of tough, oily connective tissue instead of hard keratin scutes." },
    { question: "Leatherback Turtles feed primarily on jellyfish.", answer: true, fact: "They're specialized jellyfish predators, which unfortunately makes floating plastic bags a deadly look-alike hazard." },
  ],
  LGT: [
    { question: "Loggerhead Turtles are named for their unusually large head and powerful jaws.", answer: true, fact: "Their strong jaws let them crush hard-shelled prey like conch and whelk." },
    { question: "Loggerhead Turtles are found only in the Pacific Ocean.", answer: false, fact: "They range across the Atlantic, Pacific, Indian, and Mediterranean waters." },
    { question: "Loggerhead Turtles can take decades to reach sexual maturity.", answer: true, fact: "Estimates commonly range from 20-35 years, which makes population recovery very slow." },
  ],
  WHS: [
    { question: "Whale Sharks are the largest fish species in the world.", answer: true, fact: "They can grow beyond 12 meters long, despite being filter feeders, not active predators." },
    { question: "Whale Sharks are a type of whale, not a shark.", answer: false, fact: "Despite the name, they're a shark species — the largest one, in fact." },
    { question: "Whale Sharks feed mainly by filtering plankton from the water.", answer: true, fact: "They filter-feed on plankton, small fish, and fish eggs, often near the surface." },
  ],
  GWS: [
    { question: "Great White Sharks are warm-blooded relative to most fish.", answer: true, fact: "They can keep parts of their body warmer than the surrounding water, aiding hunting performance." },
    { question: "Great White Sharks lay eggs like many other fish.", answer: false, fact: "They give birth to live young (ovoviviparous) rather than laying eggs." },
    { question: "Great White Sharks are found in coastal waters on almost every continent except Antarctica.", answer: true, fact: "They have one of the widest distributions of any large shark species." },
  ],
  SHH: [
    { question: "Scalloped Hammerheads often gather in large schools during the day.", answer: true, fact: "Schooling behavior at seamounts is well documented, unusual for large sharks." },
    { question: "The hammerhead's wide head shape is thought to improve its sensory detection of prey.", answer: true, fact: "The shape spreads out electroreceptors, helping it detect prey like stingrays buried in sand." },
    { question: "Scalloped Hammerheads are listed as a species of Least Concern.", answer: false, fact: "They're Critically Endangered, heavily impacted by the shark fin trade due to their schooling behavior." },
  ],
  BRS: [
    { question: "Blacktip Reef Sharks are named for the black markings on their fin tips.", answer: true, fact: "The black tips are most visible on the dorsal and tail fins." },
    { question: "Blacktip Reef Sharks typically live in deep open ocean far from any reef.", answer: false, fact: "They're a shallow, reef-associated species, often seen in water barely deep enough to cover them." },
    { question: "Blacktip Reef Sharks are considered dangerous to humans, with frequent fatal attacks.", answer: false, fact: "They can bite defensively if provoked, but fatal attacks are extremely rare — they're a small, cautious species." },
  ],
  MNT: [
    { question: "Giant Oceanic Manta Rays are filter feeders, not predators of large prey.", answer: true, fact: "They filter zooplankton using specialized gill plates rather than hunting fish." },
    { question: "Manta rays have a stinging barb on their tail like stingrays.", answer: false, fact: "Unlike many of their ray relatives, mantas lack a stinging tail barb." },
    { question: "Manta rays have the largest brain-to-body-size ratio of any fish.", answer: true, fact: "This is part of why they're considered unusually intelligent among cartilaginous fish." },
  ],
  DUG: [
    { question: "Dugongs are closely related to elephants rather than to whales or dolphins.", answer: true, fact: "Dugongs and manatees share an ancestor with elephants, not with cetaceans." },
    { question: "Dugongs primarily eat fish.", answer: false, fact: "They're herbivores, grazing almost exclusively on seagrass." },
    { question: "Dugongs are sometimes called 'sea cows'.", answer: true, fact: "The nickname reflects their grazing habit and gentle, slow-moving nature." },
  ],
  OTR: [
    { question: "Sea Otters have the densest fur of any animal.", answer: true, fact: "They lack blubber, so extremely dense fur (up to a million hairs per square inch) is their main insulation." },
    { question: "Sea Otters often use rocks as tools to crack open shellfish.", answer: true, fact: "This is one of the best-documented examples of tool use among marine mammals." },
    { question: "Sea Otters are the largest members of the weasel family.", answer: true, fact: "Despite being small compared to seals, they're the largest mustelids." },
  ],
  SSL: [
    { question: "Steller Sea Lions are the largest species in the sea lion family.", answer: true, fact: "Adult males can weigh over 1,000kg, much larger than California sea lions." },
    { question: "Steller Sea Lion populations have been fully stable with no historical declines.", answer: false, fact: "Western populations saw a dramatic, still not fully explained decline in the late 20th century." },
    { question: "Steller Sea Lions are named after a naturalist who first described them.", answer: true, fact: "They're named after Georg Wilhelm Steller, an 18th-century naturalist." },
  ],
  HSL: [
    { question: "Harbor Seals can sleep underwater.", answer: true, fact: "They can rest with most of their body submerged, surfacing periodically to breathe." },
    { question: "Harbor Seals are highly migratory, traveling across entire oceans each year.", answer: false, fact: "They tend to be fairly coastal and non-migratory compared to many other marine mammals." },
    { question: "Harbor Seals are considered a species of Least Concern overall.", answer: true, fact: "While some local populations face pressure, the species as a whole isn't currently threatened." },
  ],
  BLW: [
    { question: "The Blue Whale is the largest animal known to have ever lived.", answer: true, fact: "Larger than the biggest known dinosaurs, reaching up to around 30 meters long." },
    { question: "Blue Whales primarily eat large fish and squid.", answer: false, fact: "Despite their size, they feed almost exclusively on tiny shrimp-like krill." },
    { question: "Blue Whale populations were severely reduced by 20th-century commercial whaling.", answer: true, fact: "Some estimates suggest over 99% of the pre-whaling population was wiped out before protections began." },
  ],
  HPW: [
    { question: "Humpback Whales are known for their complex, long songs.", answer: true, fact: "Males produce elaborate songs that can last over 20 minutes and evolve over years." },
    { question: "Humpback Whales are currently classified as Critically Endangered worldwide.", answer: false, fact: "Most populations have recovered significantly and the species overall is Least Concern, though some subpopulations remain more vulnerable." },
    { question: "Humpback Whales are known for spectacular full-body breaches out of the water.", answer: true, fact: "Breaching is one of their most recognizable behaviors, though its exact purpose is debated." },
  ],
  NAW: [
    { question: "The North Atlantic Right Whale is one of the most endangered large whale species.", answer: true, fact: "Fewer than a few hundred individuals are estimated to remain." },
    { question: "Right Whales got their name because early whalers considered them the 'right' whale to hunt.", answer: true, fact: "They were slow, floated when killed, and yielded lots of oil and baleen — making them a preferred target." },
    { question: "Vessel strikes and fishing gear entanglement are among the leading threats to North Atlantic Right Whales.", answer: true, fact: "These two human-caused factors are the primary drivers of ongoing mortality in the species." },
  ],
  VAQ: [
    { question: "The Vaquita is the smallest species of cetacean (whale, dolphin, or porpoise).", answer: true, fact: "Adults typically reach only around 1.5 meters in length." },
    { question: "The Vaquita is found across most of the world's oceans.", answer: false, fact: "It has an extremely restricted range, found only in the northern Gulf of California, Mexico." },
    { question: "Bycatch in illegal gillnets is the primary threat driving the Vaquita toward extinction.", answer: true, fact: "Entanglement in nets set for other species (like totoaba) is the main cause of Vaquita deaths." },
  ],
  ORC: [
    { question: "Orcas are technically the largest member of the dolphin family.", answer: true, fact: "Despite being called 'killer whales,' they're classified as the largest species of oceanic dolphin." },
    { question: "Orcas live in social groups called pods, often led by an older female.", answer: true, fact: "Pods are typically matriarchal, with knowledge passed down through generations." },
    { question: "All Orca populations worldwide eat exactly the same diet.", answer: false, fact: "Different populations specialize heavily — some eat mainly fish, others marine mammals — and rarely mix diets." },
  ],
  GPO: [
    { question: "The Giant Pacific Octopus is the largest octopus species in the world.", answer: true, fact: "Some individuals have been recorded with arm spans exceeding 4 meters." },
    { question: "Octopuses have three hearts.", answer: true, fact: "Two pump blood to the gills, and one pumps it to the rest of the body." },
    { question: "The Giant Pacific Octopus typically lives for several decades.", answer: false, fact: "Most octopus species, including this one, have surprisingly short lifespans — often only 3-5 years." },
  ],
  NAU: [
    { question: "The Chambered Nautilus has remained largely unchanged for hundreds of millions of years.", answer: true, fact: "Nautiloids are often called 'living fossils' due to their ancient, slowly-evolving lineage." },
    { question: "The Chambered Nautilus can control its buoyancy using gas-filled shell chambers.", answer: true, fact: "It regulates gas and fluid in its shell chambers to move up and down in the water column." },
    { question: "The Chambered Nautilus has excellent eyesight, similar to an octopus.", answer: false, fact: "Its eyes lack a lens and form fairly blurry images, relying more on smell to navigate and find food." },
  ],
  GCL: [
    { question: "The Giant Clam is the largest living bivalve mollusk.", answer: true, fact: "It can weigh over 200kg and live for many decades." },
    { question: "Giant Clams get much of their energy from algae living inside their tissue.", answer: true, fact: "Like corals, they host photosynthetic algae (zooxanthellae) that supply them with nutrients." },
    { question: "Giant Clams are able to snap shut instantly and are known to trap divers.", answer: false, fact: "This is a persistent myth — they close quite slowly and pose no real trapping danger to divers." },
  ],
  HHW: [
    { question: "The Humphead Wrasse can change sex during its lifetime.", answer: true, fact: "Like many wrasses, individuals can transition from female to male as they mature." },
    { question: "The Humphead Wrasse is one of the largest reef fish in the world.", answer: true, fact: "It can grow to around 2 meters long, making it a reef giant." },
    { question: "The Humphead Wrasse population is thriving with no major conservation concerns.", answer: false, fact: "It's Endangered, heavily impacted by overfishing for the live reef fish trade." },
  ],
  STC: [
    { question: "Staghorn Coral gets its name from its branching, antler-like shape.", answer: true, fact: "Its fast-growing branches resemble deer antlers." },
    { question: "Staghorn Coral is one of the fastest-growing coral species in the Caribbean.", answer: true, fact: "It can grow several centimeters per year, historically making it a dominant reef-builder." },
    { question: "Staghorn Coral populations have remained stable over the last few decades.", answer: false, fact: "Populations have collapsed by over 90% in parts of its range due to disease, bleaching, and other stressors." },
  ],
  EEL: [
    { question: "European Eels migrate thousands of kilometers to spawn in the Sargasso Sea.", answer: true, fact: "Adults leave European rivers and swim across the Atlantic to spawn, then die." },
    { question: "European Eel populations have declined dramatically in recent decades.", answer: true, fact: "Recruitment of young eels has dropped by an estimated 90%+ since the 1980s." },
    { question: "European Eels spend their entire life cycle exclusively in freshwater.", answer: false, fact: "They're catadromous — living mostly in fresh/brackish water but migrating to the ocean to spawn." },
  ],
};

export const GENERIC_TRIVIA: TriviaQuestion[] = [
  { question: "The ocean covers more than 70% of Earth's surface.", answer: true, fact: "Yet an estimated 90%+ of ocean species remain undiscovered or undescribed." },
  { question: "Overfishing and bycatch are among the leading threats to many marine species.", answer: true, fact: "Unintentional capture of non-target species is a major driver of population decline for many groups." },
  { question: "Coral reefs cover less than 1% of the ocean floor but support a huge share of marine biodiversity.", answer: true, fact: "Reefs are estimated to support roughly a quarter of all known marine species despite their small footprint." },
  { question: "Plastic pollution has no measurable impact on marine wildlife.", answer: false, fact: "Plastic ingestion and entanglement affect a wide range of marine species, from turtles to whales to seabirds." },
  { question: "The IUCN Red List is a real, widely used system for tracking species' extinction risk.", answer: true, fact: "It's maintained by the International Union for Conservation of Nature and is the most widely referenced global conservation status list." },
  { question: "Marine protected areas can help threatened species recover over time.", answer: true, fact: "Well-enforced protected areas have shown measurable recovery effects for various fish and invertebrate populations." },
];

export function getTriviaForSpecies(symbol: string): TriviaQuestion[] {
  return SPECIES_TRIVIA[symbol] ?? GENERIC_TRIVIA;
}
