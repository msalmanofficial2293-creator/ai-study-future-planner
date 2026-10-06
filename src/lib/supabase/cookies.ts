export function hasSupabaseSessionCookie(cookies: { name: string }[]): boolean {
  return cookies.some((cookie) => {
    const name = cookie.name;

    return (
      name.startsWith("sb-") &&
      name.includes("-auth-token") &&
      !name.includes("code-verifier")
    );
  });
}
