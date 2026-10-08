declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

declare module 'fs' {
  export const promises: {
    readFile(path: string, encoding: string): Promise<string>;
  };
}

declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: string): string;
}

declare module 'node:path' {
  export function join(...paths: string[]): string;
}

declare const __dirname: string;

declare module '@appfabric/survey-libs';
declare module 'web-shell-core/widgets/HOCWidget';
declare module '*.png';
declare module '*.svg';
declare module '*.gif';
declare module '@appfabric/plugin-utils/lib/plugin/sandbox';
declare module '@cgds/lottie';
declare module '@core-app/variability-sync-sdk';
