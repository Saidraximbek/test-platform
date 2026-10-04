export interface FirebaseApp {
  name: string;
}

const defaultApp: FirebaseApp = { name: '[DEFAULT]' };
const apps: FirebaseApp[] = [defaultApp];

export const initializeApp = (_config?: any, name = '[DEFAULT]'): FirebaseApp => {
  const app = { name };
  if (!apps.find((a) => a.name === name)) {
    apps.push(app);
  }
  return app;
};

export const getApps = (): FirebaseApp[] => apps;
export const getApp = (): FirebaseApp => defaultApp;
