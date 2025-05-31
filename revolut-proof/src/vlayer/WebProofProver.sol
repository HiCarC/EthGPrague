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
        bool hasMoreThan40EUR = eurBalance >= (MINIMUM_BALANCE_EUROS * 100); // Convert to cents

        return (proof(), hasMoreThan40EUR, eurBalance, userAccount);
    }

    function parseEurBalance(Web memory web) private view returns (uint256) {
        // Based on your JSON structure, try the first few pockets
        // Your EUR pocket is at index 0 with balance 5000

        // Try pocket 0 (most likely where EUR is)
        if (isEurPocketAtIndex(web, 0)) {
            return getBalanceAtIndex(web, 0);
        }

        // Try pocket 1 as backup
        if (isEurPocketAtIndex(web, 1)) {
            return getBalanceAtIndex(web, 1);
        }

        // Try pocket 2 as backup
        if (isEurPocketAtIndex(web, 2)) {
            return getBalanceAtIndex(web, 2);
        }

        return 0; // No EUR balance found
    }

    function isEurPocketAtIndex(
        Web memory web,
        uint256 index
    ) private view returns (bool) {
        string memory indexStr = uintToString(index);

        string memory currencyPath = string(
            abi.encodePacked("pockets[", indexStr, "].currency")
        );
        string memory statePath = string(
            abi.encodePacked("pockets[", indexStr, "].state")
        );
        string memory typePath = string(
            abi.encodePacked("pockets[", indexStr, "].type")
        );

        // Try to get the values - if any fail, this isn't the right pocket
        string memory currency = web.jsonGetString(currencyPath);
        string memory state = web.jsonGetString(statePath);
        string memory pocketType = web.jsonGetString(typePath);

        // Check if this is an active EUR current pocket
        return (keccak256(bytes(currency)) == keccak256(bytes("EUR")) &&
            keccak256(bytes(state)) == keccak256(bytes("ACTIVE")) &&
            keccak256(bytes(pocketType)) == keccak256(bytes("CURRENT")));
    }

    function getBalanceAtIndex(
        Web memory web,
        uint256 index
    ) private view returns (uint256) {
        string memory indexStr = uintToString(index);
        string memory balancePath = string(
            abi.encodePacked("pockets[", indexStr, "].balance")
        );

        int256 balanceInt = web.jsonGetInt(balancePath);
        if (balanceInt > 0) {
            return uint256(balanceInt);
        }
        return 0;
    }

    function uintToString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";

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
