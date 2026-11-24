# Demo walkthrough

These frames were composed with the same `PageSpec` helpers the Even G2 app uses
(`apps/glass/src/screens.ts`). They approximate the official 576×288 monochrome
green canvas so the submission can be reviewed without Even G2 hardware.

Official simulator path (when `evenhub-simulator` is installed):

```bash
npm run dev:api
npm run dev:glass
# in a third terminal, with a display
npx evenhub-simulator http://localhost:5173
```

Then open http://127.0.0.1:8787/companion, enter the code shown on the glasses,
and tap through: briefing → thread → draft → send.

## Frames

| File | What it shows |
| --- | --- |
| `frames/01-pair.png` | Pairing code on the glasses |
| `frames/02-brief.png` | Unread briefing, Ada selected |
| `frames/03-brief-next.png` | Swipe to the next highlight |
| `frames/04-thread.png` | Last messages in the Ada thread |
| `frames/05-draft.png` | First AI / heuristic draft, ready to send |
| `frames/06-draft-alt.png` | Alternative draft after a swipe |
| `frames/07-listen.png` | Voice capture for a short command or instruction |
| `frames/08-sent.png` | Confirmation after an approved send |
| `brief-walkthrough.mp4` | The same frames as a short silent video |
