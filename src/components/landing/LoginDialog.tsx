'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { upsertUser } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox"
import { X } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HyperlinkText: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button type="button" onClick={onClick} className="text-sm text-pink-400 hover:underline focus:outline-none">
        {children}
    </button>
);


const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, auth } = useUser();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', terms: false });
  const [resetForm, setResetForm] = useState({ email: '' });
  const [errors, setErrors] = useState({ email: '', password: '', fullName: '', confirmPassword: '', terms: '', resetEmail: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleAuthSuccess = (redirectPath: string = '/analytics') => {
    onClose();
    router.push(redirectPath);
  };
  
  const handleResetPassword = async () => {
    if (!auth) return;
    if (!resetForm.email) {
      setErrors(prev => ({ ...prev, resetEmail: 'Email is required' }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetForm.email)) {
      setErrors(prev => ({ ...prev, resetEmail: 'Invalid email format' }));
      return;
    }
    
    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');
    
    try {
      await sendPasswordResetEmail(auth, resetForm.email);
      setAuthSuccess(`Password reset email sent to ${resetForm.email}. Please check your inbox.`);
    } catch (error: any) {
      const errorMessage = error.message.replace(/Firebase: |Error \(auth\/[^)]+\)\. /g, '');
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if(!auth) return;
    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await upsertUser({
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName!,
          photoURL: result.user.photoURL!,
      });
      handleAuthSuccess();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
          setAuthError(error.message || 'Google sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateSignIn = () => {
    const newErrors = { ...errors, email: '', password: '' };
    let isValid = true;
    if (!signInForm.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    }
    if (!signInForm.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const validateSignUp = () => {
    const newErrors = { ...errors, fullName: '', email: '', password: '', confirmPassword: '', terms: '' };
    let isValid = true;
    if (!signUpForm.fullName) {
      newErrors.fullName = 'Name is required';
      isValid = false;
    }
    if (!signUpForm.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    }
    if (signUpForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    if (!signUpForm.terms) {
      newErrors.terms = 'You must agree to the terms';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!auth || !validateSignIn()) return;
    
    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      await signInWithEmailAndPassword(auth, signInForm.email, signInForm.password);
      handleAuthSuccess();
    } catch (error: any) {
      const errorMessage = error.message.replace(/Firebase: |Error \(auth\/[^)]+\)\. /g, '');
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!auth || !validateSignUp()) return;
    
    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpForm.email, signUpForm.password);
      const photoURL = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(signUpForm.fullName)}`;
      await updateProfile(userCredential.user, {
        displayName: signUpForm.fullName,
        photoURL: photoURL
      });
      await upsertUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: signUpForm.fullName,
          photoURL: photoURL,
      });
      handleAuthSuccess();
    } catch (error: any) {
       const errorMessage = error.message.replace(/Firebase: |Error \(auth\/[^)]+\)\. /g, '');
       setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  useEffect(() => {
    if (user && isOpen) {
      handleAuthSuccess();
    }
  }, [user, isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <div className="login-overlay" onClick={handleClose}>
      <div
        ref={dialogRef}
        className={`login-dialog ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" onClick={handleClose} className="login-close-button">
          <X />
        </Button>
        
        <div className="login-dialog-content">
          <div className="login-cards-container">
            <div className="login-card-wrapper active">
              <div className="login-card-unified-container dialog">
                <div className="login-card-unified-content">
                  <div className="login-card-unified-left">
                    <div className="login-content">
                      <div className="login-header">
                        <h1 className="login-title">Welcome to Kyozo</h1>
                        <p className="login-subtitle">Create an account or sign in to access your community dashboard and settings.</p>
                      </div>
                      
                      <div className="login-form-content">
                        {activeTab === 'signin' ? (
                          <>
                            <div className="login-form-group">
                              <Input
                                type="email"
                                placeholder="Your Email"
                                value={signInForm.email}
                                onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                              />
                               {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div className="password-wrapper">
                              <div className="password-input-group">
                                  <PasswordInput
                                    placeholder="Password"
                                    value={signInForm.password}
                                    onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                  />
                                  {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                              </div>
                              <div className="forgot-password-container">
                                <button type="button" className="forgot-password-link" onClick={() => setShowResetPassword(!showResetPassword)}>
                                  Forgot Password?
                                </button>
                              </div>
                            </div>
                              
                              {showResetPassword && (
                                <div className="reset-password-container">
                                  <Button variant="ghost" size="medium" onClick={handleResetPassword} disabled={isLoading} loading={isLoading} className="reset-password-button">
                                    Reset Password
                                  </Button>
                                </div>
                              )}
                          </>
                        ) : (
                          <>
                            <div className="login-form-group">
                              <Input type="text" placeholder="Your Name" value={signUpForm.fullName} onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))} required />
                              {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
                            </div>
                            <div className="login-form-group">
                              <Input type="email" placeholder="Your Email" value={signUpForm.email} onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))} required />
                              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div className="login-form-group">
                              <PasswordInput placeholder="Create a password" value={signUpForm.password} onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))} required />
                              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div className="login-form-group">
                              <PasswordInput placeholder="Confirm password" value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))} required />
                              {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                            <div className="login-form-group">
                                <Checkbox
                                    id="terms"
                                    checked={signUpForm.terms}
                                    onCheckedChange={(checked) => setSignUpForm(prev => ({ ...prev, terms: !!checked }))}
                                    label={
                                      <span className="text-xs">
                                        I agree to the <HyperlinkText onClick={() => setShowTerms(true)}>Terms of Service</HyperlinkText> and <HyperlinkText onClick={() => setShowPrivacy(true)}>Privacy Policy</HyperlinkText>
                                      </span>
                                    }
                                  />
                              {errors.terms && <p className="text-destructive text-xs mt-1">{errors.terms}</p>}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {!showResetPassword && (
                        <div className="login-toggle-section">
                          <p className="login-toggle-text">
                            {activeTab === 'signin' ? "Don't have an account?" : "Already have an account?"}
                            <HyperlinkText onClick={() => setActiveTab(activeTab === 'signin' ? 'signup' : 'signin')}>
                              &nbsp;{activeTab === 'signin' ? ' Sign Up' : 'Sign In'}
                            </HyperlinkText>
                          </p>
                        </div>
                      )}
                      
                      {authError && <div className="login-auth-error-container"><div className="login-auth-error"><span className="login-error-icon">⚠️</span><span>{authError}</span></div></div>}
                      {authSuccess && <div className="login-auth-success-container"><div className="login-auth-success"><span className="login-success-icon">✅</span><span>{authSuccess}</span></div></div>}
                      
                      <div className="login-action-buttons">
                        <Button variant="outline-only" size="medium" onClick={activeTab === 'signin' ? handleSignIn : handleSignUp} className="flex-1" disabled={isLoading} loading={isLoading}>
                          {activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
                        </Button>
                        <Button variant="outline-only" size="medium" onClick={handleGoogleSignIn} className="flex-1" disabled={isLoading} loading={isLoading}>
                          <div className="google-button-content">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84c.08-.09.16-.18.24-.27z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
                            Continue with Google
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="login-card-unified-right">
                    <VideoPlayer />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <TermsOfService isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(console.error);
    }
  }, [isVideoLoaded]);

  return (
    <div className="w-full h-full relative">
      <video 
        ref={videoRef}
        autoPlay 
        muted 
        loop 
        playsInline
        onLoadedData={() => setIsVideoLoaded(true)}
        className={`w-full h-full object-cover rounded-r-[30px] transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src="/form-right.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {!isVideoLoaded && (
        <div className="absolute inset-0 bg-[#1a1a1a] rounded-r-[30px] flex items-center justify-center">
          <div className="text-[#666] text-sm">Loading video...</div>
        </div>
      )}
    </div>
  );
};

export default LoginDialog;
