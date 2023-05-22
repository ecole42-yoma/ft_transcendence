import "../../styles/BackGround.css";
import "../../styles/GamePlayerInfo.css";
import PlayerRecordBoard from "./PlayerRecordBoard";
import CheckBox from "./CheckBox";
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { userListAtom } from '../atom/ChatAtom';
import * as api from "../../event/api.request";
import * as chatAtom from "../../components/atom/ChatAtom";
import * as gameAtom from "../../components/atom/GameAtom";
import { UserType } from '../atom/UserAtom';
import { useEffect, useState } from 'react';
import { refreshTokenAtom } from "../../components/atom/LoginAtom";
import { useNavigate } from 'react-router-dom';

export default function Waiting({ p1, p2 }: { p1: number, p2: number }) {
  const userList = useAtomValue(userListAtom);
  const adminConsole = useAtomValue(chatAtom.adminConsoleAtom);
  const [player1Info, setPlayer1Info] = useState({} as UserType);
  const [player2Info, setPlayer2Info] = useState({} as UserType);
  const setRefreshToken = useSetAtom(refreshTokenAtom);
  const navigate = useNavigate();


  const logOutHandler = () => {
    api.LogOut(adminConsole, setRefreshToken, navigate, "/");
  };

  async function getProfileHandler(setter: React.Dispatch<React.SetStateAction<UserType>>, userId: number) {
    const getProfileResponse = await api.GetOtherProfile(adminConsole, setter, userId);
    if (getProfileResponse === 401) {
      const refreshResponse = await api.RefreshToken(adminConsole);
      if (refreshResponse !== 201) {
        logOutHandler();
      } else {
        const getProfileResponse = await api.GetOtherProfile(
          adminConsole,
          setter,
          userId
        );
        if (getProfileResponse === 401) {
          logOutHandler();
        } else {
          navigate("/profile");
        }
      }
    } else {
      navigate("/profile");
    }
  }

  useEffect(() => {
    getProfileHandler(setPlayer1Info, p1);
    if (p2 !== -42) {
      getProfileHandler(setPlayer2Info, p2);
    }
  }, []);

  return (
    <div className="QueueBackGround">
      <div className="LeftWrap">
        <div className="PlayerWrap">
          <div className="PlayerNickName">{userList[p1].userDisplayName}</div>
          <PlayerRecordBoard records={player1Info.games} userId={player1Info.uid} />
        </div>
      </div>
      <div className="RightWrap">
        <div className="PlayerWrap">
          <div className="PlayerNickName">{p2 !== -42 ? userList[p2].userDisplayName : 'Waiting...'}</div>
          {
            p2 !== -42
              ? <PlayerRecordBoard records={player2Info.games} userId={player2Info.uid} />
              : ''
          }
        </div>
      </div>
      <CheckBox />
    </div>
  );
}
