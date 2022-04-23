import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useWeb3Context } from "./context/web3Context";

import { Box } from "@mui/material";
import styled from 'styled-components'
import Home from './pages/Home'
import Staking from './pages/Staking'
import Farming from './pages/Farming'
import Bridge from './pages/Bridge'
import TopBar from "./components/TopBar/TopBar";
import LeftSideBar from './components/LeftSideBar/LeftSideBar'
import Footer from './components/Footer/Footer'

import './App.css'
import Notification from "./components/Notification";

function App() {
  const { connect, hasCachedProvider } = useWeb3Context();

  const [notification, setNotification] = useState(null);
  const [curpage, setCurPage] = useState(0)


  useEffect(() => {
    if (hasCachedProvider()) {
      // then user DOES have a wallet
      console.log("hasCachedProvider")
      connect().then(msg => {
        if (msg.type === 'error') {
          setNotification(msg)
        }
      });

    } else {
      // then user DOES NOT have a wallet
    }

    // We want to ensure that we are storing the UTM parameters for later, even if the user follows links
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>

      <StyledContainer>
        <TopBar setNotification={setNotification} curpage={curpage} setCurPage={setCurPage} />

        <Box display={'flex'} width={'100%'} zIndex={10} position={'relative'}>
          <LeftSideBar curpage={curpage} setCurPage={setCurPage} />

          <Routes>

            <Route exact path="/" element={<Home setNotification={setNotification} />} />

            <Route exact path="/staking" element={<Staking setNotification={setNotification} />} />

            <Route exact path="/farming" element={<Farming setNotification={setNotification} />} />

            <Route exact path="/bridge" element={<Bridge setNotification={setNotification} />} />

          </Routes>
        </Box>
        <Back />
        <Vector />

        <Footer />
      </StyledContainer>

      <Notification data={notification} />
    </BrowserRouter >
  );
}

const Vector = styled(Box)`
  background-image : url('/images/vector.png');
  background-size : 100% 100%;
  width : 244px;
  height : 244px;
  bottom : 65px;
  right : 77px;
  position : absolute;
  @media screen and (max-width : 800px){
    display : none;
  }
`;

const Back = styled(Box)`
  background-image : url('/images/background.jpg');
  background-size : 2000px 1080px;
  background-position : center;
  background-repeat : no-repeat;
  position : absolute;
  left : 0;
  top : 0;
  width : 100%;
  height : 100%;
  opacity : 0.1;
  z-index  : 1;
`;

const StyledContainer = styled(Box)`
  position : relative;
  min-height : 100vh;
  width : 100vw;
  overflow-x : hidden;
 
`;

export default App;
