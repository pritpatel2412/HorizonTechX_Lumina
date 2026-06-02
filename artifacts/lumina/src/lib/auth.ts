export const getToken = () => localStorage.getItem("lumina_token");
export const setToken = (token: string) => localStorage.setItem("lumina_token", token);
export const removeToken = () => localStorage.removeItem("lumina_token");
