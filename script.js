/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Store selected products */
let selectedProducts = [];

/* Store conversation history for follow-up questions */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty advisor. Help users ONLY with skincare routines, product recommendations, beauty advice, makeup, haircare, fragrance, and other beauty-related topics. If a user asks about anything unrelated to beauty, skincare, makeup, haircare, or personal care products, politely redirect them back to beauty topics. Say something like 'I'm here to help with beauty and skincare advice. Let's focus on your routine and product questions!' Keep your responses focused on the beauty industry and L'Oréal products when possible.",
  },
];

/* Store the last generated routine for context */
let lastGeneratedRoutine = null;

/* Show notification to user */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/* Add notification CSS */
const notificationStyle = document.createElement("style");
notificationStyle.textContent = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  }
  
  .notification.info {
    background: #007bff;
  }
  
  .notification.success {
    background: #28a745;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(notificationStyle);

/* localStorage functions for saving selected products */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    console.log("Selected products saved to localStorage");
    showNotification("Selected products saved!", "success");
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    showNotification("Error saving products. Please try again.", "error");
  }
}

function loadSelectedProductsFromStorage() {
  try {
    const saved = localStorage.getItem("selectedProducts");
    if (saved) {
      const loadedProducts = JSON.parse(saved);
      selectedProducts = loadedProducts;
      console.log(
        "Selected products loaded from localStorage:",
        selectedProducts
      );
      if (selectedProducts.length > 0) {
        showNotification(
          `${selectedProducts.length} saved products loaded`,
          "success"
        );
      }
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    selectedProducts = [];
  }
}

function clearSelectedProductsFromStorage() {
  try {
    localStorage.removeItem("selectedProducts");
    console.log("Selected products cleared from localStorage");
    showNotification("Selected products cleared!", "success");
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    showNotification("Error clearing products. Please try again.", "error");
  }
}

/* Load saved products when page loads */
loadSelectedProductsFromStorage();

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Initialize selected products display */
updateSelectedProductsList();

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Toggle product selection */
function toggleProductSelection(product) {
  /* Check if product is already selected */
  const existingIndex = selectedProducts.findIndex((p) => p.id === product.id);

  if (existingIndex > -1) {
    /* Remove from selection */
    selectedProducts.splice(existingIndex, 1);
  } else {
    /* Add to selection */
    selectedProducts.push(product);
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update the display */
  updateSelectedProductsList();

  /* Re-display products to update visual selection state */
  displayCurrentProducts();
}

/* Remove product from selected list */
function removeFromSelected(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  updateSelectedProductsList();

  /* Re-display products to update visual selection state */
  displayCurrentProducts();
}

/* Update the selected products display */
function updateSelectedProductsList() {
  const selectedList = document.getElementById("selectedProductsList");
  const clearAllBtn = document.getElementById("clearAllProducts");

  if (selectedProducts.length === 0) {
    selectedList.innerHTML = '<p class="no-products">No products selected</p>';
    clearAllBtn.disabled = true;
    return;
  }

  clearAllBtn.disabled = false;

  selectedList.innerHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-product">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-details">
        <h4>${product.name}</h4>
        <p>${product.brand}</p>
      </div>
      <button class="remove-btn" onclick="removeFromSelected(${product.id})">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `
    )
    .join("");
}

/* Store current products for re-display */
let currentProducts = [];

/* Create HTML for displaying product cards */
function displayProducts(products) {
  currentProducts = products; /* Store for later use */
  displayCurrentProducts();
}

/* Helper function to escape HTML characters */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* Show product description in modal */
function showProductDescription(product, event) {
  /* Prevent card selection when clicking description button */
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  /* Create modal HTML */
  const modalHTML = `
    <div id="productModal" class="modal-overlay" onclick="closeProductModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${escapeHtml(product.name)}</h2>
          <button class="modal-close" onclick="closeProductModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="product-modal-info">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(
    product.name
  )}" class="modal-product-image">
            <div class="product-modal-details">
              <p class="modal-brand"><strong>Brand:</strong> ${escapeHtml(
                product.brand
              )}</p>
              <p class="modal-category"><strong>Category:</strong> ${escapeHtml(
                product.category
              )}</p>
              <div class="modal-description">
                <h3>Description</h3>
                <p>${escapeHtml(product.description)}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-select-btn" onclick="selectProductFromModal(${
            product.id
          })">
            ${
              selectedProducts.some((p) => p.id === product.id)
                ? '<i class="fa-solid fa-check"></i> Selected'
                : '<i class="fa-solid fa-plus"></i> Add to Routine'
            }
          </button>
          <button class="modal-close-btn" onclick="closeProductModal()">Close</button>
        </div>
      </div>
    </div>
  `;

  /* Add modal to page */
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  /* Prevent body scroll */
  document.body.style.overflow = "hidden";

  /* Focus on modal for accessibility */
  document.getElementById("productModal").focus();
}

/* Close product modal */
function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "auto";
  }
}

/* Select product from modal */
function selectProductFromModal(productId) {
  /* Find the product by ID from currentProducts */
  const product = currentProducts.find((p) => p.id === productId);

  if (product) {
    toggleProductSelection(product);
    closeProductModal();

    /* Update the products display to reflect selection change */
    displayCurrentProducts();
  }
}

/* Handle escape key to close modal */
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeProductModal();
  }
});

/* Display current products with selection state */
function displayCurrentProducts() {
  productsContainer.innerHTML = currentProducts
    .map((product) => {
      /* Check if product is selected */
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      const selectedClass = isSelected ? " selected" : "";

      return `
    <div class="product-card${selectedClass}" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="brand">${product.brand}</p>
        
        <button class="description-toggle" data-product-id="${product.id}">
          <i class="fa-solid fa-info-circle"></i> Details
        </button>
        
        ${
          isSelected
            ? '<div class="selected-indicator"><i class="fa-solid fa-check"></i> Selected</div>'
            : ""
        }
      </div>
    </div>
  `;
    })
    .join("");
}

/* Add event listeners for product cards */
document.addEventListener("click", function (event) {
  /* Handle details button click */
  if (event.target.closest(".description-toggle")) {
    event.stopPropagation();
    event.preventDefault();

    const button = event.target.closest(".description-toggle");
    const productId = parseInt(button.getAttribute("data-product-id"));
    const product = currentProducts.find((p) => p.id === productId);

    if (product) {
      showProductDescription(product, event);
    }
    return;
  }

  /* Handle product card click */
  if (event.target.closest(".product-card")) {
    const card = event.target.closest(".product-card");
    const productId = parseInt(card.getAttribute("data-product-id"));
    const product = currentProducts.find((p) => p.id === productId);

    if (product) {
      toggleProductSelection(product);
    }
  }
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Send message to OpenAI API using Cloudflare Worker */
async function sendMessageToOpenAI(userMessage, includeFullHistory = true) {
  try {
    /* Create the request payload for OpenAI API */
    const messages = includeFullHistory
      ? [...conversationHistory, { role: "user", content: userMessage }]
      : [
          {
            role: "system",
            content:
              "You are a helpful L'Oréal beauty advisor. Help users ONLY with skincare routines, product recommendations, beauty advice, makeup, haircare, fragrance, and other beauty-related topics. If a user asks about anything unrelated to beauty, skincare, makeup, haircare, or personal care products, politely redirect them back to beauty topics. Say something like 'I'm here to help with beauty and skincare advice. Let's focus on your routine and product questions!'",
          },
          { role: "user", content: userMessage },
        ];

    const requestBody = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    };

    console.log("Sending request to Cloudflare Worker:", requestBody);

    /* Send request to Cloudflare Worker which handles OpenAI API key */
    const response = await fetch("https://openapi-key.nable.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; L'Oreal-App/1.0)",
      },
      body: JSON.stringify(requestBody),
      mode: "cors",
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);

    /* Check if the request was successful */
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    /* Parse the response from OpenAI */
    const data = await response.json();
    console.log("Response data:", data);

    /* Check if we got a valid response */
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      const aiResponse = data.choices[0].message.content;

      /* Save to conversation history if using full history */
      if (includeFullHistory) {
        conversationHistory.push({ role: "user", content: userMessage });
        conversationHistory.push({ role: "assistant", content: aiResponse });
      }

      return aiResponse;
    } else {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    /* Check for specific error types */
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network error: Unable to connect to the API. This might be due to CORS restrictions or network issues. Please check your internet connection and try again."
      );
    }

    if (error.message.includes("blocked by CORS policy")) {
      throw new Error(
        "CORS error: The API request was blocked. Please check the Cloudflare Worker CORS configuration."
      );
    }

    throw error;
  }
}

/* Generate routine using selected products */
async function generateRoutine() {
  /* Check if any products are selected */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      '<p class="error-message">Please select some products first to generate a routine!</p>';
    return;
  }

  /* Show loading message */
  chatWindow.innerHTML =
    '<p class="loading-message">Generating your personalized routine...</p>';

  try {
    /* Create message with selected products data */
    const productsData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    const routineMessage = `Please create a personalized skincare routine using these selected products:

${productsData
  .map(
    (product) =>
      `- ${product.name} by ${product.brand} (${product.category}): ${product.description}`
  )
  .join("\n")}

Please provide a step-by-step routine with morning and evening instructions, explaining when and how to use each product for best results.`;

    /* Get AI response */
    const aiResponse = await sendMessageToOpenAI(routineMessage, false);

    /* Save the routine context for follow-up questions */
    lastGeneratedRoutine = {
      products: productsData,
      routine: aiResponse,
      timestamp: new Date(),
    };

    /* Add routine context to conversation history */
    conversationHistory.push({
      role: "user",
      content: `I have selected these products for my routine: ${productsData
        .map((p) => p.name)
        .join(", ")}. Please create a personalized routine for me.`,
    });
    conversationHistory.push({
      role: "assistant",
      content: aiResponse,
    });

    /* Display the routine in the chat window */
    chatWindow.innerHTML = `
      <div class="routine-response">
        <h3>Your Personalized Routine</h3>
        <div class="routine-content">${aiResponse.replace(/\n/g, "<br>")}</div>
        <div class="follow-up-prompt">
          <p><em>You can now ask follow-up questions about your routine in the chat below!</em></p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error generating routine:", error);

    /* Show specific error message based on error type */
    let errorMessage =
      "Sorry, there was an error generating your routine. Please try again.";

    if (error.message.includes("Network error")) {
      errorMessage =
        "Network connection issue. Please check your internet connection and try again.";
    } else if (error.message.includes("HTTP error")) {
      errorMessage =
        "Server error. The API service might be temporarily unavailable. Please try again later.";
    }

    chatWindow.innerHTML = `<p class="error-message">${errorMessage}</p>`;
  }
}

