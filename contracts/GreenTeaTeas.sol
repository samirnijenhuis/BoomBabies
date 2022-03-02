// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";


contract GreenTeaTeas is ERC721, Ownable, VRFConsumerBase {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    uint256 public constant MINT_PRICE = 0.0666 ether; // TODO to non-const
    uint256 public raffleAmount; // = 0 removed to reduce gas
    uint256[] public randomResult;


    uint128 public constant MAX_MINT_QUANTITY = 5;
    uint128 public constant MAX_SUPPLY = 1000;
    uint128 public constant RAFFLE_WINNERS = 5;
    bool public isRevealed; // = false removed to reduce gas
    bool public publicSale; // = false removed to reduce gas


    address[] public team;
    mapping(address => bool) public whitelist;
    string private baseURI;
    Counters.Counter private _tokenIdCounter;

    event MintComplete();


    constructor(address[] memory _team, address[] memory _whiteList)
        ERC721("GreenTeaTeas", "GTT3")
        VRFConsumerBase(
        // @see https://docs.chain.link/docs/vrf-contracts/v1/
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B, // VRF Coordinator TODO To MainNet - 0xf0d54349aDdcf704F77AE15b96510dEA15cb7952
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709  // LINK Token TODO ToMain Net - 0x514910771AF9Ca656af840dff83E8264EcF986CA
        )
    {
        team = _team;

        uint256 wLength = _whiteList.length;
        for (uint256 i = 0; i < wLength; i+=1) {
            require(_whiteList[i] != address(0), "Can't add a null address");
            whitelist[_whiteList[i]] = true;
        }

        uint256 tLength = team.length;
        for(uint128 i = 0; i < tLength; i+=1){
            preMint(team[i]);
        }
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: token not found");

        if(! isRevealed){
            return "https:"; // TODO possible to hardcode this to reduce gas fees.
        }
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    function mint(uint256 _quantity) external payable {
        require(whitelist[msg.sender] || publicSale, "Not whitelisted and public mint not started");
        require(_quantity <= MAX_MINT_QUANTITY, "Quantity exceeds per-transaction limit");
        require(totalSupply() + _quantity <= MAX_SUPPLY, "Quantity exceeds supply");
        require(MINT_PRICE.mul(_quantity) <= msg.value, "Amount of ether sent does not match total mint amount");

        for(uint256 i = 0; i < _quantity; i+=1)
        {
           safeMint(msg.sender);
        }
    }

    function airdrop(address[] calldata addresses) external onlyOwner {
        uint256 aLength = addresses.length;
        require(totalSupply() + aLength <= MAX_SUPPLY, "Quantity exceeds supply");

        for (uint256 i = 0; i < aLength; i+=1) {
            safeMint(addresses[i]);
        }
    }

    //A1E8BF5F8C2484A0732CB3C3F415308C890AF0C76E0BD50CB8E3E229A1D82212
    function preMint(address to) private {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function safeMint(address to) private  {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        if(_tokenIdCounter.current() >= MAX_SUPPLY){
            emit MintComplete();
            _release();
        }
    }

    function setBaseURI(string memory _baseURI) public onlyOwner { // TODO verify memory
        baseURI = _baseURI;
    }

    function toggleReveal() external  onlyOwner {
        isRevealed = !isRevealed;
    }

    function togglePublicSale() external onlyOwner {
        publicSale = !publicSale;
    }

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        uint256 aLength = addresses.length;
        for (uint256 i = 0; i < aLength; i+=1) {
            require(addresses[i] != address(0), "Can't add a null address");
            whitelist[addresses[i]] = true;
        }
    }

    function release() external onlyTeam {
        _release();
    }

    function _release() private {
        uint balance = address(this).balance;
        _withdrawTeam(balance.div(100).mul(40));
        _withdrawCharity(balance.div(100).mul(30));
        raffleAmount = balance.div(100).mul(30);
        requestRaffleWinner();
    }

    function requestRaffleWinner() internal returns (bytes32 requestId) {
        uint256 fee = 0.1 * 10 ** 18;  // 0.1 LINK (Varies by network) TODO To Main Net
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311, fee); // TODO To Main net
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = expand(randomness, RAFFLE_WINNERS); // TODO verify keys align with the keys of the owners array
        _withdrawRaffle(randomResult);
    }

    function expand(uint256 randomValue, uint256 n) private pure returns (uint256[] memory expandedValues) {
        expandedValues = new uint256[](n);
        for (uint256 i = 0; i < n; i+=1) {
            expandedValues[i] = (uint256(keccak256(abi.encode(randomValue, i))) % MAX_SUPPLY) + 1;
        }
        return expandedValues;
    }


    function emergencyWithdraw() external onlyTeam {
       _withdrawTeam(address(this).balance);
    }

    function _withdrawTeam(uint256 amount) private {
        uint256 tLength = team.length;
        uint _each = amount.div(tLength);

        for(uint256 i = 0; i < tLength; i+=1) {
            (bool sent, bytes memory data) = team[i].call{value: _each}("");
        }
    }

    function _withdrawCharity(uint256 amount) private {
        address charity = 0xB5C181F7Fb2590F92086203B90f6A9546aB646F2;  // TODO  Charity account testnet
        (bool sent, bytes memory data) = charity.call{value: amount}("");
        require(sent, "Failed sending Ether to Charity");
    }

    function _withdrawRaffle(uint256[] memory winningTokens) private { // TODO verify memory
        uint _each = raffleAmount.div(winningTokens.length);
        for(uint256 i = 0; i < winningTokens.length; i++) {
            (bool sent, bytes memory data) =  ownerOf(winningTokens[i]).call{value: _each}("");
            require(sent, string(abi.encodePacked("Failed sending Ether to Raffle winner: ", winningTokens[i])));
        }
    }

    modifier onlyTeam() {
        require(inTeam(msg.sender) == true, "Withdraw must be initiated by a team member");
        _;
    }

    function inTeam(address _address) private view returns (bool) {
        uint256 tLength = team.length;
        for(uint256 i = 0; i < tLength; i+=1){
            if(team[i] == _address){
                return true;
            }
        }
        return false;
    }
}
