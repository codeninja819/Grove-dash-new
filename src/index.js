import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./index.css";
import App from "./App";

import { BridgeProvider } from "./context/BridgeContext";
import { GlobalProvider } from "./context/GlobalContext";
import { RefreshContextProvider } from "./context/RefreshContext";
import { Web3ContextProvider } from "./context/web3Context";
import { TokenInfoProvider } from "./hooks/useTokenInfo";
import { LockInfoProvider } from "./hooks/useLockInfo";
import { FarmInfoProvider } from "./hooks/useFarmInfo";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GlobalProvider>
      <Web3ContextProvider>
        <RefreshContextProvider>
          <BridgeProvider>
            <TokenInfoProvider>
              <LockInfoProvider>
                <FarmInfoProvider>
                  <App />
                  <ToastContainer />
                </FarmInfoProvider>
              </LockInfoProvider>
            </TokenInfoProvider>
          </BridgeProvider>
        </RefreshContextProvider>
      </Web3ContextProvider>
    </GlobalProvider>
  </React.StrictMode>
);
