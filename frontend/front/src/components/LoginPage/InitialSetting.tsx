import "../../styles/LoginModals.css";

import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLogPrinter } from "../../event/event.util";
import * as chatAtom from "../../components/atom/ChatAtom";
import { isFirstLoginAtom, refreshTokenAtom } from "../../components/atom/LoginAtom";
import { useAtom } from "jotai";
import { UserAtom } from "../atom/UserAtom";

import { hasLoginAtom } from "../../components/atom/ChatAtom";
import * as api from '../../event/api.request';

export default function InitialSettingModal() {
  const [profileImage, setProfileImage] = useState("");
  const [adminConsole] = useAtom(chatAtom.adminConsoleAtom);
  const profileRef = useRef<HTMLInputElement>(null);
  const [userInfo] = useAtom(UserAtom);
  const [isFirstLogin, setIsFirstLogin] = useAtom(isFirstLoginAtom);
  const [hasLogin, setHasLogin] = useAtom(hasLoginAtom);
  const [, setRefreshToken] = useAtom(refreshTokenAtom);
  const [checkError, setCheckError] = useState(false);


  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

  const useAutoFocus = () => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [checkError]);

    return inputRef;
  };
  const InitialSaveNameRef = useAutoFocus();

  const saveImageFile = () => {
    if (profileRef.current?.files?.[0]) {
      const newImg = URL.createObjectURL(profileRef.current?.files[0]);
      setProfileImage(newImg);
    }
  };

  const logOutHandler = () => {
    api.LogOut(adminConsole, setRefreshToken, navigate, "/");
  };

  const changeNewImageHandler = async (): Promise<boolean> => {
    if (profileImage === "") {
      return true;
    }
    const formData = new FormData();
    formData.append("profileImage", profileRef.current?.files?.[0]!);
    AdminLogPrinter(adminConsole, profileRef.current?.files?.[0]!.name);

    const changeNickNameRes = await api.changeProfileImage(adminConsole, formData, () => { }, false);
    if (changeNickNameRes === 401) {
      const refreshResponse = await api.RefreshToken(adminConsole);
      if (refreshResponse !== 201) {
        logOutHandler();
      } else {
        const getMeResponse = await api.changeProfileImage(adminConsole, formData, () => { }, false);
        if (getMeResponse == 401) {
          logOutHandler();
        } else {
          setProfileImage("");
          return true;
        }
      }
    } else {
      setProfileImage("");
      return true;
    }
    return false;
  };

  const handleChangeName = async (): Promise<boolean> => {
    const trimNewName = newName.trim();
    if (trimNewName.length < 2 || trimNewName.length > 8) {
      alert("변경할 닉네임은 2글자 이상, 8글자 이하여야 합니다.")
      return false;
    } else if (newName.includes("#")) {
      alert("#은 포함될 수 없습니다.");
      return false;
    }

    const format = JSON.stringify({ nickname: newName });
    AdminLogPrinter(adminConsole, `changeNickName: ${format}`);

    const changeNickNameRes = await api.changeNickName(adminConsole, format, () => { }, false);
    if (changeNickNameRes === 401) {
      const refreshResponse = await api.RefreshToken(adminConsole);
      if (refreshResponse !== 201) {
        logOutHandler();
      } else {
        const getMeResponse = await api.changeNickName(adminConsole, format, () => { }, false);
        if (getMeResponse == 401) {
          logOutHandler();
        } else {
          setNewName("");
          return true;
        }
      }
    } else {
      setNewName("");
      return true;
    }
    return false;
  };


  const setDefaultInfo = async () => {
    const imageRes = await changeNewImageHandler();
    if (imageRes === false) {
      alert("프로필 이미지 변경에 실패했습니다.");
      setProfileImage("");
      setCheckError((prev) => (!prev));
      return;
    }

    const nickRes = await handleChangeName();
    if (nickRes === false) {
      alert("닉네임 변경에 실패했습니다.");
      setNewName("");
      setCheckError((prev) => (!prev));
      return;
    }

    AdminLogPrinter(adminConsole, newName);
    setIsFirstLogin(false);
    setHasLogin(true);
    navigate("/chat");
  };

  return (
    <div className="LoginModalsBG">
      <div
        className="DefaultProfileImg"
        style={{
          backgroundImage: `url(${profileImage === "" ? userInfo.profileUrl : profileImage})`,
          backgroundSize: "200px",
          width: "200px",
          height: "200px",
        }}
      />
      <div className="ChangeProfileImageBtn" onClick={() => { }}>
        <label htmlFor="ChangeImage" />
        <input
          id="ChangeImage"
          type="file"
          accept="image/*"
          multiple={false}
          onChange={saveImageFile}
          ref={profileRef}
        />
      </div>
      <div className="NickNameInitialForm">
        <label htmlFor="InitialSaveName">New Nickname</label>
        <input
          id="InitialSaveName"
          ref={InitialSaveNameRef}
          type="text"
          placeholder="New Nickname"
          maxLength={8}
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
          }}
        />
      </div>
      <button className="InitialSettingSaveBtn" onClick={setDefaultInfo}>
        Save
      </button>
    </div>
  );
}
