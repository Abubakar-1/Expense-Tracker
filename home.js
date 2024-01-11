import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as updateProfileAuth,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfq97tM6WBip8Dp-HJoEulpKgPF_71Lhc",
  authDomain: "expense-tracker-26f58.firebaseapp.com",
  projectId: "expense-tracker-26f58",
  storageBucket: "expense-tracker-26f58.appspot.com",
  messagingSenderId: "707921588508",
  appId: "1:707921588508:web:529251a8531e2f11efcad9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const signupFullNameInput = document.getElementById("signupFullName");
  const signupEmailInput = document.getElementById("signupEmail");
  const signupPasswordInput = document.getElementById("signupPassword");
  const signupConfirmPasswordInput = document.getElementById(
    "signupConfirmPassword"
  );
  const signupPhoneNumberInput = document.getElementById("signupPhoneNumber");
  const signupBtn = document.getElementById("signupBtn");

  signupForm.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      signupBtn.click();
    }
  });

  signupBtn.addEventListener("click", async function () {
    const fullName = signupFullNameInput.value;
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const confirmPassword = signupConfirmPasswordInput.value;
    const phoneNumber = signupPhoneNumberInput.value;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile with additional information
      await updateProfileAuth(userCredential.user, {
        displayName: fullName,
      });

      // Add user details to Firestore directly
      const usersCollection = collection(db, "users");
      const userDoc = doc(usersCollection, userCredential.user.uid);
      await setDoc(userDoc, {
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
      });

      console.log("User signed up:", userCredential.user);

      Toastify({
        text: "Signup successful!",
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center", "right"
        backgroundColor: "#007bff",
      }).showToast();

      // Delay before redirecting to index.html
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      // Show Toastify error notification
      Toastify({
        text: `Signup error: ${error.message}`,
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center", "right"
        backgroundColor: "red",
      }).showToast();
      console.error("Signup error:", error.message);
    }
  });
});

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", function () {
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("User logged in:", userCredential.user);
      document.getElementById("loginMessage").innerHTML = "Login successful!";
      // window.location.href = "index.html";
      Toastify({
        text: "Login successful!",
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center", "right"
        backgroundColor: "#007bff",
      }).showToast();

      // Delay before redirecting to index.html
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    })
    .catch((error) => {
      // Show Toastify error notification
      Toastify({
        text: `Signup error: ${error.message}`,
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center", "right"
        backgroundColor: "red",
      }).showToast();
      console.error("Login error:", error.message);
    });
});

// Event listener for "Forgot Password" button
document
  .getElementById("forgotPasswordBtn")
  .addEventListener("click", function () {
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    // Call the function to send a password reset email
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent. Please check your inbox.");
      })
      .catch((error) => {
        console.error("Error sending password reset email:", error.message);
        alert("Error sending password reset email. Please try again.");
      });
  });
