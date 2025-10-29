'use client';

import { DocumentReference, Query, FirestoreError, DocumentData, onSnapshot, getDoc } from 'firebase/firestore';
import { EventEmitter } from 'events';
import React, { useEffect, useState } from 'react';

// Centralized event emitter for error handling
export const errorEmitter = new EventEmitter();

// Define a custom error for Firestore permission issues
export class FirestorePermissionError extends Error {
  operation: 'get' | 'list' | 'read' | 'create' | 'update' | 'delete';
  ref: DocumentReference | Query;
  resource?: any;
  originalError: FirestoreError;

  constructor(
    operation: 'get' | 'list' | 'read'| 'create' | 'update' | 'delete',
    ref: DocumentReference | Query,
    resource?: any,
    originalError: FirestoreError = new FirestoreError('permission-denied', 'Missing or insufficient permissions.')
  ) {
    const path = ref instanceof DocumentReference ? ref.path : (ref as Query)._query.path.segments.join('/');
    const message = `Firebase Firestore: ${originalError.message} (Operation: ${operation}, Path: ${path})`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.operation = operation;
    this.ref = ref;
    this.resource = resource;
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

  // Render a detailed error overlay
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '2rem',
      overflowY: 'auto',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#ff6b6b', borderBottom: '1px solid #ff6b6b', paddingBottom: '0.5rem' }}>
        Firestore Security Rule Error
      </h2>
      <p style={{ marginTop: '1rem' }}>Your app tried to perform an operation that your security rules denied.</p>
      
      <div style={{ marginTop: '1.5rem', background: '#2d2d2d', padding: '1rem', borderRadius: '4px' }}>
        <p><strong>Operation:</strong> <code style={{ color: '#f0e68c' }}>{error.operation.toUpperCase()}</code></p>
        <p><strong>Path:</strong> <code style={{ color: '#f0e68c' }}>{error.ref instanceof DocumentReference ? error.ref.path : (error.ref as any)._query.path.segments.join('/')}</code></p>
      </div>

       {error.resource && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Request Data:</strong>
          <pre style={{ background: '#2d2d2d', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(error.resource, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <p><strong>Next Steps:</strong></p>
        <ol style={{ paddingLeft: '1.5rem', listStyle: 'decimal' }}>
          <li style={{ marginBottom: '0.5rem' }}>Review the operation and the path above.</li>
          <li>Open your <code style={{ background: '#2d2d2d', padding: '0.2rem 0.4rem', borderRadius: '2px' }}>firestore.rules</code> file.</li>
          <li style={{ marginBottom: '0.5rem' }}>Adjust the rules to allow this specific operation for the authenticated user.</li>
        </ol>
      </div>

       <button 
        onClick={() => setError(null)}
        style={{
            marginTop: '2rem',
            padding: '0.5rem 1rem',
            background: '#ff6b6b',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
       >
        Close
       </button>
    </div>
  );
};
