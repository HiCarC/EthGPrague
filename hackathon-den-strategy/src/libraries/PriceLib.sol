// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library PriceLib {
    using Math for uint256;

    // WAD adjusted result
    function convertToValue(uint256 amount, uint256 price, uint8 decimals) internal pure returns (uint256) {
        return amount * price / 10 ** decimals;
    }

    function convertToAmount(uint256 amountInUsd, uint256 collPrice, uint8 collDecimals, Math.Rounding rounding)
        internal
        pure
        returns (uint256)
    {
        if (collPrice == 0 || amountInUsd == 0) {
            return 0;
        }

        return amountInUsd.mulDiv(10 ** collDecimals, collPrice, rounding);
    }

    // Coll decimal adjust amount result
    function convertAssetsToCollAmount(
        uint256 assets,
        uint256 collPrice,
        uint256 nectPrice,
        uint8 vaultDecimals,
        uint8 collDecimals,
        Math.Rounding rounding
    ) internal pure returns (uint256) {
        uint256 assetsUsdValue = assets.mulDiv(nectPrice, 10 ** vaultDecimals, rounding);

        if (collPrice != 0) {
            return convertToAmount(assetsUsdValue, collPrice, collDecimals, rounding);
        } else {
            return 0;
        }
    }

    function convertCollAmountToAssets(
        uint256 collAmount,
        uint256 collPrice,
        uint256 nectPrice,
        uint8 vaultDecimals,
        uint8 collDecimals
    ) internal pure returns (uint256) {
        uint256 collUsdValue = collAmount * collPrice / 10 ** collDecimals;

        if (nectPrice != 0) {
            return collUsdValue * 10 ** vaultDecimals / nectPrice;
        } else {
            return 0;
        }
    }
}
