import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Set global default header for all axios instances
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

const api = axios.create({
    baseURL: backendUrl
});

export const setToken = (token) => {
    if(token){
        api.defaults.headers.common["token"] = token;
    }else{
        delete api.defaults.headers.common["token"]
    }
};

export default api;