import axios from "axios";
import useAuthStore from "@/app/hooks/useAuth";

const login = async (email: string, password: string) => {
  try {
    const response = await axios.post("http://localhost:1337/api/auth/local", {
      identifier: email,
      password: password,
    });

    console.log("Giriş başarılı:", response.data);

    // Kullanıcı bilgilerini ve JWT'yi store'a kaydet
    const { setJwt, setUser, setIsAuthenticated } = useAuthStore.getState();
    setJwt(response.data.jwt);

    // Kullanıcı verilerini formatlayarak store'a kaydet
    setUser(response.data.user);
    setIsAuthenticated(true);
    console.log("Kullanıcı verileri:", response.data.user);

    return response.data;
  } catch (error) {
    console.error("Giriş hatası:", error);
    throw error;
  }
};

export default login;
