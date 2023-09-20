import { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";
import { Axios } from "../../api/api"; // Import Axios instance

const TOKEN_CACHE_KEY = "token_validity";
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default function RequiredStudentAuth({ children }) {
  const location = useLocation();
  const auth = useAuthUser();
  const [isTokenValid, setIsTokenValid] = useState(null);

  useEffect(() => {
    async function checkTokenValidity() {
      const cachedTokenValidity = JSON.parse(
        localStorage.getItem(TOKEN_CACHE_KEY)
      );
      const isValidCached =
        cachedTokenValidity &&
        Date.now() - parseInt(cachedTokenValidity.timestamp) < CACHE_EXPIRATION;

      if (isValidCached) {
        setIsTokenValid(cachedTokenValidity.isValid === "true");
      } else {
        try {
          const response = await Axios.get("/auth/check-token-validity");
          console.log("response", response);
          const isValid = response.data.isValid;

          setIsTokenValid(isValid);

          // Cache the token validity status with a timestamp
          localStorage.setItem(
            TOKEN_CACHE_KEY,
            JSON.stringify({
              isValid: isValid.toString(), // Convert to string
              timestamp: Date.now().toString(),
            })
          );
        } catch (error) {
          setIsTokenValid(false);
        }
      }
    }

    if (auth()?.isAuthenticated) {
      checkTokenValidity();
    } else {
      setIsTokenValid(false);
    }
  }, [auth]);

  if (isTokenValid === null) {
    return <div>Loading...</div>;
  }

  if (!isTokenValid) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
