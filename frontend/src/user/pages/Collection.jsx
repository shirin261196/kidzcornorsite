import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, selectFilteredProducts, updateProductStock } from '../../redux/slices/productSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { ShopContext } from '../../context/ShopContext';

const Collection = () => {
  const dispatch = useDispatch();
  const { search } = useContext(ShopContext);

  // State management
  const products = useSelector(selectFilteredProducts);
  const isLoading = useSelector((state) => state.products.loading);
  const categories = useSelector((state) => state.categories.categories);
  const categoriesLoading = useSelector((state) => state.categories.loading);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortType, setSortType] = useState('relevant');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch products and categories on mount
  useEffect(() => {
    dispatch(fetchProducts()); // Load products via Redux action
   
    dispatch(fetchCategories()); // Load categories via Redux action
  }, [dispatch]);

  // Filter products by selected categories
// Filter products by selected categories
const filteredProducts = products.filter((item) =>
  selectedCategories.length > 0
    ? selectedCategories.includes(item.category._id.toString()) // Convert to string if needed
    : true
);
  // Further filter products by search input
  const searchedProducts = filteredProducts.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort products based on selected criteria
  const sortedProducts = [...searchedProducts].sort((a, b) => {
    switch (sortType) {
      case 'low-to-high':
        return a.price - b.price;
      case 'high-to-low':
        return b.price - a.price;
      case 'popularity':
        return b.popularity - a.popularity;
      case 'average-ratings':
        return b.averageRating - a.averageRating;
      case 'featured':
        return b.isFeatured ? -1 : 1;
      case 'new-arrivals':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'a-z':
        return a.name.localeCompare(b.name);
      case 'z-a':
        return b.name.localeCompare(a.name);
      default:
        return 0; // Default sorting (relevant)
    }
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Toggle category selection
  const toggleCategory = (e) => {
    const value = e.target.value;
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div className="container py-4">
      <div className="row">
        {/* Sidebar: Filter Options */}
        <div className="col-12 col-md-3 mb-4">
          <div>
            <p className="fw-bold mb-2">FILTERS</p>

            {/* Category Filter */}
            <div className="border p-3">
              <p className="mb-3 fw-semibold">CATEGORIES</p>
              {categoriesLoading ? (
                <p>Loading categories...</p>
              ) : (
                <div className="d-flex flex-column gap-2 text-muted">
                  {categories.map((cat) => (
                    <div className="form-check" key={cat._id}>
                      <input
                        type="checkbox"
                        value={cat._id}
                        onChange={toggleCategory}
                        className="form-check-input"
                      />
                      <label className="form-check-label">{cat.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Product Listing */}
        <div className="col-12 col-md-9">
          {/* Header and Sort Options */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Title text1="ALL " text2="COLLECTION" />
            <select
              onChange={(e) => setSortType(e.target.value)}
              className="form-select w-auto"
            >
              <option value="relevant">Sort by: Relevant</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="popularity">Sort by: Popularity</option>
              <option value="average-ratings">Average Ratings</option>
              <option value="featured">Featured</option>
              <option value="new-arrivals">New Arrivals</option>
              <option value="a-z">Name: A to Z</option>
              <option value="z-a">Name: Z to A</option>
            </select>
          </div>

          {/* Product Items */}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {currentProducts.map((item, index) => {
              const imageUrl = item.images?.[0]?.url || '/path/to/default-image.jpg';

              return (
                <div className="col" key={index}>
                  <ProductItem
                    name={item.name}
                    id={item._id}
                    price={item.price}
                    stock={item.stock}
                    sizes={item.sizes}
                    image={imageUrl}
                  />
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-center mt-4">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li
                    key={index}
                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
