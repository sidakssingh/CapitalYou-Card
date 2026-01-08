import { supabase } from './supabase';

// Sign up new user
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Sign in existing user
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Sign out current user
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Delete current user account (MOCKED)
export const deleteUserAccount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user logged in');
  
  // For now, we just sign the user out after their data is deleted
  console.log('Account deletion requested for user:', user.id);
  
  // Sign out the user
  await signOut();
};
