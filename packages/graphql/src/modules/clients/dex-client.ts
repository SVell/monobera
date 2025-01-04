import { ApolloClient, InMemoryCache } from "@apollo/client";
import { balancerApiUrl, balancerSubgraphUrl } from "@bera/config";

// import { subgraphUrl } from "@bera/config";

export const bexSubgraphClient = new ApolloClient({
  ssrMode: true,
  uri: balancerSubgraphUrl,
  cache: new InMemoryCache(),
});

export const bexApiGraphqlClient = new ApolloClient({
  uri: balancerApiUrl,
  cache: new InMemoryCache(),
});
