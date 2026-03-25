import { apiRoot } from './client';

export async function getCustomObject(container: string, key: string) {
  try {
    const { body } = await apiRoot
      .customObjects()
      .withContainerAndKey({ container, key })
      .get()
      .execute();
    return body;
  } catch (e) {
    if ((e as Error).message.includes('404') || (e as Error).message.includes('ResourceNotFound')) {
      return null;
    }
    throw e;
  }
}

export async function upsertCustomObject(container: string, key: string, value: unknown) {
  const { body } = await apiRoot
    .customObjects()
    .post({ body: { container, key, value } })
    .execute();
  return body;
}
