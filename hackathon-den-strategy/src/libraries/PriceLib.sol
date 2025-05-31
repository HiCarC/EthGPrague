// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library PriceLib {
    using Math for uint;

    // WAD adjusted result
    function convertToValue(uint amount, uint price, uint8 decimals) internal pure returns (uint) {
        return amount * price / 10 ** decimals;
    }

    function convertToAmount(uint amountInUsd, uint collPrice, uint8 collDecimals, Math.Rounding rounding) internal pure returns (uint) {
        if (collPrice == 0 || amountInUsd == 0) {
            return 0;
        }

        return amountInUsd.mulDiv(10 ** collDecimals, collPrice, rounding);
    }

    // Coll decimal adjust amount result
    function convertAssetsToCollAmount(uint assets, uint collPrice, uint nectPrice, uint8 vaultDecimals, uint8 collDecimals, Math.Rounding rounding) internal pure returns (uint) {
        uint assetsUsdValue = assets.mulDiv(nectPrice, 10 ** vaultDecimals, rounding);

        if (collPrice != 0) {
            return convertToAmount(assetsUsdValue, collPrice, collDecimals, rounding);
        } else {
            return 0;
        }
    }

    function convertCollAmountToAssets(uint collAmount, uint collPrice, uint nectPrice, uint8 vaultDecimals, uint8 collDecimals) internal pure returns (uint) {
        uint collUsdValue = collAmount * collPrice / 10 ** collDecimals;
        
        if (nectPrice != 0) {
            return collUsdValue * 10 ** vaultDecimals / nectPrice;
        } else {
            return 0;
        }
    }
}