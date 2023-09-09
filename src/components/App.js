import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers';

// Components
import Navigation from './Navigation';
import Swap from './Swap';
import Deposit from './Deposit';
import Withdraw from './Withdraw';
import Charts from './Charts';
import Tabs from './Tabs';

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
      <HashRouter>

        <Navigation />

        <hr />

        <Tabs />

        <Routes>
          <Route exact path="/" element={<Swap />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/charts" element={<Charts />} />
        </Routes>
      </HashRouter>

    </Container>
  )
}

export default App;
