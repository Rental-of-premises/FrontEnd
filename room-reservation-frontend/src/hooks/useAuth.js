// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useSignInMutation, 
  useSignUpMutation,
  useLogoutMutation,
} from '../store/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [signIn, { isLoading: signInLoading }] = useSignInMutation();
  const [signUp, { isLoading: signUpLoading }] = useSignUpMutation();
  const [logoutMutation, { isLoading: logoutLoading }] = useLogoutMutation();

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await signIn({ email, password }).unwrap();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Ошибка входа';
      
      if (error.status === 401) {
        errorMessage = 'Неверный email или пароль';
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
      const userData = await signUp({ email, password, name }).unwrap();
      
      const loginResult = await login(email, password);
      
      if (loginResult.success) {
        return { success: true };
      }
      
      console.warn('User registered but auto-login failed:', loginResult.error);
      return { 
        success: false, 
        error: 'Аккаунт создан, но не удалось войти автоматически. Пожалуйста, войдите вручную.',
        userCreated: true 
      };
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Ошибка регистрации';
      
      if (error.status === 409) {
        errorMessage = 'Пользователь с таким email уже существует';
      } else if (error.status === 400) {
        errorMessage = 'Неверный JSON или валидация не пройдена (email, пароль ≥6 символов, имя)';
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
      console.log('Server logout successful');
    } catch (error) {
      console.warn('Server logout failed, but clearing local data:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      // Перенаправляем на страницу входа
      navigate('/login');
    }
  };

  const deleteAccount = async () => {
    console.warn('Delete account endpoint is not implemented in API specification');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    
    return { 
      success: false, 
      error: 'Функция удаления аккаунта пока не реализована на сервере' 
    };
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        return { success: true, user: parsedUser };
      } catch (e) {
        console.error('Failed to refresh user:', e);
        return { success: false, error: 'Invalid user data' };
      }
    }
    
    return { success: false, error: 'No user data found' };
  };

  return { 
    user, 
    loading: loading || signInLoading || signUpLoading || logoutLoading,
    login, 
    register, 
    logout, 
    deleteAccount,
    refreshUser,
    isAuth: !!user 
  };
}