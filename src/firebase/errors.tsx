
'use client';

import { FirestoreError } from 'firebase/firestore';
import { EventEmitter } from 'events';
import React, { useEffect, useState } from 'react';

// Centralized event emitter for error handling
export const errorEmitter = new EventEmitter();

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

// Define a custom error for Firestore permission issues
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  originalError: FirestoreError;

  constructor(
    context: SecurityRuleContext,
    originalError: FirestoreError = new FirestoreError('permission-denied', 'Missing or insufficient permissions.')
  ) {
    const message = `Firestore Permission Denied: ${context.operation.toUpperCase()} on /${context.path}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    this.originalError = originalError;
  }
}

// React component to listen for Firestore permission errors
export const FirebaseErrorListener: React.FC = () => {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      console.warn('Caught Firestore Permission Error:', e);
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!error) {
    return null;
  }
  
  const authContext = {
      // In a real app, you'd get this from your auth state
      // This is a placeholder for demonstration
      uid: 'some-user-uid',
      token: { name: 'Current User' }
  };

  // Render a detailed error overlay
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(10, 0, 0, 0.85)',
      color: 'white',
      padding: '2rem',
      overflowY: 'auto',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.6',
    }}>
       <h2 style={{ color: '#ff6b6b', borderBottom: '1px solid #ff6b6b', paddingBottom: '0.5rem', fontSize: '1.5rem' }}>
        Firestore Security Rule Error
      </h2>
      <p style={{ marginTop: '1rem', color: '#ccc' }}>Your app tried to perform an operation that your security rules denied.</p>
      
      <div style={{ marginTop: '1.5rem', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
        <p><strong>Operation:</strong> <code style={{ color: '#f0e68c', background: '#2b2b2b', padding: '2px 4px', borderRadius: '4px' }}>{error.context.operation.toUpperCase()}</code></p>
        <p style={{marginTop: '0.5rem'}}><strong>Path:</strong> <code style={{ color: '#f0e68c', background: '#2b2b2b', padding: '2px 4px', borderRadius: '4px' }}>/{error.context.path}</code></p>
      </div>
      
      <div style={{ marginTop: '1.5rem', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
          <strong>Request Details:</strong>
           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#2b2b2b', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem' }}>
            {JSON.stringify({
                auth: authContext,
                method: error.context.operation,
                path: `/${error.context.path}`,
                resource: error.context.requestResourceData || null,
                timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
      </div>

       <div style={{ marginTop: '1.5rem' }}>
        <p><strong>Next Steps:</strong></p>
        <ol style={{ paddingLeft: '1.5rem', listStyle: 'decimal', color: '#ccc' }}>
          <li style={{ marginBottom: '0.5rem' }}>Review the operation, path, and request data above.</li>
          <li>Open your <code style={{ background: '#2b2b2b', padding: '0.2rem 0.4rem', borderRadius: '2px' }}>firestore.rules</code> file.</li>
          <li style={{ marginBottom: '0.5rem' }}>Adjust the rules to allow this specific operation for the authenticated user based on the request details.</li>
        </ol>
      </div>

       <button 
        onClick={() => setError(null)}
        style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: '#ff6b6b',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
        }}
       >
        Close
       </button>
    </div>
  );
};
