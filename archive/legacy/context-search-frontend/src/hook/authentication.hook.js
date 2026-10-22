import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

import { loginAPI, registerAPI, logoutAPI, checkAuthAPI } from '../api/authentication.api';
import { useAuth } from '../helper/auth.context';


export const useRegister = () => {
  const navigate = useNavigate();
  const registerUser = async (username, email, hash_password, confirm_password) => {
    const data = await registerAPI(username, email, hash_password, confirm_password);

    if (data.status === "success") {
      navigate('/login');
    }

    return data;
  }
  return { registerUser };
}

export const useLogin = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const loginUser = async (email, hash_password) => {
    const data = await loginAPI(email, hash_password);

    if (data.status !== "success") return data;

    await checkAuth();
    navigate("/profiles");

    return data;
  };

  return { loginUser };
};

export const useLogout = () => {
  const navigate = useNavigate();
  const logoutUser = async () => {
    const data = await logoutAPI();
    if (data.status === "success") {
      navigate('/login');
    }
    return data;
  }
  return { logoutUser };
}
