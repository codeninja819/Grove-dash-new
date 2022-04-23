import { Box, Dialog, useMediaQuery, CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import styled from "styled-components";

import { useBridgeContext } from "../../../context/BridgeContext";
import { useWeb3Context } from "../../../context/web3Context";
import { useBridgeDirection } from "../../../hooks/useBridgeDirection";
import { useTransactionStatus } from "../../../hooks/useTransactionStatus";
import { getExplorerUrl } from "../../../utils/helper";

import { ClaimTokensModal } from "./ClaimTokensModal";
import { ClaimTransferModal } from "./ClaimTransferModal";
import { NeedsConfirmationModal } from "./NeedsConfirmationModal";
import { ProgressRing } from "./ProgressRing";

const getTransactionString = (hash) => {
  if (!hash) return "here";
  const len = hash.length;
  return `${hash.substr(0, 6)}...${hash.substr(len - 4, len - 1)}`;
};

const BridgeLoader = ({
  loading,
  loadingText,
  txHash,
  confirmations,
  totalConfirms,
  chainId,
}) => {
  const showConfirmations = confirmations < totalConfirms;
  const displayConfirms = showConfirmations ? confirmations : totalConfirms;

  const sm = useMediaQuery("(max-width : 450px)");
  return (
    <Dialog
      open={loading ?? false}
      onClose={(e, reason) => {
        if (reason === "escapeKeyDown" || reason === "backdropClick") return;
      }}
    >
      <DialogPanel>
        {loadingText ? (
          <Box
            display={"flex"}
            alignItems={sm ? "stretch" : "center"}
            flexDirection={sm ? "column" : "row"}
          >
            <Box
              display={"flex"}
              width="3.25rem"
              height="3.25rem"
              alignItems={"center"}
              justifyContent="center"
            >
              {showConfirmations ? (
                <>
                  <Box fontSize="sm">
                    {displayConfirms}/{totalConfirms}
                  </Box>
                  <Box position={"absolute"}>
                    <ProgressRing
                      radius={33.5}
                      stroke={5}
                      progress={displayConfirms}
                      totalProgress={totalConfirms}
                    />
                  </Box>
                </>
              ) : (
                <>
                  <CircularProgress />
                  <AiOutlineCheck style={{ position: "absolute" }} />
                </>
              )}
            </Box>
            <Box
              display="flex"
              flex={1}
              flexDirection="column"
              align={sm ? "flex-start" : "cetner"}
              mt="5px"
            >
              <Box textAlign="center">
                {`${loadingText || "Waiting for Block Confirmations"}...`}
              </Box>
              <Box color="grey" textAlign="center">
                {"Monitor at explorer "}
                <a
                  href={`${getExplorerUrl(chainId)}/tx/${txHash}`}
                  target={"_blank"}
                  rel="noreferrer noopener"
                  style={{ textDecoration: "underline" }}
                >
                  {getTransactionString(txHash)}
                </a>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box textAlign="center">Loading...</Box>
        )}
      </DialogPanel>
    </Dialog>
  );
};

export const BridgeLoadingModal = () => {
  const { chainID } = useWeb3Context();
  const { getMonitorUrl, homeChainId, foreignChainId, getTotalConfirms } =
    useBridgeDirection();
  const { fromToken, loading, txHash } = useBridgeContext();
  const totalConfirms = getTotalConfirms(chainID);
  const [message, setMessage] = useState();
  const {
    loadingText,
    needsConfirmation,
    setNeedsConfirmation,
    confirmations,
  } = useTransactionStatus(setMessage);

  useEffect(() => {
    if (chainID === homeChainId) {
      setMessage();
    }
  }, [chainID, homeChainId]);

  const txNeedsClaiming =
    !!message && !!txHash && !loading && chainID === foreignChainId;

  const claimTransfer = () =>
    txNeedsClaiming ? (
      <ClaimTransferModal message={message} setMessage={setMessage} />
    ) : null;

  const claimAllTokens = () =>
    txNeedsClaiming || loading || needsConfirmation ? null : (
      <ClaimTokensModal />
    );

  const loader = () =>
    needsConfirmation ? (
      <NeedsConfirmationModal
        setNeedsConfirmation={setNeedsConfirmation}
        setMessage={setMessage}
      />
    ) : (
      <BridgeLoader
        loadingText={loadingText}
        loading={loading || !fromToken}
        confirmations={confirmations}
        totalConfirms={totalConfirms}
        chainId={chainID}
        getMonitorUrl={getMonitorUrl}
        txHash={txHash}
      />
    );

  return (
    <>
      {claimTransfer()}
      {claimAllTokens()}
      {loader()}
    </>
  );
};

const DialogPanel = styled(Box)`
  width: calc(100vw - 40px);
  max-width: 500px;
  color: white;
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 235, 0.2),
    rgba(0, 0, 0, 0)
  );
  padding: 1rem 1.5rem;
  border-radius: 2rem;
  border: 1px solid rgb(57, 59, 85);
`;
