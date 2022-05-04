import { NextResponse } from 'next/server'
import { getPersonalizedRewrite } from '@builder.io/personalization-utils'

const excludededPrefixes = ['/favicon', '/api', '/sw.js']

export default function middleware(request) {
  const url = request.nextUrl
  let response = NextResponse.next()
  if (!excludededPrefixes.find((path) => url.pathname?.startsWith(path))) {
    const query = Object.fromEntries(url.searchParams);
    const queryOverrides = Object.keys(query).filter(key => key.startsWith('builder.userAttributes')).reduce((acc, key) => ({
      ...acc,
      [key]: query[key],
    }), {})
    const rewrite = getPersonalizedRewrite(
      url?.pathname,
      {       'builder.userAttributes.domain': request.headers.get('Host') || '',
      'builder.userAttributes.city': request.geo?.city || '',
      'builder.userAttributes.country': request.geo?.country || '',
      'builder.userAttributes.region': request.geo?.region || '',
      'builder.userAttributes.searchBot': String(request.ua?.isBot),
 ... request.cookies, ...queryOverrides, }
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
