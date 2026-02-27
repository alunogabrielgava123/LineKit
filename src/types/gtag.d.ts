export {};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: any[]) => void;
    __gaLoaded?: boolean;
  }
}
