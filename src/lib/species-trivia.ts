// True/False conservation trivia, keyed by species symbol (see
// supabase/seed.sql / scripts/sync-species.ts). Like the sync script's
// curated IUCN fallback, this is authored from general knowledge, not
// pulled from a live source — treat as "probably right, spot-check before
// relying on it" rather than authoritative. Update as species data changes.
//
// GENERIC_TRIVIA is used for any species not listed here (e.g. future
// additions, or the Phase 1 "Shark" placeholder) so the mining flow never
// has a species with no questions.
//
// Each species currently has 6 questions (up from 3) — a step toward the
// 15-20/species target from the Phase 3 nav/mining update brief, not the
// full target yet; that's a larger content-authoring pass. Seen-question
// tracking (mining_question_seen table, see src/app/(app)/mining/MiningHub.tsx)
// means even 6 meaningfully delays repeats across a session.
//
// IMPORTANT: only ever APPEND new questions to a species' array. question
// keys are derived from array index (`${symbol}-${index}`) — reordering or
// inserting elsewhere would silently reassign a different user's "seen"
// history onto a different question.

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
    { question: "Green Sea Turtles can rest underwater for several hours without surfacing to breathe.", answer: true, fact: "Resting turtles slow their metabolism and can stay submerged far longer than when actively swimming." },
    { question: "Green Sea Turtle hatchlings find the ocean by heading toward the brightest horizon, typically over open water.", answer: true, fact: "Artificial beachfront lighting can disorient hatchlings, leading them inland instead of to the sea." },
    { question: "Green Sea Turtles have a hinged lower shell that can close for protection, like a box turtle.", answer: false, fact: "Unlike box turtles, sea turtles have a fixed plastron and cannot close their shell at all." },
  ],
  HBT: [
    { question: "Hawksbill Turtles get their name from their narrow, hooked beak.", answer: true, fact: "Their beak shape helps them reach into crevices in coral reefs to feed on sponges." },
    { question: "Hawksbill Turtles are one of the least endangered sea turtle species.", answer: false, fact: "They're Critically Endangered, largely due to historical demand for tortoiseshell products." },
    { question: "Hawksbill Turtles feed mainly on sea sponges.", answer: true, fact: "They're one of the few predators able to eat toxic sponge species other animals avoid." },
    { question: "Hawksbill Turtles help keep coral reefs healthy by controlling sponge growth.", answer: true, fact: "By eating sponges that would otherwise outcompete corals for space, they help reefs stay balanced." },
    { question: "International trade in tortoiseshell products is now completely legal worldwide.", answer: false, fact: "It's banned under CITES in most countries, though illegal trade still persists in some regions." },
    { question: "Hawksbill Turtles are found only in the Atlantic Ocean.", answer: false, fact: "They inhabit tropical reefs across the Atlantic, Pacific, and Indian Oceans." },
  ],
  LBT: [
    { question: "Leatherback Turtles are the largest sea turtle species.", answer: true, fact: "They can weigh over 500kg — their soft, leathery carapace (not a hard shell) is unique among sea turtles." },
    { question: "Leatherback Turtles have a hard, bony shell like other sea turtles.", answer: false, fact: "Their carapace is made of tough, oily connective tissue instead of hard keratin scutes." },
    { question: "Leatherback Turtles feed primarily on jellyfish.", answer: true, fact: "They're specialized jellyfish predators, which unfortunately makes floating plastic bags a deadly look-alike hazard." },
    { question: "Leatherback Turtles can dive deeper than 1,000 meters.", answer: true, fact: "They're among the deepest-diving reptiles, likely following jellyfish prey into deep water." },
    { question: "Leatherback Turtles can keep their body warmer than the surrounding cold water.", answer: true, fact: "A trait called gigantothermy lets them stay active in colder waters than other sea turtles tolerate." },
    { question: "Leatherback Turtle populations are stable and healthy everywhere they nest.", answer: false, fact: "Some Pacific populations have declined severely, even as some Atlantic populations remain healthier." },
  ],
  LGT: [
    { question: "Loggerhead Turtles are named for their unusually large head and powerful jaws.", answer: true, fact: "Their strong jaws let them crush hard-shelled prey like conch and whelk." },
    { question: "Loggerhead Turtles are found only in the Pacific Ocean.", answer: false, fact: "They range across the Atlantic, Pacific, Indian, and Mediterranean waters." },
    { question: "Loggerhead Turtles can take decades to reach sexual maturity.", answer: true, fact: "Estimates commonly range from 20-35 years, which makes population recovery very slow." },
    { question: "Loggerhead Turtle hatchlings disappear into the open ocean for years before returning to coastal waters — sometimes called the 'lost years'.", answer: true, fact: "Young loggerheads' whereabouts during this period were long a mystery to researchers." },
    { question: "Loggerhead Turtles nest only once in their entire lifetime.", answer: false, fact: "Females typically nest multiple times per season and return to nest again in future years." },
    { question: "Loggerhead Turtles are named for a diet of logs and driftwood.", answer: false, fact: "The name refers to their comparatively large head, not their diet." },
  ],
  WHS: [
    { question: "Whale Sharks are the largest fish species in the world.", answer: true, fact: "They can grow beyond 12 meters long, despite being filter feeders, not active predators." },
    { question: "Whale Sharks are a type of whale, not a shark.", answer: false, fact: "Despite the name, they're a shark species — the largest one, in fact." },
    { question: "Whale Sharks feed mainly by filtering plankton from the water.", answer: true, fact: "They filter-feed on plankton, small fish, and fish eggs, often near the surface." },
    { question: "Each Whale Shark has a unique pattern of spots, like a fingerprint.", answer: true, fact: "Researchers use spot-pattern photography to identify and track individual whale sharks." },
    { question: "Whale Sharks reproduce by laying large numbers of eggs on the seafloor.", answer: false, fact: "They give birth to live pups; a single litter can include dozens of young." },
    { question: "Whale Sharks are known to gather seasonally at specific feeding hotspots.", answer: true, fact: "Predictable aggregations, often tied to plankton blooms, occur at various sites worldwide." },
  ],
  GWS: [
    { question: "Great White Sharks are warm-blooded relative to most fish.", answer: true, fact: "They can keep parts of their body warmer than the surrounding water, aiding hunting performance." },
    { question: "Great White Sharks lay eggs like many other fish.", answer: false, fact: "They give birth to live young (ovoviviparous) rather than laying eggs." },
    { question: "Great White Sharks are found in coastal waters on almost every continent except Antarctica.", answer: true, fact: "They have one of the widest distributions of any large shark species." },
    { question: "Great White Sharks can detect a single drop of blood in a huge volume of water.", answer: true, fact: "Their sense of smell is extraordinarily sensitive, aided by specialized olfactory organs." },
    { question: "Humans are a preferred, regular prey source for Great White Sharks.", answer: false, fact: "Humans aren't a natural prey source; most bites are believed to be cases of mistaken identity or investigation." },
    { question: "Great White Sharks' lineage stretches back millions of years.", answer: true, fact: "Their lineage stretches back well over 10 million years, with debate continuing about deeper ancestry." },
  ],
  SHH: [
    { question: "Scalloped Hammerheads often gather in large schools during the day.", answer: true, fact: "Schooling behavior at seamounts is well documented, unusual for large sharks." },
    { question: "The hammerhead's wide head shape is thought to improve its sensory detection of prey.", answer: true, fact: "The shape spreads out electroreceptors, helping it detect prey like stingrays buried in sand." },
    { question: "Scalloped Hammerheads are listed as a species of Least Concern.", answer: false, fact: "They're Critically Endangered, heavily impacted by the shark fin trade due to their schooling behavior." },
    { question: "The 'scalloped' in Scalloped Hammerhead refers to the notched edge of its head.", answer: true, fact: "Its head has a distinctive scalloped, wavy front margin distinguishing it from other hammerhead species." },
    { question: "Scalloped Hammerheads give birth to live young.", answer: true, fact: "Like many requiem-related sharks, they're viviparous, with pups nourished via a placental-like connection." },
    { question: "Scalloped Hammerheads are found only in a single, small geographic region.", answer: false, fact: "They have a wide, circumtropical distribution across warm coastal and offshore waters worldwide." },
  ],
  BRS: [
    { question: "Blacktip Reef Sharks are named for the black markings on their fin tips.", answer: true, fact: "The black tips are most visible on the dorsal and tail fins." },
    { question: "Blacktip Reef Sharks typically live in deep open ocean far from any reef.", answer: false, fact: "They're a shallow, reef-associated species, often seen in water barely deep enough to cover them." },
    { question: "Blacktip Reef Sharks are considered dangerous to humans, with frequent fatal attacks.", answer: false, fact: "They can bite defensively if provoked, but fatal attacks are extremely rare — they're a small, cautious species." },
    { question: "Blacktip Reef Sharks often hunt in very shallow water, sometimes with their dorsal fin exposed.", answer: true, fact: "This shallow-water hunting behavior makes them one of the more commonly observed reef sharks by waders and snorkelers." },
    { question: "Blacktip Reef Sharks are among the largest shark species by size.", answer: false, fact: "They're relatively small, typically under 2 meters long, much smaller than large pelagic sharks." },
    { question: "Blacktip Reef Sharks give birth to live young after a roughly year-long gestation.", answer: true, fact: "They're viviparous, typically producing small litters after a gestation of around 7-11 months depending on the population." },
  ],
  MNT: [
    { question: "Giant Oceanic Manta Rays are filter feeders, not predators of large prey.", answer: true, fact: "They filter zooplankton using specialized gill plates rather than hunting fish." },
    { question: "Manta rays have a stinging barb on their tail like stingrays.", answer: false, fact: "Unlike many of their ray relatives, mantas lack a stinging tail barb." },
    { question: "Manta rays have the largest brain-to-body-size ratio of any fish.", answer: true, fact: "This is part of why they're considered unusually intelligent among cartilaginous fish." },
    { question: "Manta Rays return to the same cleaning stations to have parasites removed by small fish.", answer: true, fact: "These cleaning-station visits are well documented and thought to be important for their health." },
    { question: "Manta Rays reproduce quickly, giving birth to large litters multiple times a year.", answer: false, fact: "They're slow-reproducing, typically giving birth to a single pup only once every few years." },
    { question: "Manta Rays are cartilaginous fish, like sharks.", answer: true, fact: "Along with sharks, rays have skeletons made of cartilage rather than bone." },
  ],
  DUG: [
    { question: "Dugongs are closely related to elephants rather than to whales or dolphins.", answer: true, fact: "Dugongs and manatees share an ancestor with elephants, not with cetaceans." },
    { question: "Dugongs primarily eat fish.", answer: false, fact: "They're herbivores, grazing almost exclusively on seagrass." },
    { question: "Dugongs are sometimes called 'sea cows'.", answer: true, fact: "The nickname reflects their grazing habit and gentle, slow-moving nature." },
    { question: "Dugongs can live for several decades in the wild.", answer: true, fact: "They can live 70 years or more, with slow reproduction contributing to their vulnerability." },
    { question: "A single Dugong typically gives birth to several calves at once.", answer: false, fact: "They almost always give birth to a single calf after a long pregnancy, contributing to slow population recovery." },
    { question: "Dugong populations are found across a wide range of Indo-Pacific coastal waters.", answer: true, fact: "Their range spans from East Africa through South/Southeast Asia to northern Australia." },
  ],
  OTR: [
    { question: "Sea Otters have the densest fur of any animal.", answer: true, fact: "They lack blubber, so extremely dense fur (up to a million hairs per square inch) is their main insulation." },
    { question: "Sea Otters often use rocks as tools to crack open shellfish.", answer: true, fact: "This is one of the best-documented examples of tool use among marine mammals." },
    { question: "Sea Otters are the largest members of the weasel family.", answer: true, fact: "Despite being small compared to seals, they're the largest mustelids." },
    { question: "Sea Otters help kelp forests thrive by controlling sea urchin populations.", answer: true, fact: "Without otters, unchecked urchin grazing can decimate kelp forests, a phenomenon well documented along the Pacific coast." },
    { question: "Sea Otters are found throughout all of the world's oceans.", answer: false, fact: "Their range is limited mainly to the North Pacific, from California through Alaska to Russia and Japan." },
    { question: "Sea Otters sometimes hold paws while floating together to avoid drifting apart.", answer: true, fact: "This 'rafting' behavior, sometimes with hand-holding, helps keep groups together while resting." },
  ],
  SSL: [
    { question: "Steller Sea Lions are the largest species in the sea lion family.", answer: true, fact: "Adult males can weigh over 1,000kg, much larger than California sea lions." },
    { question: "Steller Sea Lion populations have been fully stable with no historical declines.", answer: false, fact: "Western populations saw a dramatic, still not fully explained decline in the late 20th century." },
    { question: "Steller Sea Lions are named after a naturalist who first described them.", answer: true, fact: "They're named after Georg Wilhelm Steller, an 18th-century naturalist." },
    { question: "Steller Sea Lions are found on both sides of the North Pacific Ocean.", answer: true, fact: "Their range spans from California north through Alaska and across to Russia and Japan." },
    { question: "Male Steller Sea Lions are typically smaller than females.", answer: false, fact: "Males are considerably larger than females, a trait called sexual dimorphism, common among sea lions." },
    { question: "Steller Sea Lions primarily eat kelp and other marine plants.", answer: false, fact: "They're carnivorous, feeding mainly on fish and cephalopods like squid and octopus." },
  ],
  HSL: [
    { question: "Harbor Seals can sleep underwater.", answer: true, fact: "They can rest with most of their body submerged, surfacing periodically to breathe." },
    { question: "Harbor Seals are highly migratory, traveling across entire oceans each year.", answer: false, fact: "They tend to be fairly coastal and non-migratory compared to many other marine mammals." },
    { question: "Harbor Seals are considered a species of Least Concern overall.", answer: true, fact: "While some local populations face pressure, the species as a whole isn't currently threatened." },
    { question: "Harbor Seal pups can swim within hours of being born.", answer: true, fact: "Harbor seal pups are notably precocious swimmers compared to many other mammals." },
    { question: "Harbor Seals are one of the most widely distributed seal species in the world.", answer: true, fact: "They're found across coastal waters of the Northern Hemisphere, from North America to Europe and Asia." },
    { question: "Harbor Seals primarily communicate using complex, whale-like songs.", answer: false, fact: "Their vocalizations are comparatively simple; complex, long songs are much more associated with species like humpback whales." },
  ],
  BLW: [
    { question: "The Blue Whale is the largest animal known to have ever lived.", answer: true, fact: "Larger than the biggest known dinosaurs, reaching up to around 30 meters long." },
    { question: "Blue Whales primarily eat large fish and squid.", answer: false, fact: "Despite their size, they feed almost exclusively on tiny shrimp-like krill." },
    { question: "Blue Whale populations were severely reduced by 20th-century commercial whaling.", answer: true, fact: "Some estimates suggest over 99% of the pre-whaling population was wiped out before protections began." },
    { question: "A Blue Whale's heart can weigh as much as a small car.", answer: true, fact: "Estimates put a blue whale heart at several hundred kilograms — among the largest organs of any animal." },
    { question: "Blue Whales are found only in the Southern Hemisphere.", answer: false, fact: "They're found in oceans worldwide, though some regional populations are better studied than others." },
    { question: "Blue Whale calves can gain enormous amounts of weight very quickly while nursing.", answer: true, fact: "Calves can gain roughly 90kg per day during the nursing period, fueled by extremely fat-rich milk." },
  ],
  HPW: [
    { question: "Humpback Whales are known for their complex, long songs.", answer: true, fact: "Males produce elaborate songs that can last over 20 minutes and evolve over years." },
    { question: "Humpback Whales are currently classified as Critically Endangered worldwide.", answer: false, fact: "Most populations have recovered significantly and the species overall is Least Concern, though some subpopulations remain more vulnerable." },
    { question: "Humpback Whales are known for spectacular full-body breaches out of the water.", answer: true, fact: "Breaching is one of their most recognizable behaviors, though its exact purpose is debated." },
    { question: "Humpback Whales undertake some of the longest migrations of any mammal.", answer: true, fact: "Some populations travel thousands of kilometers between feeding and breeding grounds each year." },
    { question: "Humpback Whales use a hunting technique called 'bubble-net feeding'.", answer: true, fact: "Groups blow rings of bubbles to corral schools of fish before lunging through them." },
    { question: "All Humpback Whale populations sing the exact same song.", answer: false, fact: "Songs vary by population/region and change over time within a population, evolving like a slow-moving trend." },
  ],
  NAW: [
    { question: "The North Atlantic Right Whale is one of the most endangered large whale species.", answer: true, fact: "Fewer than a few hundred individuals are estimated to remain." },
    { question: "Right Whales got their name because early whalers considered them the 'right' whale to hunt.", answer: true, fact: "They were slow, floated when killed, and yielded lots of oil and baleen — making them a preferred target." },
    { question: "Vessel strikes and fishing gear entanglement are among the leading threats to North Atlantic Right Whales.", answer: true, fact: "These two human-caused factors are the primary drivers of ongoing mortality in the species." },
    { question: "North Atlantic Right Whales have rough skin patches called callosities that are unique to each individual.", answer: true, fact: "Researchers use callosity patterns to identify individual whales, similar to a fingerprint." },
    { question: "North Atlantic Right Whale calving rates have been steadily strong and increasing in recent years.", answer: false, fact: "Calving rates have been a concern, with population growth slower than needed for recovery in many recent years." },
    { question: "North Atlantic Right Whales are baleen whales, filter-feeding on tiny zooplankton.", answer: true, fact: "They feed by skimming through dense patches of copepods and other zooplankton." },
  ],
  VAQ: [
    { question: "The Vaquita is the smallest species of cetacean (whale, dolphin, or porpoise).", answer: true, fact: "Adults typically reach only around 1.5 meters in length." },
    { question: "The Vaquita is found across most of the world's oceans.", answer: false, fact: "It has an extremely restricted range, found only in the northern Gulf of California, Mexico." },
    { question: "Bycatch in illegal gillnets is the primary threat driving the Vaquita toward extinction.", answer: true, fact: "Entanglement in nets set for other species (like totoaba) is the main cause of Vaquita deaths." },
    { question: "The Vaquita was only formally described by scientists in the 1950s.", answer: true, fact: "It's one of the more recently described cetacean species, first scientifically described in 1958." },
    { question: "Vaquita numbers are estimated in the thousands and considered stable.", answer: false, fact: "Population estimates have dropped to only a small handful of individuals, making it critically close to extinction." },
    { question: "Vaquitas are known for distinctive dark patches around their eyes and mouth.", answer: true, fact: "These dark markings around the eyes and mouth are a distinguishing feature of the species." },
  ],
  ORC: [
    { question: "Orcas are technically the largest member of the dolphin family.", answer: true, fact: "Despite being called 'killer whales,' they're classified as the largest species of oceanic dolphin." },
    { question: "Orcas live in social groups called pods, often led by an older female.", answer: true, fact: "Pods are typically matriarchal, with knowledge passed down through generations." },
    { question: "All Orca populations worldwide eat exactly the same diet.", answer: false, fact: "Different populations specialize heavily — some eat mainly fish, others marine mammals — and rarely mix diets." },
    { question: "Orcas have been observed teaching hunting techniques to their young.", answer: true, fact: "This kind of cultural transmission of hunting strategy is well documented in several orca populations." },
    { question: "Orcas are found only in cold polar waters.", answer: false, fact: "They have one of the widest distributions of any marine mammal, found from polar waters to the tropics." },
    { question: "Adult Orcas have essentially no natural predators.", answer: true, fact: "As apex predators, healthy adult orcas have no significant natural predators in the wild." },
  ],
  GPO: [
    { question: "The Giant Pacific Octopus is the largest octopus species in the world.", answer: true, fact: "Some individuals have been recorded with arm spans exceeding 4 meters." },
    { question: "Octopuses have three hearts.", answer: true, fact: "Two pump blood to the gills, and one pumps it to the rest of the body." },
    { question: "The Giant Pacific Octopus typically lives for several decades.", answer: false, fact: "Most octopus species, including this one, have surprisingly short lifespans — often only 3-5 years." },
    { question: "Octopuses can change both the color and texture of their skin almost instantly.", answer: true, fact: "Specialized skin cells called chromatophores and papillae allow rapid changes in color and texture for camouflage." },
    { question: "The Giant Pacific Octopus has blue blood.", answer: true, fact: "Like other cephalopods, its blood uses copper-based hemocyanin instead of iron-based hemoglobin, giving it a blue tint." },
    { question: "Female Giant Pacific Octopuses typically survive and reproduce many times over their lifetime.", answer: false, fact: "Most octopus species, including this one, reproduce only once, and the female typically dies shortly after her eggs hatch." },
  ],
  NAU: [
    { question: "The Chambered Nautilus has remained largely unchanged for hundreds of millions of years.", answer: true, fact: "Nautiloids are often called 'living fossils' due to their ancient, slowly-evolving lineage." },
    { question: "The Chambered Nautilus can control its buoyancy using gas-filled shell chambers.", answer: true, fact: "It regulates gas and fluid in its shell chambers to move up and down in the water column." },
    { question: "The Chambered Nautilus has excellent eyesight, similar to an octopus.", answer: false, fact: "Its eyes lack a lens and form fairly blurry images, relying more on smell to navigate and find food." },
    { question: "The Chambered Nautilus has dozens of tentacles, unlike an octopus's eight arms.", answer: true, fact: "Nautiluses can have up to 90 tentacle-like appendages, quite different from the eight arms of octopuses." },
    { question: "The Chambered Nautilus is closely related to squids and octopuses.", answer: true, fact: "It's a cephalopod like squid and octopuses, though from an older, more primitive lineage." },
    { question: "The Chambered Nautilus reproduces quickly, laying thousands of eggs at once.", answer: false, fact: "It reproduces slowly, laying very few eggs which take many months to hatch — a factor in its vulnerability to overharvesting." },
  ],
  GCL: [
    { question: "The Giant Clam is the largest living bivalve mollusk.", answer: true, fact: "It can weigh over 200kg and live for many decades." },
    { question: "Giant Clams get much of their energy from algae living inside their tissue.", answer: true, fact: "Like corals, they host photosynthetic algae (zooxanthellae) that supply them with nutrients." },
    { question: "Giant Clams are able to snap shut instantly and are known to trap divers.", answer: false, fact: "This is a persistent myth — they close quite slowly and pose no real trapping danger to divers." },
    { question: "Giant Clams are permanently fixed in one spot once they mature.", answer: true, fact: "After settling as larvae, adults cement themselves in place and don't relocate." },
    { question: "Giant Clams have simple light-sensing organs along their mantle.", answer: true, fact: "They can detect light and shadow changes, closing slightly in response to a passing shadow." },
    { question: "Giant Clams are found in cold, deep ocean waters far from sunlight.", answer: false, fact: "They rely on sunlight for their symbiotic algae, so they live in shallow, sunlit tropical reef waters." },
  ],
  HHW: [
    { question: "The Humphead Wrasse can change sex during its lifetime.", answer: true, fact: "Like many wrasses, individuals can transition from female to male as they mature." },
    { question: "The Humphead Wrasse is one of the largest reef fish in the world.", answer: true, fact: "It can grow to around 2 meters long, making it a reef giant." },
    { question: "The Humphead Wrasse population is thriving with no major conservation concerns.", answer: false, fact: "It's Endangered, heavily impacted by overfishing for the live reef fish trade." },
    { question: "The Humphead Wrasse can live for several decades.", answer: true, fact: "Some individuals are estimated to live 30 years or more, which slows population recovery from overfishing." },
    { question: "Humphead Wrasse feed on toxic prey that many other reef fish avoid, like crown-of-thorns starfish.", answer: true, fact: "This makes them ecologically important for controlling coral-damaging starfish outbreaks." },
    { question: "The Humphead Wrasse is a small, drab-colored fish rarely noticed by divers.", answer: false, fact: "It's a large, brightly colored, easily recognized reef fish, popular among divers precisely because it stands out." },
  ],
  STC: [
    { question: "Staghorn Coral gets its name from its branching, antler-like shape.", answer: true, fact: "Its fast-growing branches resemble deer antlers." },
    { question: "Staghorn Coral is one of the fastest-growing coral species in the Caribbean.", answer: true, fact: "It can grow several centimeters per year, historically making it a dominant reef-builder." },
    { question: "Staghorn Coral populations have remained stable over the last few decades.", answer: false, fact: "Populations have collapsed by over 90% in parts of its range due to disease, bleaching, and other stressors." },
    { question: "Staghorn Coral can reproduce both by spawning and by broken fragments reattaching and growing.", answer: true, fact: "Broken fragments can reattach and grow into new colonies, in addition to synchronized sexual spawning events." },
    { question: "Staghorn Coral is highly resistant to disease and bleaching compared to most coral species.", answer: false, fact: "It's actually particularly susceptible to disease outbreaks and bleaching, contributing to its steep declines." },
    { question: "Staghorn Coral is native to the Caribbean and western Atlantic.", answer: true, fact: "It's historically been one of the dominant reef-building corals in that region." },
  ],
  EEL: [
    { question: "European Eels migrate thousands of kilometers to spawn in the Sargasso Sea.", answer: true, fact: "Adults leave European rivers and swim across the Atlantic to spawn, then die." },
    { question: "European Eel populations have declined dramatically in recent decades.", answer: true, fact: "Recruitment of young eels has dropped by an estimated 90%+ since the 1980s." },
    { question: "European Eels spend their entire life cycle exclusively in freshwater.", answer: false, fact: "They're catadromous — living mostly in fresh/brackish water but migrating to the ocean to spawn." },
    { question: "European Eel larvae can drift on ocean currents for months to years before reaching European coasts.", answer: true, fact: "Larvae (leptocephali) can take up to roughly three years drifting across the Atlantic before metamorphosing." },
    { question: "European Eels can survive brief periods out of water.", answer: true, fact: "They can tolerate brief periods on land or in damp conditions, aided by cutaneous (skin) respiration." },
    { question: "European Eels breed readily in captivity, which has eliminated concerns about wild population declines.", answer: false, fact: "Eels are notoriously difficult to breed in captivity, and conservation still depends heavily on wild population health." },
  ],
};

