import axios from 'axios';
import { collection, addDoc, updateDoc, getDoc, getDocs, doc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import QRCode from 'qrcode';

// Open Library API base URLs
const OPEN_LIBRARY_IDENTIFIER_URL = 'http://openlibrary.org/api/volumes/brief/';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS_URL = 'https://covers.openlibrary.org/b/id/';

// Function to search books via Open Library API
export const searchBooks = async (searchTerm) => {
  try {
    const response = await axios.get(`${OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(searchTerm)}&limit=40`);
    const books = response.data.docs || [];
    
    // Transform to a format similar to the previous API for compatibility
    return books.map(book => transformOpenLibraryBook(book));
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

export const getBookByIdentifier = async (type, id) => {
  try {
    let identifier = id;

    if (type === 'isbn') {
      // Remove dashes from ISBN
      identifier = id.replace(/-/g, '');
    }

    // Note: Keeping the hardcoded ISBN URL as requested
    const response = await axios.get(`${OPEN_LIBRARY_IDENTIFIER_URL}${type}/9781619634442.json`);
    
    // Ensure we have valid data
    if (!response.data.records || Object.keys(response.data.records).length === 0) {
      throw new Error('Book not found.');
    }

    // Extract the first record key dynamically
    const firstRecordKey = Object.keys(response.data.records)[0];
    const bookData = response.data.records[firstRecordKey];
    
    // Using the exact structure from the API response
    const transformedBook = {
      volumeInfo: {
        title: bookData.data?.title || '',
        authors: bookData.data?.authors ? bookData.data.authors.map(author => ({ name: author.name,url: author.url})) : [],
        publisher: bookData.data?.publishers ? bookData.data.publishers.map(publisher => publisher.name):[],
        published_date: bookData.data?.publish_date || bookData.publishDates?.[0] || '',
        publisher_place:bookData.data?.publish_places ? bookData.data.publish_places.map(places => places.name) : [],
        description: bookData.details?.details?.description || '',
        page_count: bookData.data?.number_of_pages || null,
        subjects: bookData.data?.subjects ? bookData.data.subjects.map(subject => subject.name) : [],
        weight: bookData.data?.weight || null,
        identifiers: bookData.data?.identifiers 
        ? Object.fromEntries(
            Object.entries(bookData.data.identifiers).map(([key, value]) => [key, value[0]])
          ) 
        : {},
        covers: bookData.data?.cover ? {
          cover_small: bookData.data.cover.small,
          cover_medium: bookData.data.cover.medium,
          cover_large: bookData.data.cover.large
        } : null,
        openlibrary_url: bookData.recordURL || bookData.data?.url || ''
      }
    };

    return transformedBook;
  } catch (error) {
    console.error('Error fetching book:', error.message || error);
    throw error;
  }
};

// Function to get a book by barcode (which is typically an ISBN)
export const getBookByBarcode = async (barcode) => {
  try {
    return await getBookByISBN(barcode);
  } catch (error) {
    console.error('Error fetching book by barcode:', error);
    throw error;
  }
};

// Helper function to transform Open Library book data to a format similar to previous API
const transformOpenLibraryBook = (book, isbn = null, openLibraryUrl = '') => {
  // Get cover image URL if available
  let imageUrl = null;
  if (book.cover_i) {
    imageUrl = `${OPEN_LIBRARY_COVERS_URL}${book.cover_i}-M.jpg`;
  }
  
  return {
    id: book.key,
    volumeInfo: {
      title: book.title || '',
      authors: book.author_name || [],
      publisher: book.publisher?.[0] || '',
      publishedDate: book.publish_date?.[0] || book.first_publish_year?.toString() || '',
      description: book.description || '',
      pageCount: book.number_of_pages_median || null,
      categories: book.subject || [],
      imageLinks: imageUrl ? { thumbnail: imageUrl } : null,
      industryIdentifiers: [
        {
          type: 'ISBN_13',
          identifier: isbn || book.isbn?.[0] || ''
        }
      ],
      openlibrary_url: openLibraryUrl
    }
  };
};

// Helper function to transform detailed Open Library book data
const transformOpenLibraryBookDetails = (bookData, workData, authors, isbn, openLibraryUrl = '') => {
  // Get cover image URL if available
  let imageUrl = null;
  if (bookData.covers && bookData.covers.length > 0) {
    imageUrl = `${OPEN_LIBRARY_COVERS_URL}${bookData.covers[0]}-M.jpg`;
  } else if (workData.covers && workData.covers.length > 0) {
    imageUrl = `${OPEN_LIBRARY_COVERS_URL}${workData.covers[0]}-M.jpg`;
  }
  
  return {
    id: bookData.key,
    volumeInfo: {
      title: bookData.title || workData.title || '',
      authors: authors,
      publisher: bookData.publishers?.[0] || '',
      publishedDate: bookData.publish_date || '',
      description: workData.description?.value || workData.description || '',
      pageCount: bookData.number_of_pages || null,
      categories: workData.subjects || [],
      imageLinks: imageUrl ? { thumbnail: imageUrl } : null,
      industryIdentifiers: [
        {
          type: 'ISBN_13',
          identifier: isbn
        }
      ],
      openlibrary_url: openLibraryUrl
    }
  };
};

// Helper function to generate QR data for a book
const generateQRData = (bookId, title, author) => {
  // Create a data object with essential book info
  const qrData = {
    id: bookId,
    title: title || '',
    author: author || '',
    type: 'library_book'
  };
  
  // Return as JSON string
  return JSON.stringify(qrData);
};

// Generate QR code as base64 data URL
const generateQRAsBase64 = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate QR code for a book and update its document
export const generateBookQR = async (bookId) => {
  try {
    // Get the book document
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists()) {
      throw new Error('Book not found');
    }
    
    const bookData = bookDoc.data();
    
    // Generate QR code data for the book
    const qrData = generateQRData(bookId, bookData.title, bookData.author);
    const qrCodeBase64 = await generateQRAsBase64(qrData);
    
    // Get the current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Update the book document with the QR code
    await updateDoc(bookRef, {
      library_qr: qrCodeBase64,
      logs: {
        ...bookData.logs,
        qr_generated: {
          generated_by: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || ''
          } : {
            uid: 'system',
            email: 'system',
            displayName: 'System'
          },
          generated_at: new Date()
        }
      }
    });
    
    return qrCodeBase64;
  } catch (error) {
    console.error('Error generating book QR:', error);
    throw error;
  }
};

// Firebase Functions

// Add a book to the library
export const addBookToLibrary = async (bookData) => {
  try {
    // Get the current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Prepare clean book data
    const cleanBookData = {
      // Essential book information
      title: bookData.title || '',
      author: bookData.author || '',
      isbn: bookData.isbn || '',
      publisher: bookData.publisher || '',
      publishedDate: bookData.publishedDate || '',
      description: bookData.description || '',
      pageCount: bookData.pageCount || null,
      categories: Array.isArray(bookData.categories) ? bookData.categories : [],
      imageUrl: bookData.imageUrl || null,
      
      // Library-specific information
      status: 'available', // Default status
      location: bookData.location || '',
      notes: bookData.notes || '',
      edition: bookData.edition || '',
      
      // OpenLibrary URL from the API
      openlibrary_url: bookData.openlibrary_url || '',
      
      // Stats
      borrowCount: 0,
      ratings: [],
      averageRating: 0,
      
      // Logs
      logs: {
        created: {
          created_by: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || ''
          } : {
            uid: 'system',
            email: 'system',
            displayName: 'System'
          },
          created_at: new Date()
        }
      }
    };
    
    // Add to Firestore
    const booksRef = collection(db, 'books');
    const bookDoc = await addDoc(booksRef, cleanBookData);
    
    // Generate and save QR code
    const bookId = bookDoc.id;
    try {
      const qrCodeBase64 = await generateQRAsBase64(generateQRData(bookId, cleanBookData.title, cleanBookData.author));
      
      // Update the book with QR code
      await updateDoc(doc(db, 'books', bookId), {
        library_qr: qrCodeBase64,
        logs: {
          ...cleanBookData.logs,
          qr_generated: {
            generated_by: currentUser ? {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || ''
            } : {
              uid: 'system',
              email: 'system',
              displayName: 'System'
            },
            generated_at: new Date()
          }
        }
      });
      
      // Add QR to the return data
      cleanBookData.library_qr = qrCodeBase64;
    } catch (qrError) {
      console.error('Error generating QR code during book creation:', qrError);
      // Non-critical error - continue with book creation without QR
    }
    
    return { id: bookDoc.id, ...cleanBookData };
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
    // Get current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Get the existing book to preserve logs
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    let existingLogs = {};
    
    if (bookDoc.exists()) {
      existingLogs = bookDoc.data().logs || {};
    }
    
    // Prepare update data with new log entry
    const updateData = {
      ...bookData,
      logs: {
        ...existingLogs,
        updated: {
          updated_by: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || ''
          } : {
            uid: 'system',
            email: 'system',
            displayName: 'System'
          },
          updated_at: new Date()
        }
      }
    };
    
    await updateDoc(bookRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating book details:', error);
    throw error;
  }
};

// Delete book
export const deleteBook = async (bookId) => {
  try {
    // Get current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Get the existing book to preserve logs
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      // Instead of hard deleting, mark as deleted with log info
      const bookData = bookDoc.data();
      await updateDoc(bookRef, {
        status: 'deleted',
        logs: {
          ...(bookData.logs || {}),
          deleted: {
            deleted_by: currentUser ? {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || ''
            } : {
              uid: 'system',
              email: 'system',
              displayName: 'System'
            },
            deleted_at: new Date()
          }
        }
      });
    } else {
      // If book doesn't exist, use deleteDoc
      await deleteDoc(bookRef);
    }
    
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