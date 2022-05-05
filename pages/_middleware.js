import { NextResponse } from 'next/server'
import { getPersonalizedRewrite } from '@builder.io/personalization-utils'

const excludededPrefixes = ['/favicon', '/api', '/sw.js']

export default function middleware(request) {
  const url = request.nextUrl
  let response = NextResponse.next();
  const usePath = url.pathname.split(';')[0]
  if (!excludededPrefixes.find(path => usePath.startsWith(path))) {
    console.log(' middleware got ', usePath);
    const query = Object.fromEntries(url.searchParams)
    const queryOverrides = Object.keys(query)
      .filter(key => key.startsWith('builder.userAttributes'))
      .reduce(
        (acc, key) => ({
          ...acc,
          [key]: query[key]
        }),
        {}
      )
    const rewrite = getPersonalizedRewrite(usePath, {
      'builder.userAttributes.domain': request.headers.get('Host') || '',
      'builder.userAttributes.city': request.geo?.city || '',
      'builder.userAttributes.country': request.geo?.country || '',
      'builder.userAttributes.region': request.geo?.region || '',
      'builder.userAttributes.searchBot': String(request.ua?.isBot),
      ...request.cookies,
      ...queryOverrides
    })
    if (rewrite) {
      console.log(' and rewriting to ', rewrite);
      url.pathname = rewrite;
      return NextResponse.rewrite(url);
    }
  }
  return response
}
