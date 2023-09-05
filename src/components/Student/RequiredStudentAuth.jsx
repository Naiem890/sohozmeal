import { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";
import { Axios } from "../../api/api";

// Token cache constants
const TOKEN_CACHE_KEY = "token_validity";
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour in milliseconds

// eslint-disable-next-line react/prop-types
export default function RequiredStudentAuth({ children }) {
  const location = useLocation();
  const auth = useAuthUser();

  const [isTokenValid, setIsTokenValid] = useState(null);

  useEffect(() => {
    async function checkTokenValidity() {
      const cachedTokenValidity = JSON.parse(
        localStorage.getItem(TOKEN_CACHE_KEY)
      );

      if (
        cachedTokenValidity &&
        Date.now() - parseInt(cachedTokenValidity.timestamp) < CACHE_EXPIRATION
      ) {
        setIsTokenValid(cachedTokenValidity.isValid === "true");
      } else {
        try {
          const response = await Axios.get("/auth/check-token-validity", {
            withCredentials: true,
          });

          if (response.data.isValid) {
            setIsTokenValid(true);
            // Cache the token validity status with a timestamp
            localStorage.setItem(
              TOKEN_CACHE_KEY,
              JSON.stringify({
                isValid: "true",
                timestamp: Date.now().toString(),
              })
            );
          } else {
            setIsTokenValid(false);
            // Cache the token invalidity status with a timestamp
            localStorage.setItem(
              TOKEN_CACHE_KEY,
              JSON.stringify({
                isValid: "false",
                timestamp: Date.now().toString(),
              })
            );
          }
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
