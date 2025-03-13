document.addEventListener('DOMContentLoaded', () => {
  // Handle delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const productId = e.target.dataset.id;

      if (confirm('Are you sure you want to delete this product?')) {
        try {
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            // Redirect to products list or remove from DOM
            if (window.location.pathname === '/products') {
              // Remove from DOM if on list page
              const productCard = e.target.closest('.product-card');
              productCard.remove();
            } else {
              // Redirect if on detail page
              window.location.href = '/products';
            }
          } else {
            alert('Failed to delete the product');
          }
        } catch (err) {
          console.error('Error:', err);
          alert('An error occurred while deleting the product');
        }
      }
    });
  });

  // Handle search functionality
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  // Handle category filter
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }

  function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value.toLowerCase();

    document.querySelectorAll('.product-card').forEach(product => {
      const name = product.querySelector('h3').textContent.toLowerCase();
      const productCategory = product.querySelector('.category').textContent.toLowerCase();
      const matchesSearch = name.includes(searchTerm);
      const matchesCategory = !category || productCategory.includes(category);

      if (matchesSearch && matchesCategory) {
        product.style.display = 'block';
      } else {
        product.style.display = 'none';
      }
    });
  }

  // Handle form submission with validation
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', function (e) {
      const nameInput = document.getElementById('name');
      const priceInput = document.getElementById('price');
      const categoryInput = document.getElementById('category');

      let isValid = true;
      let errorMessage = '';

      if (!nameInput.value.trim()) {
        isValid = false;
        errorMessage += 'Product name is required\n';
      }

      if (!priceInput.value || isNaN(priceInput.value) || Number(priceInput.value) <= 0) {
        isValid = false;
        errorMessage += 'Price must be a positive number\n';
      }

      if (!categoryInput.value) {
        isValid = false;
        errorMessage += 'Please select a category\n';
      }

      if (!isValid) {
        e.preventDefault();
        alert(errorMessage);
      }
    });
  }
});