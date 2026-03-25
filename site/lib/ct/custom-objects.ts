import { ct } from './request';

export async function getCustomObject(container: string, key: string) {
  try {
    return await ct('GET', `/custom-objects/${container}/${key}`);
  } catch (e) {
    if ((e as Error).message.includes('404') || (e as Error).message.includes('ResourceNotFound')) {
      return null;
    }
    throw e;
  }
}

export async function upsertCustomObject(container: string, key: string, value: unknown) {
  return ct('POST', '/custom-objects', { container, key, value });
}
