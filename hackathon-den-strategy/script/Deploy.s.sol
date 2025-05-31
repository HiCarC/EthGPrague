// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ScriptSetup} from "script/ScriptSetup.s.sol";

contract Deploy is ScriptSetup {
    function setUp() public virtual override {
        super.setUp();
        // insert any additional setup code here
        vm.stopBroadcast();
    }

    function run() public virtual override {
        vm.startBroadcast();
        // insert deployment code here
        // e.g., deploy a contract, initialize it, etc.
    }
}
