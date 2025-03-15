import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../services/firebase';

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create a new user
  const signUp = async (email, password, name, role = 'borrower', phone = '') => {
    try {

      setError('');

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const now = new Date();
      
      // Create structured user profile in Firestore
      const userData = {
        // Basic user information

        profile:{
          uid: userCredential.user.uid,
          email,
          name,
          role,
          phone,
          email_verified: false,
          mobile_verified: false,
        },
        
        // Account status
        status: 'active',
        
        // Stats
        borrowCount: 0,
        
        // Timestamps
        timestamps:{
          created_at: now,
          last_login: now,
        },
        
        // Logs
        logs: {
          created: {
            created_by: {
              uid: userCredential.user.uid, // System-created account
              email: 'system',
              name: 'System Registration'
            },
            created_at: now
          }
        }
      };
      
      // Save to users collection using Firebase Auth UID as the document ID
      // This ensures direct 1:1 mapping between Auth and Firestore records
      await setDoc(doc(db, 'Users', userCredential.user.uid), userData);
      
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in an existing user
  const signIn = async (email, password) => {
    try {
      setError('');
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp and add to login history
      const now = new Date();
      const userRef = doc(db, 'Users', userCredential.user.uid);

      
      try {
        // Get current user data to update login history
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const loginHistory = userData.login_history || [];
          
          // Only keep the last 50 logins to avoid document size limits
          if (loginHistory.length >= 50) {
            loginHistory.shift(); // Remove oldest login
          }
          
          // Add current login to history
          loginHistory.push({
            timestamp: now,
            device: navigator.userAgent || 'Unknown Device',
            ip: 'Logged on client'
          });
          
          // Update user document with new login info
          await updateDoc(userRef, {
            last_login: now,
            login_history: loginHistory,
            logs: {
              ...(userData.logs || {}),
              login: {
                timestamp: now
              }
            }
          });
          return {
            ...userCredential.user,
            profile: userData.profile,
          };
        }
      } catch (updateError) {
        // Non-critical error, just log it but don't fail the sign-in
        console.error('Error updating login history:', updateError);
      }
      
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError('');
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserRole(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userRole === 'admin' || userRole === 'superadmin';
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return userRole === 'superadmin';
  };

  // Check if user is borrower
  const isBorrower = () => {
    return userRole === 'borrower';
  };

  // Get user profile from Firestore
  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'Users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (err) {
      console.error('Error getting user profile:', err);
      return null;
    }
  };
  
  // Promote user to super admin - only callable by existing super admins
  const promoteToSuperAdmin = async (adminUid) => {
    try {
      const userRef = doc(db, 'Users', adminUid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const currentRole = userData?.profile?.role;
      
      // Can only promote admins to super admins
      if (currentRole !== 'admin') {
        throw new Error('Only administrators can be promoted to super administrators');
      }
      
      // Update the user's role
      await updateDoc(userRef, {
        'profile.role': 'superadmin',
        'profile.promoted_at': new Date(),
        'profile.promoted_by': currentUser?.uid,
      });
      
      return true;
    } catch (err) {
      console.error('Error promoting user to super admin:', err);
      throw err;
    }
  };

  // Update user auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        // Get user profile
        const profile = await getUserProfile(user.uid);
        
        if (profile) {
          // Set the user role - role is nested inside profile object
          setUserRole(profile.profile?.role);
          
          // Check if this is a new session (comparing last session with current)
          const now = new Date();
          const lastSessionTime = profile.last_session ?
            (profile.last_session.toDate ? profile.last_session.toDate() : new Date(profile.last_session)) : null;
          
          // If no session exists or last session was more than 1 hour ago, consider this a new session
          if (!lastSessionTime || (now - lastSessionTime) > (60 * 60 * 1000)) {
            try {
              // Update session information
              const userRef = doc(db, 'Users', user.uid);
              await updateDoc(userRef, {
                last_session: now,
                session_count: (profile.session_count || 0) + 1,
                logs: {
                  ...(profile.logs || {}),
                  session: {
                    timestamp: now,
                    count: (profile.session_count || 0) + 1
                  }
                }
              });
            } catch (error) {
              console.error('Error updating session data:', error);
            }
          }
        }
      }
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAdmin,
    isSuperAdmin,
    isBorrower,
    getUserProfile,
    promoteToSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};