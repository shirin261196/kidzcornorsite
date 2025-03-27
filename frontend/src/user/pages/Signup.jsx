import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector} from 'react-redux';
import { loginSuccess, selectIsAuthenticated } from '../../redux/slices/authSlice';

const SignUp = () => {
  const [userId, setUserId] = useState(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0); // Countdown for OTP resend
  const navigate = useNavigate();
  const dispatch = useDispatch();
 
  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true }); // Redirect to home and replace history
    }
  }, [isAuthenticated, navigate]);


  // Handle OTP Countdown Timer
  useEffect(() => {
    if (isOtpSent && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOtpSent, countdown]);

  const onSubmit = async (data) => {
    const { name, email, password } = data; 
    try {
      const response = await axios.post('http://localhost:4000/register', { name, email, password });
      if (response.data.success) {
        setIsOtpSent(true);
        setUserId(response.data.userId);
        setCountdown(60);
        toast.success('OTP sent to your email. Please verify.');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error occurred while registering.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = e.target[0].value; // Get OTP value from input
    try {
      const response = await axios.post('http://localhost:4000/verify-otp', { userId, otp });
      if (response.data.success) {
        toast.success('Registration successful!');
        dispatch(loginSuccess({ token: response.data.token, user: response.data.user }));
        navigate('/login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error verifying OTP');
    }
  };

  const resendOtp = async () => {
    const email = watch('email');
    try {
      const response = await axios.post('http://localhost:4000/resend-otp', { email });
      if (response.data.success) {
        toast.info('OTP resent successfully!');
        setCountdown(60);
       
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error resending OTP');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center">Sign Up</h3>
              {/* Main signup form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Name field */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="text-danger">{errors.name.message}</p>}
                </div>
                {/* Email field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                  {errors.email && <p className="text-danger">{errors.email.message}</p>}
                </div>
                {/* Password field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters long',
                      },
                    })}
                  />
                  {errors.password && <p className="text-danger">{errors.password.message}</p>}
                </div>
                {/* Submit button */}
                <button type="submit" className="btn btn-primary w-100">Register</button>
              </form>

              {/* OTP Section */}
              {isOtpSent && (
                <div className="mt-4">
                  <h4 className="text-center">OTP Verification</h4>
                  <form onSubmit={handleVerifyOtp}>
                    <div className="mb-3">
                      <label htmlFor="otp" className="form-label">Enter OTP</label>
                      <input
                        type="text"
                        id="otp"
                        className="form-control"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-success w-100">Verify OTP</button>
                  </form>
                  <button
                    onClick={resendOtp}
                    className="btn btn-link mt-2"
                    disabled={countdown > 0}
                  >
                    Resend OTP {countdown > 0 ? `(${countdown}s)` : ''}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
