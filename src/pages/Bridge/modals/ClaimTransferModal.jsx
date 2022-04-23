import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Dialog, useMediaQuery } from "@mui/material";
import { AiOutlineClose } from "react-icons/ai";
import { toast } from "react-toastify";
import styled from "styled-components";

import { useBridgeContext } from "../../../context/BridgeContext";
import { useWeb3Context } from "../../../context/web3Context";
import { useBridgeDirection } from "../../../hooks/useBridgeDirection";
import { useClaim } from "../../../hooks/useClaim";
import { isRevertedError, TOKENS_CLAIMED } from "../../../lib/bridge/amb";
import { messageCallStatus } from "../../../lib/bridge/message";
import { getNetworkLabel, handleWalletError } from "../../../utils/helper";

import Button from "../../../components/Button";
import { LoadingModal } from "./LoadingModal";

export const ClaimTransferModal = ({ message, setMessage }) => {
  const { provider: ethersProvider } = useWeb3Context();
  const { homeChainId, foreignChainId, foreignAmbAddress } =
    useBridgeDirection();
  const { txHash, setTxHash } = useBridgeContext();
  const [isOpen, setOpen] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [executed, setExecuted] = useState(false);

  const sm = useMediaQuery("(max-width : 450px)");

  const onClose = useCallback(() => {
    setTxHash();
    setMessage();
    setOpen(false);
  }, [setTxHash, setMessage]);

  const showError = useCallback((errorMsg) => {
    if (errorMsg) toast.error(errorMsg);
  }, []);

  useEffect(() => {
    if (message && message.messageId) {
      const { messageId } = message;
      messageCallStatus(foreignAmbAddress, ethersProvider, messageId).then(
        (status) => {
          if (status) {
            setExecuted(true);
          }
        }
      );
    }
  }, [message, foreignAmbAddress, ethersProvider]);

  const { claim, executing, executionTx } = useClaim();

  const claimTokens = useCallback(async () => {
    try {
      setClaiming(true);
      await claim(txHash, message);
    } catch (claimError) {
      console.error({ claimError });
      if (
        claimError.message === TOKENS_CLAIMED ||
        isRevertedError(claimError)
      ) {
        setExecuted(true);
      } else {
        handleWalletError(claimError, showError);
      }
    } finally {
      setClaiming(false);
    }
  }, [claim, txHash, showError, message]);

  useEffect(() => {
    if (!executing && !claiming && executionTx) {
      onClose();
    }
  }, [executing, claiming, executionTx, onClose]);

  if (claiming || executing)
    return (
      <LoadingModal
        loadingText="Waiting for Execution"
        chainId={homeChainId}
        txHash={txHash}
      />
    );

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogPanel>
        <DialogHeader p={4}>
          <Box>Claim Your Tokens</Box>
          <AiOutlineClose cursor={"pointer"} onClick={onClose} />
        </DialogHeader>
        <DialogBody px={4} py={0}>
          <Box
            display={"flex"}
            alignItems="center"
            flexDirection="column"
            spacing="4"
          >
            <Box alignItems="center" flexDirection="column" width="100%" mb={2}>
              <Alert severity="info" borderRadius={5}>
                <Box>
                  {`The claim process may take a variable period of time on ${getNetworkLabel(
                    foreignChainId
                  )}${" "}
                    depending on network congestion. Your token balance will increase to reflect${" "}
                    the completed transfer after the claim is processed`}
                </Box>
              </Alert>
            </Box>
            {executed && (
              <Box alignItems="center" flexDirection="column" width="100%" mb={2}>
                <Alert severity="error" borderRadius={5}>
                  <Box>
                    The tokens were already claimed. Check your token balance in{" "}
                    <strong>{getNetworkLabel(foreignChainId)}</strong>.
                  </Box>
                </Alert>
              </Box>
            )}
          </Box>
        </DialogBody>
        <Box p={4}>
          <Box
            display={"flex"}
            width="100%"
            justifyContent="space-evenly"
            alignItems={sm ? "stretch" : "center"}
            flexDirection={sm ? "column" : "row"}
          >
            <Button
              type={"secondary"}
              width={sm ? "90px" : "120px"}
              height={sm ? "28px" : "50px"}
              fontSize={sm ? "12px" : "16px"}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type={"primary"}
              width={sm ? "90px" : "120px"}
              height={sm ? "28px" : "50px"}
              fontSize={sm ? "12px" : "16px"}
              onClick={claimTokens}
              disabled={claiming || executing || executed}
            >
              Claim
            </Button>
          </Box>
        </Box>
      </DialogPanel>
    </Dialog>
  );
};

const DialogBody = styled(Box)`
  padding: 15px 20px 30px 20px;
`;

const DialogHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  padding: 20px 20px 17px 20px;
  font-size: 18px;
  font-weight: 600;
  @media screen and (max-width: 450px) {
    font-size: 17px;
  }
`;

const DialogPanel = styled(Box)`
  width: calc(100vw - 40px);
  max-width: 620px;
  color: white;
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 235, 0.2),
    rgba(0, 0, 0, 0)
  );
  border-radius: 10px;
  border: 1px solid rgb(57, 59, 85);
`;
