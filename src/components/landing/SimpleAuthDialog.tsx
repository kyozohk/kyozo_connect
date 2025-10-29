'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { upsertUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';


interface SimpleAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimpleAuthDialog: React.FC<SimpleAuthDialogProps> = ({ isOpen, onClose }) => {
  const { user, auth } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ fullName: '', email: '', password: '' });

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.push('/analytics');
      onClose();
    }
  }, [user, router, onClose]);

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignInForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        await upsertUser({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName!,
          photoURL: user.photoURL!,
        });
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    if (!signInForm.email || !signInForm.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, signInForm.email, signInForm.password);
    } catch (error: any) {
      console.error('Email sign in error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    if (!signUpForm.fullName || !signUpForm.email || !signUpForm.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpForm.email, signUpForm.password);
      const user = userCredential.user;

      const photoURL = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(signUpForm.fullName)}`;

      await updateProfile(user, {
        displayName: signUpForm.fullName,
        photoURL: photoURL,
      });

      await upsertUser({
        uid: user.uid,
        email: user.email!,
        displayName: signUpForm.fullName,
        photoURL: photoURL,
      });

    } catch (error: any) {
      console.error('Email sign up error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSignInForm({ email: '', password: '' });
    setSignUpForm({ fullName: '', email: '', password: '' });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={handleClose}>
      <div
        ref={dialogRef}
        className="auth-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-closeButton" onClick={handleClose}>
          <X size={24} />
        </button>

        <div className="auth-content">
          <div className="auth-header">
            <h2 className="auth-title">Welcome to Kyozo Pro</h2>
            <p className="auth-subtitle">Sign in to manage your communities</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            className="auth-googleButton"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.8 111.8 14 244 14c72.5 0 134.4 28.8 181.4 75.4l-62.9 62.9C337 112.4 294.1 88 244 88c-88.3 0-160 71.7-160 160s71.7 160 160 160c94.4 0 135.3-69.1 140.8-106.9H244v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="auth-form">
              <div className="auth-inputGroup">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={signInForm.email}
                  onChange={handleSignInChange}
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-inputGroup">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={signInForm.password}
                  onChange={handleSignInChange}
                  className="auth-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="auth-submitButton"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="auth-inputGroup">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={signUpForm.fullName}
                  onChange={handleSignUpChange}
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-inputGroup">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={signUpForm.email}
                  onChange={handleSignUpChange}
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-inputGroup">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={signUpForm.password}
                  onChange={handleSignUpChange}
                  className="auth-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="auth-submitButton"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleAuthDialog;

    