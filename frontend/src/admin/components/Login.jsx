import React, { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginRequest, loginSuccess, loginFailure } from '../../redux/slices/authSlice';
import styled from 'styled-components';
import axios from 'axios';
import { ShopContext } from '../../context/ShopContext';
import { backendUrl } from '../../App';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

const Card = styled.div`
  background-color: white;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const AdminLogin = () => {
  const { setAdminSession } = useContext(ShopContext);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.token);

  const handleLogin = async (data) => {
    dispatch(loginRequest());
    try {
      const response = await axios.post(`${backendUrl}/admin/login`, data, { withCredentials: true });
      if (response?.data?.success) {
        const { token, user } = response.data;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('userRole', user.role);
        dispatch(loginSuccess({ user, token }));
        toast.success('Admin login successful');
      } else {
        dispatch(loginFailure(response?.data?.message));
        toast.error('Login failed');
      }
    } catch (error) {
      dispatch(loginFailure(error.message || 'Unknown error'));
      toast.error('An error occurred');
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedRole = localStorage.getItem('userRole');
    if (storedToken) {
      dispatch(loginSuccess({ token: storedToken, user: { role: storedRole } }));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!token) return;
    const role = localStorage.getItem('userRole');
    if (role === 'admin') {
      navigate('/admin/products/list', { replace: true });
    }
  }, [token, navigate]);

  return (
    <Container>
      <Card>
        <Title>Admin Panel</Title>
        <form onSubmit={handleSubmit(handleLogin)}>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            {errors.email && <span style={{ color: 'red' }}>{errors.email.message}</span>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters long',
                },
              })}
            />
            {errors.password && <span style={{ color: 'red' }}>{errors.password.message}</span>}
          </div>
          <Button type="submit">Login</Button>
        </form>
      </Card>
    </Container>
  );
};

export default AdminLogin;
