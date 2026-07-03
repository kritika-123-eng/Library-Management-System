/**
 * Library Management System - Vanilla JavaScript Engine
 * Persists data with browser localStorage and manages interactive UI state.
 */

// Initial Seed Books for first-time loaders
const DEFAULT_BOOKS = [
  { id: "B101", title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "available", category: "Fiction" },
  { id: "B102", title: "To Kill a Mockingbird", author: "Harper Lee", status: "borrowed", category: "Fiction" },
  { id: "B103", title: "1984", author: "George Orwell", status: "available", category: "Sci-Fi / Fantasy" }
];

// App State
let books = [];
let editingBookId = null;
let deleteBookId = null;

// DOM Elements
const bookForm = document.getElementById("bookForm");
const bookIdInput = document.getElementById("bookId");
const bookTitleInput = document.getElementById("bookTitle");
const bookAuthorInput = document.getElementById("bookAuthor");
const bookStatusInput = document.getElementById("bookStatus");
const bookCategoryInput = document.getElementById("bookCategory");
const formSubmitBtn = document.getElementById("formSubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formCard = document.getElementById("formCard");
const formTitle = document.getElementById("formTitle");

const searchInput = document.getElementById("searchInput");
const filterTabs = document.querySelectorAll(".filter-tab");
const booksTableBody = document.getElementById("booksTableBody");
const emptyState = document.getElementById("emptyState");
const booksTableWrapper = document.getElementById("booksTableWrapper");

const totalBooksCount = document.getElementById("totalBooksCount");
const availableBooksCount = document.getElementById("availableBooksCount");
const borrowedBooksCount = document.getElementById("borrowedBooksCount");

const toastContainer = document.getElementById("toastContainer");

const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  setupEventListeners();
  renderApp();
});

// Event Listeners Setup
function setupEventListeners() {
  // Add / Edit Book Form Submission
  bookForm.addEventListener("submit", handleFormSubmit);

  // Form input real-time validations (clear errors on type)
  [bookIdInput, bookTitleInput, bookAuthorInput, bookCategoryInput].forEach(input => {
    input.addEventListener(input.tagName === "SELECT" ? "change" : "input", () => {
      clearInputError(input);
    });
  });

  // Cancel Edit action
  cancelEditBtn.addEventListener("click", resetForm);

  // Status option selector in form
  const statusOptions = document.querySelectorAll(".status-option");
  statusOptions.forEach(option => {
    option.addEventListener("click", () => {
      statusOptions.forEach(opt => opt.classList.remove("active"));
      option.classList.add("active");
      bookStatusInput.value = option.dataset.status;
    });
  });

  // Search input typing
  searchInput.addEventListener("input", renderBooksList);

  // Filter tabs clicking
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderBooksList();
    });
  });

  // Modal Actions
  confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  cancelDeleteBtn.addEventListener("click", hideDeleteModal);
  confirmDeleteModal.addEventListener("click", (e) => {
    if (e.target === confirmDeleteModal) hideDeleteModal();
  });
}

// Load Books from LocalStorage
function loadBooks() {
  const localData = localStorage.getItem("lms_books");
  if (localData) {
    books = JSON.parse(localData);
  } else {
    // Seed default books if empty
    books = [...DEFAULT_BOOKS];
    saveBooks();
  }
}

// Save Books to LocalStorage
function saveBooks() {
  localStorage.setItem("lms_books", JSON.stringify(books));
}

