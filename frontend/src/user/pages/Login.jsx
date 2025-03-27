import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, logout, selectIsAuthenticated } from "../../redux/slices/authSlice";
import Swal from "sweetalert2";
import {fetchUserProfile} from "../../redux/slices/userSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated); // Check if user is already authenticated
  const backendUrl = "https://d81b-2405-201-f018-f0ba-b00e-df89-2fab-fee2.ngrok-free.app";


  const token = useSelector((state) => state.auth.token);
console.log("Token in Redux state:", token); // Should print the token

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Load token and user on page refresh (Merged both useEffects)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
  
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser); // Safely parse
        dispatch(loginSuccess({ token: storedToken, user }));
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("user"); // Clear invalid data
        localStorage.removeItem("token"); // Clear token too for consistency
        dispatch(logout()); // Reset auth state
      }
    } else {
      dispatch(logout()); // No valid data, log out
    }
  }, [dispatch]);
    
    

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true }); // Redirect to home and replace history
    }
  }, [isAuthenticated, navigate]);


  useEffect(() => {
    const initializeGoogleSignIn = () => {
      /* global google */
      google.accounts.id.initialize({
        client_id: "1063960380483-r5rjuccv61c7pel45o2q864ijbo45t2v.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
        theme: "outline",
        size: "large",
      });
    };
    initializeGoogleSignIn();
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const result = await axios.post(`${backendUrl}/google-login`, {
        token: response.credential,
      });
      console.log("Response from backend:", result);
      console.log("Response Data:", result.data);
      if (result.data.success) {
        const { token, user } = result.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        dispatch(loginSuccess({ token, user }));
        toast.success("Google Sign-In successful!");
        navigate("/", { replace: true });
      } else {
        toast.error(result.data.message || "Google Sign-In failed or your account is blocked by the admin");
      }
    } catch (error) {
      toast.error("Error during Google Sign-In");
    }
  };

  

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${backendUrl}/login`, data);
  
      console.log("Response from server:", response); // Debugging
    console.log("Response Data:", response.data); 
      if (response?.status === 403 && response?.data?.userBlocked) {
        Swal.fire({
          icon: "error",
          title: "Account Blocked",
          text: "Your account has been blocked by the admin. Contact support.",
        });
      } else if (response?.data?.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token); // Store token in localStorage
        localStorage.setItem('user', JSON.stringify(user)); 
        console.log(token)
      
        dispatch(loginSuccess({ token, user }));
  
        dispatch(fetchUserProfile()); // Missing closing bracket was here
        toast.success("Login successful!");
        navigate("/", { replace: true });
      } else {
        toast.error(response?.data?.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Caught error:", error);
  
      if (error.response) {
        if (error.response.status === 403 && error.response.data?.userBlocked) {
          Swal.fire({
            icon: "error",
            title: "Account Blocked",
            text: "Your account has been blocked by the admin. Contact support.",
          });
        } else {
          toast.error(error.response.data?.message || "Login failed. Please try again.");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    }
  };
  

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", padding: "50px 0" }}
    >
      <div
        className="card shadow-sm p-4"
        style={{ maxWidth: "400px", width: "100%", borderRadius: "10px" }}
      >
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Email"
              className="form-control"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            {errors.email && <p className="text-danger">{errors.email.message}</p>}
          </div>
          <div className="mb-3">
            <input
              type="password"
              placeholder="Password"
              className="form-control"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
            />
            {errors.password && <p className="text-danger">{errors.password.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-3">
            Log In
          </button>
        </form>
        <div id="google-signin-button" className="mb-3"></div>
        <div className="text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="text-decoration-underline text-primary">
              Create Account
            </Link>
          </p>
          <p>
          <Link to="/forgot-password" className="text-primary">
  Forgot Password?
</Link>

          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
