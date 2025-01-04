import { bgtClient } from "@bera/graphql";
import {
  GetAllValidatorBlockCount,
  GetAllValidatorBlockCountQueryVariables,
  type GetAllValidatorBlockCountQuery,
} from "@bera/graphql/pol/subgraph";

import { type BeraConfig } from "~/types";
const DAYS = 24 * 60 * 60 * 1000;

export const getValidatorAllBlockStats = async ({
  config,
  timestamp = (Math.floor(Date.now() / DAYS) - 1) * DAYS,
}: {
  config: BeraConfig;
  timestamp?: number;
}): Promise<GetAllValidatorBlockCountQuery | undefined> => {
  try {
    if (!config.subgraphs?.polSubgraph) {
      throw new Error("pol subgraph uri is not found in config");
    }

    const result = await bgtClient.query<
      GetAllValidatorBlockCountQuery,
      GetAllValidatorBlockCountQueryVariables
    >({
      query: GetAllValidatorBlockCount,
      variables: {
        timestamp: (timestamp * 1000).toString(),
      },
    });

    return {
      ...result.data,
      blockStatsByValidators: result.data.blockStatsByValidators.toSorted(
        (a, b) => {
          return Number(b.blockCount) - Number(a.blockCount);
        },
      ),
    };
  } catch (e) {
    console.error("getValidatorAllBlockStats:", e);
    throw e;
  }
};