/* Clear conversation history (useful for starting fresh) */
function clearConversationHistory() {
  conversationHistory = [
    {
      role: "system",
      content:
        "You are a helpful L'Oréal beauty advisor. Help users ONLY with skincare routines, product recommendations, beauty advice, makeup, haircare, fragrance, and other beauty-related topics. If a user asks about anything unrelated to beauty, skincare, makeup, haircare, or personal care products, politely redirect them back to beauty topics. Say something like 'I'm here to help with beauty and skincare advice. Let's focus on your routine and product questions!' Keep your responses focused on the beauty industry and L'Oréal products when possible.",
    },
  ];
  lastGeneratedRoutine = null;
}

/* Clear all selected products */
function clearAllProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsList();
  displayCurrentProducts();
}

/* Add event listener for Clear All button */
document
  .getElementById("clearAllProducts")
  .addEventListener("click", clearAllProducts);

/* Add event listener for Generate Routine button */
document
  .getElementById("generateRoutine")
  .addEventListener("click", generateRoutine);

/* Chat form submission handler with OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  /* Get the user's message from the input field */
  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  /* Don't send empty messages */
  if (!userMessage) {
    return;
  }

  /* Show user message and loading */
  chatWindow.innerHTML += `
    <div class="user-message">You: ${userMessage}</div>
    <div class="loading-message">Thinking...</div>
  `;

  /* Clear the input field */
  userInput.value = "";

  try {
    /* Send message to OpenAI with conversation history */
    const aiResponse = await sendMessageToOpenAI(userMessage, true);

    /* Remove loading message and add AI response */
    const loadingMessage = chatWindow.querySelector(".loading-message");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    chatWindow.innerHTML += `
      <div class="ai-message">AI: ${aiResponse.replace(/\n/g, "<br>")}</div>
    `;

    /* Scroll to bottom */
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    /* Remove loading message and show error */
    const loadingMessage = chatWindow.querySelector(".loading-message");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    chatWindow.innerHTML += `
      <div class="error-message">Sorry, I'm having trouble connecting right now. Please try again.</div>
    `;
  }
});

/* Save selected products to storage on unload */
window.addEventListener("beforeunload", () => {
  saveSelectedProductsToStorage();
});
