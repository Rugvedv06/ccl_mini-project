import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { FACULTY_GROUP } from '../utils/constants';

function env(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy frontend/.env.example to frontend/.env and run the SAM deployment to obtain the values.`,
    );
  }
  return value;
}

let pool;
function getPool() {
  if (!pool) {
    pool = new CognitoUserPool({
      UserPoolId: env('VITE_COGNITO_USER_POOL_ID'),
      ClientId: env('VITE_COGNITO_CLIENT_ID'),
    });
  }
  return pool;
}

export function decodeJwt(token) {
  const payload = token.split('.')[1];
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(normalized);
  return JSON.parse(
    Array.from(decoded)
      .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
}

export function roleFromPayload(payload) {
  const groups = payload?.['cognito:groups'] || [];
  return groups.includes(FACULTY_GROUP) ? 'faculty' : 'student';
}

function toSessionObject(session, payload) {
  return {
    accessToken: session.getAccessToken().getJwtToken(),
    idToken: session.getIdToken().getJwtToken(),
    refreshToken: session.getRefreshToken()?.getJwtToken(),
    payload,
    expiresAt: session.getIdToken().getExpiration() * 1000,
  };
}

export function signIn(email, password) {
  const cognitoUser = new CognitoUser({
    Username: email.trim(),
    Pool: getPool(),
  });
  const details = new AuthenticationDetails({ Username: email.trim(), Password: password });
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(details, {
      onSuccess: (session) => {
        resolve(toSessionObject(session, decodeJwt(session.getIdToken().getJwtToken())));
      },
      onFailure: (err) => {
        reject(new Error(err?.message || 'Sign-in failed. Check your email and password.'));
      },
      newPasswordRequired: () => {
        reject(new Error('A temporary password must be changed in the AWS console first.'));
      },
    });
  });
}

export async function getCurrentSession() {
  const cognitoUser = getPool().getCurrentUser();
  if (!cognitoUser) return null;
  const session = await new Promise((resolve, reject) => {
    cognitoUser.getSession((err, result) => (err ? reject(err) : resolve(result)));
  });
  if (!session || !session.isValid()) return null;
  return toSessionObject(session, decodeJwt(session.getIdToken().getJwtToken()));
}

export async function refreshCurrentSession() {
  const cognitoUser = getPool().getCurrentUser();
  if (!cognitoUser) return null;
  const session = await new Promise((resolve, reject) => {
    cognitoUser.getSession((err, result) => (err ? reject(err) : resolve(result)));
  });
  if (!session || !session.isValid()) return null;
  return toSessionObject(session, decodeJwt(session.getIdToken().getJwtToken()));
}

export function signOut() {
  const cognitoUser = getPool().getCurrentUser();
  if (cognitoUser) cognitoUser.signOut();
}
