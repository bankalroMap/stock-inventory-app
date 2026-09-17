import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AuthUser } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with Sheets and Drive File scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token caching per guidelines
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let customAuthUser: AuthUser | null = null;

export const initAuth = (
  onAuthSuccess?: (user: AuthUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const appUser: AuthUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      customAuthUser = appUser;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(appUser, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else if (customAuthUser && cachedAccessToken) {
      if (onAuthSuccess) {
        onAuthSuccess(customAuthUser, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      customAuthUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Fallback to Google Identity Services (GSI) token flow
 */
export const signInWithGoogleIdentityServices = (): Promise<{
  user: AuthUser;
  accessToken: string;
}> => {
  return new Promise((resolve, reject) => {
    const googleObj = window.google;
    if (!googleObj?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services SDK ยังโหลดไม่เสร็จ หรือถูกบล็อก กรุณาลองใหม่อีกครั้ง'
        )
      );
      return;
    }

    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      reject(new Error('ไม่พบ OAuth Client ID ในระบบ'));
      return;
    }

    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(
              new Error(
                tokenResponse.error_description ||
                  `Google OAuth Error: ${tokenResponse.error}`
              )
            );
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('ไม่ได้รับ Access Token จาก Google'));
            return;
          }

          const accessToken = tokenResponse.access_token;
          cachedAccessToken = accessToken;

          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            let userInfo: any = {};
            if (res.ok) {
              userInfo = await res.json();
            }

            const authUser: AuthUser = {
              uid: userInfo.sub || `gsi-${Date.now()}`,
              displayName: userInfo.name || userInfo.email?.split('@')[0] || 'Google User',
              email: userInfo.email || null,
              photoURL: userInfo.picture || null,
            };

            customAuthUser = authUser;
            resolve({ user: authUser, accessToken });
          } catch {
            const authUser: AuthUser = {
              uid: `gsi-${Date.now()}`,
              displayName: 'Google User',
              email: null,
              photoURL: null,
            };
            customAuthUser = authUser;
            resolve({ user: authUser, accessToken });
          }
        },
        error_callback: (err) => {
          reject(err);
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
};

export const googleSignIn = async (
  forceGsi = false
): Promise<{ user: AuthUser; accessToken: string } | null> => {
  isSigningIn = true;
  try {
    if (forceGsi) {
      return await signInWithGoogleIdentityServices();
    }

    // 1. First attempt Firebase signInWithPopup
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('ไม่สามารถดึง Access Token จาก Google Sign-In ได้');
      }

      cachedAccessToken = credential.accessToken;
      const appUser: AuthUser = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      customAuthUser = appUser;
      return { user: appUser, accessToken: cachedAccessToken };
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithPopup error:', firebaseErr);

      const isDomainError =
        firebaseErr?.code === 'auth/unauthorized-domain' ||
        firebaseErr?.message?.includes('auth/unauthorized-domain') ||
        firebaseErr?.message?.includes('unauthorized-domain');

      if (isDomainError) {
        console.log(
          'Detected unauthorized-domain in Firebase. Attempting GSI token client fallback...'
        );
        try {
          const gsiResult = await signInWithGoogleIdentityServices();
          return gsiResult;
        } catch (gsiErr: any) {
          console.warn('GSI fallback was not completed:', gsiErr);
          const currentHost = window.location.hostname;
          const enhanced: any = new Error(
            `Firebase: Error (auth/unauthorized-domain). โดเมน "${currentHost}" ยังไม่ได้ถูกเพิ่มใน Authorized Domains ของ Firebase`
          );
          enhanced.code = 'auth/unauthorized-domain';
          enhanced.hostname = currentHost;
          enhanced.projectId = firebaseConfig.projectId;
          throw enhanced;
        }
      }

      throw firebaseErr;
    }
  } catch (error: any) {
    console.error('Sign in process error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (err) {
    console.warn('Firebase signOut err:', err);
  }
  cachedAccessToken = null;
  customAuthUser = null;
};
