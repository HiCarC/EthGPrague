// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

interface IRebalancer {
    function swap(address sentCurrency, uint256 sentAmount, address receivedCurrency, bytes calldata payload)
        external;
}
