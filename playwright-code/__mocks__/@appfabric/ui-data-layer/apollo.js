/* eslint-disable */

class MockApolloClient {
  query = () => Promise.resolve();
}

const getApolloClient = (sandbox, config) =>
  new MockApolloClient(sandbox, config);

export default getApolloClient;
export { getApolloClient };
