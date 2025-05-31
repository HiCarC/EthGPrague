import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useRevolutBalanceProof } from "../../../hooks/useRevolutBalanceProof";
import { ProveStepPresentational } from "./Presentational";
import { useAccount } from "wagmi";

export const ProveStep = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [disabled, setDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const {
    requestWebProof,
    webProof,
    callProver,
    isPending,
    isCallProverIdle,
    result,
    balanceInfo,
    error,
  } = useRevolutBalanceProof();

  useEffect(() => {
    if (webProof && isCallProverIdle) {
      void callProver([webProof, address]);
    }
  }, [webProof, address, callProver, isCallProverIdle]);

  useEffect(() => {
    if (result) {
      // Check if balance verification was successful (MORE than 40 EUR)
      if (balanceInfo?.hasMinimumBalance) {
        console.log(`✅ Balance verified: ${balanceInfo.balanceInEuros}€ (more than 40€)`);
        void navigate("/mint");
      } else {
        console.log(`❌ Balance too low: ${balanceInfo?.balanceInEuros || '0'}€ (should be more than 40€)`);
        setErrorMessage(`Balance too low: ${balanceInfo?.balanceInEuros || '0'}€. Need more than 40€ to qualify.`);
      }
    }
  }, [result, balanceInfo, navigate]);

  useEffect(() => {
    modalRef.current?.showModal();
  }, []);

  // Handle errors gracefully instead of throwing
  useEffect(() => {
    if (error) {
      console.error("ProveStep Error:", error);
      
      // Set user-friendly error messages
      if (error.message.includes("TLSN")) {
        setErrorMessage(
          "Connection to Wise failed. This may be due to:\n" +
          "• Wise blocking automated connections\n" +
          "• Network security restrictions\n" +
          "• VPN/proxy interference\n\n" +
          "Please try again or contact support."
        );
      } else {
        setErrorMessage(`Error: ${error.message}`);
      }
      
      setDisabled(false); // Re-enable the button for retry
    }
  }, [error]);

  return (
    <ProveStepPresentational
      requestWebProof={requestWebProof}
      isPending={isPending}
      disabled={disabled}
      setDisabled={setDisabled}
      errorMessage={errorMessage}
      onRetry={() => {
        setErrorMessage(null);
        setDisabled(false);
      }}
    />
  );
};
