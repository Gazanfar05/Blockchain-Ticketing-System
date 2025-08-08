// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket is ERC721URIStorage, Ownable {
    uint256 public ticketPrice = 0.01 ether;
    uint256 public totalSupply;
    uint256 public maxSupply;

    constructor(uint256 _maxSupply) ERC721("EventTicket", "ETKT") Ownable(msg.sender) {
        maxSupply = _maxSupply;
    }

    function mintTicket(string memory _tokenURI) public payable {
        require(totalSupply < maxSupply, "All tickets sold!");
        require(msg.value >= ticketPrice, "Not enough ETH!");

        uint256 tokenId = totalSupply + 1;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        totalSupply++;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}