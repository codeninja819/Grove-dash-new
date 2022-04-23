/* eslint-disable jsx-a11y/alt-text */
import { Box, useMediaQuery } from "@mui/material";
import ConnectMenu from "./ConnectMenu.jsx";
import styled from "styled-components";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Button from "../Button";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import Hamburger from "./Hamburger";
import { useWeb3Context } from "../../context/web3Context";
import { switchNetwork } from "../../utils/functions";

function TopBar({ setNotification, curpage, setCurPage }) {
  const [dropdownopen, setDropDownOpen] = useState(false);
  const { chainID } = useWeb3Context();
  const dialog = useRef();

  useEffect(() => {
    document.addEventListener("mouseup", function (event) {
      if (dialog && dialog.current && !dialog.current.contains(event.target)) {
        setDropDownOpen(false);
      }
    });
  }, []);

  const chains = {
    1: {
      url: "/icons/eth.png",
      text: "ETH Chain",
      id: 1,
    },
    56: {
      url: "/icons/binance.png",
      text: "BNB Chain",
      id: 56,
    },
  };

  const md = useMediaQuery("(max-width : 1600px)");
  const sm = useMediaQuery("(max-width : 450px)");

  return (
    <>
      <Box display={md ? "block" : "none"}>
        <Hamburger
          setNotification={setNotification}
          curpage={curpage}
          setCurPage={setCurPage}
        />
      </Box>
      <StyledContainer>
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Box display={"flex"} alignItems={"center"}>
            <Box
              borderRight={sm ? "1px solid #242E45" : "none"}
              padding={sm ? "7px 7px 7px 5px" : 0}
            >
              <a
                href={"https://www.grovetoken.com/"}
                target={"_blank"}
                rel="noreferrer"
              >
                <Box
                  display={"flex"}
                  maxWidth={sm ? "39px" : "72px"}
                  maxHeight={sm ? "39px" : "73px"}
                  minWidth={sm ? "39px" : "72px"}
                  minHeight={sm ? "39px" : "73px"}
                >
                  <img src={"/logo.png"} width={"100%"} height={"100%"} />
                </Box>
              </a>
            </Box>
            <Box ml={sm ? "6px" : "54px"}>
              <Box fontSize={sm ? "19px" : "24px"} fontWeight={"bold"}>
                GroveToken
              </Box>
              <Box
                display={"flex"}
                mt={sm ? "-2px" : "5px"}
                maxWidth={sm ? "120px" : "147px"}
                maxHeight={sm ? "10px" : "12px"}
                minWidth={sm ? "120px" : "147px"}
                minHeight={sm ? "10px" : "12px"}
              >
                <img src={"/logotext.png"} />
              </Box>
            </Box>
          </Box>
          <Box display={"flex"} alignItems={"center"}>
            <Menus active={curpage}>
              <Link to={"/"} onClick={() => setCurPage(1)}>
                Overview
              </Link>
              <Link to={"/staking"} onClick={() => setCurPage(2)}>
                Staking
              </Link>
              <Link to={"/farming"} onClick={() => setCurPage(3)}>
                Farming
              </Link>
              <Link to={"/bridge"} onClick={() => setCurPage(4)}>
                Bridge
              </Link>
            </Menus>
            <Buttons ml={"21px"}>
              <a
                href={"https://earn.brewlabs.info/swap"}
                target={"_blank"}
                rel="noreferrer"
                style={{ display: md ? "none" : "block" }}
              >
                <Button type={"buy"} width={"227px"} height={"50px"}>
                  <Box
                    display={"flex"}
                    minWidth={"33px"}
                    minHeight={"33px"}
                    maxWidth={"33px"}
                    maxHeight={"33px"}
                    borderRadius={"50%"}
                    border={"1px solid white"}
                  >
                    <img src={"/logo.png"} width={"100%"} height={"100%"} />
                  </Box>
                  <Box fontWeight={600} ml={"13px"}>
                    Buy Grove Token
                  </Box>
                </Button>
              </a>
              {chainID === 1 || chainID === 56 ? (
                <DropDown
                  onClick={() => setDropDownOpen(!dropdownopen)}
                  active={dropdownopen}
                  ref={dialog}
                  mx={"40px"}
                >
                  <img
                    src={chains[chainID].url}
                    style={{
                      borderRadius: "50%",
                      minWidth: "27px",
                      maxWidth: "27px",
                      minHeight: "27px",
                      maxHeight: "27px",
                    }}
                  />
                  <Box>{chains[chainID].text}</Box>
                  {dropdownopen ? <AiFillCaretUp /> : <AiFillCaretDown />}
                  <DropDownBody active={dropdownopen}>
                    {Object.values(chains).map((data, i) => {
                      return (
                        <Box
                          key={i}
                          onClick={() => {
                            switchNetwork(data.id, setNotification);
                          }}
                        >
                          <img
                            src={data.url}
                            style={{
                              borderRadius: "50%",
                              minWidth: "27px",
                              maxWidth: "27px",
                              minHeight: "27px",
                              maxHeight: "27px",
                            }}
                          />
                          <Box>{data.text}</Box>
                        </Box>
                      );
                    })}
                  </DropDownBody>
                </DropDown>
              ) : (
                <WrongNetwork mx={"40px"}>
                  <Box display={"flex"} alignItems={"center"}>
                    <Box
                      mr={"10px"}
                      minWidth={"25px"}
                      minHeight={"25px"}
                      maxWidth={"25px"}
                      maxHeight={"25px"}
                      display={"flex"}
                    >
                      <img
                        src={"/icons/wrongnetwork.png"}
                        width={"100%"}
                        height={"100%"}
                      />
                    </Box>
                    <Box>Wrong Network</Box>
                  </Box>
                </WrongNetwork>
              )}
              <ConnectMenu setNotification={setNotification} />
            </Buttons>
          </Box>
        </Box>
      </StyledContainer>
    </>
  );
}

