import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
  deleteDoc,
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

function toggleProfilePopup() {
  const profilePopup = document.getElementById("profilePopup");
  profilePopup.style.display =
    profilePopup.style.display === "block" ? "none" : "block";
}

// Function to get the user profile from Firestore
async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userRef);
  return userSnapshot.data();
}

function viewProfile() {
  // Get the user's profile data
  const userProfilePromise = getUserProfile(auth.currentUser.uid);

  // Display the user's profile data (you can customize this part)
  userProfilePromise
    .then((userProfile) => {
      if (userProfile) {
        alert(
          `User Profile:\nName: ${userProfile.fullName}\nEmail: ${userProfile.email}`
        );
      } else {
        alert("User profile not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching user profile:", error);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const profileButton = document.getElementById("profileButton");
    profileButton.addEventListener("click", toggleProfilePopup);

    const viewProfileDiv = document.getElementById("viewProfile");
    viewProfileDiv.addEventListener("click", viewProfile);

    const signOutBtn = document.getElementById("signOutBtn");
    signOutBtn.addEventListener("click", function () {
      // Sign out the user
      signOut(auth)
        .then(() => {
          // Redirect to index.html after sign-out
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Sign-out error:", error);
        });
    });

    // Sample expenses data
    let expensesData = [];

    // Function to update the expenses table
    function updateExpensesTable() {
      console.log("Updating expenses table:", expensesData);
      const tableBody = document.getElementById("expensesTable");
      tableBody.innerHTML = "";

      if (expensesData.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
          <td colspan="4" class="text-center">No expenses to display</td>
        `;
        tableBody.appendChild(emptyRow);
      } else {
        expensesData.forEach((expense) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${expense.expenseName}</td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td>${capitalizeFirstLetter(expense.category)}</td>
            <td>${expense.date}</td>
            <td><button class="edit-button" data-expense-id="${
              expense.id
            }">Edit</button></td>
            <td><button class="delete-button" data-expense-id="${
              expense.id
            }">Delete</button></td>
          `;
          tableBody.appendChild(row);
        });
      }
    }

    // Function to update summary statistics
    function updateSummaryStatistics() {
      console.log("Updating summary statistics:", expensesData);
      const totalExpenses = expensesData.reduce(
        (total, expense) => total + expense.amount,
        0
      );
      const averageExpense = expensesData.length
        ? totalExpenses / expensesData.length
        : 0;
      const maximumExpense = expensesData.length
        ? Math.max(...expensesData.map((expense) => expense.amount))
        : 0;

      document.getElementById(
        "totalExpenses"
      ).innerText = `$${totalExpenses.toFixed(2)}`;
      document.getElementById(
        "averageExpense"
      ).innerText = `$${averageExpense.toFixed(2)}`;
      document.getElementById(
        "maximumExpense"
      ).innerText = `$${maximumExpense.toFixed(2)}`;
    }

    // Function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    // Function to handle edit expense
    async function editExpense(expenseId, row) {
      const expenseRef = doc(db, "expenses", expenseId);
      const expenseSnapshot = await getDoc(expenseRef);
      const expenseData = expenseSnapshot.data();

      // Replace table cells with input fields
      row.innerHTML = `
        <td><input type="text" id="editExpenseName" value="${expenseData.expenseName}"></td>
        <td><input type="number" id="editAmount" value="${expenseData.amount}"></td>
        <td><input type="text" id="editCategory" value="${expenseData.category}"></td>
        <td><input type="date" id="editDate" value="${expenseData.date}"></td>
        <td><button class="save-button" data-expense-id="${expenseId}">Save</button></td>
        <td><button class="cancel-button">Cancel</button></td>
      `;

      // Attach event listener to the "Cancel" button
      row.querySelector(".cancel-button").addEventListener("click", () => {
        // Revert changes and update the UI
        updateExpensesTable();
        updateSummaryStatistics();
      });

      // Attach event listener to the "Save" button
      row.querySelector(".save-button").addEventListener("click", async () => {
        const editedExpenseName = row.querySelector("#editExpenseName").value;
        const editedAmount = parseFloat(row.querySelector("#editAmount").value);
        const editedCategory = row.querySelector("#editCategory").value;
        const editedDate = row.querySelector("#editDate").value;

        // Validate edited values
        if (
          !editedExpenseName ||
          isNaN(editedAmount) ||
          !editedCategory ||
          !editedDate
        ) {
          alert("Please fill in all fields with valid data.");
          return;
        }

        try {
          // Update Firestore document with edited values
          await updateDoc(expenseRef, {
            expenseName: editedExpenseName,
            amount: editedAmount,
            category: editedCategory,
            date: editedDate,
          });

          // Update UI and summary statistics
          updateExpensesTable();
          updateSummaryStatistics();
        } catch (error) {
          console.error("Error updating expense:", error);
        }
      });
    }

    // Function to handle delete expense
    async function deleteExpense(expenseId) {
      const expenseRef = doc(db, "expenses", expenseId);

      try {
        // Delete the expense document from Firestore
        await deleteDoc(expenseRef);
        console.log(`Expense with ID ${expenseId} deleted successfully.`);
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }

    document
      .getElementById("expensesTable")
      .addEventListener("click", function (event) {
        const target = event.target;

        if (
          target.tagName === "BUTTON" &&
          target.classList.contains("delete-button")
        ) {
          const expenseId = target.getAttribute("data-expense-id");

          if (expenseId) {
            deleteExpense(expenseId);
          }
        }
      });

    function submitExpense() {
      const expenseName = document.getElementById("expenseName").value;
      const amount = parseFloat(document.getElementById("amount").value);
      const categoryInput = document.getElementById("newCategory");
      const date = document.getElementById("date").value;

      // Validate form input
      if (!expenseName || isNaN(amount) || !categoryInput.value || !date) {
        alert("Please fill in all fields with valid data.");
        return;
      }

      let category;

      category = categoryInput.value;

      // Add new expense to Firebase
      addExpenseToFirebase(expenseName, amount, category, date);

      // Update the UI
      updateExpensesTable();
      updateSummaryStatistics();

      // Clear the form
      document.getElementById("expenseForm").reset();
    }

    // Function to add expense to Firebase
    async function addExpenseToFirebase(expenseName, amount, category, date) {
      try {
        const expensesCollection = collection(db, "expenses");
        await addDoc(expensesCollection, {
          expenseName,
          amount,
          category,
          date,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
        });
        console.log("Expense added to Firebase successfully.");
      } catch (error) {
        console.error("Error adding expense to Firebase:", error);
      }
    }

    // Function to update the pie chart
    function updateExpenseDistributionChart() {
      const categories = expensesData.map((expense) =>
        expense.category.toLowerCase()
      );
      console.log(categories);

      // Count occurrences of each category
      const categoryCounts = categories.reduce((counts, category) => {
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {});

      const uniqueCategories = Object.keys(categoryCounts);
      const data = uniqueCategories.map((category) => categoryCounts[category]);

      const chartData = {
        labels: uniqueCategories,
        datasets: [
          {
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(153, 102, 255, 0.7)",
            ],
          },
        ],
      };

      const chartCanvas = document.getElementById("expenseDistributionChart");
      const existingChart = Chart.getChart(chartCanvas);

      // Destroy existing chart if it exists
      if (existingChart) {
        existingChart.destroy();
      }

      // Create a new chart
      const ctx = chartCanvas.getContext("2d");
      new Chart(ctx, {
        type: "pie",
        data: chartData,
      });
    }

    document.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitExpense();
      }
    });

    document
      .getElementById("addExpenseBtn")
      .addEventListener("click", function () {
        submitExpense();
      });

    // Attach event listener to the "Edit" button in the table
    document
      .getElementById("expensesTable")
      .addEventListener("click", function (event) {
        const target = event.target;

        if (
          target.tagName === "BUTTON" &&
          target.classList.contains("edit-button")
        ) {
          const expenseId = target.getAttribute("data-expense-id");
          const row = target.closest("tr");

          if (expenseId && row) {
            editExpense(expenseId, row);
          }
        }
      });

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User is logged in:", user);

        const welcomeMessage = document.getElementById("welcomeMessage");
        welcomeMessage.textContent = `Welcome, ${user.displayName.toUpperCase()}!`;

        const expensesCollection = collection(db, "expenses");
        const q = query(
          expensesCollection,
          where("uid", "==", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          expensesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          updateExpensesTable();
          updateSummaryStatistics();
          // Call the function after fetching expenses data
          updateExpenseDistributionChart();
        });
      } else {
        console.log("No user is logged in.");
        window.location.href = "index.html";
        return;
      }
    });
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});
