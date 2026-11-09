/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** API origin override for builds; empty string = same-origin (dev proxy). */
  readonly PUBLIC_API_ORIGIN?: string;
  /** Public repository URL shown in the UI footer / about page. */
  readonly PUBLIC_GITHUB_URL?: string;
  /** Set to 'true' to allow non-FinUties API hosts (self-hosted mirrors). */
  readonly PUBLIC_ALLOW_NON_FINUTIES_API?: string;
  readonly PUBLIC_ENABLE_LOCAL_PYTHON_ADAPTER?: string;
  readonly PUBLIC_LOCAL_PYTHON_ADAPTER_ORIGIN?: string;
  readonly PUBLIC_LOCAL_PYTHON_ADAPTER_TIMEOUT_MS?: string;
  readonly PUBLIC_LOCAL_PYTHON_MAX_SERIES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
