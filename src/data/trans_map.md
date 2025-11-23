Translation Map – Dream Interpretation App
This document maps each translation key in trans.json to its source files and UI sections.
It is used only for documentation and developer clarity.
The actual translations are stored in trans.json.
#1. Chat Page (Main Dream Chat)
Related React files:
DreamChat.jsx
EditableUserBubble.jsx
TagsInput.jsx
TagsList.jsx
TagPill.jsx
Keys:
chat.welcome
chat.system.interpreting
chat.system.interpretingUpdated
chat.system.error.couldNotInterpret
chat.system.error.generic
chat.input.placeholder.loading
chat.input.placeholder.default
chat.nav.diary
chat.nav.interpretation
chat.nav.profile
chat.editDream.placeholder
chat.editDream.sendAgain
tags.input.placeholder
#2. Terms Gate (Terms of Use Consent Screen)
Related file:
TermGate.jsx
Keys:
terms.title
terms.intro
terms.points.experientialOnly
terms.points.localStorageOnly
terms.points.noGuarantee
terms.points.userResponsibility
terms.consentNote
terms.buttons.accept
terms.buttons.decline
#3. No-Consent Page (User Declined Terms)
Related file:
NoConsentPage.jsx
Keys:
noConsent.title
noConsent.intro
noConsent.readMore
noConsent.links.psychological
noConsent.links.spiritual
noConsent.links.experiential
noConsent.links.symbolic
noConsent.backToTerms
##4. Category Selection Step (User selects approach + method)
Related file:
CategoryStep.jsx
Keys:
categoryStep.chooseCategory
categoryStep.chooseMethod
##5. High-Level Interpretation Categories (Metadata)
Related file:
Categories.js
Keys:
categoryMeta.spiritual.label
categoryMeta.spiritual.description
categoryMeta.psychological.label
categoryMeta.psychological.description
categoryMeta.scientific.label
categoryMeta.scientific.description
categoryMeta.experiential.label
categoryMeta.experiential.description
##6. Interpretation Categories + Short Descriptions
Related file:
interpretationCategories.js
6.1 Psychological Category
interpretationCategories.psychological.label
interpretationCategories.psychological.shortDescription
interpretationCategories.psychological.methods.freud.label
interpretationCategories.psychological.methods.freud.description
interpretationCategories.psychological.methods.jung.label
interpretationCategories.psychological.methods.jung.description
interpretationCategories.psychological.methods.adler.label
interpretationCategories.psychological.methods.adler.description
interpretationCategories.psychological.methods.gestalt.label
interpretationCategories.psychological.methods.gestalt.description
interpretationCategories.psychological.methods.cbt.label
interpretationCategories.psychological.methods.cbt.description
6.2 Spiritual Category
interpretationCategories.spiritual.label
interpretationCategories.spiritual.shortDescription
interpretationCategories.spiritual.methods.kabbalah.label
interpretationCategories.spiritual.methods.kabbalah.description
interpretationCategories.spiritual.methods.intuitive.label
interpretationCategories.spiritual.methods.intuitive.description
6.3 Symbolic / Archetypal Category
interpretationCategories.symbolic.label
interpretationCategories.symbolic.shortDescription
interpretationCategories.symbolic.methods.mythic.label
interpretationCategories.symbolic.methods.mythic.description
interpretationCategories.symbolic.methods.personal-symbols.label
interpretationCategories.symbolic.methods.personal-symbols.description
6.4 Experiential Category
interpretationCategories.experiential.label
interpretationCategories.experiential.shortDescription
interpretationCategories.experiential.methods.day-residue.label
interpretationCategories.experiential.methods.day-residue.description
interpretationCategories.experiential.methods.scenario-rehearsal.label
interpretationCategories.experiential.methods.scenario-rehearsal.description
##7. Full Methods (Deep Analysis Methods)
Related file:
Methods.js
These include long-form descriptions, origins, meanings arrays, usage notes, and AI prompt hints.
7.1 Spiritual Methods
All keys beginning with:
methods.kabbalistic.*
methods.sufi_islamic.*
methods.hindu_yogic.*
methods.tibetan_dream_yoga.*
methods.shamanic.*
methods.native_american.*
methods.christian_mystical.*
methods.shinto_japanese.*
methods.feng_shui_chinese.*
methods.classical_oneiromancy.*
7.2 Psychological Methods
All keys beginning with:
methods.freudian.*
methods.jungian.*
methods.cognitive_scientific.*
methods.existential.*
methods.attachment_based.*
7.3 Scientific Methods
All keys beginning with:
methods.neuroscience_memory.*
methods.evolutionary.*
methods.predictive_hypothesis.*
7.4 Experiential & Embodied Methods
All keys beginning with:
methods.daily_residue.*
methods.embodied_experience.*
#8. Notes for Developers
trans.json contains the actual source-language text (English).
This mapping file is not used by the app — it is documentation only.
When adding new UI text:
Add a new key/value in trans.json.
Add a new entry in this mapping file under the correct section.
The key should follow the existing naming convention: section.subsection.element
