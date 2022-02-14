// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

interface IERC1155 {
    /**
     * @notice Transfers amount amount of an _id from the _from address to the _to address specified
     * @param _from    Source address
     * @param _to      Target address
     * @param _id      ID of the token type
     * @param _amount  Transfered amount
     * @param _data    Additional data with no specified format, sent in call to `_to`
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) external;
}

contract MultiSend1155 is Initializable, AccessControlUpgradeable {
    function initialize() public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function airdrop(
        address _erc1155,
        uint256 _tokenId,
        address[] calldata _users
    ) external {
        uint length = _users.length;
        for (uint i=0; i<length; i++) {
            IERC1155(_erc1155).safeTransferFrom(msg.sender, _users[i], _tokenId, 1, "");
        }
    }
}
