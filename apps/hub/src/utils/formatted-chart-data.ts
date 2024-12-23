import { type Token } from "@bera/berajs";
import {
  ValidatorStakedBgtsFragment,
  type BlockRewardStatsByValidatorFragment,
  type GetValidatorIncentivesReceivedsQuery,
} from "@bera/graphql/pol/subgraph";
import { addDays } from "date-fns";

type GroupedValidatorRewardsData = {
  [timestamp: string]: BlockRewardStatsByValidatorFragment;
};

type GroupedValidatorBgtStakedData = {
  [timestamp: string]: ValidatorStakedBgtsFragment;
};

type GroupedValidatorBgtStakedDataDelta = {
  [timestamp: string]: ValidatorStakedBgtsFragment;
};

type TokenInformation = Token & {
  tokenReceived: string;
  usdValueTokenRewarded: string;
};

type GroupedTokenRewardsUsageEntry = {
  tokens: TokenInformation[];
  timestamp: string;
  totalTokenRewardedOnTimestamp: number;
  totalUsdValueTokenRewardedOnTimestamp: number;
  allTimeUsdValueTokenRewarded: string;
};

type GroupedTokenRewardsUsageData = {
  [timestamp: string]: GroupedTokenRewardsUsageEntry;
};

export type GroupedTokenRewardsData = {
  [address: string]: {
    token: Token;
    totalTokenRewarded: number;
    totalUsdValueTokenRewarded: number;
  };
};

const generateValidatorRewardsEmptyData = (
  timestamp: string,
): BlockRewardStatsByValidatorFragment => {
  return {
    timestamp: timestamp,
    BGTEmitted: "0",
    BGTEarned: "0",
    allTimeBGTEmitted: "0",
    allTimeBGTEarned: "0",
    validator: {
      id: "",
      publicKey: "",
      amountDelegated: "0",
    },
  };
};

const generateValidatorBgtStakedEmptyData = (
  timestamp: string,
): ValidatorStakedBgtsFragment => {
  return {
    allTimeBGTStaked: "0",
    BGTStaked: "0",
    id: "",
    timestamp: timestamp,
  };
};

const generatValidatorTokenRewardsUsageEmptyData = (
  timestamp: string,
): GroupedTokenRewardsUsageEntry => {
  return {
    tokens: [],
    timestamp: timestamp,
    totalTokenRewardedOnTimestamp: 0,
    totalUsdValueTokenRewardedOnTimestamp: 0,
    allTimeUsdValueTokenRewarded: "0",
  };
};

export const formatValidatorRewardsData = (
  data: BlockRewardStatsByValidatorFragment[],
  days: number,
) => {
  const groupedData = {} as GroupedValidatorRewardsData;

  data.forEach((item) => {
    const timestamp = item.timestamp;
    const dateKey = new Date(parseInt(timestamp) / 1000)
      .toISOString()
      .split("T")[0];

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = item;
    }
  });

  // Fill in missing days with mock data
  for (let i = 0; i < days; i++) {
    const date = addDays(new Date(), -i).toISOString().split("T")[0];
    if (!groupedData[date] && i !== 0) {
      groupedData[date] = generateValidatorRewardsEmptyData(
        (addDays(new Date(), -i).valueOf() * 1000).toString(),
      );
    }
  }

  // Convert the grouped data back to an array of objects
  return Object.values(groupedData)
    .map((group) => group)
    .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
};

export const formatValidatorBgtDelegated = (
  data: ValidatorStakedBgtsFragment[],
  days: number,
) => {
  const groupedData = {} as GroupedValidatorBgtStakedData;

  let currentBgtTotal = 0;

  data.forEach((item: ValidatorStakedBgtsFragment) => {
    const timestamp = item.timestamp;
    const dateKey = new Date(parseInt(timestamp) / 1000)
      .toISOString()
      .split("T")[0];

    currentBgtTotal += Number(item.BGTStaked);
    if (!groupedData[dateKey]) {
      groupedData[dateKey] = item;
    }
  });

  // Fill in missing days with mock data
  for (let i = 0; i < days; i++) {
    const date = addDays(new Date(), -i).toISOString().split("T")[0];
    if (!groupedData[date] && i !== 0) {
      groupedData[date] = generateValidatorBgtStakedEmptyData(
        (addDays(new Date(), -i).valueOf() * 1000).toString(),
      );
    }
  }

  // Convert the grouped data back to an array of objects
  return {
    data: Object.values(groupedData)
      .map((group) => group)
      .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)),
    currentBgtTotal: currentBgtTotal,
  };
};

