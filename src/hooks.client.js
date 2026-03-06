/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, status, message }) {
  return {
    status: status ?? 500,
    message: message ?? (error && error.message) ?? 'Something went wrong.'
  };
}
