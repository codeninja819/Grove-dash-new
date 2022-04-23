import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
} from "@mui/material";
import { useCallback, useState } from "react";
import { Navigate } from "react-router-dom";
import styled from "styled-components";
import { useWeb3Context } from "../../context/web3Context";
import { useUserHistory } from "../../hooks/useUserHistory";
import { HistoryItem } from "./components/HistoryItem";
import { ClaimErrorModal } from "./modals/ClaimErrorModal";

const TOTAL_PER_PAGE = 15;

export const BridgeHistory = ({ page }) => {
  const { connected: isConnected } = useWeb3Context();
  const { transfers } = useUserHistory();

  const [onlyUnReceived, setOnlyUnReceived] = useState(false);
  const [claimErrorShow, setClaimErrorShow] = useState(false);
  const [claimErrorToken, setClaimErrorToken] = useState(null);

  const sm = useMediaQuery("(max-width : 750px)");
  const xs = useMediaQuery("(max-width : 550px)");
  const xx = useMediaQuery("(max-width : 600px)");

  const handleClaimError = useCallback((toToken) => {
    toToken && setClaimErrorToken(toToken);
    setClaimErrorShow(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setClaimErrorShow(false);
    claimErrorToken && setClaimErrorToken(null);
  }, [claimErrorToken]);

  const filteredTransfers =
    (onlyUnReceived
      ? transfers.filter((i) => i.receivingTx === null)
      : transfers) || [];

  const numPages = Math.ceil(filteredTransfers.length / TOTAL_PER_PAGE);
  const displayHistory = page
    ? filteredTransfers.slice(
        (page - 1) * TOTAL_PER_PAGE,
        Math.min(page * TOTAL_PER_PAGE, filteredTransfers.length)
      )
    : filteredTransfers.slice(0, TOTAL_PER_PAGE);

  if (numPages > 1 && page > numPages) {
    return <Navigate to="/history" />;
  }

  return (
    <Box width={"100%"} mt={sm ? "40px" : "60px"}>
      <Box
        fontSize={xs ? "calc(100vw / 412 * 20)" : "24px"}
        fontWeight={"bold"}
      >
        History
      </Box>
      <ClaimErrorModal
        claimErrorShow={claimErrorShow}
        claimErrorToken={claimErrorToken}
        onClose={handleModalClose}
      />
      {isConnected && (
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={onlyUnReceived}
                onChange={(e) => setOnlyUnReceived(e.target.checked)}
              />
            }
            label="Show only unreceived"
          />
        </FormGroup>
      )}
      <Panel
        mt={sm ? "10px" : "16px"}
        padding={xx ? "0px 15px 20px 15px" : "30px"}
        width={"100%"}
      >
        <Box
          display={{ xs: "none", md: "grid" }}
          gridTemplateColumns={{
            xs: "1fr",
            md: "0.5fr 0.3fr 0.75fr 0.75fr 0.5fr 0.5fr",
            lg: "1fr 0.3fr 0.9fr 0.9fr 0.5fr 0.5fr",
          }}
          px={"30px"}
        >
          <Box>Date</Box>
          <Box>Direction</Box>
          <Box textAlign="center">Sending Tx</Box>
          <Box textAlign="center">Receiving Tx</Box>
          <Box textAlign="right" pr={{ xs: 0, md: 2 }}>
            Amount
          </Box>
          <Box textAlign="right">Status</Box>
        </Box>
        <HistoryPanel mt={"14px"}>
          {displayHistory.map((item) => (
            <HistoryItem
              key={item.sendingTx}
              data={item}
              handleClaimError={handleClaimError}
            />
          ))}
          {displayHistory.length === 0 && (
            <History display="flex" alignItems="center">
              <Box width="100%" textAlign="center">
                NO HISTORIES
              </Box>
            </History>
          )}
        </HistoryPanel>
      </Panel>
    </Box>
  );
};

const HistoryPanel = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const History = styled(Box)`
  width: 100%;
  height: 63px;
  background: rgba(1, 5, 30, 0.2);
  border: 2px solid rgb(51, 83, 98);
  border-radius: 10px;
  margin: 10px 0;
  padding: 10px;
`;

const Panel = styled(Box)`
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 235, 0.2),
    rgba(0, 0, 0, 0)
  );
  border: 2px solid rgb(50, 54, 83);
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0px 0px 0px 25px;
`;
