# Library Management App

A React Native application for library management with QR code-based borrowing system, built with Expo.

## Features

### Admin Features
- Dashboard with library statistics and quick actions
- Book management (add, edit, delete)
- Barcode scanning to add books using Google Books API
- QR code generation for books
- Borrowers management
- Reports and analytics

### Borrower Features
- Browse and search library catalog
- Scan QR codes to borrow books
- OTP verification for secure borrowing
- View borrowed books and history
- Return books

## Tech Stack

- React Native with Expo
- Firebase (Authentication, Firestore, Storage)
- React Navigation for routing
- React Native Paper for UI components
- Expo Camera and Barcode Scanner
- QR code generation and scanning
- OTP verification via email/SMS
- Google Books API integration

## Project Structure

```
LibraryApp/
├── App.js                  # App entry point
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable components
│   ├── context/            # Context providers
│   │   └── AuthContext.js  # Authentication context
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation structure
│   │   ├── AppNavigator.js        # Main app navigator
│   │   ├── AuthNavigator.js       # Auth flow
│   │   ├── AdminNavigator.js      # Admin screens
│   │   └── BorrowerNavigator.js   # Borrower screens
│   ├── screens/
│   │   ├── admin/          # Admin screens
│   │   ├── auth/           # Authentication screens
│   │   ├── borrower/       # Borrower screens
│   │   └── common/         # Shared screens
│   ├── services/
│   │   ├── firebase.js     # Firebase configuration
│   │   ├── bookService.js  # Book-related operations
│   │   └── borrowService.js# Borrowing logic
│   ├── theme/              # Styling constants
│   └── utils/              # Utility functions
```

## Setup

### Prerequisites

- Node.js (v14+)
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Google Books API key
- Expo account (optional, for easier testing)

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up necessary collections (books, borrows, users, otps)
5. Get your Firebase config from Project Settings > General > Your apps > SDK setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/library-app.git
cd library-app
```

2. Install dependencies:
```bash
npm install
```

3. Update Firebase configuration:
   - Open `src/services/firebase.js`
   - Replace the firebaseConfig object with your own Firebase configuration

4. Update Google Books API key:
   - Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Books API for your project
   - Add the key to your API requests in `bookService.js`

5. Run the app:
```bash
npm start
```

## Usage

### Admin Setup

1. Register a new user with admin role
2. Add books to the library using manual entry or barcode scanning
3. Generate QR codes for books
4. Manage borrowers and track statistics

### Borrower Flow

1. Register as a borrower
2. Browse the library catalog or scan book QR codes
3. Borrow books using OTP verification
4. Return books when finished

## Database Structure

### Collections

- **users**: User profiles (name, email, role)
- **books**: Book information (title, author, status, etc.)
- **borrows**: Borrowing records (bookId, userId, dates, status)
- **otps**: OTP verification records for borrowing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
