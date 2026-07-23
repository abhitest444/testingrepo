export type UserCredentials = {
  username: string;
  password: string;
};

export const users = {
  standard: {
    username: process.env.STANDARD_USER ?? 'standard_user',
    password: process.env.STANDARD_PASSWORD ?? 'secret_sauce',
  },
  locked: {
    username: process.env.LOCKED_USER ?? 'locked_out_user',
    password: process.env.LOCKED_PASSWORD ?? 'secret_sauce',
  },
  problem: {
    username: 'problem_user',
    password: 'secret_sauce',
  },
} as const satisfies Record<string, UserCredentials>;
