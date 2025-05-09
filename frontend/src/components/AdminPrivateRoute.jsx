import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";

// Functional Component for Admin Private Route
export default function AdminPrivateRoute() {
    const { currentUser } = useSelector((state) => state.user);

    // Check if the user is authenticated and is an admin
    return currentUser && currentUser.isAdmin ? <Outlet /> : <Navigate to="/login" />;
}
