import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Droplets, Mail, Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Verify OTP, 3: Set new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      await authAPI.sendOTP({ 
        email, 
        purpose: 'password_reset' 
      });
      
      toast.success(`OTP sent to ${email}. Please check your email.`);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      await authAPI.verifyOTP({ 
        email, 
        otp, 
        purpose: 'password_reset' 
      });
      
      toast.success('OTP verified successfully');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({ 
        email, 
        otp, 
        new_password: newPassword 
      });
      
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await authAPI.sendOTP({ 
        email, 
        purpose: 'password_reset' 
      });
      toast.success('OTP resent successfully');
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Droplets className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FlowGuard</h1>
          <p className="text-gray-600">Water Usage Monitoring System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your email to receive OTP'}
              {step === 2 && 'Enter the OTP sent to your email'}
              {step === 3 && 'Set your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>Sending OTP...</>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-900">
                    <Mail className="inline h-4 w-4 mr-2" />
                    OTP sent to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    Valid for 10 minutes. Check your spam folder if not received.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Verify OTP
                    </>
                  )}
                </Button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-blue-600 hover:text-blue-800"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>Resetting...</>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">
                ← Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
