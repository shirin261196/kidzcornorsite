import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../../App';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Pagination } from 'react-bootstrap';

const MySwal = withReactContent(Swal);

const CategoryManagement = () => {
    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
        formState: { errors: addErrors },
    } = useForm();
    
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        setValue,
        reset: resetEdit,
        formState: { errors: editErrors },
    } = useForm();

    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [editingCategory, setEditingCategory] = useState(null);
    const [editedCategoryData, setEditedCategoryData] = useState({ name: '', description: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage] = useState(10);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${backendUrl}/admin/category`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
            });
            if (response.data.success) {
                setCategories(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch categories');
        }
    };

    // Add new category
    const handleAddCategory = async (data) => {
        const trimmedName = data.name?.trim(); // Trim spaces before validation
        const trimmedDescription = data.description?.trim(); // Trim spaces before validation
    
        // Validate category name
        if (!trimmedName) {
            toast.error("Category name cannot be empty or only spaces");
            return;
        }
    
        // Validate category description
        if (!trimmedDescription) {
            toast.error("Category description cannot be empty or only spaces");
            return;
        }
    
        // Check for duplicate category name (case insensitive)
        if (categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast.error("Category with this name already exists");
            return;
        }
    
        try {
            const response = await axios.post(
                `${backendUrl}/admin/category`,
                { name: trimmedName, description: trimmedDescription }, // Save trimmed values
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
            );
    
            if (response.data.success) {
                toast.success(response.data.message);
                fetchCategories();
                resetAdd();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error adding category:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Failed to add category");
        }
    };
    

    // Soft Delete category
    const handleDeleteCategory = async (id) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: 'This will mark the category as deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.put(
                    `${backendUrl}/admin/category/${id}/delete`,
                    { isDeleted: true },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')} ` } }
                );

                if (response.data.success) {
                    toast.success('Category marked as deleted');
                    fetchCategories();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error('Failed to delete category');
            }
        }
    };

    // Restore category
    const handleRestoreCategory = async (id) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: 'This will restore the deleted category!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, restore it!',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.put(
                    `${backendUrl}/admin/category/${id}/restore`,
                    { isDeleted: false },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')} ` } }
                );
                if (response.data.success) {
                    toast.success('Category restored successfully');
                    fetchCategories();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error('Failed to restore category');
            }
        }
    };

    // Edit category
    const handleEditCategory = async (data) => {
        const trimmedName = data.name.trim(); // Trim spaces before validation
        const trimmedDescription = data.description.trim(); // Trim spaces for description

        // Validate category name
        if (!trimmedName) {
            toast.error("Category name cannot be empty or only spaces");
            return;
        }
    
        // Validate category description
        if (!trimmedDescription) {
            toast.error("Category description cannot be empty or only spaces");
            return;
        }
    
    
        try {
            const response = await axios.put(
                `${backendUrl}/admin/category/${editingCategory}`, 
                { ...data, name: trimmedName }, // Save trimmed name
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')} ` } }
            );
            
            if (response.data.success) {
                toast.success(response.data.message);
                fetchCategories();
                setEditingCategory(null);
                resetEdit();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error("Failed to update category");
        }
    };
    
    // Function to set values when editing
    const startEditing = (category) => {
        setEditingCategory(category._id);
        setValue("name", category.name); // Populate form fields
        setValue("description", category.description);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Pagination logic
    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h3 className="my-4 text-center">Category Management</h3>

            {/* Add Category Form */}
            <div className="mb-4">
    <h4>Add Category</h4>
    <form onSubmit={handleSubmitAdd(handleAddCategory)}> {/* ✅ Form properly wraps the input fields */}
        <div className="row">
            <div className="col-md-6">
                <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Category Name"
                    {...registerAdd('name', { required: 'Category name is required' })}
                    />
                    {addErrors.name && <p className="text-danger">{addErrors.name.message}</p>}
                </div>
            <div className="col-md-6">
                <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Category Description"
                    {...registerAdd('description', { required: 'Description is required' })}
                    />
                    {addErrors.description && <p className="text-danger">{addErrors.description.message}</p>}
                </div>
        </div>
        <button className="btn btn-primary" type="submit">
            Add Category
        </button>
    </form> {/* ✅ Properly closed the form */}
</div>
            


            {/* Categories List */}
            <h4 className="mb-3">Categories</h4>
            <table className="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentCategories.map((category, index) => (
                        <tr key={category._id}>
                            <td>{index + 1}</td>
                            <td>
                                {editingCategory === category._id ? (
                                    <input
                                    type="text"
                                    className="form-control"
                                    {...registerEdit("name", { required: "Category name is required" })}
                                />
                                ) : (
                                    category.name
                                )}
                                {editErrors.name && <p className="text-danger">{editErrors.name.message}</p>}
                            </td>
                            <td>
    {editingCategory === category._id ? (
        <>
            <input
                type="text"
                className="form-control"
                {...registerEdit("description", { required: "Description is required" })}
            />
            {editErrors.description && <p className="text-danger">{editErrors.description.message}</p>}
        </>
    ) : (
        category.description // ✅ Show only the category description when not editing
    )}
</td>

                            <td>{category.isDeleted ? 'Deleted' : 'Active'}</td>
                            <td>
                                {editingCategory === category._id ? (
                                   <form onSubmit={handleSubmitEdit(handleEditCategory)}> {/* Form for editing */}
                                   <button className="btn btn-success me-2" type="submit">
                                       Save
                                   </button>
                                   <button className="btn btn-secondary" onClick={() => setEditingCategory(null)}>
                                       Cancel
                                   </button>
                               </form>
                                ) : category.isDeleted ? (
                                    <button
                                        className="btn btn-info"
                                        onClick={() => handleRestoreCategory(category._id)}
                                    >
                                        Restore
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="btn btn-warning me-2"
                                            onClick={() => startEditing(category)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteCategory(category._id)}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination>
                {[...Array(Math.ceil(categories.length / categoriesPerPage))].map((_, index) => (
                    <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>
        </div>
    );
};

export default CategoryManagement;
