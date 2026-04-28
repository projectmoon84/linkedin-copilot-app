# UX and product design knowledge base

This document gives the LinkedIn Copilot app a working knowledge of UX and product design principles. It covers how to think about users, how to structure interfaces, how to write good copy, and how to evaluate design decisions — grounded in established principles from cognitive psychology and design practice.

---

## The core principle: human first, technology second

Every design decision should start with the person using the interface, not the feature, the technology, or the business goal. Before suggesting any UI change, new feature, or flow, the right questions are:

- Who is this person, and what are they feeling when they reach this screen?
- What is their goal — not the business goal, but what do *they* want to accomplish and move on with?
- What is their context? (Mobile on the go, desktop at work, first-time user, daily power user, distracted, focused, stressed, curious?)

If these questions aren't answered, pause and ask before proceeding. Never assume.

---

## Understanding the user: the three questions

### 1. Who is the person?
- What emotional state are they in? (Stressed, curious, rushed, bored, anxious, excited, confused, determined)
- Are they a first-time visitor or a returning power user?
- Are they on mobile or desktop? Distracted or focused?
- Are they technical or non-technical?

### 2. What is the problem space?
- What currently exists? What works well? What causes frustration?
- What conventions do users already know from similar tools?
- How do other products — even in different industries — solve the same underlying problem?

### 3. What are the constraints?
- Device types and screen sizes in use
- Existing design system or brand guidelines
- Content that exists vs. content that needs to be created
- Technical limitations that affect what's possible

---

## Cognitive load: how much thinking are we asking of users?

The brain can hold roughly four chunks of information in working memory at once. Every element on screen competes for that limited capacity. Good design minimises unnecessary cognitive load.

**Key techniques:**

- **Progressive disclosure** — show only what's needed for the current step; reveal complexity gradually
- **Sensible defaults** — pre-select the most common option so users don't have to decide unnecessarily
- **Chunking** — group related items in sets of three to five
- **Recognition over recall** — show options rather than making users remember them
- **Consistency** — the same action should always look and behave the same way across the product

---

## Visual hierarchy: designing for how people actually scan

Users scan screens in about three seconds. They don't read linearly. Design for the scan, not the read.

- The most important element comes first; supporting context second; actions third
- Size, weight, contrast, and whitespace create hierarchy — not decoration
- One dominant element per view; if everything is emphasised, nothing is
- Left-aligned content receives significantly more attention than right-aligned

**Scanning patterns:**
- **F-pattern** — for text-heavy pages: key information should appear in the first two words of each line
- **Z-pattern** — for visual pages: the eye moves top-left → top-right → bottom-left → bottom-right
- **Above the fold** — approximately 80% of viewing time happens before the user scrolls

---

## Feedback loops: every action needs a response

Silence is the enemy of good UX. When users take an action, they need confirmation that something happened.

- **Immediate (under 100ms)** — button press, toggle state, checkbox tick
- **Progress (over one second)** — skeleton screens or progress bars (skeleton screens are almost always better than spinners — they show structure, not just a waiting state)
- **Completion** — success messages with a clear next step
- **Error** — what went wrong, why it went wrong, and exactly what to do next — and always preserve the user's work

---

## Decision architecture: how choices are presented changes what people choose

- **Default bias** — most users accept defaults; make the default the best option for most people
- **Anchoring** — the first option shown sets expectations for everything that follows
- **Choice paralysis** — beyond five to seven options, decision quality drops sharply
- **Commitment escalation** — small agreements lead to larger ones (ask for email before asking for credit card details)
- **Loss aversion** — "Don't lose your progress" consistently outperforms "Save your progress"

---

## Emotional design

First impressions form in approximately three seconds and shape how users interpret everything that follows.

- Reduce anxiety around irreversible actions with confirmation steps and the ability to undo
- Celebrate success moments, but never in a way that slows the user down
- Match tone to emotional state: calm and clear for errors, encouraging for progress, warm for onboarding
- Avoid designing interactions that feel dismissive, condescending, or blame-shifting

---

## Key UX laws (applied)

**Hick's law** — fewer choices lead to faster decisions. When in doubt, reduce options.

**Fitts's law** — important touch targets should be large and close to where the user's cursor or thumb naturally sits.

**Jakob's law** — users prefer interfaces that work like ones they already know. Familiar patterns reduce friction; novel patterns require justification.

**Peak-end rule** — people judge an experience by how it felt at its most intense moment and how it ended. A painful finish undermines an otherwise good experience.

**Gestalt proximity** — elements placed close together are perceived as related. Use spacing intentionally to group and separate.

---

## Information architecture and navigation

Users should always be able to answer three questions instantly:
- Where am I?
- Where can I go?
- How do I get back?

**Navigation principles:**
- Breadth over depth — seven top-level items beats three levels of nesting
- Consistent navigation placement across all screens (users rely on spatial memory)
- The current location should be visually obvious within one second on any screen

**Content hierarchy:**
- Every link and button must clearly signal what's behind it (information scent)
- Users follow information scent — vague labels cause drop-off

---

## Designing flows, not just screens

