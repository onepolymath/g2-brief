/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRIEF_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
