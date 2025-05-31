// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {WebProofProver} from "./WebProofProver.sol";
import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";
import {ERC721} from "@openzeppelin-contracts-5.0.1/token/ERC721/ERC721.sol";

contract WebProofVerifier is Verifier, ERC721 {
    address public prover;

    mapping(address => uint256) public userBalanceProof; // Store proven balance
    mapping(uint256 => uint256) public tokenIdToBalance;

    event BalanceProven(
        address indexed user,
        uint256 balance,
        bool hasLessThanMaximum
    );

    constructor(address _prover) ERC721("WiseBalanceNFT", "WBNFT") {
        prover = _prover;
    }

    function verify(
        Proof calldata,
        bool hasLessThanMaximum,
        uint256 balance,
        address userAccount
    ) public onlyVerified(prover, WebProofProver.main.selector) {
        require(
            hasLessThanMaximum,
            "User doesn't have less than 100 EUR balance"
        );

        uint256 tokenId = uint256(
            keccak256(abi.encodePacked(userAccount, balance))
        );
        require(
            _ownerOf(tokenId) == address(0),
            "User has already proven balance"
        );

        // Store the proven balance
        userBalanceProof[userAccount] = balance;
        tokenIdToBalance[tokenId] = balance;

        _safeMint(userAccount, tokenId);

        emit BalanceProven(userAccount, balance, hasLessThanMaximum);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        uint256 balance = tokenIdToBalance[tokenId];

        // Convert balance from cents to euros for display
        uint256 euros = balance / 100;
        uint256 cents = balance % 100;

        return
            string.concat(
                '{"name":"Wise Balance Proof","description":"Proven balance of ',
                _toString(euros),
                ".",
                cents < 10 ? "0" : "",
                _toString(cents),
                ' EUR (less than 100 EUR)","attributes":[{"trait_type":"Balance EUR","value":"',
                _toString(euros),
                ".",
                cents < 10 ? "0" : "",
                _toString(cents),
                '"}]}'
            );
    }

    function hasProvenBalance(address user) public view returns (bool) {
        return userBalanceProof[user] > 0;
    }

    function getProvenBalance(address user) public view returns (uint256) {
        return userBalanceProof[user];
    }

    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
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

    function _base64encode(
        bytes memory data
    ) internal pure returns (string memory) {
        // Simple base64 encoding - you might want to use a library for this
        // This is a placeholder implementation
        return "placeholder"; // Implement actual base64 encoding
    }
}
