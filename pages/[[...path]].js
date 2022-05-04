import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { BuilderComponent, Builder, builder } from '@builder.io/react'
import builderConfig from '../config/builder'
import DefaultErrorPage from 'next/error'
import Head from 'next/head'
import { getTargetingValues } from '@builder.io/personalization-utils'

export async function getStaticProps({ params }) {
  const isPersonalizedRequest = params?.path?.[0].startsWith(';')
  const targeting = isPersonalizedRequest
    ? {
        // if it's a personalized page let's fetch it:
        ...getTargetingValues(params.path[0].split(';').slice(1))
      }
    : {
        urlPath: '/' + (params?.path?.join('/') || '')
      }
  const page =
    (await builder
      .get('page', {
        apiKey: builderConfig.apiKey,
        userAttributes: targeting,
        cachebust: true
      })
      .toPromise()) || null

  return {
    props: {
      page,
      targeting,
      locale: targeting?.locale || 'en-US'
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 1 seconds
    revalidate: 1
  }
}

export async function getStaticPaths() {
  const pages = await builder.getAll('page', {
    options: { noTargeting: true },
    apiKey: builderConfig.apiKey
  })

  return {
    // new set ensure unique urls, as there could be multiple pages on the same url, variations will be handled by middlewar
    paths: [...new Set(pages.map(page => `${page.data?.url}`))],
    fallback: true
  }
}

export default function Path({ page, targeting, locale }) {
  const router = useRouter()

  if (router.isFallback) {
    return <h1>Loading...</h1>
  }
  const isLive = !Builder.isEditing && !Builder.isPreviewing
  if (!page && isLive) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
        <DefaultErrorPage statusCode={404} />
      </>
    )
  }

  const { title, description, image } = page?.data || {}
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <NextSeo
        title={title}
        description={description}
        openGraph={{
          type: 'website',
          title,
          description,
          images: [
            {
              url: image,
              width: 800,
              height: 600,
              alt: title
            }
          ]
        }}
      />
      <BuilderComponent
        context={{ targeting }}
        data={{ targeting, locale }}
        model="page"
        content={page}
      />
    </>
  )
}
