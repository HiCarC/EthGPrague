import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useRevolutBalanceProof } from "../../../hooks/useRevolutBalanceProof";
import { ProveStepPresentational } from "./Presentational";
import { useAccount } from "wagmi";

export const ProveStep = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [disabled, setDisabled] = useState(false);
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
      // Check if balance verification was successful
      if (balanceInfo?.hasMinimumBalance) {
        console.log(`✅ Balance verified: ${balanceInfo.balanceInEuros}€`);
        void navigate("/mint");
      } else {
        console.log(`❌ Insufficient balance: ${balanceInfo?.balanceInEuros || '0'}€ (minimum 40€ required)`);
        // You could show an error message or redirect to a different page
        alert(`Insufficient balance: ${balanceInfo?.balanceInEuros || '0'}€. Minimum 40€ required.`);
      }
    }
  }, [result, balanceInfo, navigate]);

  useEffect(() => {
    modalRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return (
    <ProveStepPresentational
      requestWebProof={requestWebProof}
      isPending={isPending}
      disabled={disabled}
      setDisabled={setDisabled}
    />
  );
};
