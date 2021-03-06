import React from 'react';
import Web3Modal from '@wandevs/web3modal';
// import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3 from 'web3';

const INITIAL_STATE = {
  address: '',
  web3: null,
  provider: null,
  connected: false,
  networkId: 888, // TODO: CHANGE TO 888 AFTER JUPITER FORK
  chainType: 'wan',
};

const differ = (a, b) => {
  if (a.address !== b.address) {
    return 1;
  }

  if (a.networkId !== b.networkId) {
    return 1;
  }

  if (a.connected !== b.connected) {
    return 1;
  }

  return 0;
};

export const WalletContext = React.createContext({}, differ);

function initWeb3(provider) {
  const web3 = new Web3(provider);
  return web3;
}

class Wallet extends React.Component {
  constructor(props) {
    super(props);
    const intiState = {
      ...INITIAL_STATE,
      resetApp: this.resetApp,
      connect: this.onConnect,
      switchNetwork: this.switchNetwork,
    };

    this.setWallet = props.setWallet;
    this.setWallet(intiState);

    if (typeof window === 'undefined') {
      return;
    }

    // console.debug('new web3modal');
    this.web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: true,
      disableInjectedProvider: false,
      providerOptions: this.getProviderOptions(),
    });
  }

  componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      if (this.web3Modal.cachedProvider === 'wanmask' && !window.wanchain) {
        this.web3Modal.clearCachedProvider();
        return;
      }
      if (this.web3Modal.cachedProvider === 'clover' && !window.clover) {
        this.web3Modal.clearCachedProvider();
        return;
      }
      this.onConnect();
    }
  }

  onConnect = async () => {
    try {
      let provider;

      try {
        if (window.injectWeb3) {
          provider = await this.web3Modal.connectTo('wanwallet');
        } else {
          provider = await this.web3Modal.connect();
        }
      } catch (error) {
        console.error(error);
      }

      await this.subscribeProvider(provider);

      const web3 = initWeb3(provider);

      const accounts = await web3.eth.getAccounts();

      const address = accounts[0];

      const networkId = await web3.eth.net.getId();

      await this.setWallet({
        web3,
        provider,
        connected: true,
        address,
        networkId,
        chainType:
          this.web3Modal.cachedProvider === 'wanmask' ||
          this.web3Modal.cachedProvider === 'wanwallet'
            ? 'wan'
            : 'eth',
        resetApp: this.resetApp,
        connect: this.onConnect,
        switchNetwork: this.switchNetwork,
      });
    } catch (error) {
      console.error(error);
    }
  };

  subscribeProvider = async (provider) => {
    if (!provider || !provider.on) {
      return;
    }
    provider.on('close', () => this.resetApp());
    provider.on('accountsChanged', async (accounts) => {
      await this.setWallet({ ...this.props.wallet, address: accounts[0] });
    });
    provider.on('chainChanged', async (event) => {
      // console.debug('event', event);
      const { web3 } = this.props.wallet;
      if (web3) {
        const networkId = await web3.eth.net.getId();
        await this.setWallet({ ...this.props.wallet, networkId });
      } else {
        await this.setWallet({ ...this.props.wallet, networkId: event });
      }
    });

    provider.on('networkChanged', async (networkId) => {
      await this.setWallet({ ...this.props.wallet, networkId });
    });
  };

  getProviderOptions = () => {
    const providerOptions = {
      // walletconnect: {
      //   package: WalletConnectProvider,
      //   options: {
      //     infuraId: '326fb0397704475abffcfa9ca9c0ee5a',
      //     rpcUrl: 'https://gwan-ssl.wandevs.org:56891',
      //     chainId: 888,
      //     networkId: 888,
      //     rpc: {
      //       888: 'https://gwan-ssl.wandevs.org:56891',
      //       999: 'https://gwan-ssl.wandevs.org:46891',
      //     },
      //   },
      // },
    };
    return providerOptions;
  };

  resetApp = async () => {
    const { web3 } = this.props.wallet;
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    web3.currentProvider.removeAllListeners();
    await this.web3Modal.clearCachedProvider();
    this.setWallet({
      ...INITIAL_STATE,
      resetApp: this.resetApp,
      connect: this.onConnect,
    });
  };

  // param:
  // interface AddEthereumChainParameter {
  //   chainId: string; // A 0x-prefixed hexadecimal string
  //   chainName: string;
  //   nativeCurrency: {
  //     name: string;
  //     symbol: string; // 2-6 characters long
  //     decimals: 18;
  //   };
  //   rpcUrls: string[];
  //   blockExplorerUrls?: string[];
  //   iconUrls?: string[]; // Currently ignored.
  // }
  switchNetwork = async (param) => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [param],
      });
      this.onConnect();
    } catch (addError) {
      // handle "add" error
      console.error('addError', addError);
    }
  };

  addToken = async (tokenAddress, tokenSymbol, tokenDecimals, tokenImage) => {
    if (this.web3Modal.cachedProvider !== 'injected') {
      return;
    }

    // const tokenAddress = '0xd00981105e61274c8a5cd5a88fe7e037d935b513';
    // const tokenSymbol = 'TUT';
    // const tokenDecimals = 18;
    // const tokenImage = 'http://placekitten.com/200/300';

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });

      if (wasAdded) {
        console.log('Thanks for your interest!');
      } else {
        console.log('Your loss!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  render() {
    return <></>;
  }
}

export default Wallet;