export const formatValidatorTokenRewardsUsage = (
  data: GetValidatorIncentivesReceivedsQuery | undefined,
  days: number,
) => {
  if (!data)
    return {
      incentives: [],
      groupedTokens: {},
    };

  const groupedData = {} as GroupedTokenRewardsUsageData;
  const groupedTokens = {} as GroupedTokenRewardsData;

  data.validatorIncentivesReceiveds.forEach((item) => {
    const timestamp = item.timestamp;
    const dateKey = new Date(parseInt(timestamp) / 1000)
      .toISOString()
      .split("T")[0];

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = {
        tokens: [],
        timestamp: timestamp,
        totalTokenRewardedOnTimestamp: 0,
        totalUsdValueTokenRewardedOnTimestamp: 0,
        // @ts-expect-error
        allTimeUsdValueTokenRewarded: item.allTimeUsdValueTokenRewarded,
      };
    }

    const address = item?.token?.address;
    if (!groupedTokens[address]) {
      groupedTokens[address] = {
        token: item.token as Token,
        totalTokenRewarded: Number(item.tokenReceived),
        // @ts-expect-error
        totalUsdValueTokenRewarded: Number(item.usdValueTokenRewarded ?? "0"),
      };
    } else {
      groupedTokens[address].totalTokenRewarded += Number(item.tokenReceived);
      groupedTokens[address].totalUsdValueTokenRewarded += Number(
        // @ts-expect-error
        item.usdValueTokenRewarded ?? "0",
      );
    }
    groupedData[dateKey].tokens.push({
      ...item.token,
      address: item.token.address as `0x${string}`,
      tokenReceived: item.tokenReceived,
      // @ts-expect-error
      usdValueTokenRewarded: item.usdValueTokenRewarded ?? "0",
    });

    groupedData[dateKey].totalTokenRewardedOnTimestamp += parseFloat(
      item.tokenReceived,
    );
    groupedData[dateKey].totalUsdValueTokenRewardedOnTimestamp += parseFloat(
      // @ts-expect-error
      item.usdValueTokenRewarded ?? "0",
    );
  });

  for (let i = 0; i < days; i++) {
    const date = addDays(new Date(), -i).toISOString().split("T")[0];
    // if the current day is not in the grouped data, prevent mocking data for current day
    if (!groupedData[date] && i !== 0) {
      groupedData[date] = generatValidatorTokenRewardsUsageEmptyData(
        (addDays(new Date(), -i).valueOf() * 1000).toString(),
      );
    }
  }

  // Convert the grouped data back to an array of objects
  return {
    incentives: Object.values(groupedData)
      .map((group) => ({
        ...group,
        totalTokenRewardedOnTimestamp: group.totalTokenRewardedOnTimestamp,
        totalUsdValueTokenRewardedOnTimestamp:
          group.totalUsdValueTokenRewardedOnTimestamp,
      }))
      .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)),
    groupedTokens,
  };
};

export const formatValidatorBgtDelegatedDelta = (
  data: ValidatorStakedBgtsFragment[],
  days: number,
) => {
  const groupedData = {} as GroupedValidatorBgtStakedDataDelta;

  let delegationIn = 0;
  let delegationOut = 0;

  data.forEach((item: ValidatorStakedBgtsFragment) => {
    const timestamp = item.timestamp;
    const dateKey = new Date(parseInt(timestamp) / 1000)
      .toISOString()
      .split("T")[0];

    if (Number(item.BGTStaked) > 0) {
      delegationIn += Number(item.BGTStaked);
    } else {
      delegationOut += Number(item.BGTStaked);
    }
    if (!groupedData[dateKey]) {
      groupedData[dateKey] = item;
    }
  });

  // Fill in missing days with mock data
  for (let i = 0; i < days; i++) {
    const date = addDays(new Date(), -i).toISOString().split("T")[0];
    if (!groupedData[date] && i !== 0) {
      groupedData[date] = generateValidatorBgtStakedEmptyData(
        (addDays(new Date(), -i).valueOf() * 1000).toString(),
      );
    }
  }

  // Convert the grouped data back to an array of objects
  return {
    data: Object.values(groupedData)
      .map((group) => group)
      .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)),
    netDelegation: delegationIn + delegationOut,
    delegationIn: delegationIn,
    delegationOut: delegationOut,
  };
};
