import { useEffect, useState } from "react";
import {
  useCallProver,
  useWaitForProvingResult,
  useWebProof,
  useChain,
} from "@vlayer/react";
import { useLocalStorage } from "usehooks-ts";
import { WebProofConfig, ProveArgs } from "@vlayer/sdk";
import { Abi, ContractFunctionName } from "viem";
import { startPage, expectUrl, notarize } from "@vlayer/sdk/web_proof";
import { UseChainError, WebProofError } from "../errors";
import webProofProver from "../../../out/WebProofProver.sol/WebProofProver";

// Configuration that matches your exact curl POST request
const webProofConfig: WebProofConfig<Abi, string> = {
  proverCallCommitment: {
    address: "0x0000000000000000000000000000000000000000",
    proverAbi: [],
    functionName: "proveWeb",
    commitmentArgs: [],
    chainId: 1,
  },
  logoUrl: "/wise-logo.png",
  steps: [
    startPage("https://wise.com/payments/account-details/new?currency=EUR", "Navigate to account details"),
    // notarize(
    //   "https://wise.com/gateway/v1/profiles/70749292/account-details",
    //   "GET",
    //   "Capture exact Wise balance POST request",
    //   [
    //   ],
    // ),
    notarize(
      "https://wise.com/gateway/v4/profiles/70749292/balances",
      "POST",
      "Capture exact Wise balance POST request",
      [
        {
          request: {
            // Redact only the most sensitive authentication
            headers_except: [
              "cookie",            // appToken, userToken, etc.
              "x-access-token",    // Tr4n5f3rw153
              "x-idempotence-uuid" // d87b7163-6310-47dd-a646-d640ae5b52e2
            ],
            // Keep the exact POST body: {"currency":"EUR","type":"STANDARD"}
            json_body_except: []
          },
          response: {
            // Keep the response data (balance information)
            headers_except: [
              "set-cookie",
              "server", 
              "date"
            ],
            json_body_except: [] // Keep all response data
          },
        },
      ],
    ),
  ],
};

console.log("webProofConfig:", webProofConfig);

export const useRevolutBalanceProof = () => {
  const [error, setError] = useState<Error | null>(null);

  const {
    requestWebProof,
    webProof,
    isPending: isWebProofPending,
    error: webProofError,
  } = useWebProof(webProofConfig);

  useEffect(() => {
    if (webProofError) {
      console.error("WebProof Error Details:", {
        message: webProofError.message,
        stack: webProofError.stack,
        name: webProofError.name,
        cause: webProofError.cause,
      });
      setError(new WebProofError(`TLSN Connection Failed: ${webProofError.message}`));
    }
  }, [webProofError]);

  const { chain, error: chainError } = useChain(
    import.meta.env.VITE_CHAIN_NAME,
  );
  
  useEffect(() => {
    if (chainError) {
      setError(new UseChainError(chainError));
    }
  }, [chainError]);

  const vlayerProverConfig: Omit<
    ProveArgs<Abi, ContractFunctionName<Abi>>,
    "args"
  > = {
    address: import.meta.env.VITE_PROVER_ADDRESS as `0x${string}`,
    proverAbi: webProofProver.abi,
    chainId: chain?.id,
    functionName: "main",
    gasLimit: Number(import.meta.env.VITE_GAS_LIMIT),
  };

  const {
    callProver,
    isPending: isCallProverPending,
    isIdle: isCallProverIdle,
    data: hash,
    error: callProverError,
  } = useCallProver(vlayerProverConfig);

  useEffect(() => {
    if (callProverError) {
      console.error("Call Prover Error:", callProverError);
      setError(callProverError);
    }
  }, [callProverError]);

  const {
    isPending: isWaitingForProvingResult,
    data: result,
    error: waitForProvingResultError,
  } = useWaitForProvingResult(hash);

  useEffect(() => {
    if (waitForProvingResultError) {
      console.error("Wait For Proving Result Error:", waitForProvingResultError);
      setError(waitForProvingResultError);
    }
  }, [waitForProvingResultError]);

  const [, setWebProof] = useLocalStorage("wiseWebProof", "");
  const [, setProverResult] = useLocalStorage("wiseProverResult", "");

  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  };

  useEffect(() => {
    if (webProof) {
      console.log("Wise webProof", webProof);
      setWebProof(safeStringify(webProof));
    }
  }, [webProof]);

  useEffect(() => {
    if (result) {
      console.log("Wise proverResult", result);
      setProverResult(safeStringify(result));
      
      if (result && Array.isArray(result) && result.length >= 4) {
        const [proof, hasLessThanMaximum, balance, userAccount] = result;
        console.log("Proof verification:", {
          hasLessThanMaximum,
          balance: balance.toString(),
          balanceInEuros: (Number(balance) / 100).toFixed(2),
          userAccount
        });
      }
    }
  }, [result]);

  const getBalanceInfo = () => {
    if (result && Array.isArray(result) && result.length >= 4) {
      const [, hasLessThanMaximum, balance, userAccount] = result;
      return {
        hasLessThanMaximum: hasLessThanMaximum,
        balanceInCents: Number(balance),
        balanceInEuros: (Number(balance) / 100).toFixed(2),
        userAccount
      };
    }
    return null;
  };

  return {
    requestWebProof,
    webProof,
    isPending:
      isWebProofPending || isCallProverPending || isWaitingForProvingResult,
    isCallProverIdle,
    isWaitingForProvingResult,
    isWebProofPending,
    callProver,
    result,
    balanceInfo: getBalanceInfo(),
    error,
  };
}; 


