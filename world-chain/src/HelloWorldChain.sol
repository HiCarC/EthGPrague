// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HelloWorldChain {
    string private word;

    // Constructor that sets the initial word to "Hello World Chain!"
    constructor() {
        word = "Hello World Chain!";
    }

    // Setter function to update the word
    function setWord(string memory newWord) public {
        word = newWord;
    }

    // Getter function to return the current word
    function getWord() public view returns (string memory) {
        return word;
    }
}
