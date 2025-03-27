import React, { useContext, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import 'bootstrap/dist/css/bootstrap.min.css';
import styled from 'styled-components';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';  
import { logout } from '../../redux/slices/authSlice';  
import { ShopContext } from '../../context/ShopContext';
import { fetchCart, selectCartItems } from '../../redux/slices/cartSlice';
import { selectWishlistItems } from '../../redux/slices/wishlistSlice'; // Import selector for wishlist

const Logo = styled.img`
  width: 80px;
  height: 60px;
`;

const Icon = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const NavbarComponent = () => {
  const { setShowSearch } = useContext(ShopContext);
  const dispatch = useDispatch();  
  const navigate = useNavigate();  
  const user = useSelector((state) => state.auth.user);
  const items = useSelector(selectCartItems);
  const wishlistItems = useSelector(selectWishlistItems);  // Get wishlist items

  // Calculate cart item count
  const cartItemCount = useMemo(() => {
    return (items || []).reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  // Calculate wishlist item count
  const wishlistItemCount = useMemo(() => {
    return wishlistItems.length;
  }, [wishlistItems]);

  // Fetch cart items when the component mounts
  useEffect(() => {
    if (user && user._id) {
      dispatch(fetchCart(user._id)); // Use the thunk to fetch cart data
    }
  }, [dispatch, user]);

  // Logout function to dispatch Redux action and navigate to login
  const handleLogout = () => {
    console.log("Logging out...");
    dispatch(logout());
    console.log("Logged out successfully");
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="/">
          <Logo src={assets.Logo} alt="Logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={NavLink} to="/">HOME</Nav.Link>
            <Nav.Link as={NavLink} to="/collection">COLLECTION</Nav.Link>
            <Nav.Link as={NavLink} to="/about">ABOUT</Nav.Link>
            <Nav.Link as={NavLink} to="/contact">CONTACT</Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-3 ms-auto">
            <Icon onClick={() => setShowSearch(true)} src={assets.search_icon} alt="Search" />
            
            {user ? (
              <NavDropdown
                title={(
                  <>
                    <Icon src={assets.profile_icon} alt="Profile" />
                    <span className="ms-2">{user.name ? `Hi ${user.name}` : 'Profile'}</span>
                  </>
                )}
                id="profile-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/profile">My Profile</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/orders">Orders</NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={NavLink} to="/login">
                <Icon src={assets.profile_icon} alt="Profile" title="Login" />
              </Nav.Link>
            )}

            <Link to="/cart" className="position-relative">
              <Icon src={assets.cart_icon} alt="Cart" />
              {cartItemCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Wishlist Icon with badge */}
            <Link to="/wishlist" className="position-relative">
              <Icon src={assets.wishlist_icon} alt="Wishlist" />
              {wishlistItemCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
