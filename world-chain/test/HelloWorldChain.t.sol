// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/HelloWorldChain.sol";

contract HelloWorldChainTest is Test {
    HelloWorldChain helloWorldChain;

    function setUp() public {
        helloWorldChain = new HelloWorldChain();
    }

    function testInitialWord() public view {
        string memory expected = "Hello World Chain!";
        string memory actual = helloWorldChain.getWord();
        assertEq(actual, expected);
    }

    function testSetWord() public {
        string memory newWord = "Hello Foundry!";
        helloWorldChain.setWord(newWord);
        string memory actual = helloWorldChain.getWord();
        assertEq(actual, newWord);
    }
}
