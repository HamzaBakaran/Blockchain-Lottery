import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


declare global {
  interface Window {
    ethereum?: any;
    provider: any;
    signer: any;
  }
}

interface Player {
  registered: boolean;
  amountPaid: number;
}

function App() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [gameData, setGameData] = useState<any>({});
  const [players, setPlayers] = useState<{ [address: string]: Player }>({});
  const [error, setError] = useState<string | null>(null);

  const abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"GameCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountWon","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"adminAmount","type":"uint256"}],"name":"GameEnded","type":"event"},{"anonymous":false,"inputs":[],"name":"GameStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"NewPlayer","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"createGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"endGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"gameCreated","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gameEnded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gameStarted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"playerAddresses","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"players","outputs":[{"internalType":"bool","name":"registered","type":"bool"},{"internalType":"uint256","name":"amountPaid","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"registerForGame","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"startGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalAmountPaid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalPlayers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
  const contractAddress = '0x801121771320B312620082CfDE014d9b3518e8bE';

  useEffect(() => {
    const initializeContract = async () => {
      if (window.ethereum) {
        window.provider = new ethers.BrowserProvider(window.ethereum);
        window.signer = await window.provider.getSigner();
      }
      await fetchData();
    };

    initializeContract();
  }, []);

  const fetchData = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, window.signer);
  
      // Fetch data from the contract
      const admin = await contract.admin();
      const gameCreated = await contract.gameCreated();
      const gameStarted = await contract.gameStarted();
      const gameEnded = await contract.gameEnded();
      const totalPlayers = await contract.totalPlayers();
      const totalAmountPaid = await contract.totalAmountPaid();
  
      // Log fetched data
      console.log('Fetched Contract Data:', {
        admin,
        gameCreated,
        gameStarted,
        gameEnded,
        totalPlayers,
        totalAmountPaid,
      });
  
      // Set contract data in the React state
      setGameData({
        admin,
        gameCreated,
        gameStarted,
        gameEnded,
        totalPlayers,
        totalAmountPaid,
      });
  
      // Fetch player addresses from the contract
      const addresses = await contract.playerAddresses();
      
      // Log player addresses
      console.log('Player Addresses:', addresses);
  
      // Set player addresses in the React state
      setAddresses(addresses);
  
      // Fetch detailed player data
      const playersData: { [address: string]: Player } = {};
      for (const address of addresses) {
        const playerData = await contract.players(address);
  
        // Log individual player data
        console.log(`Player Data for ${address}:`, playerData);
  
        // Set player data in the React state
        playersData[address] = {
          registered: playerData.registered,
          amountPaid: playerData.amountPaid.toNumber(),
        };
      }
      
      // Log the final playersData
      console.log('All Players Data:', playersData);
  
      // Set player data in the React state
      setPlayers(playersData);
  
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle the error
    }
  };

  const connect = async () => {
    if (window.ethereum) {
      window.provider = new ethers.BrowserProvider(window.ethereum);
      const addresses = await window.provider.send('eth_requestAccounts', []);
      window.signer = await window.provider.getSigner();

      if (addresses && Array.isArray(addresses)) {
        setAddresses(addresses);
        fetchData();
      }
    }
  };

  const isAdmin = addresses.length > 0 && addresses[0].toLowerCase() === gameData.admin.toLowerCase();

  const startGame = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, window.signer);
      const transaction = await contract.startGame();
  
      // Wait for the transaction to be mined
      await transaction.wait();
  
      await fetchData();
  
      // Reset error state on success
      setError(null);
  
      // Display success notification
      toast.success('Game started successfully');
    } catch (error) {
      console.error('Error starting the game:', error);
  
      // Extract and display contract error message
      const contractErrorMessage = (error as { message?: string; data?: { message?: string } })?.message ||
        ((error as { data?: { message?: string } })?.data?.message || 'Error starting the game. Please try again.');
      toast.error(contractErrorMessage);
  
      // Set error state for displaying custom error message (optional)
      setError(contractErrorMessage);
    }
  };
  const createGame = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, window.signer);
      const transaction = await contract.createGame();
      
      // Wait for the transaction to be mined
      await transaction.wait();
  
      await fetchData();
  
      // Reset error state on success
      setError(null);
  
      // Display success notification
      toast.success('Game created successfully');
    } catch (error) {
      console.error('Error creating the game:', error);
  
      // Extract and display contract error message
      const contractErrorMessage = (error as { message?: string; data?: { message?: string } })?.message ||
        ((error as { data?: { message?: string } })?.data?.message || 'Error creating the game. Please try again.');
      toast.error(contractErrorMessage);
  
      // Set error state for displaying custom error message (optional)
      setError(contractErrorMessage);
    }
  };
  
  const endGame = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, window.signer);
      const transaction = await contract.endGame();
  
      // Wait for the transaction to be mined
      await transaction.wait();
  
      await fetchData();
  
      // Reset error state on success
      setError(null);
  
      // Display success notification
      toast.success('Game ended successfully');
    } catch (error) {
      console.error('Error ending the game:', error);
  
      // Extract and display contract error message
      const contractErrorMessage = (error as { message?: string; data?: { message?: string } })?.message ||
        ((error as { data?: { message?: string } })?.data?.message || 'Error ending the game. Please try again.');
      toast.error(contractErrorMessage);
  
      // Set error state for displaying custom error message (optional)
      setError(contractErrorMessage);
    }
  };

  const registerForGame = async () => {
    try {
      // Check if MetaMask is installed and available
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask to interact with the application.');
      }
  
      const contract = new ethers.Contract(contractAddress, abi, window.signer);
  
      // Prompt user to allow MetaMask transaction
      await window.ethereum.request({ method: 'eth_requestAccounts' });
  
      // Specify the amount of 1 ETH in Wei (1 ETH = 10^18 Wei)
      const amountToSend = '100000000000000000';

      const gasLimit = 200000;
  
      // Trigger MetaMask transaction with specified amount
      const transaction = await contract.registerForGame({ value: amountToSend, gasLimit});
  
      // Wait for the transaction to be mined
      await transaction.wait();
  
      // Refresh data after the transaction is successful
      await fetchData();
  
      // Reset error state on success
      setError(null);
  
      // Display success notification
      toast.success('Registered successfully');
    } catch (error) {
      console.error('Error registering the game:', error);
  
      // Extract and display contract error message
      const contractErrorMessage =
        (error as { message?: string; data?: { message?: string } })?.message ||
        ((error as { data?: { message?: string } })?.data?.message || 'Error registering for the game. Please try again.');
      toast.error(contractErrorMessage);
  
      // Set error state for displaying custom error message (optional)
      setError(contractErrorMessage);
    }
  };
  
  
  
  return (
    <div className="container mt-5">
    {!addresses.length && (
      <div className="text-center">
        <p>Please log in using your MetaMask wallet.</p>
        <button className="btn btn-primary" onClick={connect}>
          Connect to MetaMask
        </button>
      </div>
    )}
    {addresses.length > 0 && (
      <div>
        <p className="mt-3">Connected address: {addresses[0]}</p>
        {isAdmin ? (
          <div className="mt-3">
            <h4>Admin Dashboard</h4>
            <div className="mb-3">
              <p>
                <strong>Admin:</strong> {gameData.admin}
              </p>
              <p>
                <strong>Game Created:</strong> {String(gameData.gameCreated)}
              </p>
              <p>
                <strong>Game Started:</strong> {String(gameData.gameStarted)}
              </p>
              <p>
                <strong>Game Ended:</strong> {String(gameData.gameEnded)}
              </p>
            </div>

            {addresses.map((address, index) => (
              <div key={index} className="mb-3">
                <p>
                  <strong>Player:</strong> {address}
                </p>
                <p>
                  <strong>Registered:</strong> {String(players[address]?.registered)}
                </p>
                <p>
                  <strong>Amount Paid:</strong> {players[address]?.amountPaid} ETH
                </p>
              </div>
            ))}
                        <div>
              <button className="btn btn-success mr-2" onClick={createGame}>
                Create Game
              </button>
              <button className="btn btn-info mr-2" onClick={startGame}>
                Start Game
              </button>
              <button className="btn btn-danger" onClick={endGame}>
                End Game
              </button>
            </div>
          </div>
          
        ) : (
          <div className="mt-3">
            <h4>Player Dashboard</h4>
            <div className="mb-3">
              <p>
                <strong>Total Players:</strong> {gameData.totalPlayers}
              </p>
              <p>
                <strong>Total Amount Paid:</strong> {gameData.totalAmountPaid} ETH
              </p>
              <p>
                <strong>Game Started:</strong> {String(gameData.gameStarted)}
              </p>
              <p>
                <strong>Game Ended:</strong> {String(gameData.gameEnded)}
              </p>
              <button className="btn btn-primary" onClick={registerForGame}>
                Register for Game
              </button>
            </div>
          </div>
        )}
      </div>
    )}
    <ToastContainer />
  </div>
);
}
   

export default App;