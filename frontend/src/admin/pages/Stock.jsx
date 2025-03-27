import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, selectFilteredProducts, updateProductStock } from '../../redux/slices/productSlice';
import { toast } from 'react-toastify';
import { Pagination } from 'react-bootstrap';

const AdminStockManagement = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectFilteredProducts);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);

  const [updatedStock, setUpdatedStock] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleStockChange = (id, size, value) => {
    setUpdatedStock({
      ...updatedStock,
      [id]: {
        ...updatedStock[id],
        [size]: value,
      },
    });
  };

  const handleUpdateStock = async (id, size) => {
    const newStock = updatedStock[id]?.[size];
  
    if (!newStock) {
      toast.error('Please enter a valid stock value');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:4000/admin/products/update-stock/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          size,
          stock: newStock,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success('Stock updated successfully');
  
        // Dispatch action to update the stock in Redux
        dispatch(updateProductStock({ id, size, stock: newStock }));
      } else {
        toast.error(data.message || 'Failed to update stock');
      }
    } catch (error) {
      toast.error('Error updating stock');
    }
  };

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-5">
      <h2 className="text-center">Admin Stock Management</h2>
      
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-center text-danger">{error}</div>
      ) : (
        <div>
          <table className="table table-bordered mt-4">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Category Id</th>
                <th>Size</th>
                <th>Current Stock</th>
                <th>Update Stock</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                product.sizes.map((size, index) => (
                  <tr key={`${product._id}-${size.size}`}>
                    <td>{product.name}</td>
                    <td>{product.category?.name}</td>
                    <td>{product.category?._id}</td>
                    <td>{size.size}</td>
                    <td>{size.stock}</td>
                    <td>
                      <input
                        type="number"
                        value={updatedStock[product._id]?.[size.size] || ''}
                        onChange={(e) => handleStockChange(product._id, size.size, e.target.value)}
                        className="form-control"
                        placeholder="Enter stock"
                      />
                      <button
                        onClick={() => handleUpdateStock(product._id, size.size)}
                        className="btn btn-primary mt-2 w-100"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <Pagination>
            {[...Array(Math.ceil(products.length / productsPerPage))].map((_, index) => (
              <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                {index + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default AdminStockManagement;
