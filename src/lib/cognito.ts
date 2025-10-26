import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
};

export const userPool = typeof window !== 'undefined' ? new CognitoUserPool(poolData) : null;

export interface StudentUser {
  username: string;
  email: string;
  attributes: {
    student_id?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
  };
}

export async function signIn(username: string, password: string): Promise<{
  success: boolean;
  user?: CognitoUser;
  error?: string;
}> {
  if (!userPool) {
    return { success: false, error: 'User pool not initialized' };
  }

  return new Promise((resolve) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve({
          success: true,
          user: cognitoUser,
        });
      },
      onFailure: (err) => {
        resolve({
          success: false,
          error: err.message || 'Authentication failed',
        });
      },
    });
  });
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (!userPool) {
    return { success: false, error: 'User pool not initialized' };
  }

  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser) {
      cognitoUser.signOut(() => {
        resolve({ success: true });
      });
    } else {
      resolve({ success: false, error: 'No user signed in' });
    }
  });
}

export async function getCurrentUser(): Promise<StudentUser | null> {
  if (!userPool || typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
        return;
      }

      cognitoUser.getUserAttributes((err: Error | null, attributes: any[]) => {
        if (err) {
          resolve(null);
          return;
        }

        const userAttributes: StudentUser['attributes'] = {};
        attributes.forEach((attr) => {
          userAttributes[attr.Name as keyof StudentUser['attributes']] = attr.Value;
        });

        resolve({
          username: cognitoUser.getUsername(),
          email: userAttributes.email || '',
          attributes: userAttributes,
        });
      });
    });
  });
}

export async function getAccessToken(): Promise<string | null> {
  if (!userPool) {
    return null;
  }

  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
        return;
      }

      resolve(session.getIdToken().getJwtToken());
    });
  });
}

export function isAuthenticated(): boolean {
  if (!userPool || typeof window === 'undefined') {
    return false;
  }

  const cognitoUser = userPool.getCurrentUser();
  return cognitoUser !== null;
}

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region?: string;
}

export function configureCognito(config: CognitoConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  const envVars = {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: config.userPoolId,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: config.clientId,
    NEXT_PUBLIC_COGNITO_REGION: config.region || 'us-east-1',
  };

  Object.assign(process.env, envVars);
}
