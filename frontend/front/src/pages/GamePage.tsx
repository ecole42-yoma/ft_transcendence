import { useEffect, useState } from "react";
import BackGround from "../components/BackGround";
import "../components/GamePage/PingPong";
import PingPong from "../components/GamePage/PingPong";
import TopBar from "../components/TopBar";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  isGameStartedAtom,
  isLoadingAtom,
  isMatchedAtom,
  isPrivateAtom,
  isGameQuitAtom,
  gameInviteInfoAtom,
  gameSocketAtom,
  gameModeAtom,
  isP1Atom,
  gameWinnerAtom,
  playersAtom,
} from "../components/atom/GameAtom";

import * as chatSocket from "../socket/chat.socket";
import * as chatAtom from "../components/atom/ChatAtom";
import { gameResultModalAtom } from "../components/atom/ModalAtom";
import GameResultModal from "../components/GamePage/GameResultModal";
import LadderBoard from "../components/GamePage/LadderBoard";

import Waiting from "../components/GamePage/Waiting";
import { AdminLogPrinter, PressKey } from "../event/event.util";
import { io, Socket } from 'socket.io-client';
import { UserAtom } from "../components/atom/UserAtom";
import { GameType } from "../socket/game.dto";
import { p1, p2 } from "../components/GamePage/GameInfo";

export default function GamePage() {
  const [showComponent, setShowComponent] = useState(true);
  const [gameResultModal, setGameResultModal] = useAtom(gameResultModalAtom);

  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [isMatched, setIsMatched] = useAtom(isMatchedAtom);
  const [isPrivate, setIsPrivate] = useAtom(isPrivateAtom);
  const [isGameStart, setIsGameStart] = useAtom(isGameStartedAtom);
  const setIsGameQuit = useSetAtom(isGameQuitAtom);
  const [gameInviteInfo, setGameInviteInfo] = useAtom(gameInviteInfoAtom);
  const [gameMode, setGameMode] = useAtom(gameModeAtom);

  const [adminConsole, setAdminConsole] = useAtom(chatAtom.adminConsoleAtom);

  const [userInfo, setUserInfo] = useAtom(UserAtom);

  const userList = useAtomValue(chatAtom.userListAtom);

  // const [socket, setSocket] = useState(io());

  const [gameSocket, setGameSocket] = useAtom(gameSocketAtom);
  const [isP1, setIsP1] = useAtom(isP1Atom);

  const gameWinner = useAtomValue(gameWinnerAtom);
  const [players, setPlayers] = useAtom(playersAtom);

  class socketAuth {
    token: string | null;
    type: GameType;
    invite?: number;
    observ?: number;
    constructor(inviteInfo: {gameType: string, userId: number}) {
      this.token = localStorage.getItem("refreshToken");
      this.type = isPrivate ? GameType.PRIVATE : GameType.PUBLIC;
      if (inviteInfo.gameType === 'invite') {
        this.invite = inviteInfo.userId;
      } else if (inviteInfo.gameType === 'observe') {
        this.observ = inviteInfo.userId;
      }
    }
  }

  PressKey(["F4"], () => {
    setAdminConsole((prev) => !prev);
  });

  const clearState = () => {
    setIsPrivate(false);
    // setIsGameStart(false);
    setIsLoading(false);
    setIsMatched(false);
    setIsGameQuit(true);
    setGameMode('normal');
  };

  useEffect(() => {
    AdminLogPrinter(adminConsole, `gameSocket connection`);
    const auth = new socketAuth(gameInviteInfo);
    gameSocket.auth = auth;
    const socket = gameSocket;
    socket.connect();
    setGameSocket(socket);
    setGameInviteInfo({ gameType: 'queue', userId: -1 });
    setIsGameQuit(false);
    setIsLoading(true);
    return () => {
      clearState();
      gameSocket.disconnect();
    };
  }, []);

  const connectionEventHandler = () => {
    if (gameSocket.connected) {
      //This attribute describes whether the socket is currently connected to the server.
      if (gameSocket.recovered) {
        // any missed packets will be received
      } else {
        // new or unrecoverable session
        AdminLogPrinter(adminConsole, "gameSocket connected");
      }
    }
  };

  //https://socket.io/docs/v4/client-socket-instance/#disconnect
  const disconnectionEventHandler = (reason: string) => {
    if (reason === "io server disconnect") {
    }
    console.log(`gameSocket end`, reason);
    clearState();
    AdminLogPrinter(adminConsole, "gameSocket disconnected");
  };

  const gameStartEventHandler = () => {
    AdminLogPrinter(adminConsole, "game start");
    setIsLoading(false);
    setIsMatched(false);
    setIsGameStart(true);
  };

  const matchEventHandler = ({p1, p2}: { p1: number, p2: number }) => {
    AdminLogPrinter(adminConsole, "matched");
    if (p1 === userInfo.uid) {
      setIsP1(true);
    } else {
      setIsP1(false);
    }
    setPlayers([p1, p2]);
    setIsMatched(true);
  };

  const observerHandler = () => {
    AdminLogPrinter(adminConsole, "observer");
    setIsLoading(false);
    setIsGameStart(true);
  };

  useEffect(() => {
    AdminLogPrinter(
      adminConsole,
      `useeffect: isLoading: ${isLoading}, isPrivate: ${isPrivate}, isMatched: ${isMatched}, isGameStart: ${isGameStart}`
    );
  }, [isLoading, isPrivate, isGameStart, isMatched, gameSocket]);

  useEffect(() => {
    gameSocket.on("connect", connectionEventHandler);
    gameSocket.on("gameStart", gameStartEventHandler);
    return () => {
      gameSocket.off("connect", connectionEventHandler);
      gameSocket.off("gameStart", gameStartEventHandler);
    };
  }, [isGameStart, gameSocket]);

  useEffect(() => {
    gameSocket.on("disconnect", disconnectionEventHandler);
    return () => {
      gameSocket.off("disconnect", disconnectionEventHandler);
    };
  }, [isPrivate, isGameStart, gameSocket]);

  useEffect(() => {
    gameSocket.on("matched", matchEventHandler);
    return () => {
      gameSocket.off("matched", matchEventHandler);
    }
  }, [isMatched, gameSocket]);

  // useEffect(() => {
  //   return () => {
  //   }
  // }, [isLoading, isMatched, isGameStart]);

  return (
    <BackGround>
      {adminConsole ? (
        <div>
          <button
            onClick={() => {
              const loading = !isLoading;
              setIsLoading(loading);
            }}
          >
            LadderRanking
          </button>
          <button
            onClick={() => {
              const gameOverModal = !gameResultModal;
              setGameResultModal(gameOverModal);
            }}
          >
            GameOver
          </button>
        </div>
      ) : (
        ""
      )}
      <TopBar />
      {isLoading ? (
        isPrivate ? (
          <Waiting />
        ) : (
          isMatched ? (
            <Waiting />
          ) : (
            <LadderBoard />
          )
        )
      ) : isGameStart ? (
        <PingPong />

      ) : (
        <Waiting />
      )}
      {gameResultModal ? <GameResultModal winner={userList[gameWinner]?.userDisplayName} leftScore={isP1? p1.score : p2.score} rightScore={isP1? p2.score : p1.score} /> : null}
    </BackGround>
  );
}
