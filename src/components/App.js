import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import {
  loadAccount,
  loadProvider,
  loadNetwork,
  loadTokens,
  loadAMM
} from '../store/interactions';

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = await loadProvider(dispatch);

    // Fetch current network chainId
    const chainId = await loadNetwork(provider, dispatch);

    // Fetch current account from MetaMask when changed
    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch);
    });

    // reload page when network is changed
    window.ethereum.on('chainChanged', async () => {
      window.location.reload();
    });

    // initiate contracts
    await loadTokens(provider, chainId, dispatch);
    await loadAMM(provider, chainId, dispatch);
  }

  useEffect(() => {
    loadBlockchainData();
  });

  return(
    <Container>
      <Navigation />

      <h1 className='my-4 text-center'>React Hardhat Template</h1>

      <>
        <p className='text-center'><strong>Your ETH Balance:</strong> 0 ETH</p>
        <p className='text-center'>Edit App.js to add your code here.</p>
      </>
    </Container>
  )
}

export default App;
