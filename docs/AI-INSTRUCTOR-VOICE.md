# AI Instructor Studio — Voice and Conversational Tutor

**Academy status (7 November 2026):** public guided lessons are available on GitHub Pages. The private optional generative AI and natural voice connectors are implemented and tested as software, but **not deployed or configured with credentials**. This does not represent an AI flight instructor of record, any approved aviation theory training or a qualified simulator.

## What works today on the public Academy

[AI Instructor Studio](../ai-instructor.html) is linked from Academy home and Cockpit V3. It offers:

- Three *teaching styles*: **Captain Sky** (friendly mentor), **Scout Guide** (Air Scouts-oriented explanations), **Theory Coach** (revision questions). These are fictional UI personas, not real certified instructors.
- Six curated introductory modules: four forces, flight instruments, yoke/joystick/rudder, flaps, weather decisions, and aviation radio concepts.
- User-selected **browser/device text-to-speech voices**, speaking speed controls, repeat, stop, and an optional microphone-to-text feature when supported.
- Multiple-choice questions with instant concept feedback and a study question tool that selects a matching **human-authored lesson excerpt**.
- No required sign-in, provider API key, payments or server uploads for this *public guided mode*. Voice quality and offline support depend on the student's device/browser. Browser speech recognition **may use a third-party speech service** and is never activated automatically; the student must deliberately tap the microphone.
- A clear label explains this is **not live generative AI**. It does not claim to answer arbitrary questions or make real-flight decisions.

The public page uses `ai-instructor-lessons.js`, `ai-instructor.js`, and `ai-instructor.css`, with browser and Node tests. It **never calls OpenAI from the browser or embeds provider credentials**.

## What is prepared privately (not yet usable by public students)

The separate Training API `services/training-api/` includes these optional authenticated, same-origin routes:

| API route | Authentication | Behaviour |
| --- | --- | --- |
| `GET /api/v1/ai/status` | Valid signed-in, verified staging account | Says whether external AI text and voice are configured, shows daily limits, never returns secrets |
| `POST /api/v1/ai/ask` | Valid account, matching CSRF token, quota | Inputs `{question,topic,style}`, sends a limited educational prompt through an operator-configured OpenAI **Responses API**, returns a clearly labelled synthetic AI answer |
| `POST /api/v1/ai/voice` | Valid account, matching CSRF token, separate quota | Inputs `{text,voice}`, sends short text to an optional server-side speech adapter and returns a bounded MP3 stream |

**By default both external connections are OFF.** Nothing is billed or transmitted unless an operator configures the external provider and enables the relevant flags.

The private portal `/portal/` includes an AI Tutor panel for a manually provisioned, email-verified fictional staging account. It **requires explicit user acknowledgment** before sending a question to an AI provider. It can read an answer using the browser's own speech engine even when remote generated speech is disabled. If enabled, the student can select a supported generated voice. No answer is saved to the Training API practice-assessment database, no conversation is automatically persisted by the Academy, and no official course-credit process uses the AI responses.

### Configuration (operator-managed secrets, not browser input)

The following are examples of configuration **keys**, not actual values:

```text
AGSA_AI_ENABLED=0
AGSA_AI_VOICE_ENABLED=0
AGSA_AI_TEXT_MODEL=gpt-6-luna
OPENAI_API_KEY=<restricted-provider-key-held-in-secret-manager>
```

To enable private test usage, an operator must first supply a valid paid API account, key, budget alert/hard limits as supported by the provider, suitable data/privacy processing conditions, and a protected staging host. Only then may the flags be changed to `1` under a controlled private deployment. The model ID is **server-configured** and not controlled by a user. Keys must not be pasted into the public HTML, GitHub repository, messages or shared screenshots.

The backend requests `store:false` in the Responses API call, limits student question text to 500 characters, applies 440 output tokens, and displays only up to 2,200 characters of the generated answer. Backend limits are **12 AI questions and 5 generated voice requests per verified staging account per UTC day**, reserved atomically in PostgreSQL. Text narration requests are capped at 700 characters; audio responses are capped at 900 KB. Provider errors are sanitised, no API credentials are returned and the HTTP API has no CORS access from GitHub Pages.

**Privacy:** Questions are transmitted to the configured external provider when the user consents and asks. Students should avoid names, student IDs, health information and private data. Exact data processing/retention terms are subject to the provider contract and deployment configuration, not a promise of local-only computation.

### Important: voice API deprecation