// Render Entire Application Layout and Stats
function renderApp() {
  renderStats();
  renderBooksList();
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Calculate and Update Dashboard stats
function renderStats() {
  const total = books.length;
  const available = books.filter(b => b.status === "available").length;
  const borrowed = total - available;

  totalBooksCount.textContent = total;
  availableBooksCount.textContent = available;
  borrowedBooksCount.textContent = borrowed;
}

// Helper to get Category badge class
function getCategoryBadgeClass(category) {
  switch (category) {
    case "Fiction": return "badge-fiction";
    case "Non-Fiction": return "badge-nonfiction";
    case "Sci-Fi / Fantasy": return "badge-scifi";
    case "Biography": return "badge-biography";
    case "History": return "badge-history";
    case "Technology": return "badge-technology";
    case "Mystery / Thriller": return "badge-mystery";
    case "Kids": return "badge-kids";
    default: return "badge-other";
  }
}

// Render dynamic Books List/Table Row elements
function renderBooksList() {
  const searchPhrase = searchInput.value.toLowerCase().trim();
  const activeTab = document.querySelector(".filter-tab.active").dataset.filter;

  // Filter books based on active tab and search searchPhrase
  const filteredBooks = books.filter(book => {
    const bookCategory = book.category || "Other";
    const matchesSearch = book.title.toLowerCase().includes(searchPhrase) || 
                          book.author.toLowerCase().includes(searchPhrase) ||
                          bookCategory.toLowerCase().includes(searchPhrase) ||
                          book.id.toLowerCase().includes(searchPhrase);
    
    const matchesFilter = activeTab === "all" || book.status === activeTab;

    return matchesSearch && matchesFilter;
  });

  // If no books match the filters or search
  if (filteredBooks.length === 0) {
    booksTableWrapper.style.display = "none";
    emptyState.style.display = "flex";
    
    // Customize empty state message if it's a search/filter result
    const emptyTitle = emptyState.querySelector("h3");
    const emptyDesc = emptyState.querySelector("p");
    
    if (searchPhrase || activeTab !== "all") {
      emptyTitle.textContent = "No Matches Found";
      emptyDesc.textContent = "Try adjusting your search terms or filter constraints.";
    } else {
      emptyTitle.textContent = "No Books in Library";
      emptyDesc.textContent = "Your library shelf is currently empty. Add your first book above!";
    }
    return;
  }

  // Show table & hide empty state
  booksTableWrapper.style.display = "block";
  emptyState.style.display = "none";

  // Build table rows
  booksTableBody.innerHTML = filteredBooks.map(book => {
    const isAvailable = book.status === "available";
    const badgeClass = isAvailable ? "badge-success" : "badge-warning";
    const badgeText = isAvailable ? "Available" : "Borrowed";
    const badgeIcon = isAvailable ? "check-circle" : "alert-circle";
    const categoryText = book.category || "Other";
    const categoryClass = getCategoryBadgeClass(categoryText);

    return `
      <tr>
        <td><code class="font-mono text-xs">${escapeHTML(book.id)}</code></td>
        <td>
          <div class="book-meta-group">
            <span class="book-title">${escapeHTML(book.title)}</span>
            <span class="book-author">by ${escapeHTML(book.author)}</span>
          </div>
        </td>
        <td>
          <span class="badge ${categoryClass}">
            ${escapeHTML(categoryText)}
          </span>
        </td>
        <td>
          <span class="badge ${badgeClass}">
            <i data-lucide="${badgeIcon}" style="width: 12px; height: 12px;"></i>
            ${badgeText}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="startEditBook('${escapeHTML(book.id)}')" title="Edit details">
              <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="action-btn delete" onclick="queueDeleteBook('${escapeHTML(book.id)}')" title="Remove Book">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Re-create icons for freshly appended items
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Form Submission (Create or Edit)
function handleFormSubmit(e) {
  e.preventDefault();

  const id = bookIdInput.value.trim();
  const title = bookTitleInput.value.trim();
  const author = bookAuthorInput.value.trim();
  const status = bookStatusInput.value;
  const category = bookCategoryInput.value;

  // Validation
  let isValid = true;

  if (!id) {
    showInputError(bookIdInput, "Book ID is required");
    isValid = false;
  } else if (!editingBookId && books.some(b => b.id.toLowerCase() === id.toLowerCase())) {
    showInputError(bookIdInput, "This Book ID already exists");
    isValid = false;
  }

  if (!title) {
    showInputError(bookTitleInput, "Book Title is required");
    isValid = false;
  }

  if (!author) {
    showInputError(bookAuthorInput, "Author name is required");
    isValid = false;
  }

  if (!category) {
    showInputError(bookCategoryInput, "Please select a category");
    isValid = false;
  }

  if (!isValid) return;

  if (editingBookId) {
    // Edit existing book
    const bookIndex = books.findIndex(b => b.id === editingBookId);
    if (bookIndex !== -1) {
      books[bookIndex] = { id, title, author, status, category };
      saveBooks();
      showToast(`Book "${title}" successfully updated!`, "success");
    }
  } else {
    // Add new book
    books.push({ id, title, author, status, category });
    saveBooks();
    showToast(`Book "${title}" added to your library!`, "success");
  }

  resetForm();
  renderApp();
}

// Enter Edit Mode
window.startEditBook = function(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  editingBookId = id;
  
  // Set values
  bookIdInput.value = book.id;
  // Disable ID editing to prevent core primary key changes
  bookIdInput.disabled = true;
  bookTitleInput.value = book.title;
  bookAuthorInput.value = book.author;
  bookStatusInput.value = book.status;
  bookCategoryInput.value = book.category || "Fiction";

  // Update Status Selection in UI
  const statusOptions = document.querySelectorAll(".status-option");
  statusOptions.forEach(opt => {
    opt.classList.remove("active");
    if (opt.dataset.status === book.status) {
      opt.classList.add("active");
    }
  });

  // Change form aesthetic to 'Editing'
  formCard.classList.add("editing");
  formTitle.innerHTML = `<i data-lucide="edit-3"></i> Edit Book Details`;
  formSubmitBtn.innerHTML = `<i data-lucide="check"></i> Update Book`;
  cancelEditBtn.style.display = "inline-flex";

  // Scroll to form smoothly
  formCard.scrollIntoView({ behavior: "smooth" });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
};

// Reset Form & Exit Edit Mode
function resetForm() {
  editingBookId = null;
  bookForm.reset();
  
  bookIdInput.disabled = false;
  bookStatusInput.value = "available";

  // Reset status selector buttons UI
  const statusOptions = document.querySelectorAll(".status-option");
  statusOptions.forEach(opt => opt.classList.remove("active"));
  document.querySelector(".status-option[data-status='available']").classList.add("active");

  // Remove styling
  formCard.classList.remove("editing");
  formTitle.innerHTML = `<i data-lucide="plus-circle"></i> Add New Book`;
  formSubmitBtn.innerHTML = `<i data-lucide="plus"></i> Add Book`;
  cancelEditBtn.style.display = "none";

  // Clean validation errors
  [bookIdInput, bookTitleInput, bookAuthorInput, bookCategoryInput].forEach(clearInputError);

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Queue Book Deletion (Shows Confirmation Dialog)
window.queueDeleteBook = function(id) {
  deleteBookId = id;
  const book = books.find(b => b.id === id);
  if (!book) return;
  
  // Update Modal message dynamically
  const modalBody = confirmDeleteModal.querySelector(".modal-body");
  modalBody.innerHTML = `Are you sure you want to delete <strong>"${escapeHTML(book.title)}"</strong> (ID: ${escapeHTML(book.id)})? This action cannot be undone.`;

  showDeleteModal();
};

// Confirm and Execute Deletion
function handleConfirmDelete() {
  if (!deleteBookId) return;

  const book = books.find(b => b.id === deleteBookId);
  const title = book ? book.title : "Book";

  books = books.filter(b => b.id !== deleteBookId);
  saveBooks();
  showToast(`Book "${title}" deleted successfully!`, "danger");
  
  // If we delete the book currently being edited, reset the form
  if (editingBookId === deleteBookId) {
    resetForm();
  }

  hideDeleteModal();
  renderApp();
}

// Show/Hide Delete Modal utilities
function showDeleteModal() {
  confirmDeleteModal.classList.add("show");
}

function hideDeleteModal() {
  confirmDeleteModal.classList.remove("show");
  deleteBookId = null;
}

// Error presentation utilities
function showInputError(inputElement, errorMessage) {
  inputElement.classList.add("error");
  const errorContainer = inputElement.nextElementSibling;
  if (errorContainer && errorContainer.classList.contains("error-message")) {
    errorContainer.textContent = errorMessage;
    errorContainer.classList.add("show");
  }
}

function clearInputError(inputElement) {
  inputElement.classList.remove("error");
  const errorContainer = inputElement.nextElementSibling;
  if (errorContainer && errorContainer.classList.contains("error-message")) {
    errorContainer.classList.remove("show");
    errorContainer.textContent = "";
  }
}

// Toast notification trigger
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let iconName = "check-circle";
  if (type === "danger") iconName = "trash-2";
  if (type === "info") iconName = "info";

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
    <div class="toast-message">${escapeHTML(message)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i data-lucide="x" style="width: 14px; height: 14px;"></i>
    </button>
  `;

  toastContainer.appendChild(toast);
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Auto-dismiss element after animation duration
  setTimeout(() => {
    toast.remove();
  }, 3300); // 3s delay + 0.3s fadeout
}

// Simple HTML escaping to protect against XSS injections
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
