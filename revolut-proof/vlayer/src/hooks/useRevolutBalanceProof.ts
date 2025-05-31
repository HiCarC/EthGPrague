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
            // redact sensitive headers but keep authentication
            headers_except: ["Authorization", "Cookie"],
          },
        },
        {
          response: {
            // Keep essential response headers
            headers_except: ["Content-Type", "Transfer-Encoding"],
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

  if (webProofError) {
    throw new WebProofError(webProofError.message);
  }

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

  if (callProverError) {
    throw callProverError;
  }

  const {
    isPending: isWaitingForProvingResult,
    data: result,
    error: waitForProvingResultError,
  } = useWaitForProvingResult(hash);

  if (waitForProvingResultError) {
    throw waitForProvingResultError;
  }

  const [, setWebProof] = useLocalStorage("revolutWebProof", "");
  const [, setProverResult] = useLocalStorage("revolutProverResult", "");

  useEffect(() => {
    if (webProof) {
      console.log("Revolut webProof", webProof);
      setWebProof(JSON.stringify(webProof));
    }
  }, [JSON.stringify(webProof)]);

  useEffect(() => {
    if (result) {
      console.log("Revolut proverResult", result);
      setProverResult(JSON.stringify(result));
      
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
  }, [JSON.stringify(result)]);

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