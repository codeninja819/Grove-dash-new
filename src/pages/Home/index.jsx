/* eslint-disable react-hooks/exhaustive-deps */
import { Box, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { BiLinkExternal } from "react-icons/bi";
import CountUp from "react-countup";
import styled from "styled-components";

import { useAddress, useWeb3Context } from "../../context/web3Context";
import useTokenInfo from "../../hooks/useTokenInfo";
import { getTokenContract } from "../../utils/contracts";
import {
  numberWithCommas,
  priceFormat,
  BigNumberFormat,
  figureError,
} from "../../utils/functions";
import Button from "../../components/Button";

const Home = ({ setNotification }) => {
  const md = useMediaQuery("(max-width : 1500px)");
  const xs = useMediaQuery("(max-width : 680px)");
  const sm = useMediaQuery("(max-width : 1180px)");
  const xx = useMediaQuery("(max-width : 600px)");
  const xxs = useMediaQuery("(max-width : 400px)");

  const {
    price,
    dailyvolume,
    circulatingSupply,
    totalreward,
    holders,
    pendingReward,
    balance,
    recentburn,
    burnAmount,
    fetchAccountTokenInfo,
  } = useTokenInfo();

  const account = useAddress();
  const { chainID, provider } = useWeb3Context();

  const [PendingReward, setPendingReward] = useState({ prevalue: 0, value: 0 });
  const [Balance, setBalance] = useState({ prevalue: 0, value: 0, detail: "" });
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState([
    {
      title: "ACCOUNT BALANCE",
      value: 0,
      prevalue: 0,
      url: "",
      detail: "",
    },
    {
      title: "GVR PRICE",
      url: "/icons/groveprice.png",
      value: 0,
      prevalue: 0,
      detail: "",
    },
    {
      title: "TOKEN INFO",
      url: "/icons/tokeninfo.png",
      value: 0,
      prevalue: 0,
      detail: (
        <>
          <Box>
            Name: <span style={{ fontWeight: 500 }}>Grove Token</span>
          </Box>
          <Box>
            Symbol: <span style={{ fontWeight: 500 }}>GVR</span>
          </Box>
          <Box>
            Decimal: <span style={{ fontWeight: 500 }}>18</span>
          </Box>
        </>
      ),
    },
    {
      title: `M. CAP BNB`,
      url: "/icons/marketcap.png",
      value: 0,
      prevalue: 0,
      detail: "",
    },
    {
      title: "HOLDERS",
      url: "/icons/holders.png",
      value: 0,
      prevalue: 0,
      detail: "",
    },
    {
      title: "DAILY VOLUME",
      url: "/icons/dailyvolume.png",
      value: 0,
      prevalue: 0,
      detail: "",
    },
    {
      title: "REWARDS INFORMATION",
      url: "/icons/rewardsinfo.png",
      value: 0,
      prevalue: 0,
      detail: "",
    },
    {
      title: "BURN INFORMATION",
      url: "/icons/burninfo.png",
      value: 0,
      prevalue: 0,
      detail: "",
    },
  ]);

  useEffect(() => {
    let temp = [...items];
    temp[0].prevalue = temp[0].value;
    temp[0].value = balance / Math.pow(10, 18);
    temp[0].detail = (
      <>
        <Box fontWeight={500} fontSize={xs ? "calc(100vw / 412 * 16)" : "16px"}>
          GVR{" "}
          <span
            style={{
              fontSize: xs ? "calc(100vw / 412 * 16)" : "32px",
              fontWeight: 600,
            }}
          >
            <CountUp
              start={
                temp[0].prevalue /
                Math.pow(10, BigNumberFormat(temp[0].value).decimals)
              }
              end={
                temp[0].value /
                Math.pow(10, BigNumberFormat(temp[0].value).decimals)
              }
              decimals={2}
              formattingFn={(value) => {
                return value
                  ? numberWithCommas(BigNumberFormat(value).num.toFixed(2))
                  : "0.00";
              }}
            />
          </span>
          {BigNumberFormat(temp[0].value).text}
        </Box>
        <Box
          fontWeight={500}
          fontSize={xs ? "calc(100vw / 412 * 12)" : "24px"}
          mt={xs ? "calc(100vw / 412 * 2)" : 0}
        >
          $
          {BigNumberFormat(
            chainID ? temp[0].value * price[chainID] : 0
          ).num.toFixed(2)}
          <span style={{ fontSize: xs ? "calc(100vw / 412 * 12)" : "16px" }}>
            {BigNumberFormat(chainID ? temp[0].value * price[chainID] : 0).text}
          </span>
        </Box>
      </>
    );
    setItems(temp);

    temp = Balance;
    temp.prevalue = temp.value;
    temp.value = balance / Math.pow(10, 18);
    Balance.detail = (
      <CountUp
        start={
          temp.prevalue /
          Math.pow(10, BigNumberFormat(Number(temp.value)).decimals)
        }
        end={
          temp.value /
          Math.pow(10, BigNumberFormat(Number(temp.value)).decimals)
        }
        decimals={2}
        formattingFn={(value) => {
          return (
            BigNumberFormat(Number(value)).num.toFixed(2) +
            BigNumberFormat(Number(temp.value)).text.toUpperCase()
          );
        }}
      />
    );
    setBalance(temp);
  }, [balance]);

  useEffect(() => {
    let temp = [...items];
    temp[1].prevalue = temp[1].value;
    temp[1].value = price[chainID];
    temp[1].detail = (
      <Box>
        $ 0.0
        {Number(temp[1].value) || Number(temp[1].prevalue) ? (
          <span style={{ fontSize: xx ? (xxs ? "8px" : "12px") : "16px" }}>
            {priceFormat(price[chainID]).count}
          </span>
        ) : (
          ""
        )}
        <CountUp
          start={priceFormat(temp[1].prevalue).value}
          end={priceFormat(temp[1].value).value}
          formattingFn={(value) => {
            return value;
          }}
        />
      </Box>
    );
    temp[3].title = `M. CAP ${chainID === 56 ? "BNB" : "ETH"}`;
    temp[3].prevalue = temp[3].value;
    temp[3].value = circulatingSupply * price[chainID];
    temp[3].detail = (
      <Box>
        $
        <CountUp
          start={temp[3].prevalue}
          end={temp[3].value}
          decimals={2}
          formattingFn={(value) => {
            return numberWithCommas(Number(value).toFixed(2));
          }}
        />
      </Box>
    );
    temp[5].prevalue = temp[5].value;
    temp[5].value = dailyvolume;
    temp[5].detail = (
      <Box>
        $
        <CountUp
          start={temp[5].prevalue}
          end={temp[5].value}
          decimals={2}
          formattingFn={(value) => {
            return numberWithCommas(Number(value).toFixed(2));
          }}
        />
      </Box>
    );
    setItems(temp);
  }, [price[chainID], dailyvolume, chainID]);

  useEffect(() => {
    let temp = [...items];
    temp[4].prevalue = temp[4].value;
    temp[4].value = holders;
    temp[4].detail = (
      <Box>
        <CountUp
          start={temp[4].prevalue}
          end={temp[4].value}
          formattingFn={(value) => {
            return numberWithCommas(Number(value));
          }}
        />
      </Box>
    );

    setItems(temp);
  }, [holders]);

  useEffect(() => {
    let temp = [...items];
    temp[6].detail = (
      <Box>
        Token: <span style={{ fontWeight: 500 }}>Grove Token</span>
        <br />
        Total Rewards:{" "}
        <span style={{ fontWeight: 500 }}>
          {numberWithCommas(BigNumberFormat(totalreward).num.toFixed(2))}
          {BigNumberFormat(Number(totalreward)).text} GVR
        </span>
        <br />
        Total Rewards Price:{" "}
        <span style={{ fontWeight: 500 }}>
          ${numberWithCommas((price[chainID] * totalreward).toFixed(2))}
        </span>
      </Box>
    );
    temp[7].detail = (
      <Box>
        Total Burned:{" "}
        <span style={{ fontWeight: 500 }}>
          {numberWithCommas(BigNumberFormat(Number(burnAmount)).num.toFixed(2))}
          {BigNumberFormat(Number(burnAmount)).text} GVR
          <br />
        </span>
        Total Value of Burn:{" "}
        <span style={{ fontWeight: 500 }}>
          $
          {numberWithCommas(
            Number(
              isNaN(price[chainID] * burnAmount)
                ? 0
                : price[chainID] * burnAmount
            ).toFixed(2)
          )}{" "}
          GVR
          <br />
        </span>
        Most recent Burn:{" "}
        <span style={{ fontWeight: 500 }}>
          {numberWithCommas(
            BigNumberFormat(Number(recentburn).toFixed(2)).num.toFixed(2)
          )}
          {BigNumberFormat(Number(recentburn)).text} GVR
        </span>
      </Box>
    );
    setItems(temp);
  }, [totalreward, price[chainID], burnAmount, recentburn]);

  useEffect(() => {
    let temp = PendingReward;
    temp.prevalue = temp.value;
    temp.value = pendingReward * price[chainID];
    setPendingReward(temp);
  }, [pendingReward, price[chainID], chainID]);

  const onClaim = async () => {
    setPending(true);
    const tokenContract = getTokenContract(chainID, provider.getSigner());
    try {
      const estimateGas = await tokenContract.estimateGas.claim();
      console.log(estimateGas.toString());
      if (estimateGas / 1 === 0) {
        setNotification({
          type: "error",
          title: "Error",
          detail: "Insufficient funds",
        });
        setPending(false);
        return;
      }
      const tx = {
        gasLimit: estimateGas.toString(),
      };
      const claimtx = await tokenContract.claim(tx);
      await claimtx.wait();
      fetchAccountTokenInfo();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  return (
    <StyledContainer>
      <Box display={"flex"} alignItems={"center"}>
        <Box
          fontSize={xs ? "calc(100vw / 412 * 20)" : "36px"}
          fontWeight={"bold"}
          mr={xs ? "8px" : "19px"}
        >
          DASHBOARD
        </Box>
        <Box
          display={"flex"}
          minWidth={xs ? "23px" : "40px"}
          minHeight={xs ? "23px" : "40px"}
          maxWidth={xs ? "23px" : "40px"}
          maxHeight={xs ? "23px" : "40px"}
        >
          <img
            src={"/icons/dashboard.png"}
            width={"100%"}
            height={"100%"}
            alt={""}
          />
        </Box>
      </Box>
      <Field>
        <Box width={"100%"} maxWidth={md ? "650px" : "985px"}>
          <InfoPanel mt={"36px"}>
            {items.map((data, i) => {
              return (
                <Panel
                  key={i}
                  width={
                    i === 6 || i === 7
                      ? md
                        ? "100%"
                        : "470px"
                      : xs
                      ? "calc(100vw / 412 * 172) "
                      : "303px"
                  }
                  height={
                    i === 6 || i === 7
                      ? xs
                        ? "calc((100vw - 40px) / 367 * 141)"
                        : "247px"
                      : xs
                      ? "calc(100vw / 412 * 102)"
                      : "178px"
                  }
                  type={i === 0 ? "secondary" : "primary"}
                >
                  <Vector>
                    <img src={data.url} alt={""} />
                  </Vector>
                  <Box
                    fontSize={
                      xs
                        ? i === 6 || i === 7
                          ? "calc(100vw / 412 * 14)"
                          : "calc(100vw / 412 * 12)"
                        : "18px"
                    }
                  >
                    {data.title}
                  </Box>
                  <Box
                    mt={
                      xs
                        ? i === 2
                          ? "calc(100vw / 412 * 6)"
                          : i === 0
                          ? "calc(100vw / 412 * 3)"
                          : "calc(100vw / 412 * 7)"
                        : "18px"
                    }
                    fontWeight={600}
                    fontSize={
                      i === 6 || i === 7 || i === 2
                        ? xs
                          ? "calc(100vw / 412 * 12)"
                          : "16px"
                        : xs
                        ? "calc(100vw / 412 * 16)"
                        : "32px"
                    }
                  >
                    {data.detail}
                  </Box>
                </Panel>
              );
            })}
          </InfoPanel>

          <Box width={"100%"}>
            <Box
              fontSize={xs ? "calc(100vw / 412 * 20)" : "24px"}
              fontWeight={700}
            >
              CONTRACT INFORMATION
            </Box>
            <ContractInfo>
              <a
                href={
                  "https://bscscan.com/token/0xafb64e73def6faa8b6ef9a6fb7312d5c4c15ebdb"
                }
                target={"_blank"}
                rel="noreferrer"
              >
                <Box>GroveToken BEP-20:</Box>
                <Box display={"flex"} alignItems={"center"}>
                  <Box> 0xafb64e73def6faa8b6ef9a6fb7312d5c4c15ebdb</Box>
                  <BiLinkExternal />
                </Box>
              </a>
              <a
                href={
                  "https://bscscan.com/token/0xb14173e6E9790C346aCfe9BC02b54AA81841427A"
                }
                target={"_blank"}
                rel="noreferrer"
              >
                <Box>LPToken BEP-20:</Box>
                <Box display={"flex"} alignItems={"center"}>
                  <Box> 0xb14173e6E9790C346aCfe9BC02b54AA81841427A</Box>
                  <BiLinkExternal />
                </Box>
              </a>
              <a
                href={
                  "https://etherscan.io/token/0x84FA8f52E437Ac04107EC1768764B2b39287CB3e"
                }
                target={"_blank"}
                rel="noreferrer"
              >
                <Box>GroveToken ERC-20:</Box>
                <Box display={"flex"} alignItems={"center"}>
                  <Box> 0x84FA8f52E437Ac04107EC1768764B2b39287CB3e</Box>
                  <BiLinkExternal />
                </Box>
              </a>
              <a
                href={
                  "https://etherscan.io/token/0x1f1B4836Dde1859e2edE1C6155140318EF5931C2"
                }
                target={"_blank"}
                rel="noreferrer"
              >
                <Box>LPToken ERC-20:</Box>
                <Box display={"flex"} alignItems={"center"}>
                  <Box> 0x1f1B4836Dde1859e2edE1C6155140318EF5931C2</Box>
                  <BiLinkExternal />
                </Box>
              </a>
            </ContractInfo>
          </Box>
        </Box>

        <Box ml={sm ? 0 : "62px"} mt={sm ? 0 : "-36px"}>
          <Box
            fontSize={xs ? "calc(100vw / 412 * 20)" : "24px"}
            fontWeight={"bold"}
            mt={sm ? "20px" : 0}
          >
            REWARDS
          </Box>
          <Panel
            width={sm ? "100%" : "303px"}
            maxWidth={sm ? "650px" : "unset"}
            height={sm ? "unset" : "407px"}
            type={"primary"}
            justifyContent={"unset"}
            padding={
              xs
                ? "calc(100vw / 412 * 22) calc(100vw / 412 * 17) calc(100vw / 412 * 30) calc(100vw / 412 * 17)"
                : "22px 17px 30px 17px"
            }
            mt={sm ? "20px" : "36px"}
            mb={sm ? "10px" : 0}
            fontSize={xs ? "calc(100vw / 412 * 14)" : "18px"}
            lineHeight={"120%"}
            fontWeight={600}
          >
            <Box pl={xs ? "calc(100vw / 412 * 16)" : 0}>
              <Box
                maxWidth={"72px"}
                maxHeight={"73px"}
                minWidth={"72px"}
                minHeight={"73px"}
                display={"flex"}
              >
                <img
                  src={"/logo.png"}
                  alt={""}
                  width={"100%"}
                  height={"100%"}
                />
              </Box>
              <Box mt={xs ? "calc(100vw / 412 * 20)" : "25px"}>
                <Box>Balance</Box>
                <Box fontWeight={500}>{Balance.detail}</Box>
              </Box>
              <Box mt={xs ? "calc(100vw / 412 * 18)" : "23px"}>
                <Box>Balance Price</Box>
                <Box fontWeight={500}>
                  $
                  <CountUp
                    start={Balance.prevalue * price[chainID]}
                    end={Balance.value * price[chainID]}
                    decimals={2}
                    formattingFn={(value) => {
                      return Number(value).toFixed(2);
                    }}
                  />
                </Box>
              </Box>
              <Box mt={xs ? "calc(100vw / 412 * 18)" : "23px"}>
                <Box>Pending Rewards</Box>
                <Box fontWeight={500}>
                  $
                  <CountUp
                    start={PendingReward.prevalue}
                    end={PendingReward.value}
                    decimals={2}
                    formattingFn={(value) => {
                      return Number(value).toFixed(2);
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Box mt={xs ? "calc(100vw / 412 * 18)" : "23px"}>
              <Button
                width={"100%"}
                height={xs ? "calc(100vw / 412 * 32)" : "50px"}
                type={"primary"}
                fontSize={xs ? "calc(100vw / 412 * 12)" : "unset"}
                disabled={pending || !account}
                onClick={() => onClaim()}
              >
                Claim Rewards
              </Button>
            </Box>
          </Panel>
        </Box>
      </Field>
    </StyledContainer>
  );
};

const ContractInfo = styled(Box)`
  margin-top: 33px;
  background: linear-gradient(
    110deg,
    rgba(18, 22, 51, 0.5),
    rgba(8, 13, 43, 0.5) 40%,
    rgba(1, 5, 30, 0.5) 130%
  );
  border-radius: 10px;
  border: 2px solid rgb(0, 120, 143);
  padding: 24px;
  width: 100%;
  > a {
    display: flex;
    align-items: center;
    font-size: 15px;
    cursor: pointer;
    margin-bottom: 20px;
    > div > div {
      margin-right: 8px;
    }
    > div > svg {
      color: #00ebff;
    }
    flex-wrap: wrap;
  }
  > a:last-child {
    margin: 0;
  }
  @media screen and (max-width: 680px) {
    padding: calc(100vw / 412 * 12);
    margin-top: calc(100vw / 412 * 20);
    > a {
      font-size: calc(100vw / 412 * 12);
    }
  }
`;

const Vector = styled(Box)`
  position: absolute;
  right: 10px;
  top: 10px;
  @media screen and (max-width: 680px) {
    transform: scale(0.57);
    right: calc(-100vw / 412 * 3);
    top: calc(-100vw / 412 * 2);
  }
`;

const Panel = styled(Box)`
  background: ${({ type }) =>
    type === "primary"
      ? "linear-gradient(to bottom, rgba(0,255,235,0.2), rgba(0,0,0,0))"
      : "linear-gradient(110deg, #0C860F, #80AB46 40%, #E4DE4F 80%, #E7CD44) 120%"};
  border: ${({ type }) =>
    type === "primary" ? "2px solid rgb(50,54,83)" : "none"};
  border-radius: 10px;
  margin-bottom: 50px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0px 0px 0px 25px;
  @media screen and (max-width: 680px) {
    padding: 0 calc(100vw / 412 * 11) 0 calc(100vw / 412 * 17);
    margin-bottom: calc(100vw / 412 * 30);
  }
`;

const InfoPanel = styled(Box)`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const Field = styled(Box)`
  display: flex;
  @media screen and (max-width: 1180px) {
    flex-direction: column-reverse;
  }
`;

const StyledContainer = styled(Box)`
  color: white;
  font-weight: 500;
  padding: 56px 46px 100px 46px;
  height: fit-content;
  width: 100%;
  @media screen and (max-width: 800px) {
    width: fit-content;
    margin: 0 auto;
    padding: 56px 30px 100px 30px;
  }
  @media screen and (max-width: 680px) {
    width: fit-content;
    margin: 0 auto;
    padding: calc(100vw / 412 * 40) calc(100vw / 412 * 24)
      calc(100vw / 412 * 50) calc(100vw / 412 * 20);
  }
`;

export default Home;
