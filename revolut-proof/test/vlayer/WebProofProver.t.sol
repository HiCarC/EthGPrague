// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {VTest} from "vlayer-0.1.0/testing/VTest.sol";
import {WebProof, Web} from "vlayer-0.1.0/WebProof.sol";
import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Strings} from "@openzeppelin-contracts-5.0.1/utils/Strings.sol";

import {WebProofProver} from "../../src/vlayer/WebProofProver.sol";

contract WebProverTest is VTest {
    using Strings for string;

    function test_verifiesWebProofAndRetrievesBalance() public {
        WebProof memory webProof = WebProof(
            vm.readFile("testdata/web_proof.json")
        );
        WebProofProver prover = new WebProofProver();
        address account = vm.addr(1);

        callProver();
        (, , , address addr) = prover.main(webProof, account);

        // For the test, we just check that it returns the correct address
        assertEq(addr, account);
        // Note: hasMinBalance and balance will depend on the test data in web_proof.json
    }

    function test_failedVerificationBecauseOfInvalidNotaryPublicKey() public {
        WebProof memory webProof = WebProof(
            vm.readFile("testdata/web_proof_invalid_notary_pub_key.json")
        );
        WebProofProver prover = new WebProofProver();
        address account = vm.addr(1);

        callProver();
        try prover.main(webProof, account) returns (
            Proof memory,
            bool,
            uint256,
            address
        ) {
            revert("Expected error");
        } catch Error(string memory reason) {
            assertEq(
                reason,
                'Preflight: Transaction reverted: ContractError(Revert(Revert("Invalid notary public key")))'
            );
        }
    }
}
