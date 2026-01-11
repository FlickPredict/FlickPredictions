import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

// Session freshness check - prevents stale app state issues
const SESSION_STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
const APP_LOAD_TIME = Date.now();
let lastVisibleTime = Date.now();

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      const timeSinceLoad = now - APP_LOAD_TIME;
      const timeSinceVisible = now - lastVisibleTime;

      if (timeSinceLoad > SESSION_STALE_THRESHOLD_MS && timeSinceVisible > 30 * 60 * 1000) {
        console.log('[Session] App is stale, forcing refresh...');
        window.location.reload();
        return;
      }
      lastVisibleTime = now;
    } else {
      lastVisibleTime = Date.now();
    }
  });
}

import { createRoot } from "react-dom/client";
import { useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import App from "./App";
import "./index.css";
import { PrivySafeProvider, PrivySafeContext, PrivySafeContextType, PRIVY_ENABLED } from "@/hooks/use-privy-safe";
import { SolanaTransactionContext, SolanaTransactionContextType, createSOLTransferTransaction, createSOLTransferWithFeeTransaction, TransactionResult } from "@/hooks/use-solana-transaction";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useFundWallet, useSignAndSendTransaction, useWallets } from "@privy-io/react-auth/solana";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0a0a0f]" />
);

function PrivyInnerAdapter({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const { fundWallet } = useFundWallet();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { wallets: privyWallets } = useWallets();

  const [txIsLoading, setTxIsLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Privy] Connection State:', {
      ready: privy.ready,
      authenticated: privy.authenticated,
      user: !!privy.user,
    });
  }, [privy.ready, privy.authenticated, privy.user]);

  const embeddedWalletData = useMemo(() => {
    if (!privy.user?.linkedAccounts) return null;

    const embedded = privy.user.linkedAccounts.find(
      (account: any) =>
        account.type === 'wallet' &&
        account.walletClientType === 'privy' &&
        account.chainType === 'solana'
    );

    if (embedded && 'address' in embedded) {
      return {
        address: (embedded as any).address,
        walletClientType: 'privy',
        id: (embedded as any).id,
      };
    }
    return null;
  }, [privy.user?.linkedAccounts]);

  const embeddedWallet = embeddedWalletData ? {
    address: embeddedWalletData.address,
    walletClientType: embeddedWalletData.walletClientType,
  } : null;

  const externalWalletAddress = useMemo(() => {
    if (!privy.user?.linkedAccounts) return null;

    const externalWallet = privy.user.linkedAccounts.find(
      (account: any) =>
        account.type === 'wallet' &&
        account.walletClientType !== 'privy' &&
        account.chainType === 'solana'
    );

    if (externalWallet && 'address' in externalWallet) {
      return (externalWallet as any).address;
    }
    return null;
  }, [privy.user?.linkedAccounts]);

  const createWalletWrapper = async () => {
    try {
      await (privy.createWallet as any)({ chainType: 'solana' });
    } catch (error) {
      console.error('Failed to create Solana wallet:', error);
    }
  };

  const fundWalletWrapper = (address: string) => {
    console.log('[Privy] Opening funding modal for address:', address);
    fundWallet({ address });
  };

  const exportWalletWrapper = async () => {
    alert('To withdraw funds, copy your wallet address and send from an external wallet like Phantom.');
  };

  const getPrivyWallet = useCallback(() => {
    if (!privyWallets || privyWallets.length === 0) return null;
    return privyWallets.find((w: any) => w.address === embeddedWalletData?.address) || privyWallets[0];
  }, [privyWallets, embeddedWalletData]);

  const sendSOL = useCallback(async (toAddress: string, amountSOL: number): Promise<TransactionResult> => {
    if (!embeddedWalletData?.address) {
      throw new Error('No wallet connected');
    }
    if (amountSOL <= 0.000001) {
      throw new Error('Amount too small');
    }
    const wallet = getPrivyWallet();
    if (!wallet || !signAndSendTransaction) {
      throw new Error('Wallet or transaction signing not available');
    }

    setTxIsLoading(true);
    setTxError(null);

    try {
      const { transaction } = await createSOLTransferTransaction(embeddedWalletData.address, toAddress, amountSOL);
      const result = await signAndSendTransaction({
        transaction: transaction.serialize({ requireAllSignatures: false }),
        wallet
      });
      const signature = typeof result === 'string' ? result : (result as any)?.signature || String(result);
      return { signature, success: true };
    } catch (err: any) {
      setTxError(err?.message || 'Transaction failed');
      throw err;
    } finally {
      setTxIsLoading(false);
    }
  }, [embeddedWalletData, signAndSendTransaction, getPrivyWallet]);

  const sendSOLWithFee = useCallback(async (toAddress: string, amountSOL: number, feePercent: number = 1): Promise<TransactionResult> => {
    if (!embeddedWalletData?.address) {
      throw new Error('No wallet connected');
    }
    if (amountSOL <= 0.000001) {
      throw new Error('Amount too small');
    }
    const wallet = getPrivyWallet();
    if (!wallet || !signAndSendTransaction) {
      throw new Error('Wallet or transaction signing not available');
    }

    setTxIsLoading(true);
    setTxError(null);

    try {
      const { transaction, feeAmount } = await createSOLTransferWithFeeTransaction(
        embeddedWalletData.address,
        toAddress,
        amountSOL
      );
      const recipientAmount = amountSOL - feeAmount;
      const result = await signAndSendTransaction({
        transaction: transaction.serialize({ requireAllSignatures: false }),
        wallet
      });
      const signature = typeof result === 'string' ? result : (result as any)?.signature || String(result);
      return { signature, success: true, feeAmount, recipientAmount };
    } catch (err: any) {
      setTxError(err?.message || 'Transaction failed');
      throw err;
    } finally {
      setTxIsLoading(false);
    }
  }, [embeddedWalletData, signAndSendTransaction, getPrivyWallet]);

  const privySafeValue: PrivySafeContextType = {
    login: privy.login,
    logout: privy.logout,
    authenticated: privy.authenticated,
    user: privy.user,
    getAccessToken: privy.getAccessToken,
    ready: privy.ready,
    embeddedWallet,
    externalWalletAddress,
    createWallet: createWalletWrapper,
    fundWallet: fundWalletWrapper,
    exportWallet: exportWalletWrapper,
  };

  const solanaTransactionValue: SolanaTransactionContextType = {
    sendSOL,
    sendSOLWithFee,
    isLoading: txIsLoading,
    error: txError,
  };

  return (
    <PrivySafeContext.Provider value={privySafeValue}>
      <SolanaTransactionContext.Provider value={solanaTransactionValue}>
        {children}
      </SolanaTransactionContext.Provider>
    </PrivySafeContext.Provider>
  );
}

