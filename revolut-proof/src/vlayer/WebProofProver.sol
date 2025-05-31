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

        // Parse the wallet response to get EUR balance from pockets
        uint256 eurBalance = parseEurBalance(web);
        bool hasMinimumBalance = eurBalance >= (MINIMUM_BALANCE_EUROS * 100); // Convert to cents/centimes

        return (proof(), hasMinimumBalance, eurBalance, userAccount);
    }

    function parseEurBalance(Web memory web) private view returns (uint256) {
        // Try to find EUR balance in the pockets array
        // Structure: {"pockets": [{"currency": "EUR", "type": "CURRENT", "balance": 5000}]}

        // Try multiple pocket indices to find the EUR CURRENT account
        for (uint256 i = 0; i < 10; i++) {
            try this.tryGetPocketBalance(web, i) returns (uint256 balance) {
                if (balance > 0) return balance;
            } catch {}
        }

        // If all methods fail, return 0 (which will trigger the original error)
        return 0;
    }

    function tryGetPocketBalance(
        Web memory web,
        uint256 pocketIndex
    ) external view returns (uint256) {
        // Convert index to string for JSON path
        string memory indexStr = uintToString(pocketIndex);

        // Build JSON paths using bracket notation for arrays
        string memory currencyPath = string(
            abi.encodePacked("pockets[", indexStr, "].currency")
        );
        string memory typePath = string(
            abi.encodePacked("pockets[", indexStr, "].type")
        );
        string memory statePath = string(
            abi.encodePacked("pockets[", indexStr, "].state")
        );
        string memory balancePath = string(
            abi.encodePacked("pockets[", indexStr, "].balance")
        );

        // Check if this pocket is EUR CURRENT and ACTIVE
        string memory currency = web.jsonGetString(currencyPath);
        string memory pocketType = web.jsonGetString(typePath);
        string memory state = web.jsonGetString(statePath);

        // Check if this is the EUR current account
        if (
            keccak256(bytes(currency)) == keccak256(bytes("EUR")) &&
            keccak256(bytes(pocketType)) == keccak256(bytes("CURRENT")) &&
            keccak256(bytes(state)) == keccak256(bytes("ACTIVE"))
        ) {
            // Get balance as integer (should be in cents already)
            int256 balanceInt = web.jsonGetInt(balancePath);
            if (balanceInt > 0) {
                return uint256(balanceInt);
            }
        }

        revert("EUR pocket not found at this index");
    }

    function uintToString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
