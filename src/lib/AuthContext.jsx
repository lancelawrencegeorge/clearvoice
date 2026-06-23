import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);

        // Always check user auth — the SDK manages the token in localStorage
        // internally, so we can't rely solely on appParams.token being present.
        await checkUserAuth();
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);

        // user_not_registered is a hard block — the user was never invited
        // to this app, so show the restricted-access screen regardless of
        // whether they happen to have a valid auth token.
        if (appError.status === 403 && appError.data?.extra_data?.reason === 'user_not_registered') {
          setAuthError({
            type: 'user_not_registered',
            message: 'User not registered for this app'
          });
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
        } else {
          // For any other failure (network glitch, transient 5xx, etc.)
          // still check user auth so a valid token isn't ignored —
          // otherwise the user bounces to the landing page in a loop.
          await checkUserAuth();
          setIsLoadingPublicSettings(false);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);

      // The SDK's isAuthenticated() calls me() internally and returns
      // false for ANY failure (401, 403, 500, network…).  That's too
      // aggressive: a user with a valid token who hits a transient 403
      // (e.g. User-entity RLS on a brand-new account with no domain yet)
      // gets bounced to the landing page, clicks Sign In, gets redirected
      // back with the same valid token, and loops forever.
      //
      // Instead: a token in localStorage means the user went through
      // login.  Treat them as authenticated and only flip back to
      // unauthenticated on a hard 401 (invalid/expired token).
      const storedToken =
        window.localStorage.getItem('base44_access_token') ||
        window.localStorage.getItem('token');

      if (!storedToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      // Token exists — optimistically authenticated.
      setIsAuthenticated(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (meError) {
        console.error('me() failed after login:', meError);
        // 401 = token is genuinely invalid/expired → not authenticated.
        // Anything else (403, 500, network) → keep the user logged in;
        // pages call base44.auth.me() themselves and can retry.
        if (meError.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          window.localStorage.removeItem('base44_access_token');
          window.localStorage.removeItem('token');
        }
        // else: stay authenticated, user stays null for now
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};