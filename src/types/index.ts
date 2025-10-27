
import type { User as FirebaseUser } from 'firebase/auth';

export interface Community {
  id: string;
  name: string;
  communityProfileImage?: string;
  memberCount: number;
  data: any;
}

export interface Member {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  phoneNumber?: string;
  joinedAt?: string;
  role: 'owner' | 'admin' | 'member';
  data: any;
}

export interface Message {
  id: string;
  sender: Partial<Member>;
  text: string;
  createdAt: string;
  data: any;
}

export type RawMessage = {
    _id: import('mongodb').ObjectId;
    communityId?: import('mongodb').ObjectId; // Optional as it might be on the channel
    channel?: import('mongodb').ObjectId;
    senderId?: import('mongodb').ObjectId; // Legacy
    user?: import('mongodb').ObjectId; // Preferred
    text: string;
    createdAt: Date;
}

export interface AppUser extends FirebaseUser {}
