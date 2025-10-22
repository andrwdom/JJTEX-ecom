import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext';
import GoogleAuth from '../components/GoogleAuth';

const Login = () => {
  const { token, navigate } = useContext(ShopContext)

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  return <GoogleAuth />
}

export default Login