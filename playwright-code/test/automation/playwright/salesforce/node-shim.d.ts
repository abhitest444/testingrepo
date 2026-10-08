declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

declare const __dirname: string;

declare module 'node:fs' {
  interface NodeFs {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: string): string;
  }
  const fs: NodeFs;
  export default fs;
}

declare module 'node:path' {
  interface NodePath {
    join(...paths: string[]): string;
  }
  const path: NodePath;
  export default path;
}
