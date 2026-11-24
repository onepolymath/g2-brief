import { createApiServer, createDraftEngine } from "./http.ts";
import { SessionStore } from "./sessions.ts";

const host = process.env.BRIEF_HOST ?? "127.0.0.1";
const port = Number(process.env.BRIEF_PORT ?? 8787);
const publicUrl = process.env.BRIEF_PUBLIC_URL ?? `http://${host}:${port}`;

const store = new SessionStore(process.env.TELEGRAM_BOT_TOKEN);
const drafts = createDraftEngine(process.env);
const server = createApiServer({ store, drafts, publicUrl });

server.listen(port, host, () => {
  console.log(`Brief API listening on ${publicUrl}`);
  console.log(`Companion: ${publicUrl}/companion`);
});
