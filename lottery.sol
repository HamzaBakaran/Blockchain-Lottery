// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract Lottery {
    address public admin;
    bool public gameCreated;
    bool public gameStarted;
    bool public gameEnded=true;
    uint public totalPlayers;
    uint public totalAmountPaid;
    address[] public playerAddresses;

    struct Player {
        bool registered;
        uint amountPaid;
    }

    mapping(address => Player) public players;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyPlayers() {
        require(players[msg.sender].registered, "Only registered players can call this function");
        _;
    }

    modifier gameNotStarted() {
        require(!gameStarted, "Game has already started");
        _;
    }

    modifier gameNotEnded() {
        require(!gameEnded, "Game has already ended");
        _;
    }

    modifier gameCreatedOnly() {
        require(!gameStarted, "Game has already started");
        _;
    }

    modifier gameStartedOnly() {
        require(gameStarted, "Game has not started yet");
        _;
    }

    event NewPlayer(address indexed player, uint amount);
    event GameCreated();
    event GameStarted();
    event GameEnded(address indexed winner, uint amountWon, uint adminAmount);

    constructor() {
        admin = msg.sender;
    }

    function createGame() external onlyAdmin gameNotStarted {
        require(gameEnded, "Previous game has not ended");
        gameCreated = true;
        gameEnded = false;
        emit GameCreated();
    }

    function startGame() external onlyAdmin gameCreatedOnly gameNotStarted {
        require(gameCreated==true,"Gane is not created");
        gameStarted = true;
        emit GameStarted();
    }

    function registerForGame() external payable gameStartedOnly gameNotEnded {
        require(msg.value == 0.1 ether, "Amount must be exactly 0.1 ETH");
        require(!players[msg.sender].registered, "Player is already registered");

        players[msg.sender] = Player(true, msg.value);
        playerAddresses.push(msg.sender);
        totalPlayers++;
        totalAmountPaid += msg.value;
        emit NewPlayer(msg.sender, msg.value);
    }

    function endGame() external onlyAdmin gameStartedOnly {
        require(address(this).balance > 0, "No funds to distribute");
        require(totalPlayers > 0, "No registered players");

        address winner = selectWinner();
        uint amountWon = totalAmountPaid / 2; // 50% of the total amount paid
        uint adminAmount = address(this).balance - amountWon;

        payable(winner).transfer(amountWon);
        payable(admin).transfer(adminAmount);

        // Clear the mapping of registered players
        for (uint i = 0; i < totalPlayers; i++) {
            delete players[playerAddresses[i]];
        }

        totalPlayers = 0;
        totalAmountPaid = 0;
        gameEnded = true;
        gameCreated = false;
        gameStarted = false;
        emit GameEnded(winner, amountWon, adminAmount);
    }

    function selectWinner() internal view returns (address) {
        uint randomIndex = uint(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, totalPlayers))) % totalPlayers;

        return playerAddresses[randomIndex];
    }
}