// curl 'https://wise.com/gateway/v4/profiles/70749292/balances' \
//   -H 'accept: application/json, text/plain, */*' \
//   -H 'accept-language: en-GB' \
//   -H 'content-type: application/json' \
//   -b 'appToken=dad99d7d8e52c2c8aaf9fda788d8acdc; gid=aeefb1d1-716a-4353-801d-6a5a59e0a09b; gid=aeefb1d1-716a-4353-801d-6a5a59e0a09b; signupToken=b4bede8f-9fc6-4dcf-b36f-857ef3b8882e; selected-profile-id-89058057=70749292; tw-ref-user=Your%20friend; localeData=fr; __cf_bm=87vVs4n5FTGM6gky4lv81yEQ20Gw2_89ud8nNOYVI8c-1748702505-1.0.1.1-lOUfNfsWw4ELKERHyogtTeIQ9nhmRn6w_Qcr0j2CbhDIPq0KBsSoQVz1P2hIUhM2Dzp2l9w.h5CsFhKCOsJnoHhH4eDMQYDx38HxNhNgDK39n7ljDf64WcAj4qxjZERk; oauthToken=afb2e0c0-3251-4a42-9d47-c399ead44005; userToken=6cd03429557a4ea7b882c2192a7b5d57' \
//   -H 'origin: https://wise.com' \
//   -H 'priority: u=1, i' \
//   -H 'referer: https://wise.com/payments/account-details/new?currency=EUR' \
//   -H 'sec-ch-ua: "Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"' \
//   -H 'sec-ch-ua-arch: "arm"' \
//   -H 'sec-ch-ua-bitness: "64"' \
//   -H 'sec-ch-ua-mobile: ?0' \
//   -H 'sec-ch-ua-model: ""' \
//   -H 'sec-ch-ua-platform: "macOS"' \
//   -H 'sec-ch-ua-platform-version: "15.4.1"' \
//   -H 'sec-fetch-dest: empty' \
//   -H 'sec-fetch-mode: cors' \
//   -H 'sec-fetch-site: same-origin' \
//   -H 'sec-gpc: 1' \
//   -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36' \
//   -H 'x-access-token: Tr4n5f3rw153' \
//   -H 'x-idempotence-uuid: d87b7163-6310-47dd-a646-d640ae5b52e2' \
//   -H 'x-visual-context: personal::light' \
//   --data-raw '{"currency":"EUR","type":"STANDARD"}'