export const GENERIC_TRIVIA: TriviaQuestion[] = [
  { question: "The ocean covers more than 70% of Earth's surface.", answer: true, fact: "Yet an estimated 90%+ of ocean species remain undiscovered or undescribed." },
  { question: "Overfishing and bycatch are among the leading threats to many marine species.", answer: true, fact: "Unintentional capture of non-target species is a major driver of population decline for many groups." },
  { question: "Coral reefs cover less than 1% of the ocean floor but support a huge share of marine biodiversity.", answer: true, fact: "Reefs are estimated to support roughly a quarter of all known marine species despite their small footprint." },
  { question: "Plastic pollution has no measurable impact on marine wildlife.", answer: false, fact: "Plastic ingestion and entanglement affect a wide range of marine species, from turtles to whales to seabirds." },
  { question: "The IUCN Red List is a real, widely used system for tracking species' extinction risk.", answer: true, fact: "It's maintained by the International Union for Conservation of Nature and is the most widely referenced global conservation status list." },
  { question: "Marine protected areas can help threatened species recover over time.", answer: true, fact: "Well-enforced protected areas have shown measurable recovery effects for various fish and invertebrate populations." },
  { question: "Bioluminescence — light produced by living organisms — is common among deep-sea creatures.", answer: true, fact: "A large share of deep-sea species are estimated to produce their own light for hunting, camouflage, or communication." },
  { question: "A whale carcass sinking to the seafloor ('whale fall') can support a unique ecosystem for decades.", answer: true, fact: "Whale falls create long-lived deep-sea habitats, hosting specialized scavengers found almost nowhere else." },
  { question: "Migratory marine species like turtles and whales stay within a single country's waters their whole lives.", answer: false, fact: "Many species migrate across international waters and multiple countries' territories, which is why international cooperation matters for their protection." },
  { question: "Ocean acidification, driven partly by rising CO2 levels, can harm shell- and skeleton-building marine life.", answer: true, fact: "Increased ocean acidity makes it harder for organisms like corals, clams, and some plankton to build calcium carbonate structures." },
];

export function getTriviaForSpecies(symbol: string): TriviaQuestion[] {
  return SPECIES_TRIVIA[symbol] ?? GENERIC_TRIVIA;
}
