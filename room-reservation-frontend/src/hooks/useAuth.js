import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { 
  useSignInMutation, 
  useSignUpMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
} from '../store/api';

const FIXED_SALT = '$2a$10$fixedSaltForTestingPurposeOnly12';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [signIn, { isLoading: signInLoading }] = useSignInMutation();
  const [signUp, { isLoading: signUpLoading }] = useSignUpMutation();
  const [logoutMutation, { isLoading: logoutLoading }] = useLogoutMutation();
  const [deleteAccountMutation, { isLoading: deleteLoading }] = useDeleteAccountMutation();

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const hashPassword = async (password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, FIXED_SALT);
      return hashedPassword;
    } catch (error) {
      console.error('Ошибка хеширования пароля:', error);
      throw new Error('Ошибка при хешировании пароля');
    }
  };

  const login = async (email, password) => {
    try {
      const hashedPassword = await hashPassword(password);
      
      const data = await signIn({ 
        email, 
        password: hashedPassword
      }).unwrap();
      
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Ошибка входа';
      
      if (error.status === 401) {
        if (error.data?.error) {
          errorMessage = error.data.error;
        } else {
          errorMessage = 'Неверный email или пароль';
        }
      } else if (error.status === 400) {
        errorMessage = 'Неверный JSON или валидация не пройдена';
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, name) => {
    try {
      const hashedPassword = await hashPassword(password);
      
      await signUp({ 
        email, 
        password: hashedPassword,
        name 
      }).unwrap();
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Ошибка регистрации';
      
      if (error.status === 409) {
        errorMessage = 'Пользователь с таким email уже существует';
      } else if (error.status === 400) {
        errorMessage = 'Неверный JSON или валидация не пройдена';
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.warn('Server logout failed, but clearing local data:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  const deleteAccount = async () => {
    try {
      await deleteAccountMutation().unwrap();
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      let errorMessage = 'Ошибка при удалении аккаунта';
      
      if (error.status === 401) {
        errorMessage = 'Сессия истекла, войдите снова';
      } else if (error.status === 404) {
        errorMessage = 'Эндпоинт удаления аккаунта не найден';
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
    const savedUser = localStorage.getItem('user');
    
    if (!savedUser) {
      setUser(null);
      return { success: false, error: 'No user data found' };
    }

    try {
      const response = await fetch('https://team3.verstack.ru/api/account/my-apartments', {
        credentials: 'include',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('user');
        setUser(null);
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          navigate('/login');
        }
        return { success: false, error: 'Token expired' };
      }

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      return { success: true, user: parsedUser };
    } catch (e) {
      console.error('Failed to refresh user:', e);
      return { success: false, error: 'Invalid user data' };
    }
  };

  return { 
    user, 
    loading: loading || signInLoading || signUpLoading || logoutLoading || deleteLoading,
    login, 
    register, 
    logout, 
    deleteAccount,
    refreshUser,
    isAuth: !!user 
  };
}