# Draft DoraHacks BUIDL text

Do not submit this until Yusuf has reviewed it, made the GitHub repository public (or opened a public fork), and completed DoraHacks registration. This file is a draft only.

## Title

Brief — Telegram in one glance

## Tagline

See what matters in Telegram, then send a short reply with one tap on Even G2.

## Track

Messaging & News

Also intended for the Best Telegram integration special prize.

## Short description

Brief is an Even G2 app for the thirty seconds between “I felt the notification” and “I should get my phone out.” It shows a tight unread briefing from Telegram, opens the thread you care about, and drafts a short reply you can send, skip, or rewrite by voice.

The glasses talk only to a small Brief API. Keys stay on the server. The default walkthrough uses a realistic demo inbox so judges can run everything without a Telegram login. A live Telegram Bot API path is included and documented.

On the glasses:

- A pairing code, completed from a phone companion page (Google sign-in is not used; it does not work in the Even WebView).
- A glanceable briefing: a few unread highlights, one selected.
- The last messages in that chat.
- Two or three short drafts. Tap to send, swipe for another wording, or say “tell them I’m running late.”
- Double-tap the home briefing to exit through the system confirmation dialog.

## Links

- Repository: _(private until Yusuf publishes it)_
- Demo video: `demo/brief-walkthrough.mp4` (up to the 3-minute limit; the generated walkthrough is short and silent)
- Screenshots: `demo/frames/`
- Companion / API (local): `http://127.0.0.1:8787/companion`
- Glasses dev server: `http://localhost:5173`

## How it maps to judging

1. **Usefulness on G2 (30%).** The product is a single everyday moment: inbox in about 30 seconds, then a reply, hands-free on a 576×288 canvas. It is not a dashboard.
2. **Read and write (25%).** Reading is a tap into a thread. Writing is an approved draft, an alternative wording on swipe, or a short spoken instruction. There is no long dictation.
3. **Technical execution (20%).** Official Even Hub SDK 0.0.16, three text containers plus a contextual menu, pairing with a claim step, a CORS-correct backend, tests, and CI.
4. **UX for display and voice (15%).** Header / body / footer, dim footers, short lines, official menu verbs, long-press or menu to listen, 16 kHz PCM as the SDK provides it.
5. **Business potential and safety (10%).** A clear habit for Telegram users who already wear G2. Messages are never sent without an explicit approve. No trading. No keys in the client.

## Feature requests for Even Realities (optional)

1. A first-party Telegram account scope, so a glasses app can read chats the user already sees in Telegram without running a custom bot.
2. On-device or Even-hosted short-form speech-to-text, so apps do not have to ship their own PCM pipeline for three-word commands.
3. A documented pairing-code component in the SDK, since Google sign-in cannot run in the WebView.

## Build notes for judges

```bash
npm install
npm test
npm run dev:api
npm run dev:glass
# optional: npx evenhub-simulator http://localhost:5173
```

See the README for the full walkthrough.
