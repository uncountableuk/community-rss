const headers = new Headers();
headers.append('Set-Cookie', 'better-auth.session_token=12345; Path=/; HttpOnly');
headers.append('Set-Cookie', 'other=abc; Path=/');

const setCookies = headers.getSetCookie ? headers.getSetCookie() : [headers.get('Set-Cookie')];
console.log(setCookies);
