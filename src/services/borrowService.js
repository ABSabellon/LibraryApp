import { collection, addDoc, updateDoc, getDoc, getDocs, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { updateBookStatus } from './bookService';
import * as MailComposer from 'expo-mail-composer';
import * as SMS from 'expo-sms';

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Firebase
export const storeOTP = async (borrowerEmail, borrowerPhone, otp) => {
  try {
    const otpRef = collection(db, 'otps');
    await addDoc(otpRef, {
      email: borrowerEmail,
      phone: borrowerPhone,
      otp,
      createdAt: Timestamp.now(),
      isUsed: false
    });
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (borrowerEmail, inputOTP) => {
  try {
    const otpRef = collection(db, 'otps');
    const q = query(
      otpRef, 
      where("email", "==", borrowerEmail),
      where("otp", "==", inputOTP),
      where("isUsed", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // Mark OTP as used
    const otpDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'otps', otpDoc.id), {
      isUsed: true
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Send OTP via email
export const sendOTPViaEmail = async (borrowerEmail, otp) => {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('Mail composer is not available');
      return false;
    }
    
    await MailComposer.composeAsync({
      recipients: [borrowerEmail],
      subject: 'Your Library App OTP Code',
      body: `Your OTP code for book borrowing is: ${otp}. This code will expire in 10 minutes.`,
      isHtml: false
    });
    
    return true;
  } catch (error) {
    console.error('Error sending OTP via email:', error);
    throw error;
  }
};

// Send OTP via SMS
export const sendOTPViaSMS = async (borrowerPhone, otp) => {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('SMS is not available');
      return false;
    }
    
    const { result } = await SMS.sendSMSAsync(
      [borrowerPhone],
      `Your OTP code for book borrowing is: ${otp}. This code will expire in 10 minutes.`
    );
    
    return result === 'sent';
  } catch (error) {
    console.error('Error sending OTP via SMS:', error);
    throw error;
  }
};

// Borrow a book
export const borrowBook = async (bookId, borrowerDetails) => {
  try {
    // First update the book status
    await updateBookStatus(bookId, 'borrowed');
    
    // Create a borrow record
    const borrowsRef = collection(db, 'borrows');
    const borrowDoc = await addDoc(borrowsRef, {
      bookId,
      borrower: borrowerDetails,
      borrowDate: Timestamp.now(),
      dueDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
      returnDate: null,
      status: 'active',
    });
    
    // Increment the borrow count for the book
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      const currentCount = bookDoc.data().borrowCount || 0;
      await updateDoc(bookRef, {
        borrowCount: currentCount + 1
      });
    }
    
    return { id: borrowDoc.id, bookId, borrower: borrowerDetails };
  } catch (error) {
    console.error('Error borrowing book:', error);
    throw error;
  }
};

// Return a book
export const returnBook = async (borrowId) => {
  try {
    // Get the borrow record
    const borrowRef = doc(db, 'borrows', borrowId);
    const borrowDoc = await getDoc(borrowRef);
    
    if (!borrowDoc.exists()) {
      throw new Error('Borrow record not found');
    }
    
    const borrowData = borrowDoc.data();
    
    // Update the book status
    await updateBookStatus(borrowData.bookId, 'available');
    
    // Update the borrow record
    await updateDoc(borrowRef, {
      returnDate: Timestamp.now(),
      status: 'returned'
    });
    
    return true;
  } catch (error) {
    console.error('Error returning book:', error);
    throw error;
  }
};

// Get all active borrows
export const getActiveBorrows = async () => {
  try {
    const borrowsRef = collection(db, 'borrows');
    const q = query(borrowsRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting active borrows:', error);
    throw error;
  }
};

// Get borrows by borrower email
export const getBorrowsByEmail = async (email) => {
  try {
    const borrowsRef = collection(db, 'borrows');
    const q = query(borrowsRef, where("borrower.email", "==", email));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting borrows by email:', error);
    throw error;
  }
};

// Get borrow history for a book
export const getBookBorrowHistory = async (bookId) => {
  try {
    const borrowsRef = collection(db, 'borrows');
    const q = query(borrowsRef, where("bookId", "==", bookId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting book borrow history:', error);
    throw error;
  }
};

// Get overdue borrows
export const getOverdueBorrows = async () => {
  try {
    const borrowsRef = collection(db, 'borrows');
    const q = query(borrowsRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const now = Timestamp.now();
    
    // Filter out overdue borrows
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(borrow => borrow.dueDate.toMillis() < now.toMillis());
  } catch (error) {
    console.error('Error getting overdue borrows:', error);
    throw error;
  }
};

// Send reminder to borrower
export const sendBorrowReminder = async (borrow) => {
  try {
    const { borrower, dueDate } = borrow;
    const dueDateTime = dueDate.toDate();
    
    // Format due date
    const formattedDate = dueDateTime.toLocaleDateString();
    
    // Send email reminder
    if (borrower.email) {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [borrower.email],
          subject: 'Library Book Due Date Reminder',
          body: `Dear ${borrower.name},\n\nThis is a friendly reminder that your borrowed book is due on ${formattedDate}. Please return it on time.\n\nThank you,\nLibrary Management`,
          isHtml: false
        });
      }
    }
    
    // Send SMS reminder
    if (borrower.phone) {
      const isAvailable = await SMS.isAvailableAsync();
      
      if (isAvailable) {
        await SMS.sendSMSAsync(
          [borrower.phone],
          `Library Reminder: Your borrowed book is due on ${formattedDate}. Please return it on time.`
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending borrow reminder:', error);
    throw error;
  }
};