A single screen is never the whole story. Design the journey:

- **Happy path** — the ideal journey from start to finish
- **Edge cases** — what happens with zero items? One thousand items? Very long names? Missing data?
- **Error recovery** — every error needs a clear, low-friction path back to success
- **Empty states** — the first thing new users often see; make them useful and actionable, not just "no data found"
- **Loading states** — skeleton screens (show structure) consistently outperform spinners (show nothing)

---

## Content design and microcopy

Words are part of the interface. Every label, message, and instruction is a design decision with a direct impact on usability.

### Button labels
- Use verbs that describe the outcome: "Save changes" not "Submit"
- Be specific: "Delete account" not "Continue"
- Primary action label should match the title of the dialogue it lives in
- Destructive actions should name what's being destroyed: "Delete 3 files"

### Error messages
Every error message must answer three questions:
1. What happened? ("Your payment was declined")
2. Why? ("The card number doesn't match our records")
3. What now? ("Please check the number or try a different card")

Never: "An error occurred" / "Invalid input" / "Something went wrong"

### Empty states
Empty states are an opportunity, not a dead end:
- Explain what will appear here and why it's currently empty
- Provide the direct action to fill it ("Create your first post")
- Show an example or illustration of what it looks like when populated
- For search with no results: suggest corrections or show popular alternatives

### Confirmation dialogues
- Title: the action being confirmed ("Delete this post?")
- Body: the consequence ("This permanently removes the post and all its data")
- Primary action: matches the title verb ("Delete post")
- Safe exit: positive framing ("Keep post" is better than "Cancel")
- For critical, irreversible actions: require the user to type a name or phrase to confirm

### Tone guide
| Situation | Tone |
|-----------|------|
| Errors | Calm, helpful, never blame the user |
| Success | Warm, brief, point to the next step |
| Onboarding | Encouraging, not condescending |
| Destructive actions | Serious, clear about consequences |
| Loading / waiting | Reassuring, show progress |

---

## Accessibility: not a separate checklist

Accessibility is UX for everyone. It's not an add-on — it's fundamental to how every interface should work.

- **Touch targets** — minimum 44×44px, ideally 48px
- **Colour contrast** — 4.5:1 ratio for body text, 3:1 for large text (WCAG AA standard)
- **Keyboard navigation** — every interactive element must be reachable via keyboard Tab
- **Colour independence** — never use colour alone to convey meaning (always pair with a label, icon, or pattern)
- **Focus indicators** — visible focus ring on all interactive elements
- **Form labels** — every input needs a visible, associated label
- **Error identification** — errors must be marked by more than just a colour change

---

## Motion and animation

Motion is a communication tool, not decoration. Every animation should answer at least one of these questions:

- Where did this come from? (origin animation)
- What changed? (state transition)
- Did my action work? (feedback)
- What should I look at? (attention direction)

**Timing guide:**
- Micro-interactions: 100–150ms (feels instant)
- Tooltips and popovers: 150–200ms
- Panels and expands: 200–300ms
- Page transitions: 300–500ms
- Closing is always faster than opening
- Never use linear easing for anything except progress bars

---

## UX quality checklist

Before presenting any design decision or recommendation, check:

- [ ] Can a new user understand what to do within five seconds?
- [ ] Is the most important action visually dominant?
- [ ] Are interactive elements obviously interactive?
- [ ] Does every action have visible feedback?
- [ ] Are error states helpful, specific, and recoverable?
- [ ] Does the flow work with keyboard only?
- [ ] Do loading states use skeletons rather than spinners?
- [ ] Is the empty state useful, not just "no data found"?
- [ ] Does the flow handle edge cases (zero, one, many, missing data)?
- [ ] Is all microcopy clear, specific, and actionable?
- [ ] Does it work well on mobile — not just fit, but actually feel good?

---

## How to audit an existing interface

Use this format for structured feedback:

**UX audit: [what's being reviewed]**

**Score: [X/10]** — [one-sentence summary]

**Critical** (blocks users or causes errors):
- [Finding with specific location and recommended fix]

**Important** (creates friction or confusion):
- [Finding with specific location and recommended fix]

**Polish** (would improve the experience):
- [Finding with specific location and recommended fix]

**What's working well:**
- [Always include at least one genuine positive finding]

---

## When to push back on a design request

If a user or stakeholder asks for something that would harm the experience, say so clearly and offer an alternative:

"That works technically, but it adds friction at a critical moment. Here's an alternative that achieves the same goal with less cognitive load."

"I'd question this because [specific UX reason]. What if we tried [alternative] instead?"

Good UX work means advocating for the person on the other side of the screen — not just executing requests.

---

## Validating design decisions

After making a recommendation, suggest how to test it cheaply:

- **Five-second test** — show the screen for five seconds, ask what they remember
- **Task completion** — give someone a goal, watch whether they can achieve it without help
- **Think-aloud** — watch someone use it while narrating their thoughts
- **A/B test** — when two approaches are genuinely equal, test both and let data decide

The riskiest assumption is always worth naming: "The biggest risk here is [X] — here's the cheapest way to validate it before building."
