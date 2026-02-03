import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { phone, countryCode } = (location.state as { phone: string; countryCode: string }) || {};

  useEffect(() => {
    // Redirect if no phone/countryCode in state
    if (!phone || !countryCode) {
      navigate('/forgot-password');
      return;
    }
    
    // Focus first input
    inputRefs.current[0]?.focus();
  }, [phone, countryCode, navigate]);

  useEffect(() => {
    // Countdown timer for resend
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedValue.length && index + i < 6; i++) {
        if (/^\d$/.test(pastedValue[i])) {
          newOtp[index + i] = pastedValue[i];
        }
      }
      setOtp(newOtp);
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + pastedValue.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const response = await api.post<{ message: string }>(
        '/api/auth/forgot-password/',
        { phone, country_code: countryCode }
      );

      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        toast.success('OTP sent successfully');
        setResendCooldown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.post<{ message: string; verified: boolean }>(
        '/api/auth/verify-otp/',
        { phone, country_code: countryCode, otp: otpCode }
      );

      if (response.error) {
        toast.error(response.error);
      } else if (response.data?.verified) {
        toast.success('OTP verified successfully');
        navigate('/reset-password', { 
          state: { phone, countryCode, otp: otpCode } 
        });
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!phone || !countryCode) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="My Cafe" className="h-12 w-auto max-h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your WhatsApp
            <br />
            <span className="font-medium">+{countryCode} {phone}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Enter OTP</Label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold"
                  />
                ))}
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            
            <div className="text-center text-sm">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              ) : (
                <span className="text-muted-foreground">
                  Resend OTP in {resendCooldown}s
                </span>
              )}
            </div>
            
            <div className="text-center">
              <Link 
                to="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Change Phone Number
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
