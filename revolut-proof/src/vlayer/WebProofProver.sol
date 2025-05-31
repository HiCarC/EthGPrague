// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract WebProofProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant DATA_URL =
        "https://app.revolut.com/api/retail/user/current/wallet";
    uint256 public constant MINIMUM_BALANCE_EUROS = 40; // 40€ minimum

    function main(
        WebProof calldata webProof,
        address userAccount
    ) public view returns (Proof memory, bool, uint256, address) {
        Web memory web = webProof.verify(DATA_URL);

        // Parse the wallet response to get EUR balance
        // For now, let's use a simple approach and assume balance is in the response
        uint256 eurBalance = parseEurBalance(web);
        bool hasMinimumBalance = eurBalance >= (MINIMUM_BALANCE_EUROS * 100); // Convert to cents/centimes

        return (proof(), hasMinimumBalance, eurBalance, userAccount);
    }

    function parseEurBalance(Web memory web) private view returns (uint256) {
        // This depends on Revolut's exact API response format
        // You'll need to examine the actual response structure

        // First, try to get balance as an integer (common for APIs to use cents)
        int256 balanceInt = web.jsonGetInt("balance");
        if (balanceInt > 0) {
            return uint256(balanceInt);
        }

        // If that fails, try to get it as a string and convert
        string memory balanceStr = web.jsonGetString("balance");
        return stringToUint(balanceStr);
    }

    function stringToUint(string memory str) private pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 result = 0;

        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result;
    }
}