As of 7 November 2026, OpenAI has announced that the `gpt-4o-mini-tts` Speech API model used by this **optional transitional natural-voice adapter** is deprecated and scheduled to shut down on **6 January 2027**. The recommended future alternative is `gpt-realtime-2.1-mini` through the **Realtime API**, *not* simply replacing the model name in `/audio/speech`. See the [OpenAI text-to-speech guide](https://developers.openai.com/api/docs/guides/text-to-speech) and [Speech API reference](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create).

This adapter is deliberately disabled until configured; **do not rely on it for long-term production voice**. A follow-up engineering phase should implement reviewed realtime voice sessions, secure ephemeral access, browser permissions, spend control, interruption handling, and full-duplex speech before opening a commercial AI teaching product.

## Safety and training quality

The prompt enforces introductory theory, clear identification as AI-generated, no official assessment claims, and refusal to improvise live flight control instructions, real ATC clearances, current weather decisions, or specific aircraft operating limits. Such guardrails **reduce but do not eliminate errors**. All generated educational answers require review against authoritative aviation teaching sources and suitably qualified human instructors.

For Air Scouts or learners under 18, safeguarding, parental/student consent as appropriate, moderation, instructor supervision, data minimisation and local legal requirements must be completed before making connected AI available. In this version only the curated, non-personalised public mode is offered openly.

## Tests

- `scripts/test-ai-instructor.mjs`: correct lessons, quiz scoring, curated question matching, explicit offline/non-AI labelling.
- `scripts/test-ai-instructor-browser.mjs`: desktop and 390px touch-screen quiz, voice selection, narration and safe text rendering.
- `services/training-api/tests/ai.test.mjs`: provider flags, guardrails, secrets never in output, request/output bounds, fail-closed provider handling, voice stream caps.
- `services/training-api/tests/http.test.mjs`: private login, CSRF, rate limits, role and account isolation, model key secrecy, text and voice endpoint access.
- `services/training-api/tests/postgres.integration.test.mjs`: atomic usage quotas with separate student budgets in disposable PostgreSQL.
- `services/training-api/tests/portal.browser.mjs`: private dashboard consent, AI response, test voice playback and small-screen behaviour with **mock providers only**.

All actual OpenAI provider requests in automated tests are mocked, so **no live AI voice has been generated or billed** as part of these tests.

## Future instructor experience

A later release can add optional low-latency two-way spoken tutoring using the provider Realtime API and **instructor-reviewed** topic-specific knowledge, with separately approved curriculum versions, verified user eligibility and a clear distinction between AI guidance and human instruction. Do not misrepresent current training devices, AI teachers or assessment tools as FAA/EASA-authorised.


## Next upgrade — Two-way WebRTC AI flight-theory tutoring

The separate private staging dashboard now contains a **start/mute/end two-way voice tutor** using a microphone, an AI-generated voice and optional response transcript. The public `ai-instructor.html` stays curated and works with browser speech even when no provider account exists.

**Backend flow:**
1. A fictional, verified staging account explicitly agrees to external voice processing and presses Start. Only then does the browser request microphone permission.
2. The browser negotiates a local WebRTC offer and posts the bounded SDP plus a curated topic, teaching style and synthetic-voice choice to `POST /api/v1/ai/realtime-connect` on the authenticated **same origin**, with CSRF validation.
3. The server validates input, reserves one of **two voice sessions per UTC day** atomically in PostgreSQL, and sends a multipart SDP + server-owned session configuration to **`POST https://api.openai.com/v1/realtime/calls`** using a private API key and hashed safety identifier.
4. A generated SDP answer is returned to the browser. Microphone audio and synthetic responses travel over WebRTC, not through an Academy recording database; JSON speech status and generated output transcript events travel over the data channel. The browser does **not** receive a provider API key or reusable ephemeral provider token.
5. The learner can mute, unmute or end the conversation. A server in-memory registry limits active calls per user, ends them on logout or stop, and **attempts provider-side hangup after 120 seconds**. The browser also ends the call at the two-minute limit and releases microphone tracks when leaving the page.

The server fixes the model to `gpt-realtime-2.1-mini`, educational instructions, speaker voice allowlist and single-response output token budget. The model is a synthetic educational tool, not a qualified human instructor; it cannot verify flight proficiency or issue official grades. It may be inaccurate. Do not use during real flight, for clearances, aircraft operating limitations or go/no-go decisions.

**Activation requires explicit private operator approval:** `AGSA_AI_ENABLED=1`, `AGSA_AI_REALTIME_ENABLED=1`, `AGSA_AI_REALTIME_STAGING_APPROVED=1`, plus a valid privately managed `OPENAI_API_KEY` and an isolated HTTPS staging environment. Without these, the connect endpoint returns unavailable and the public lesson/voice alternative remains accessible. None of these keys has been configured; tests simulate the upstream provider.

**Limitations and production gates:** This is deliberately a private staging implementation, not a deployed commercial AI school or guaranteed expense ceiling. The server's call-expiry timers are process-local; a server restart or provider hangup failure can leave an external call running. Two daily reservations limit *new* attempts but cannot independently cap token usage of an already connected call. Before involving real students, add provider-enforced spend limits, durable server call tracking and expiry, media safety review, access/age verification, instructor oversight, model evaluation and approved educational content. Audio handling and retention are also subject to the provider's terms; do not claim audio is stored only locally. The application does not persist transcripts in the Academy practice database.

Official protocol references: [Realtime WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc), [Realtime Conversations](https://developers.openai.com/api/docs/guides/realtime-conversations), [Provider Hangup API](https://developers.openai.com/api/reference/resources/realtime/subresources/calls/methods/hangup).
