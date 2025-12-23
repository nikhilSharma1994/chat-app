import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
    baseURL:backendUrl
});

// here we are adding the token to axios default header and evry request automatically gets token 
export const setToken = (token) => {
    if(token){
        api.defaults.headers.common["token"] = token;
    }else{
        delete api.defaults.headers.common["token"]
    }
};



export default api ; 




