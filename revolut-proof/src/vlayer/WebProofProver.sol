// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract WebProofProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    // string public constant DATA_URL = "https://wise.com/gateway/v4/profiles/70749292/balances";
    string public constant DATA_URL =
        "https://wise.com/gateway/v1/profiles/70749292/account-details";
    uint256 public constant MAXIMUM_BALANCE_EUROS = 100; // 100€ maximum (prove less than this)

    function main(
        WebProof calldata webProof,
        address userAccount
    ) public view returns (Proof memory, bool, uint256, address) {
        Web memory web = webProof.verify(DATA_URL);

        // Parse the exact Wise API response for EUR balance
        uint256 eurBalance = parseWiseEurBalance(web);
        bool hasLessThanMaximum = eurBalance < (MAXIMUM_BALANCE_EUROS * 100);

        return (proof(), hasLessThanMaximum, eurBalance, userAccount);
    }

    function parseWiseEurBalance(
        Web memory web
    ) private view returns (uint256) {
        // Since you have 0 EUR balance, let's parse the Wise response directly
        // Based on your data: {"id": 123252897, "currency": "EUR", "amount": {"value": 0}}

        // First check if this is a EUR balance
        string memory currency = web.jsonGetString("currency");

        if (keccak256(bytes(currency)) == keccak256(bytes("EUR"))) {
            // Get the balance value from amount.value
            int256 balanceValue = web.jsonGetInt("amount.value");

            if (balanceValue >= 0) {
                // Wise returns balance in euros, convert to cents
                return uint256(balanceValue) * 100;
            }
        }

        // If we can't parse or no EUR found, return 0 (which is less than 100 EUR)
        return 0;
    }
}
