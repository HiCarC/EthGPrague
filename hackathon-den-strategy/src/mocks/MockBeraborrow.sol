// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockNECT is ERC20 {
    constructor() ERC20("NECT Stablecoin", "NECT") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockBorrowerOperations {
    MockNECT public nectToken;
    
    constructor(address _nect) {
        nectToken = MockNECT(_nect);
    }
    
    function openDen(uint256, uint256 _NECTAmount, address, address) external {
        nectToken.mint(msg.sender, _NECTAmount);
    }
}

contract MockLSP {
    // Mock Liquid Stability Pool
    function deposit(uint256 amount) external returns (uint256) {
        return amount; // Mock 1:1 exchange
    }
}
