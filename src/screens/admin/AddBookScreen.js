import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  FlatList
} from 'react-native';
import { TextInput, Button, Divider, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { getBookByIdentifier, addBookToLibrary } from '../../services/bookService';
const AddBookScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookAdded, setBookAdded] = useState(false);
  const [authorChips, setAuthorChips] = useState([]);
  const [categoryChips, setCategoryChips] = useState([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  
  // Book data from scan or route params
  const initialBookData = route.params?.bookData || null;
  
  // Initialize chips from initial data if available
  useEffect(() => {
    if (initialBookData) {
      if (initialBookData.author) {
        const authors = typeof initialBookData.author === 'string'
          ? initialBookData.author.split(',').map(a => a.trim())
          : Array.isArray(initialBookData.author) ? initialBookData.author : [];
        setAuthorChips(authors);
      }
      
      if (initialBookData.categories) {
        const categories = Array.isArray(initialBookData.categories)
          ? initialBookData.categories
          : typeof initialBookData.categories === 'string'
            ? initialBookData.categories.split(',').map(c => c.trim())
            : [];
        setCategoryChips(categories);
      }
    }
  }, [initialBookData]);
  // Validation schema
  const BookSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    author: Yup.string().required('Author is required'),
    isbn: Yup.string(),
    publisher: Yup.string(),
    publishedDate: Yup.string(),
    description: Yup.string(),
    pageCount: Yup.number().integer().positive().nullable(),
    categories: Yup.string(),
    imageUrl: Yup.string().url().nullable(),
    notes: Yup.string(),
    edition: Yup.string(),
    openlibrary_url: Yup.string().url().nullable(),
  });
  
  // Handle scan book button
  const handleScanBook = () => {
    navigation.navigate('ScanBook', { returnToAddBook: true });
  };
  
  // Handle form submission
  const handleAddBook = async (values) => {
    try {
      setLoading(true);
      
      // Process categories to array if provided as comma-separated string
      let processedValues = { ...values };
      if (values.categories && typeof values.categories === 'string') {
        processedValues.categories = values.categories.split(',').map(cat => cat.trim());
      }
      
      // Add the book to the library
      await addBookToLibrary(processedValues);
      setBookAdded(true);
      
      Alert.alert(
        'Success',
        `"${values.title}" has been added to the library`,
        [
          { text: 'Add Another Book', onPress: () => navigation.replace('AddBook') },
          { text: 'View Books', onPress: () => navigation.navigate('BookList') }
        ]
      );
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add the book to the library');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions for chips
  const addAuthorChip = (author, setFieldValue) => {
    if (author && author.trim()) {
      const newChips = [...authorChips, author.trim()];
      setAuthorChips(newChips);
      setFieldValue('author', newChips.join(', '));
      setNewAuthor('');
    }
  };
  
  const removeAuthorChip = (index, setFieldValue) => {
    const newChips = [...authorChips];
    newChips.splice(index, 1);
    setAuthorChips(newChips);
    setFieldValue('author', newChips.join(', '));
  };
  
  const addCategoryChip = (category, setFieldValue) => {
    if (category && category.trim()) {
      const newChips = [...categoryChips, category.trim()];
      setCategoryChips(newChips);
      setFieldValue('categories', newChips.join(', '));
      setNewCategory('');
    }
  };
  
  const removeCategoryChip = (index, setFieldValue) => {
    const newChips = [...categoryChips];
    newChips.splice(index, 1);
    setCategoryChips(newChips);
    setFieldValue('categories', newChips.join(', '));
  };
  
  // Handle search by ISBN
  const handleSearchISBN = async (isbn, setFieldValue) => {
    if (!isbn) {
      Alert.alert('Error', 'Please enter an ISBN');
      return;
    }
    
    try {
      setSearchLoading(true);
      const book = await getBookByIdentifier('isbn',isbn);
      console.log('book :: ',book);
      
      if (book) {
        
        // Extract and map book data from the new book structure
        setFieldValue('title', book.title || '');
        
        // Handle authors for chip display
        if (book.authors) {
          let authorList = [];
          if (Array.isArray(book.authors)) {
            // If authors is an array of objects with name property
            if (typeof book.authors[0] === 'object') {
              authorList = book.authors.map(a => a.name);
            } else {
              // If authors is just an array of strings
              authorList = book.authors;
            }
          } else {
            authorList = [book.authors.toString()];
          }
          
          // Update author chips
          setAuthorChips(authorList);
          setFieldValue('author', authorList.join(', '));
        } else {
          setAuthorChips([]);
          setFieldValue('author', '');
        }
        
        // Handle publisher
        if (book.publisher) {
          if (Array.isArray(book.publisher)) {
            setFieldValue('publisher', book.publisher[0] || '');
          } else {
            setFieldValue('publisher', book.publisher);
          }
        } else {
          setFieldValue('publisher', '');
        }
        
        // Handle published date
        setFieldValue('publishedDate', book.published_date || book.publishedDate || '');
        
        // Handle description
        setFieldValue('description', book.description || '');
        
        // Handle page count
        setFieldValue('pageCount', book.page_count || book.pageCount || null);
        
        // Handle subjects/categories for chip display
        if (book.subjects && Array.isArray(book.subjects)) {
          setCategoryChips(book.subjects);
          setFieldValue('categories', book.subjects.join(', '));
        } else if (book.categories && Array.isArray(book.categories)) {
          setCategoryChips(book.categories);
          setFieldValue('categories', book.categories.join(', '));
        } else {
          setCategoryChips([]);
          setFieldValue('categories', '');
        }
        
        // Handle cover image
        if (book.imageLinks && book.imageLinks.thumbnail) {
          setFieldValue('imageUrl', book.imageLinks.thumbnail);
        } else if (book.covers) {
          setFieldValue('imageUrl',
            book.covers.cover_medium ||
            book.covers.cover_large ||
            book.covers.cover_small ||
            null
          );
        } else {
          setFieldValue('imageUrl', null);
        }
        
        // Handle OpenLibrary URL
        setFieldValue('openlibrary_url', book.openlibrary_url || '');
        
        Alert.alert('Success', 'Book details retrieved successfully from OpenLibrary');
      } else {
        Alert.alert('Not Found', 'No book found with this ISBN in OpenLibrary');
      }
    } catch (error) {
      console.error('Error searching book by ISBN:', error);
      Alert.alert('Error', 'Failed to search for the book');
    } finally {
      setSearchLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Book</Text>
          
          <Button
            mode="contained"
            icon="barcode-scan"
            onPress={handleScanBook}
            style={styles.scanButton}
            labelStyle={styles.scanButtonLabel}
          >
            Scan Book
          </Button>
        </View>
        
        <Formik
          initialValues={{
            title: initialBookData?.title || '',
            author: initialBookData?.author || '',
            isbn: initialBookData?.isbn || '',
            publisher: initialBookData?.publisher || '',
            publishedDate: initialBookData?.publishedDate || '',
            description: initialBookData?.description || '',
            pageCount: initialBookData?.pageCount || null,
            categories: initialBookData?.categories ? initialBookData.categories.join(', ') : '',
            imageUrl: initialBookData?.imageUrl || null,
            notes: initialBookData?.notes || '',
            edition: initialBookData?.edition || '',
            openlibrary_url: initialBookData?.openlibrary_url || '',
          }}
          validationSchema={BookSchema}
          onSubmit={handleAddBook}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.formContainer}>
              {/* ISBN search field */}
              <View style={styles.isbnSearchContainer}>
                <TextInput
                  label="ISBN / Barcode"
                  value={values.isbn}
                  onChangeText={handleChange('isbn')}
                  onBlur={handleBlur('isbn')}
                  mode="outlined"
                  style={styles.isbnInput}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon="barcode" />}
                />
                <Button
                  mode="contained"
                  onPress={() => handleSearchISBN(values.isbn, setFieldValue)}
                  loading={searchLoading}
                  disabled={searchLoading}
                  style={styles.searchButton}
                >
                  Search
                </Button>
              </View>
              
              {/* Book details form */}
              <TextInput
                label="Title *"
                value={values.title}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                mode="outlined"
                style={styles.input}
                error={touched.title && errors.title}
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              
              <Divider style={styles.divider} />
              
              {/* Book cover preview */}
              {values.imageUrl ? (
                <View style={styles.coverPreviewContainer}>
                  <Image
                    source={{ uri: values.imageUrl }}
                    style={styles.coverImage}
                    resizeMode="contain"
                  />
                  <Button
                    icon="close"
                    mode="text"
                    onPress={() => setFieldValue('imageUrl', null)}
                    style={styles.removeCoverButton}
                  >
                    Remove
                  </Button>
                </View>
              ) : (
                <View style={styles.noCoverContainer}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#DDDDDD" />
                  <Text style={styles.noCoverText}>No cover image</Text>
                </View>
              )}
              
              {/* Author Chips */}
              <View style={styles.chipSection}>
                <Text style={styles.chipSectionTitle}>Authors *</Text>
                <ScrollView horizontal style={styles.chipScrollView}>
                  {authorChips.map((author, index) => (
                    <Chip
                      key={`author-${index}`}
                      onClose={() => removeAuthorChip(index, setFieldValue)}
                      style={styles.chip}
                      mode="outlined"
                    >
                      {author}
                    </Chip>
                  ))}
                </ScrollView>
                <View style={styles.chipInputRow}>
                  <TextInput
                    placeholder="Add author"
                    value={newAuthor}
                    onChangeText={setNewAuthor}
                    style={styles.chipInput}
                    mode="outlined"
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={() => addAuthorChip(newAuthor, setFieldValue)}
                      />
                    }
                  />
                </View>
                {/* Hidden input for Formik validation */}
                <TextInput
                  value={values.author}
                  onChangeText={handleChange('author')}
                  style={{ display: 'none' }}
                  error={touched.author && errors.author}
                />
                {touched.author && errors.author && (
                  <Text style={styles.errorText}>{errors.author}</Text>
                )}
              </View>
              
              <TextInput
                label="Publisher"
                value={values.publisher}
                onChangeText={handleChange('publisher')}
                onBlur={handleBlur('publisher')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Published Date"
                value={values.publishedDate}
                onChangeText={handleChange('publishedDate')}
                onBlur={handleBlur('publishedDate')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Page Count"
                value={values.pageCount ? String(values.pageCount) : ''}
                onChangeText={(text) => setFieldValue('pageCount', text ? parseInt(text, 10) : null)}
                onBlur={handleBlur('pageCount')}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />
              
              {/* Categories Chips */}
              <View style={styles.chipSection}>
                <Text style={styles.chipSectionTitle}>Categories</Text>
                <ScrollView horizontal style={styles.chipScrollView}>
                  {categoryChips.map((category, index) => (
                    <Chip
                      key={`category-${index}`}
                      onClose={() => removeCategoryChip(index, setFieldValue)}
                      style={styles.chip}
                      mode="outlined"
                    >
                      {category}
                    </Chip>
                  ))}
                </ScrollView>
                <View style={styles.chipInputRow}>
                  <TextInput
                    placeholder="Add category"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    style={styles.chipInput}
                    mode="outlined"
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={() => addCategoryChip(newCategory, setFieldValue)}
                      />
                    }
                  />
                </View>
                {/* Hidden input for Formik */}
                <TextInput
                  value={values.categories}
                  onChangeText={handleChange('categories')}
                  style={{ display: 'none' }}
                />
              </View>
              
              <TextInput
                label="Description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                mode="outlined"
                style={styles.textArea}
                multiline
                numberOfLines={4}
              />
              
              <TextInput
                label="Notes"
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
                mode="outlined"
                style={styles.textArea}
                multiline
                numberOfLines={3}
              />
              
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
              >
                Add Book to Library
              </Button>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  scanButton: {
    backgroundColor: '#4A90E2',
  },
  scanButtonLabel: {
    fontSize: 12,
  },
  formContainer: {
    width: '100%',
  },
  isbnSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  isbnInput: {
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4A90E2',
  },
  divider: {
    marginVertical: 15,
  },
  coverPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: 120,
    height: 180,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  removeCoverButton: {
    marginVertical: 5,
  },
  noCoverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 20,
  },
  noCoverText: {
    marginTop: 10,
    color: '#999999',
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  textArea: {
    marginBottom: 15,
    height: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 30,
    padding: 5,
    backgroundColor: '#4A90E2',
  },
  // Chip section styles
  chipSection: {
    marginBottom: 15,
  },
  chipSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  chipScrollView: {
    flexDirection: 'row',
    marginBottom: 10,
    maxHeight: 45,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  chipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipInput: {
    flex: 1,
    marginBottom: 10,
  },
});

export default AddBookScreen;