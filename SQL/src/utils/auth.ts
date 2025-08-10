import type { User } from '../types';

export const saveUser = async (user: User) => {
  try {
    const res = await fetch('http://localhost:8000/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      user.id = data.id;  // update user object with id from backend
      localStorage.setItem('user', JSON.stringify(user));
      window.location.reload();
    } else {
      console.error('Failed to get user ID from backend:', data);
    }
  } catch (error) {
    console.error('Error saving user to backend:', error);
  }
};


export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const signOut = () => {
  localStorage.removeItem('user');
};