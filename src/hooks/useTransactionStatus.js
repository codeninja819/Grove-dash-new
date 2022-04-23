import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { POLLING_INTERVAL } from "../config";
import { useBridgeContext } from "../context/BridgeContext";
import { useWeb3Context } from "../context/web3Context";
import {
  getMessage,
  getMessageData,
  messageCallStatus,
  NOT_ENOUGH_COLLECTED_SIGNATURES,
} from "../lib/bridge/message";
import { getEthersProvider, timeout, withTimeout } from "../utils/helper";
import { useBridgeDirection } from "./useBridgeDirection";
import { useNeedsClaiming } from "./useNeedsClaiming";

export const useTransactionStatus = (setMessage) => {
  const needsClaiming = useNeedsClaiming();
  const { homeChainId, getBridgeChainId, getAMBAddress, getTotalConfirms } =
    useBridgeDirection();
  const { provider: ethersProvider, chainID } = useWeb3Context();
  const { loading, setLoading, txHash, setTxHash } = useBridgeContext();

  const isHome = chainID === homeChainId;
  const totalConfirms = getTotalConfirms(chainID);
  const bridgeChainId = getBridgeChainId(chainID);
  
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loadingText, setLoadingText] = useState();
  const [confirmations, setConfirmations] = useState(0);

  const completeReceipt = useCallback(() => {
    setTxHash();
    setLoading(false);
    setLoadingText();
    setConfirmations(0);
    toast.success(
      "The Grove token has been successfully transferred. After a while it will appear in the history table."
    );
  }, [setLoading, setTxHash]);

  const incompleteReceipt = useCallback(() => {
    setLoading(false);
    setLoadingText();
    setConfirmations(0);
    toast.success("GVR claim was failed");
  }, [setLoading]);

  useEffect(() => {
    if (!loading) {
      setLoadingText();
      setConfirmations(0);
    }
  }, [loading]);

  const getStatus = useCallback(async () => {
    try {
      const tx = await ethersProvider.getTransaction(txHash);
      const txReceipt = tx
        ? await withTimeout(5 * POLLING_INTERVAL, tx.wait())
        : null;
      const numConfirmations = txReceipt ? txReceipt.confirmations : 0;
      const enoughConfirmations = numConfirmations >= totalConfirms;

      if (txReceipt) {
        setConfirmations(numConfirmations);
        if (enoughConfirmations) {
          const bridgeProvider = await getEthersProvider(bridgeChainId);
          const bridgeAmbAddress = getAMBAddress(bridgeChainId);
          if (needsClaiming) {
            setLoadingText("Collecting Signatures");
            const message = await getMessage(
              isHome,
              ethersProvider,
              getAMBAddress(chainID),
              txHash
            );

            setLoadingText("Waiting for Execution");
            if (message && message.signatures) {
              const sleep = (delay) =>
                new Promise((resolve) => setTimeout(resolve, delay));
              await sleep(10 * POLLING_INTERVAL);
              const status = await messageCallStatus(
                bridgeAmbAddress,
                bridgeProvider,
                message.messageId
              );
              if (status) {
                completeReceipt();
                return true;
              } else {
                setNeedsConfirmation(true);
                incompleteReceipt();
                setMessage(message);
                return true;
              }
            }
          } else {
            setLoadingText("Waiting for Execution");

            const { messageId } = await getMessageData(
              isHome,
              ethersProvider,
              txHash,
              txReceipt
            );
            const status = await messageCallStatus(
              bridgeAmbAddress,
              bridgeProvider,
              messageId
            );
            if (status) {
              completeReceipt();
              return true;
            }
          }
        }
      }
    } catch (txError) {
      if (txError?.code === "TRANSACTION_REPLACED" && !txError.cancelled) {
        console.debug("TRANSACTION_REPLACED");
        setTxHash(txError.replacement.hash);
      } else if (
        txError?.message === "timed out" ||
        (needsClaiming && txError?.message === NOT_ENOUGH_COLLECTED_SIGNATURES)
      ) {
        return false;
      }

      completeReceipt();
      console.error({ txError });
      return true;
    }
    return false;
  }, [
    isHome,
    needsClaiming,
    txHash,
    setTxHash,
    ethersProvider,
    totalConfirms,
    completeReceipt,
    incompleteReceipt,
    chainID,
    bridgeChainId,
    getAMBAddress,
    setMessage,
  ]);

  useEffect(() => {
    if (!loading || !txHash || !ethersProvider) {
      return () => undefined;
    }

    setLoadingText("Waiting for Confirmations");
    let isSubscribed = true;

    const updateStatus = async () => {
      const status = !isSubscribed || (await getStatus());
      if (!status && loading && txHash && ethersProvider) {
        await timeout(POLLING_INTERVAL);
        updateStatus();
      }
    };

    updateStatus();

    return () => {
      isSubscribed = false;
    };
  }, [loading, txHash, ethersProvider, getStatus]);

  useEffect(() => {
    setNeedsConfirmation((needs) => chainID === homeChainId && needs);
  }, [homeChainId, chainID]);

  return {
    loadingText,
    needsConfirmation,
    setNeedsConfirmation,
    confirmations,
  };
};
