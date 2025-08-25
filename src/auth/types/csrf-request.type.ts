export interface CsrfRequest extends Request {
  csrfToken: () => string;
  cookies: { [key: string]: string };
}
