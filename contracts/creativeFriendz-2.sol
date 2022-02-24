// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RandomNumberConsumer.sol";


contract CreativeFriendzClub2 is ERC721, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIdCounter;

    uint128 public constant MAX_MINT_QUANTITY = 5;
    uint128 public constant MAX_SUPPLY = 1000;
    uint256 public constant MINT_PRICE = 0.066 ether;

    bool public isRevealed = false;
    bool public publicSale = false;
    string public provenanceHash = "";
    address[] public team;
    mapping(address => bool) public whitelist;
    string private baseURI;
    string private notRevealedUri;

    uint256 private raffleAmount = 0;

    constructor(string memory _baseURI, address[] memory _team, address[] memory _whiteList) ERC721("Boom Babies", "BABIES") {
        setBaseURI(_baseURI);
        team = _team;

        for (uint256 i = 0; i < _whiteList.length; i++) {
            require(_whiteList[i] != address(0), "Can't add a null address");
            whitelist[_whiteList[i]] = true;
        }


        for(uint i = 0; i < team.length; i++){
            safeMint(team[i]);
        }
    }

    function totalSupply() public view virtual returns (uint256 memory) {
        return _tokenIdCounter.current();
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
        require(whitelist[msg.sender] == true || publicSale == true, "Not whitelisted and public mint not started");
        require(_quantity <= MAX_MINT_QUANTITY, "Quantity exceeds per-transaction limit");
        require(latestTokenId.add(_quantity) < MAX_SUPPLY, "Quantity exceeds supply");
        require(MINT_PRICE.mul(_quantity) <= msg.value, "Amount of ether sent does not match total mint amount");

        for(uint256 i = 0; i < _quantity; i++)
        {
           safeMint(msg.sender);
        }
    }

    function airdrop(address[] calldata addresses) public onlyOwner {
        uint256 latestTokenId = _tokenIdCounter.current();
        require(latestTokenId.add(addresses.length) < MAX_SUPPLY, "Quantity exceeds supply");

        for (uint256 i = 0; i < addresses.length; i++) {
            safeMint(addresses[i]);
        }
    }

    function safeMint(address to) internal  {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        if(_tokenIdCounter.current() >= MAX_SUPPLY){
            release();
        }
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


    function toggleReveal() public  onlyOwner {
        isRevealed = !isRevealed;
    }

    function togglePublicSale() public onlyOwner {
        publicSale = !publicSale;
    }

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Can't add a null address");
            whitelist[addresses[i]] = true;
        }
    }



    function release() internal {
        uint balance = address(this).balance;
        _withdrawTeam(balance.mul(.4));
        _withdrawCharity(balance.mul(.3));
        raffleAmount = balance.mul(.3);

        RandomNumberConsumer random = new RandomNumberConsumer();
        random.getRandomNumber();
    }

   function emergencyWithdraw() public onlyTeam {
       _withdrawTeam(address(this).balance);
    }

    function _withdrawTeam(uint256 amount) internal {
        uint _each = amount.div(team.length);

        for(uint256 i = 0; i < team.length; i++) {
            payable(team[i]).transfer(_each);
        }
    }

    function _withdrawCharity(uint256 amount) internal {
        payable(0x00000000000).transfer(amount);
    }

    function releaseRaffle(uint256[] winningTokens) {
        uint _each = raffleAmount.div(winningTokens.length);
        for(uint256 i = 0; i < winningTokens.length; i++) {
            payable(ownerOf(winningTokens[i])).transfer(_each);
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
