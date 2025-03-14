import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { db } from './firebase';
import * as MailComposer from 'expo-mail-composer';

// Generate a random invite code
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitted potentially confusing chars like O, 0, 1, I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create an admin invite
export const createAdminInvite = async (email, expiryDays = 7, generatedBy) => {
  try {
    // Check if there's an existing invite for this email
    const existingInvite = await getInviteByEmail(email);
    
    if (existingInvite && !existingInvite.isUsed) {
      // Return the existing code if it's valid
      if (existingInvite.expiresAt.toDate() > new Date()) {
        return existingInvite.code;
      }
    }
    
    // Generate a new invite code
    const code = generateInviteCode();
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Store the invite in Firestore
    const invitesRef = collection(db, 'adminInvites');
    await addDoc(invitesRef, {
      code,
      email,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isUsed: false,
      generatedBy
    });
    
    return code;
  } catch (error) {
    console.error('Error creating admin invite:', error);
    throw error;
  }
};

// Get invite by email
export const getInviteByEmail = async (email) => {
  try {
    const invitesRef = collection(db, 'adminInvites');
    const q = query(
      invitesRef,
      where('email', '==', email),
      where('isUsed', '==', false),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const inviteDoc = querySnapshot.docs[0];
    return {
      id: inviteDoc.id,
      ...inviteDoc.data()
    };
  } catch (error) {
    console.error('Error getting invite by email:', error);
    throw error;
  }
};

// Get invite by code
export const getInviteByCode = async (code) => {
  try {
    const invitesRef = collection(db, 'adminInvites');
    const q = query(
      invitesRef,
      where('code', '==', code),
      where('isUsed', '==', false),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const inviteDoc = querySnapshot.docs[0];
    return {
      id: inviteDoc.id,
      ...inviteDoc.data()
    };
  } catch (error) {
    console.error('Error getting invite by code:', error);
    throw error;
  }
};

// Verify admin invite code
export const verifyAdminInviteCode = async (code, email) => {
  try {
    const invite = await getInviteByCode(code);
    
    if (!invite) {
      return false;
    }
    
    // Check if the invite is for the correct email
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return false;
    }
    
    // Check if the invite has expired
    if (invite.expiresAt.toDate() < new Date()) {
      return false;
    }
    
    // Mark the invite as used
    await updateDoc(doc(db, 'adminInvites', invite.id), {
      isUsed: true,
      usedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying admin invite code:', error);
    throw error;
  }
};

// Send invite email
export const sendInviteEmail = async (email, code, libraryName = 'Library App') => {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('Mail composer is not available');
      return false;
    }
    
    // Create a nice looking email body
    const emailBody = `
Dear Future Administrator,

You have been invited to join the ${libraryName} administration team!

To complete your registration, please follow these steps:
1. Go to the Admin Registration page in the Library App
2. Fill out your details
3. Use the following invite code when prompted:

${code}

This invite code will expire in 7 days.

If you have any questions, please contact the library management.

Best regards,
${libraryName} Management Team
    `.trim();
    
    await MailComposer.composeAsync({
      recipients: [email],
      subject: `Admin Invitation for ${libraryName}`,
      body: emailBody,
      isHtml: false
    });
    
    return true;
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw error;
  }
};

// Get all valid (non-expired and unused) invites
export const getAllValidInvites = async () => {
  try {
    const invitesRef = collection(db, 'adminInvites');
    const q = query(
      invitesRef,
      where('isUsed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const now = Timestamp.now();
    
    // Filter out expired invites
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(invite => invite.expiresAt.toDate() > now.toDate());
  } catch (error) {
    console.error('Error getting valid invites:', error);
    throw error;
  }
};

// Create and send admin invite in one function
export const createAndSendInvite = async (email, expiryDays = 7, generatedBy, libraryName = 'Library App') => {
  try {
    const code = await createAdminInvite(email, expiryDays, generatedBy);
    const sent = await sendInviteEmail(email, code, libraryName);
    
    return { code, sent };
  } catch (error) {
    console.error('Error creating and sending invite:', error);
    throw error;
  }
};