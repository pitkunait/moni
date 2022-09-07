// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract MoniNFT is ERC721Enumerable, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using Strings for uint256;

    uint256 public supply = 1000;
    uint256 public pricePerToken = 1 ether;
    mapping(address => uint256) public mintRecords;
    uint256 public maxMintCount = 2;
    EnumerableSet.AddressSet private whitelist;
    EnumerableSet.AddressSet private allowlist;
    bool public saleOpen = false;
    string public baseURI;
    uint256 public whiteListStart;
    uint256 public allowListStart;
    uint256 public publicStart;

    enum Status {
        Closed,
        SoldOut,
        WhiteListMint,
        AllowListMint,
        PublicMint,
        NotStarted
    }

    enum WalletStage {
        whiteList,
        allowList,
        publicMint
    }

    struct Info {
        Status stage;
        uint256 whiteListStart;
        uint256 allowListStart;
        uint256 publicStart;
        bool saleOpen;
        uint256 supply;
        uint256 minted;
        uint256 maxMintCount;
        uint256 pricePerToken;
    }

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {
    }

    function info() public view returns (Info memory) {
        return Info(
            stage(),
            whiteListStart,
            allowListStart,
            publicStart,
            saleOpen,
            supply,
            totalSupply(),
            maxMintCount,
            pricePerToken
        );
    }

    function stage() public view returns (Status) {
        if (!saleOpen) {
            return Status.Closed;
        }

        if (totalSupply() >= supply) {
            return Status.SoldOut;
        }

        uint256 ts = block.timestamp;
        if (publicStart != 0 && ts >= publicStart) {
            return Status.PublicMint;
        } else if (allowListStart != 0 && ts >= allowListStart) {
            return Status.AllowListMint;
        } else if (whiteListStart != 0 && ts >= whiteListStart) {
            return Status.WhiteListMint;
        }

        return Status.NotStarted;
    }

    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function setSaleOpen() onlyOwner external {
        saleOpen = true;
    }

    function setSaleClose() onlyOwner external {
        saleOpen = false;
    }

    function setSaleStart(uint256 _whiteListStart, uint256 _allowListStart, uint256 _publicStart) onlyOwner external {
        require(_whiteListStart > block.timestamp, "Whitelist should be in the future");
        require(_allowListStart > _whiteListStart, "Allowlist start should be after whitelist start");
        require(_publicStart > _allowListStart, "Public start should be after allowlist start");

        whiteListStart = _whiteListStart;
        allowListStart = _allowListStart;
        publicStart = _publicStart;
    }

    function setBaseURI(string memory _uri) external onlyOwner {
        baseURI = _uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : '';
    }

    function availableToMint(address _address) public view returns (uint256) {
        return maxMintCount - mintRecords[_address];
    }

    function setWhiteList(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            EnumerableSet.add(whitelist, addresses[i]);
        }
    }

    function setAllowList(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            EnumerableSet.add(allowlist, addresses[i]);
        }
    }

    function setPrice(uint256 _price) external onlyOwner {
        pricePerToken = _price;
    }

    function setSupply(uint256 _supply) external onlyOwner {
        supply = _supply;
    }

    function getWalletStage(address _wallet) external view returns (WalletStage) {
        if (isWalletWhitelisted(_wallet)) {
            return WalletStage.whiteList;
        } else if (isWalletAllowlisted(_wallet)) {
            return WalletStage.allowList;
        } else {
            return WalletStage.publicMint;
        }
    }

    function isWalletWhitelisted(address _address) public view returns (bool) {
        return EnumerableSet.contains(whitelist, _address);
    }

    function isWalletAllowlisted(address _address) public view returns (bool) {
        return EnumerableSet.contains(allowlist, _address);
    }

    function mint(uint256 _tokenCount) payable external {
        require(saleOpen, "Sale is closed");

        uint256 totalSupply = totalSupply();
        require(totalSupply + _tokenCount <= supply, "Purchase would exceed max tokens");
        require(pricePerToken * _tokenCount <= msg.value, "Ether value sent is not correct");

        require(_tokenCount > 0 && _tokenCount <= maxMintCount, "Invalid token count supplied");

        uint256 _availableToMint = availableToMint(msg.sender);
        require(_availableToMint >= _tokenCount, "Token count exceeded");

        Status _stage = stage();
        if (_stage == Status.WhiteListMint) {
            require(isWalletWhitelisted(msg.sender), "Wallet is not in whitelist");
        } else if (_stage == Status.AllowListMint) {
            require(isWalletAllowlisted(msg.sender), "Wallet is not in allowlist");
        }

        mintRecords[msg.sender] += _tokenCount;

        for (uint256 i = 1; i <= _tokenCount; i++) {
            uint256 _tokenId = totalSupply + i;
            _safeMint(msg.sender, _tokenId);
        }
    }
}
