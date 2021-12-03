import { useState, useCallback, useEffect } from 'react';
import { SafeAppWeb3Modal } from '@gnosis.pm/safe-apps-web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from 'walletlink';
import { providers, utils } from 'ethers';

import networks from '../networks';

import coinbaseLogo from '../images/coinbase.png';
import walletConnectLogo from '../images/walletconnect.svg';

const walletConnectOptions = () => {
  const options = {};
  Object.keys(networks).forEach(chainId => {
    options[`custom-walletconnect-${chainId}`] = {
      display: {
        logo: walletConnectLogo,
        name: `WalletConnect (${networks[chainId].networkName})`,
        description: 'Scan with WalletConnect to connect',
      },
      package: WalletConnectProvider,
      options: {
        chainId: Number(chainId),
        rpc: {
          [chainId]: networks[chainId].rpcUrl
        },
      },
      connector: async (ProviderPackage, options) => {
        const provider = new ProviderPackage(options);
        await provider.enable();
        return provider;
      }
    }
  });
  return options;
}

const web3Modal = new SafeAppWeb3Modal({
  cacheProvider: true,
  providerOptions: {
    'custom-walletlink': {
      display: {
        logo: coinbaseLogo,
        name: 'Coinbase Wallet',
        description: 'Scan with Coinbase Wallet to connect',
      },
      package: WalletLink,
      connector: async (ProviderPackage) => {
        const provider = new ProviderPackage({ appName: 'Stake to Gno' }).makeWeb3Provider({}, 0);
        await provider.enable();
        return provider;
      },
    },
    ...walletConnectOptions(),
  },
});

async function switchChainInMetaMask(chainId) {
  const name = 'xDai';
  const symbol = 'XDAI';
  const chainName = 'xDai Chain';
  const rpcUrl = 'https://dai.poa.network';
  const blockExplorerUrl = 'https://blockscout.com/poa/xdai';

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: utils.hexValue(Number(chainId)),
        },
      ],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        if (chainId !== '100') throw Error();
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: utils.hexValue(Number(chainId)),
              chainName,
              nativeCurrency: {
                name,
                symbol,
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: [blockExplorerUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.log(addError);
      }
    } else {
      console.log(switchError);
    }
    return false;
  }
};

function useWallet() {
  const [wallet, setWallet] = useState();
  const [isMetamask, setIsMetamask] = useState(false);

  const closeConnection = useCallback(async () => {
    const provider = wallet?.provider;
    if (provider && provider.currentProvider && provider.currentProvider.close) {
      await provider.currentProvider.close();
    }
    await web3Modal.clearCachedProvider();
    window.location.reload();
  }, [wallet]);

  const loadWallet = useCallback(async () => {
    const provider = await web3Modal.requestProvider();
    async function connect() {
      const library = new providers.Web3Provider(provider);
      const network = await library.getNetwork();
      const address = await library.getSigner().getAddress();
      const chainId = String(network.chainId);
      setIsMetamask(library?.connection?.url === 'metamask');
      setWallet({ provider: library, address, chainId });
    }
    if (provider.on) {
      provider.on('close', closeConnection);
      provider.on('disconnect', closeConnection);
      provider.on('accountsChanged', accounts => accounts.length ? connect() : window.location.reload());
      // provider.on('networkChanged', connect);
      provider.on('chainChanged', () => window.location.reload());
    }
    provider.autoRefreshOnNetworkChange = false;
    await connect();
  }, [closeConnection]);

  const disconnectWallet = useCallback(async () => {
    await web3Modal.clearCachedProvider();
    window.location.reload();
  }, []);

  useEffect(() => {
    async function connect() {
      const cachedProvider = localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER');
      if (cachedProvider) {
        try {
          await loadWallet();
        } catch (error) {
          console.log(error);
          await disconnectWallet();
        }
      }
    }
    connect();
  }, []);

  return ({
    wallet,
    isMetamask,
    loadWallet,
    disconnectWallet,
    switchChainInMetaMask,
  });
};

export default useWallet;
