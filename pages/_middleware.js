import { NextResponse } from 'next/server'
import { getPersonalizedRewrite } from '@builder.io/personalization-utils'

const excludededPrefixes = ['/favicon', '/api']

export default function middleware(request) {
  const url = request.nextUrl
  let response = NextResponse.next()
  if (!excludededPrefixes.find((path) => url.pathname?.startsWith(path))) {
    const rewrite = getPersonalizedRewrite(
      url?.pathname,
      request.cookies
    )
    if (rewrite) {
      const headers = request.headers;
      const protocol = headers.get('x-forwarded-proto') || 'http'
      const baseURL = `${protocol}://${headers.get('host')}`
      response = NextResponse.rewrite(baseURL + rewrite)
    }
  }
  return response;
}
