import axios from 'axios';
import { collection, addDoc, updateDoc, getDoc, getDocs, doc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Google Books API base URL
const API_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Function to search books via Google Books API
export const searchBooks = async (searchTerm) => {
  try {
    const response = await axios.get(`${API_BASE_URL}?q=${encodeURIComponent(searchTerm)}&maxResults=40`);
    return response.data.items || [];
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

// Function to get a book by ISBN
export const getBookByISBN = async (isbn) => {
  try {
    const response = await axios.get(`${API_BASE_URL}?q=isbn:${isbn}`);
    return response.data.items?.[0] || null;
  } catch (error) {
    console.error('Error fetching book by ISBN:', error);
    throw error;
  }
};

// Function to get a book by barcode/ISBN from Google Books API
export const getBookByBarcode = async (barcode) => {
  try {
    // Barcodes are typically ISBN numbers
    return await getBookByISBN(barcode);
  } catch (error) {
    console.error('Error fetching book by barcode:', error);
    throw error;
  }
};

// Firebase Functions

// Add a book to the library
export const addBookToLibrary = async (bookData) => {
  try {
    const booksRef = collection(db, 'books');
    const bookDoc = await addDoc(booksRef, {
      ...bookData,
      status: 'available', // Default status
      addedDate: new Date(),
      borrowCount: 0,
      ratings: [],
      averageRating: 0,
    });
    return { id: bookDoc.id, ...bookData };
  } catch (error) {
    console.error('Error adding book to library:', error);
    throw error;
  }
};

// Get all books from the library
export const getAllBooks = async () => {
  try {
    const booksRef = collection(db, 'books');
    const querySnapshot = await getDocs(booksRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all books:', error);
    throw error;
  }
};

// Get book by ID
export const getBookById = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      return { id: bookDoc.id, ...bookDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting book by ID:', error);
    throw error;
  }
};

// Update book status
export const updateBookStatus = async (bookId, status) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    await updateDoc(bookRef, { status });
    return true;
  } catch (error) {
    console.error('Error updating book status:', error);
    throw error;
  }
};

// Update book details
export const updateBookDetails = async (bookId, bookData) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    await updateDoc(bookRef, bookData);
    return true;
  } catch (error) {
    console.error('Error updating book details:', error);
    throw error;
  }
};

// Delete book
export const deleteBook = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    await deleteDoc(bookRef);
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

// Get books by status
export const getBooksByStatus = async (status) => {
  try {
    const booksRef = collection(db, 'books');
    const q = query(booksRef, where("status", "==", status));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting books by status:', error);
    throw error;
  }
};

// Get borrowed books
export const getBorrowedBooks = async () => {
  return getBooksByStatus('borrowed');
};

// Get most borrowed books
export const getMostBorrowedBooks = async (limit = 10) => {
  try {
    const booksRef = collection(db, 'books');
    const querySnapshot = await getDocs(booksRef);
    
    const books = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by borrow count in descending order
    const sortedBooks = books.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
    
    return sortedBooks.slice(0, limit);
  } catch (error) {
    console.error('Error getting most borrowed books:', error);
    throw error;
  }
};

// Get highest rated books
export const getHighestRatedBooks = async (limit = 10) => {
  try {
    const booksRef = collection(db, 'books');
    const querySnapshot = await getDocs(booksRef);
    
    const books = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by average rating in descending order
    const sortedBooks = books.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    
    return sortedBooks.slice(0, limit);
  } catch (error) {
    console.error('Error getting highest rated books:', error);
    throw error;
  }
};