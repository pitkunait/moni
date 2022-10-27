// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract MoniWizards is ERC721Enumerable, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using Strings for uint256;

    uint256 public waveSupply;
    uint256 public MAX_SUPPLY;
    uint256 public waveMinted;
    uint256 public pricePerToken;
    uint256 public maxMintCount;

    mapping(address => uint256) public mintRecords;
    address[] private minters;

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
        NotStarted,
        SoldOutStage
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

        uint256 waveSupply;
        uint256 maxSupply;

        uint256 waveMinted;
        uint256 totalMinted;

        uint256 maxMintCount;
        uint256 pricePerToken;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint256 _supply,
        uint256 _maxSupply,
        uint256 _pricePerToken,
        uint256 _maxMintCount
    ) ERC721(name, symbol) {
        pricePerToken = _pricePerToken;
        maxMintCount = _maxMintCount;
        waveSupply = _supply;
        MAX_SUPPLY = _maxSupply;
    }

    function info() public view returns (Info memory) {
        return Info(
            stage(),
            whiteListStart,
            allowListStart,
            publicStart,
            saleOpen,

            waveSupply,
            MAX_SUPPLY,

            waveMinted,
            totalSupply(),

            maxMintCount,
            pricePerToken
        );
    }

    function stage() public view returns (Status) {
        if (!saleOpen) {
            return Status.Closed;
        }

        if (waveMinted >= waveSupply) {
            return Status.SoldOutStage;
        }

        if (totalSupply() >= MAX_SUPPLY) {
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

    function startWave(uint256 _whiteListStart, uint256 _allowListStart, uint256 _publicStart, uint256 _amount) public onlyOwner {

        for (uint256 i = 0; i < whitelist.length(); i++) {
            address whitelisted = whitelist.at(i);
            whitelist.remove(whitelisted);
        }

        for (uint256 i = 0; i < allowlist.length(); i++) {
            address whitelisted = allowlist.at(i);
            allowlist.remove(whitelisted);
        }

        waveMinted = 0;
        setSaleStart(_whiteListStart, _allowListStart, _publicStart);
        waveSupply = _amount;
    }

    function clearMinters() public onlyOwner {
        for (uint256 i = 0; i < minters.length; i++) {
            delete mintRecords[minters[i]];
        }
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

    function setSaleStart(uint256 _whiteListStart, uint256 _allowListStart, uint256 _publicStart) internal {
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

    function setMaxSupply(uint256 _supply) external onlyOwner {
        MAX_SUPPLY = _supply;
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

        Status _stage = stage();
        if (_stage == Status.WhiteListMint) {
            require(isWalletWhitelisted(msg.sender), "Wallet is not in whitelist");
        } else if (_stage == Status.AllowListMint) {
            require(isWalletAllowlisted(msg.sender) || isWalletWhitelisted(msg.sender), "Wallet is not in allowlist");
        } else if (_stage == Status.NotStarted) {
            revert("Sale not started yet");
        }
        require(totalSupply() + _tokenCount <= MAX_SUPPLY, "Purchase would exceed max tokens");
        require(waveMinted + _tokenCount <= waveSupply, "Purchase would exceed wave max tokens");
        require(pricePerToken * _tokenCount <= msg.value, "Ether value sent is not correct");
        require(_tokenCount > 0 && _tokenCount <= maxMintCount, "Invalid token count supplied");
        require(availableToMint(msg.sender) >= _tokenCount, "Available token mint count exceeded");

        mintRecords[msg.sender] += _tokenCount;
        minters.push(msg.sender);
        for (uint256 i = 0; i < _tokenCount; i++) {
            waveMinted += 1;
            _safeMint(msg.sender, totalSupply() + 1);

        }
    }
}
