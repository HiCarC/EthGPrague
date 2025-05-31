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

const webProofConfig: WebProofConfig<Abi, string> = {
  proverCallCommitment: {
    address: "0x0000000000000000000000000000000000000000",
    proverAbi: [],
    functionName: "proveWeb",
    commitmentArgs: [],
    chainId: 1,
  },
  logoUrl: "/revolut-logo.png", // You'll need to add Revolut logo
  steps: [
    startPage("https://app.revolut.com/", "Go to Revolut app"),
    expectUrl("https://app.revolut.com/home", "Log in to your Revolut account"),
    notarize(
      "https://app.revolut.com/api/retail/user/current/wallet",
      "GET",
      "Generate Proof of Revolut balance",
      [
        {
          request: {
            headers_except: [
              "Authorization", 
              "Cookie", 
              "X-CSRF-Token",
              "X-Client-Transaction-Id",
              "X-Transaction-Id"
            ],
          },
          response: {
            headers_except: [
              "Set-Cookie", 
              "X-Frame-Options",
              "Strict-Transport-Security",
              "Transfer-Encoding",
              "Connection",
              "Date",
              "Server"
            ],
            json_body_except: []
          },
        },
      ],
    ),
  ],
};

export const useRevolutBalanceProof = () => {
  const [error, setError] = useState<Error | null>(null);

  const {
    requestWebProof,
    webProof,
    isPending: isWebProofPending,
    error: webProofError,
  } = useWebProof(webProofConfig);

  // Handle web proof errors without throwing immediately
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

  const [, setWebProof] = useLocalStorage("revolutWebProof", "");
  const [, setProverResult] = useLocalStorage("revolutProverResult", "");

  // Helper function to safely stringify data with BigInt values
  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  };

  useEffect(() => {
    if (webProof) {
      console.log("Revolut webProof", webProof);
      setWebProof(safeStringify(webProof));
    }
  }, [webProof]);

  useEffect(() => {
    if (result) {
      console.log("Revolut proverResult", result);
      setProverResult(safeStringify(result));
      
      // Log the extracted data for debugging
      if (result && Array.isArray(result) && result.length >= 4) {
        const [proof, hasMinBalance, balance, userAccount] = result;
        console.log("Proof verification:", {
          hasMinBalance,
          balance: balance.toString(),
          balanceInEuros: (Number(balance) / 100).toFixed(2),
          userAccount
        });
      }
    }
  }, [result]);

  // Helper function to extract balance information from result
  const getBalanceInfo = () => {
    if (result && Array.isArray(result) && result.length >= 4) {
      const [, hasMinBalance, balance, userAccount] = result;
      return {
        hasMinimumBalance: hasMinBalance,
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