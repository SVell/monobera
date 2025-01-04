import { BERA_CHEF_ABI, BERA_VAULT_REWARDS_ABI } from "@bera/berajs";
import { Card } from "@bera/ui/card";
import { serialize } from "wagmi";
import { useGetVerifiedAbi } from "@bera/berajs";
import { ExecutableCallSubsetFragment } from "@bera/graphql/governance";

import {
  Abi,
  AbiFunction,
  AbiParameter,
  Address,
  decodeFunctionData,
  erc20Abi,
} from "viem";

function AbiInput({
  input,
  value,
}: {
  input: AbiParameter;
  value: any;
}) {
  if (typeof value === "object") {
    return (
      <div className="m-4">
        {input.name}:
        <pre>
          {JSON.stringify(
            value,
            (_, v) => (typeof v === "bigint" ? v.toString() : v),
            2,
          )}
        </pre>
      </div>
    );
    // if (Array.isArray(value)) {
    //   return (
    //     <div className="grid grid-cols-1 gap-1 my-4 pl-4">
    //       {value.map((v, idx) => (
    //         <AbiInput key={idx} input={input} value={v} />
    //       ))}
    //     </div>
    //   );
    // }

    // if ("components" in input) {
    //   return input.components.map((component, idx) => (
    //     <AbiInput key={idx} input={component} value={value[component.name!]} />
    //   ));
    // }
  }
  return (
    <div className="m-4">
      {input.name}: {value?.toString()}
    </div>
  );
}

export const Actions = ({
  executableCalls,
}: {
  executableCalls: ExecutableCallSubsetFragment[];
}) => {
  return (
    <>
      {executableCalls.map((executableCall, index) => {
        const { data, error, isLoading } = useGetVerifiedAbi(
          executableCall.target,
        );

        const abi: Abi = [
          ...BERA_CHEF_ABI,
          ...BERA_VAULT_REWARDS_ABI,
          ...erc20Abi,
          ...(data && !error && !isLoading ? JSON.parse(data) : []),
        ];

        let content: {
          args: readonly unknown[] | undefined;
          functionName: string;
        } = { functionName: "", args: [] };

        try {
          content = decodeFunctionData({
            data: executableCall.calldata as Address,
            abi,
          });
        } catch (error) {}
        const fn = abi.find(
          (a) => a.type === "function" && a.name === content.functionName,
        ) as AbiFunction;

        return (
          <Card
            key={`${executableCall.target}-${index}`}
            className="mt-1 h-full break-words p-4 text-sm font-normal leading-normal text-muted-foreground"
          >
            {content.functionName && (
              <>
                <div className="font-medium text-foreground">Function:</div>
                <div className=" whitespace-pre-line">
                  {content.functionName}
                </div>
                <br />
                <div className="font-medium text-foreground">Params:</div>
                <div className="whitespace-pre-line">
                  {content.args?.map((arg, idx) => (
                    <AbiInput key={idx} input={fn.inputs[idx]} value={arg} />
                  ))}
                </div>
              </>
            )}
            <div className="font-medium text-foreground">Calldata:</div>
            <div className=" whitespace-pre-line">
              {executableCall.calldata}
            </div>
            <br />
            <div className="font-medium text-foreground">Target:</div>
            <div>{executableCall.target}</div>
            <br />
            <div className="font-medium text-foreground">Value in wei:</div>
            <div>{executableCall.value}</div>
          </Card>
        );
      })}
    </>
  );
};
