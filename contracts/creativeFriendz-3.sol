// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CreativeFriendzClub3 is ERC721, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIdCounter;

    uint public constant MAX_MINT_QUANTITY = 1;
    uint public constant MAX_ADDRESS_QUANTITY = 1;

    uint256 public MINT_PRICE = 0.5 ether;
    uint256 public MAX_SUPPLY = 1000;

    bool public isRevealed = false;
    bool public publicSale = false;
    string public provenanceHash = "";
    address[] public team;
    string  private baseURI;
    string  private notRevealedUri;

    constructor(string memory _baseURI, address[] memory _team) ERC721("Creative Friendz Club", "TCFC") {
        setBaseURI(_baseURI);
        team = _team;

        for(uint256 i = 0; i < team.length; i++){
            safeMint(team[i]);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: token not found");

        if(! isRevealed){
            return notRevealedUri;
        }
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    function mint(uint256 _quantity) public payable {
        uint256 latestTokenId = _tokenIdCounter.current();
        require(publicSale == true, "Mint not started yet");
        require(_quantity <= MAX_MINT_QUANTITY, "Quantity exceeds per-transaction limit");
        require(latestTokenId.add(_quantity) < MAX_SUPPLY, "Quantity exceeds supply");
        require(MINT_PRICE.mul(_quantity) <= msg.value, "Amount of ether sent does not match total mint amount");
        require(balanceOf(msg.sender) < MAX_ADDRESS_QUANTITY, "Address exceeds quantity limit.");

        for(uint256 i = 0; i < _quantity; i++)
        {
           safeMint(msg.sender);
        }

    }

    function safeMint(address to) internal  {
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
        MINT_PRICE = _mintPrice;
    }

    function toggleReveal() public  onlyOwner {
        isRevealed = !isRevealed;
    }

    function togglePublicSale() public onlyOwner {
        publicSale = !publicSale;
    }

   function withdraw() public onlyTeam {
        uint _each = address(this).balance.div(team.length);

        for(uint256 i = 0; i < team.length; i++){
            payable(team[i]).transfer(_each);
        }
    }

    modifier onlyTeam() {
        require(inTeam(msg.sender) == true, "Withdraw must be initiated by a team member");
        _;
    }

    function inTeam(address _address) internal view  returns (bool) {
        for(uint256 i = 0; i < team.length; i++){
            if(team[i] == _address){
                return true;
            }
        }
        return false;
    }

}
