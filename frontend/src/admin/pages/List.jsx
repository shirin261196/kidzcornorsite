import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { fetchCategories } from '../../redux/slices/categorySlice.js';
import { backendUrl, currency } from '../../App';
import { Pagination } from 'react-bootstrap';

const List = () => {
  const [list, setList] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10); // Adjust how many products per page
  const navigate = useNavigate();
  const dispatch = useDispatch();


  // Access categories and loading state from Redux
  const { categories, loading: isLoadingCategories } = useSelector(
    (state) => state.categories
  );

  // Fetch the list of products
  const fetchList = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await axios.get(`${backendUrl}/admin/products/list`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Failed to fetch products'
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categoryId || {};
    return category.name || 'Unknown';
  };

  // Handle product edit
  const handleEdit = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  // Handle product removal
  const removeProduct = async (productId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this product!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${backendUrl}/admin/products/${productId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
              },
            }
          );

          if (response.data.success) {
            toast.success('Product deleted successfully');
            fetchList(); // Refresh product list
          } else {
            toast.error(response.data.message);
          }
        } catch (error) {
          console.error(error);
          toast.error(
            error.response?.data?.message || 'Failed to delete product'
          );
        }
      }
    });
  };

  // Restore a deleted product
  const restoreProduct = async (productId) => {
    try {
      const response = await axios.put(
        `${backendUrl}/admin/products/restore/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Product restored successfully');
        fetchList(); // Refresh product list
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Failed to restore product'
      );
    }
  };

  // Fetch products and categories on component mount
  useEffect(() => {
    fetchList();
    dispatch(fetchCategories());
  }, [dispatch]);

  // Pagination: Get current products for the page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = list.slice(indexOfFirstProduct, indexOfLastProduct);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container my-4">
  <button className="btn btn-primary" onClick={() => navigate("/admin/bestselling")}>
    ⭐ Best Sellers
  </button>
      <h2 className="text-center mb-4">Product List</h2>

      <div className="table-responsive">
        {isLoadingProducts || isLoadingCategories ? (
          <p className="text-center text-muted">Loading...</p>
        ) : currentProducts.length > 0 ? (
          <table className="table table-bordered table-hover">
            <thead className="thead-dark">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((item, index) => (
                <tr key={index}>
                  <td>
                    <img
                      src={item.images?.[0]?.url || '/path/to/default-image.jpg'}
                      alt={item.name}
                      className="img-thumbnail"
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                      }}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{getCategoryName(item.category)}</td>
                  <td>
                    {currency}
                    {item.price}
                  </td>
                  <td className="text-center">
                    {item.deleted ? (
                      <button
                        onClick={() => restoreProduct(item._id)}
                        className="btn btn-success btn-sm mx-1"
                      >
                        🔄 Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item._id)}
                          className="btn btn-warning btn-sm mx-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeProduct(item._id)}
                          className="btn btn-danger btn-sm mx-1"
                        >
                          ❌
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-muted">
            No products available. Please add some products.
          </p>
        )}
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-center">
        <Pagination>
          {[...Array(Math.ceil(list.length / productsPerPage))].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      </div>
    </div>
  );
};

export default List;