const WrongNetwork = styled(Box)`
  z-index: 100;
  background: #c43547a6;
  border-radius: 5px;
  width: 186px;
  height: 50px;
  padding: 12px 10px 11px 10px;
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  position: relative;
`;

const DropDownBody = styled.div`
  position: absolute;
  left: 0px;
  top: 50px;
  width: 186px;
  > div {
    display: flex;
    align-items: center;
    padding: 12px 19px 11px 18px;
    > div {
      margin-left: 9px;
      margin-right: 6px;
    }
    :hover {
      background: #64789a;
    }
  }
  background-image: linear-gradient(to top, #64789a, #2a3340);
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  overflow: hidden;
  height: ${({ active }) => (active ? "102px" : "0")};
  z-index: 100;
`;

const DropDown = styled(Box)`
  z-index: 100;
  background: #364153;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border-bottom-left-radius: ${({ active }) => (active ? "0" : "5px")};
  border-bottom-right-radius: ${({ active }) => (active ? "0" : "5px")};
  width: 186px;
  height: 50px;
  padding: 12px 19px 11px 18px;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  > div:nth-child(2) {
    margin-left: 9px;
    margin-right: 6px;
  }
  cursor: pointer;
  position: relative;
`;
const Menus = styled(Box)`
  > a {
    cursor: pointer;
    padding: 14px 32px;
    font-size: 18px;
    font-weight: 700;
    line-height: 122%;
    border-radius: 5px;
    margin-right: 9px;
    color: white;
    transition: all 0.3s;
    text-decoration: none;
  }
  display: flex;
  > a:nth-child(${({ active }) => active}) {
    background: #364153;
  }
  @media screen and (max-width: 1600px) {
    display: none;
  }
`;

const Buttons = styled(Box)`
  display: flex;
  align-items: center;
  @media screen and (max-width: 1600px) {
    margin-right: 50px;
  }
  @media screen and (max-width: 800px) {
    display: none;
  }
`;

const StyledContainer = styled(Box)`
  padding: 9px 49px 8px 9px;
  border-bottom: 1px solid #242e45;
  z-index: 100;
  position: relative;
  @media screen and (max-width: 450px) {
    padding: 0;
  }
`;

export default TopBar;
