// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloUser {

    string public user;

    // Set user name
    function setUser(string memory _user) public {
        user = _user;
    }

    // Returns "Hello <user>"
    function sayHello() public view returns (string memory) {
        return string(abi.encodePacked("Hello ", user));
    }

    // Returns "u are <random age> age"
    function randomAge() public view returns (string memory) {
        uint age = uint(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % 100; // age between 0–99

        return string(
            abi.encodePacked(
                "u are ",
                uintToString(age),
                " age"
            )
        );
    }

    // Helper: uint to string
    function uintToString(uint v) internal pure returns (string memory) {
        if (v == 0) {
            return "0";
        }

        uint digits;
        uint temp = v;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }

        return string(buffer);
    }
}
