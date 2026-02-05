import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Droplets, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Enter details, 2: Verify OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.sendOTP({
        email,
        purpose: 'registration'
      });

      toast.success(`OTP sent to ${email}. Please check your email.`);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
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
        purpose: 'registration'
      });

      const response = await authAPI.register({
        email,
        otp,
        name,
        password
      });

      // Django returns tokens.access instead of just token
      const token = response.data.tokens.access;
      const user = response.data.user;

      login(token, user);
      toast.success('Registration successful!');

      // All users start as 'user' role, admin can be set via Django Admin
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await authAPI.sendOTP({
        email,
        purpose: 'registration'
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

        <Card data-testid="register-card">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              {step === 1
                ? 'Create a new account to start monitoring water usage'
                : 'Enter the OTP sent to your email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4" data-testid="register-form">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="password-input"
                  />
                  <p className="text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="send-otp-button"
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
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" data-testid="verify-otp-form">
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
                    data-testid="otp-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                  data-testid="register-submit-button"
                >
                  {loading ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Registration
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

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-blue-600 hover:underline" data-testid="login-link">
                Login here
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> All new users are registered as regular users.
            Admin access can be granted via the Django Admin portal by a superuser.
          </p>
        </div>
      </div>
    </div>
  );
}
