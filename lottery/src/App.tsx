import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from './components/Spinner';
import DashboardItem from './components/DashboardItem';


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
  const [isLoading, setIsLoading] = useState(false);

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
  
      // Fetch basic contract data
      const [admin, gameCreated, gameStarted, gameEnded, totalPlayers, totalAmountPaid] = await Promise.all([
        contract.admin(),
        contract.gameCreated(),
        contract.gameStarted(),
        contract.gameEnded(),
        contract.totalPlayers(),
        contract.totalAmountPaid(),
      ]);
  
      // Log fetched data
      console.log('Fetched Contract Data:', {
        admin,
        gameCreated,
        gameStarted,
        gameEnded,
        totalPlayers,
        totalAmountPaid: totalAmountPaid.toString(), // Keep totalAmountPaid as BigNumber
      });
  
      // Set contract data in the React state
      setGameData({
        admin,
        gameCreated,
        gameStarted,
        gameEnded,
        totalPlayers: Number(totalPlayers),
        totalAmountPaid: totalAmountPaid.toString(), // Keep totalAmountPaid as BigNumber
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
        const [registered, amountPaid] = await contract.players(address);
  
        // Log individual player data
        console.log(`Player Data for ${address}:`, { registered, amountPaid: amountPaid.toString() });
  
        // Set player data in the React state
        playersData[address] = {
          registered,
          amountPaid: amountPaid.toString(), // Keep amountPaid as BigNumber
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const endGame = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const registerForGame = async () => {
    try {
      setIsLoading(true);
  
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
      const transaction = await contract.registerForGame({ value: amountToSend, gasLimit });
  
      // Wait for the transaction to be mined
      await transaction.wait();
  
      // Refresh data after the transaction is successful
      await fetchData();
  
      // Reset error state on success
      setError(null);
  
      // Display success notification
      toast.success('Registered successfully');
    } catch (error) {
      console.error('Error registering for the game:', error);
  
      // Extract and display contract error message
      const contractErrorMessage =
        (error as { message?: string; data?: { message?: string } })?.message ||
        ((error as { data?: { message?: string } })?.data?.message || 'Error registering for the game. Please try again.');
      toast.error(contractErrorMessage);
  
      // Set error state for displaying custom error message (optional)
      setError(contractErrorMessage);
    } finally {
      setIsLoading(false);
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
    {isLoading && <Spinner />} {/* Render the spinner if loading */}
    {addresses.length > 0 && (
      <div>
        <p className="mt-3">Connected address: {addresses[0]}</p>
        {isAdmin ? (
          <div className="mt-3">
            <h4>Admin Dashboard</h4>
            <DashboardItem title="Admin" value={gameData.admin} />
            <DashboardItem title="Game Created" value={String(gameData.gameCreated)} />
            <DashboardItem title="Game Started" value={String(gameData.gameStarted)} />
            <DashboardItem title="Game Ended" value={String(gameData.gameEnded)} />
            <DashboardItem title="Total Players" value={gameData.totalPlayers} />
            <DashboardItem title="Total Amount Paid" value={`${gameData.totalAmountPaid} Wei`} />
            <div className="mt-4">
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
            <DashboardItem title="Total Players" value={gameData.totalPlayers} />
            <DashboardItem title="Possible Win Amount" value={`${gameData.totalAmountPaid / 2} Wei`} />
            <DashboardItem title="Game Started" value={String(gameData.gameStarted)} />
            <DashboardItem title="Game Ended" value={String(gameData.gameEnded)} />
            <button className="btn btn-primary mt-3" onClick={registerForGame}>
              Register for Game
            </button>
          </div>
        )}
      </div>
    )}
    <ToastContainer />
  </div>
);
}
   

export default App;