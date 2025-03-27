import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../../App.jsx";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10); // You can change this to any number

    useEffect(() => {
        axios.get(`${backendUrl}/admin/users`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
            },
        }).then((response) => {
            setUsers(response.data.data);
        }).catch((error) => {
            toast.error(error.response?.data?.message || "Error fetching users");
        });
    }, []);

    const toggleUserStatus = async (userId, isBlocked) => {
        const result = await Swal.fire({
            title: isBlocked ? "Unblock User?" : "Block User?",
            text: `Are you sure you want to ${isBlocked ? "unblock" : "block"} this user?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: isBlocked ? "Yes, Unblock!" : "Yes, Block!",
        });
    
        if (result.isConfirmed) {
            try {
                const response = await axios.put(
                    `${backendUrl}/admin/users/${userId}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                        },
                    }
                );
                toast.success(response.data.message);
                setUsers(users.map(user => user._id === userId ? { ...user, isBlocked: !user.isBlocked } : user));
                Swal.fire({
                    title: "Success!",
                    text: `User has been ${isBlocked ? "unblocked" : "blocked"} successfully.`,
                    icon: "success",
                });
            } catch (error) {
                toast.error(error.response?.data?.message || "Error toggling user status");
            }
        }
    };

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <div className="d-flex justify-content-between align-items-center my-4">
                <h3 className="text-primary">User List</h3>

            </div>
    
            <div className="table-responsive">
                <table className="table table-striped table-hover shadow-sm">
                    <thead className="bg-dark text-white">
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map((user) => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`badge ${user.isBlocked ? 'bg-danger' : 'bg-success'}`}>
                                        {user.isBlocked ? "Blocked" : "Active"}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <div className="btn-group">
                                        <button 
                                            className={`btn ${user.isBlocked ? 'btn-success' : 'btn-danger'} btn-sm`}
                                            onClick={() => toggleUserStatus(user._id, user.isBlocked)}
                                        >
                                            {user.isBlocked ? "Unblock" : "Block"}
                                        </button>
                        
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
    
            {/* Pagination Controls */}
            <nav aria-label="User pagination">
                <ul className="pagination justify-content-center">
                    {[...Array(Math.ceil(users.length / usersPerPage))].map((_, index) => (
                        <li key={index + 1} className={`page-item ${index + 1 === currentPage ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => paginate(index + 1)}>
                                {index + 1}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
    
};

export default Users;
