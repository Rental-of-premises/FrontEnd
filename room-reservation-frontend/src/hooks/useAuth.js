import { useState, useEffect } from 'react'
import { useSignInMutation, useSignUpMutation } from '../store/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Используем RTK Query хуки
  const [signInMutation] = useSignInMutation()
  const [signUpMutation] = useSignUpMutation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const data = await signInMutation({ email, password }).unwrap()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.data?.message || error.message }
    }
  }

  const register = async (email, password, name) => {
    try {
      const data = await signUpMutation({ email, password, name }).unwrap()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.data?.message || error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const deleteAccount = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    return { success: true }
  }

  return { 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    deleteAccount,
    isAuth: !!user 
  }
}