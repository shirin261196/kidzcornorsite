import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../redux/slices/authSlice";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Reset Password
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(60); // Initial timer value in seconds
  const [otpDisabled, setOtpDisabled] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();


  
  

  useEffect(() => {
    if (timer > 0 && step === 2) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval); // Cleanup interval on component unmount or timer reset
    } else if (timer === 0) {
      setOtpDisabled(false); // Allow resending OTP
    }
  }, [timer, step]);

  const handleSendOtp = async (data) => {
    try {
      setEmail(data.email); // Save email for the next step
      const response = await axios.post("http://localhost:4000/forgot-password", { email: data.email });
      if (response.data.success) {
        toast.success(response.data.message);
        setStep(2);
        setTimer(60); // Reset timer to 60 seconds
        setOtpDisabled(true); // Disable OTP resend button
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error sending OTP");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await axios.post("http://localhost:4000/resend-otp", { email });
      if (response.data.success) {
        toast.success("OTP resent successfully");
        setTimer(60); // Reset timer to 60 seconds
        setOtpDisabled(true); // Disable OTP resend button
      } else {
        toast.error("Invalid OTP");
      }
    } catch (error) {
      toast.error("Error resending OTP");
    }
  };

  const handleResetPassword = async (data) => {
    try {
      const response = await axios.post("http://localhost:4000/reset-password", {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error resetting password");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center">Forgot Password</h3>
              {step === 1 && (
                <form onSubmit={handleSubmit(handleSendOtp)}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
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
                  <button type="submit" className="btn btn-primary w-100">Send OTP</button>
                </form>
              )}
              {step === 2 && (
                <div>
                  <form onSubmit={handleSubmit(handleResetPassword)}>
                    <div className="mb-3">
                      <label htmlFor="otp" className="form-label">OTP</label>
                      <input
                        type="text"
                        id="otp"
                        className="form-control"
                        {...register("otp", { required: "OTP is required" })}
                      />
                      {errors.otp && <p className="text-danger">{errors.otp.message}</p>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        className="form-control"
                        {...register("newPassword", {
                          required: "New password is required",
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters long",
                          },
                        })}
                      />
                      {errors.newPassword && <p className="text-danger">{errors.newPassword.message}</p>}
                    </div>
                    <button type="submit" className="btn btn-success w-100">Reset Password</button>
                  </form>
                  <div className="text-center mt-3">
                    <p>
                      Resend OTP in {timer}s
                    </p>
                    <button
                      className="btn btn-link"
                      disabled={otpDisabled}
                      onClick={handleResendOtp}
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
