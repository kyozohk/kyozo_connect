'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="legal-header">
          <h2 className="legal-title">Privacy Policy</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
        </div>
        
        <div className="legal-content">
          <div className="legal-section">
            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password</li>
              <li><strong>Profile Information:</strong> Community details, member information</li>
              <li><strong>Usage Information:</strong> How you interact with our service</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
            </ul>
          </div>
          <div className="legal-section">
            <h3>2. How We Use Your Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
          </div>
          <div className="legal-section">
            <h3>3. Information Sharing</h3>
            <p>We do not sell your personal information. We may share information with trusted third parties who assist us in operating our service, under strict confidentiality agreements.</p>
          </div>
          <div className="legal-section">
            <h3>4. Data Security</h3>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </div>
          <div className="legal-last-updated">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
