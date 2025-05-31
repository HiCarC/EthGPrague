export const MintStepPresentational = ({
  handleMint,
  isMinting,
  balanceInfo,
}: {
  handleMint: () => void;
  isMinting: boolean;
  balanceInfo: {
    hasMinimumBalance: boolean;
    balanceInEuros: string;
  } | null;
}) => {
  return (
    <>
      {balanceInfo && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Balance Verified Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your Revolut balance of <strong>{balanceInfo.balanceInEuros}€</strong> has been verified.
                  {balanceInfo.hasMinimumBalance 
                    ? " You meet the minimum requirement of 40€."
                    : " However, you don't meet the minimum requirement of 40€."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-7 flex justify-center flex-col items-center">
        <button 
          disabled={isMinting || !balanceInfo?.hasMinimumBalance} 
          id="nextButton" 
          onClick={handleMint}
          className={`${
            !balanceInfo?.hasMinimumBalance 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          {isMinting ? "Minting..." : "Mint Revolut Balance NFT"}
        </button>
        
        {balanceInfo && !balanceInfo.hasMinimumBalance && (
          <p className="text-red-600 text-sm mt-2">
            Cannot mint: minimum balance of 40€ required
          </p>
        )}
      </div>
    </>
  );
};
