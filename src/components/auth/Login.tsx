'use client';
import React, { useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { upsertUser } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordInput } from '../landing/PasswordInput';
import TermsOfService from '../landing/TermsOfService';
import PrivacyPolicy from '../landing/PrivacyPolicy';

const HyperlinkText: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button type="button" onClick={onClick} className="text-sm text-pink-400 hover:underline focus:outline-none">
        {children}
    </button>
);

export const Login = () => {
  const { user, auth } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', terms: false });
  const [resetForm, setResetForm] = useState({ email: '' });
  const [errors, setErrors] = useState({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '', terms: '', resetEmail: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleAuthSuccess = (redirectPath: string = '/communities') => {
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
      const user = result.user;
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await upsertUser({
          uid: user.uid,
          email: user.email!,
          displayName: displayName,
          photoURL: user.photoURL!,
          firstName,
          lastName,
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
    const newErrors = { ...errors, firstName: '', lastName: '', email: '', password: '', confirmPassword: '', terms: '' };
    let isValid = true;
    if (!signUpForm.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
     if (!signUpForm.lastName) {
      newErrors.lastName = 'Last name is required';
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
      const displayName = `${signUpForm.firstName} ${signUpForm.lastName}`.trim();
      const photoURL = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: photoURL
      });
      await upsertUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: displayName,
          photoURL: photoURL,
          firstName: signUpForm.firstName,
          lastName: signUpForm.lastName,
      });
      handleAuthSuccess();
    } catch (error: any) {
       const errorMessage = error.message.replace(/Firebase: |Error \(auth\/[^)]+\)\. /g, '');
       setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="login-form-content">
        {activeTab === 'signin' ? (
          <>
            <div className="login-form-group">
                <div className={`input-container ${errors.email ? 'input-error' : ''}`}>
                    <Input
                        type="email"
                        placeholder="Your Email"
                        value={signInForm.email}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="input-field"
                    />
                </div>
               {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="password-wrapper">
              <div className="password-input-group">
                  <div className={`input-container ${errors.password ? 'input-error' : ''}`}>
                    <PasswordInput
                        placeholder="Password"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="input-field"
                    />
                  </div>
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
            <div className="flex gap-4">
                <div className="login-form-group w-1/2">
                <div className={`input-container ${errors.firstName ? 'input-error' : ''}`}>
                    <Input type="text" placeholder="First Name" value={signUpForm.firstName} onChange={(e) => setSignUpForm(prev => ({ ...prev, firstName: e.target.value }))} required className="input-field" />
                </div>
                {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div className="login-form-group w-1/2">
                 <div className={`input-container ${errors.lastName ? 'input-error' : ''}`}>
                    <Input type="text" placeholder="Last Name" value={signUpForm.lastName} onChange={(e) => setSignUpForm(prev => ({ ...prev, lastName: e.target.value }))} required className="input-field" />
                 </div>
                {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName}</p>}
                </div>
            </div>
            <div className="login-form-group">
                <div className={`input-container ${errors.email ? 'input-error' : ''}`}>
                  <Input type="email" placeholder="Your Email" value={signUpForm.email} onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))} required className="input-field" />
                </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="login-form-group">
                <div className={`input-container ${errors.password ? 'input-error' : ''}`}>
                  <PasswordInput placeholder="Create a password" value={signUpForm.password} onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))} required className="input-field" />
                </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>
            <div className="login-form-group">
                <div className={`input-container ${errors.confirmPassword ? 'input-error' : ''}`}>
                  <PasswordInput placeholder="Confirm password" value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))} required className="input-field" />
                </div>
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
      
      <TermsOfService isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};
