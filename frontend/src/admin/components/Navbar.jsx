import React from 'react';
import styled from 'styled-components';
import { assets } from '../../assets/assets';
import { logout } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';


 // Import Firebase authentication methods

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #343a40;
  color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 20px;
  }
`;

const Logo = styled.img`
  width: 60px; /* Default size */
  height: auto;

  @media (max-width: 768px) {
    width: 50px; /* Smaller logo on smaller screens */
  }
`;

const Title = styled.h3`
  font-size: 1.5rem;
  margin: 0;
  font-weight: bold;
  text-transform: uppercase;
  color: #ffdd57;

  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin: 10px 0;
  }
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:active {
    background-color: #004085;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 8px 16px; /* Adjust padding for smaller screens */
  }
`;

const Navbar = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.info('You have been logged out');
    navigate('/admin/login');
  };




  return (
    <NavbarContainer>
      <Logo src={assets.Logo} alt="Logo" />
      <Title>Admin Panel</Title>
      <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
    </NavbarContainer>
  );
};

export default Navbar;
