// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts@4.4.1/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.4.1/access/Ownable.sol";
import "@openzeppelin/contracts@4.4.1/utils/Counters.sol";

contract CreativeFriendzClub is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    uint public constant MAX_MINT_QUANTITY = 1;
    uint public constant MAX_ADDRESS_QUANTITY = 1;

    uint128 public MINT_PRICE = 0.5 ether;
    uint256 public MAX_SUPPLY = 1000;

    bool public isRevealed = false;
    string public provenanceHash = "";    
    address[] public team;
    address[] public whitelist;
    string  private baseURI;
    string  private notRevealedUri;

    constructor(string memory _baseURI, address[] memory _team, address[] memory _whiteList) ERC721("Creative Friendz Club", "TCFC") {
        setBaseURI(_baseURI);
        team = _team;
        whitelist = _whiteList;

        uint supply = totalSupply();

        for(uint i = 0; i < team.length; i++){
            safeMint(team[i]);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: token not found");

        if(! isRevealed){
            return notRevealedUri;
        }
        return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    } 

    function mint(uint256 _quantity) public payable {
        require(whitelist[msg.sender], "Whitelist entry required");
        require(_quantity <= MAX_MINT_QUANTITY, "Quantity exceeds per-transaction limit");
        require(totalSupply().add(_quantity) <= MAX_SUPPLY, "Quantity exceeds supply");
        require(MINT_PRICE.mul(_quantity) <= msg.value, "Amount of ether sent does not match total mint amount");
        require(balanceOf(msg.sender) < MAX_ADDRESS_QUANTITY, "Address exceeds quantity limit.")

        for(i = 0; i < _quantity; i++) 
        {
           safeMint(msg.sender);
        }
        
    }   

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }
    
    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function setProvenanceHash(string memory _provenanceHash) public onlyOwner {
        provenanceHash = _provenanceHash;
    }
    
    function setMintPrice(uint128 _mintPrice) public onlyOwner {
        MINT_PRICE = _mintPrice
    }

    function toggleReveal() public  onlyOwner {
        isRevealed = !isRevealed;
    }

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Can't add a null address");
            whitelist.push(addresses[i]);
        }
    }

    function withdraw() public {
        require(team[msg.sender] != address(0), "Withdraw must be initiated by a team member");

        uint _each = address(this).balance / team.length;

        for(i = 0; i < team.length; i++){
            payable(team[i]).transfer(_each);    
        }
    }

}
