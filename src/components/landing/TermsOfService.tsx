'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="legal-header">
          <h2 className="legal-title">Terms of Service</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
        </div>
        
        <div className="legal-content">
          <div className="legal-section">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using Kyozo Pro, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </div>
          <div className="legal-section">
            <h3>2. Description of Service</h3>
            <p>Kyozo Pro is a professional community management platform that enables users to create, manage, and grow their communities through advanced tools and analytics.</p>
          </div>
          <div className="legal-section">
            <h3>3. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
          </div>
          <div className="legal-section">
            <h3>4. Acceptable Use</h3>
            <p>You agree to use Kyozo Pro only for lawful purposes and in accordance with these Terms. You may not use the service:</p>
            <ul>
              <li>To violate any applicable laws or regulations</li>
              <li>To transmit harmful, offensive, or inappropriate content</li>
              <li>To interfere with or disrupt the service or servers</li>
              <li>To attempt to gain unauthorized access to other accounts</li>
            </ul>
          </div>
          <div className="legal-section">
            <h3>5. Privacy and Data Protection</h3>
            <p>Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.</p>
          </div>
          <div className="legal-last-updated">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
