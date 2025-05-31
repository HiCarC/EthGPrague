// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library FeeLib {
    using Math for uint256;

    uint256 private constant BP = 1e4;

    /// @dev Calculates the fees that should be added to an amount `shares` that does already include fees.
    /// Used in {IERC4626-deposit}, {IERC4626-mint}, {IERC4626-withdraw} and {IERC4626-previewRedeem} operations.
    function feeOnRaw(uint256 shares, uint256 feeBP) internal pure returns (uint256) {
        return shares.mulDiv(feeBP, BP, Math.Rounding.Ceil);
    }

    /// @dev Calculates the fee part of an amount `shares` that deoes not includes fees.
    /// Used in {IERC4626-previewDeposit} and {IERC4626-previewRedeem} operations.
    function feeOnTotal(uint256 shares, uint256 feeBP) internal pure returns (uint256) {
        return shares.mulDiv(feeBP, feeBP + BP, Math.Rounding.Ceil);
    }
}
