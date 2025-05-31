// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {IDenManager} from "src/interfaces/core/IDenManager.sol";
import {ISortedDens} from "src/interfaces/core/ISortedDens.sol";
import {IInfraredCollateralVault} from "src/interfaces/core/vaults/IInfraredCollateralVault.sol";
import {IBorrowerOperations} from "src/interfaces/core/IBorrowerOperations.sol";

import {MultiCollateralHintHelpers} from "src/core/helpers/MultiCollateralHintHelpers.sol";
import {MultiDenGetter} from "src/core/helpers/MultiDenGetter.sol";
import {DenManagerGetters} from "src/core/helpers/DenManagerGetters.sol";

contract TestSetup is Test {
    IDenManager wberaDenManager;
    ISortedDens wberaSortedDens;
    IInfraredCollateralVault wberaCollateralVault;
    IBorrowerOperations borrowerOperations;

    MultiCollateralHintHelpers multiCollateralHintHelpers;
    MultiDenGetter multiDenGetter;
    DenManagerGetters denManagerGetters;

    //For any permissioned behaviour after forking contracts
    //Fee receiver and owner are the same address
    address owner = vm.envAddress("OWNER");

    function setUp() public virtual {
        vm.startBroadcast();
        string memory RPC_URL = vm.envString("RPC_URL");
        console2.log("Forking from: %s", RPC_URL);

        wberaDenManager = IDenManager(vm.envAddress("DEN_MANAGER_WBERA"));
        wberaSortedDens = ISortedDens(vm.envAddress("SORTED_DENS_WBERA"));
        wberaCollateralVault = IInfraredCollateralVault(vm.envAddress("COLL_VAULT_WBERA"));

        borrowerOperations = IBorrowerOperations(vm.envAddress("BORROWER_OPERATIONS"));

        multiCollateralHintHelpers = MultiCollateralHintHelpers(vm.envAddress("MULTI_COLLATERAL_HINT_HELPERS"));
        multiDenGetter = MultiDenGetter(vm.envAddress("MULTI_DEN_GETTER"));
        denManagerGetters = DenManagerGetters(vm.envAddress("DEN_MANAGER_GETTERS"));
    }
}
