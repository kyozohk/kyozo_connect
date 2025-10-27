import type { User as FirebaseUser } from 'firebase/auth';

export interface Community {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export interface Message {
  id: string;
  sender: Member;
  text: string;
  createdAt: string;
}

export type RawMessage = {
    _id: import('mongodb').ObjectId;
    communityId: import('mongodb').ObjectId;
    senderId: import('mongodb').ObjectId;
    text: string;
    createdAt: Date;
}

export interface AppUser extends FirebaseUser {}
