/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_DESCRIPTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Temporary type fixes for build
declare var React: any;