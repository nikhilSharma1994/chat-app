import React, { useState, useEffect } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../features/authThunk';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth.authUser);

  const [selectedImage, setSelectedImage] = useState(null);   // FILE object
  const [previewImage, setPreviewImage] = useState(null);     // URL string

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const navigate = useNavigate();

  // load data into local state
  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName || "");
      setBio(authUser.bio || "");
      setPreviewImage(authUser.profilePic || null);
      setSelectedImage(null); // important!
    }
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // CASE 1: Only name & bio update
    if (!selectedImage) {
      await dispatch(updateProfile({ fullName: name, bio }));
      return navigate('/');
    }

    // CASE 2: With image
    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);

    reader.onload = async () => {
      const base64Image = reader.result;

      await dispatch(updateProfile({
        profilePic: base64Image,
        fullName: name,
        bio,
      }));

      navigate('/');
    };
  };

  // WHEN USER SELECTS A NEW IMAGE
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg '>Profile details</h3>
          
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input 
              type="file" 
              id="avatar" 
              accept='.png,.jpg,.jpeg' 
              hidden
              onChange={handleFileChange}
            />

            <img 
              src={previewImage || assets.avatar_icon}
              className="w-12 h-12 rounded-full"
              alt=""
            />

            Upload Profile image here ....
          </label>

          <input 
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
            placeholder="Your name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea 
            rows={4}
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            required
            placeholder="Write profile bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <button type="submit" className="bg-linear-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer">
            Save
          </button>
        </form>

        <img 
          src={previewImage || assets.logo_icon}
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10"
          alt=""
        />
      </div>
    </div>
  );
};

export default ProfilePage;
