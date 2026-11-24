import { BriefApi } from "./api.ts";
import { BriefApp } from "./app.ts";
import { EvenHubHost } from "./sdkHost.ts";

const apiBase = import.meta.env.VITE_BRIEF_API ?? "http://127.0.0.1:8787";

const host = await EvenHubHost.connect();
const api = new BriefApi(apiBase);
const app = new BriefApp(host, api, apiBase);

await app.start();
