// Node.js global declarations
declare const process: {
  env: {
    SOLINK_API_URL?: string;
    WALLET_PRIVATE_KEY?: string;
    [key: string]: string | undefined;
  };
};

declare function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
declare const URL: typeof globalThis.URL;
