// eslint-disable-next-line import/prefer-default-export, import/no-mutable-exports
export let sandbox = null;
export const getSandbox = jest.fn(() => sandbox);
export const setSandbox = jest.fn((newSandbox) => {
  sandbox = newSandbox;
});