function PrivyWrapperComponent({ children }: { children: ReactNode }) {
  const buildTimeHeliusKey = import.meta.env.VITE_HELIUS_API_KEY;
  const [rpcConfig, setRpcConfig] = useState<{ rpcUrl: string; wssUrl: string } | null>(null);
  const [configLoaded, setConfigLoaded] = useState(!!buildTimeHeliusKey);

  useEffect(() => {
    if (!buildTimeHeliusKey) {
      fetch('/api/config/rpc')
        .then(res => res.json())
        .then(config => {
          setRpcConfig({ rpcUrl: config.rpcUrl, wssUrl: config.wssUrl });
          setConfigLoaded(true);
        })
        .catch(err => {
          console.error('[RPC] Failed to fetch config:', err);
          setRpcConfig({
            rpcUrl: 'https://api.mainnet-beta.solana.com',
            wssUrl: 'wss://api.mainnet-beta.solana.com'
          });
          setConfigLoaded(true);
        });
    }
  }, [buildTimeHeliusKey]);

  const rpcUrl = buildTimeHeliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${buildTimeHeliusKey}`
    : (rpcConfig?.rpcUrl || 'https://api.mainnet-beta.solana.com');
  const wssUrl = buildTimeHeliusKey
    ? `wss://mainnet.helius-rpc.com/?api-key=${buildTimeHeliusKey}`
    : (rpcConfig?.wssUrl || 'wss://api.mainnet-beta.solana.com');

  const solanaRpc = useMemo(() => createSolanaRpc(rpcUrl), [rpcUrl]);
  const solanaRpcSubscriptions = useMemo(() => createSolanaRpcSubscriptions(wssUrl), [wssUrl]);

  if (!configLoaded) {
    return <LoadingScreen />;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
          showWalletLoginFirst: false,
          walletChainType: 'ethereum-and-solana',
        },
        loginMethods: ['email', 'google', 'twitter', 'wallet'],
        embeddedWallets: {
          showWalletUIs: false,
          solana: {
            createOnLogin: 'all-users',
          },
        },
        fundingMethodConfig: {
          moonpay: {
            useSandbox: false,
          },
        },
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: solanaRpc,
              rpcSubscriptions: solanaRpcSubscriptions,
            },
          },
        },
      }}
    >
      <PrivyInnerAdapter>
        {children}
      </PrivyInnerAdapter>
    </PrivyProvider>
  );
}

const AppWithProviders = () => {
  if (PRIVY_ENABLED && PRIVY_APP_ID) {
    return (
      <PrivyWrapperComponent>
        <App />
      </PrivyWrapperComponent>
    );
  }

  return (
    <PrivySafeProvider>
      <App />
    </PrivySafeProvider>
  );
};

createRoot(document.getElementById("root")!).render(<AppWithProviders />);

export { PRIVY_ENABLED };
