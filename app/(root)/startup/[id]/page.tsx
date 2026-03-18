import { client } from '@/sanity/lib/client';
import FormattedDate from '@/components/FormattedDate';
import { PLAYLIST_BY_SLUG_QUERY, STARTUP_BY_ID_QUERY, } from '@/sanity/lib/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import markdownit from 'markdown-it'
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import View from '../../../../components/View';
import StartupCard, { StartupTypeCard } from '@/components/StartupCard';
import StartupImage from '@/components/StartupImage';
import LikeButton from '@/components/LikeButton';
import { auth } from '@/auth';

const md = markdownit();

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  const [post, editorPicksData] = await Promise.all([
    client.fetch(STARTUP_BY_ID_QUERY, { id, userId: session?.id ?? null }),
    client.fetch(PLAYLIST_BY_SLUG_QUERY, { slug: 'editor-picks' })
  ])

  if (!post) return notFound();

  // Add null check and provide default empty array
  const editorPosts = editorPicksData?.select || [];

  const parsedContent = md.render(post?.pitch || '')

  return (
    <>
      <section className="pink_container min-h-[230px]">
        <p className="tag"><FormattedDate date={post?._createdAt ?? ''} /></p>
        <h1 className="heading">{post.title}</h1>
        <p className="sub-heading max-w-5xl">{post.description}</p>
      </section>

      <section className="section_container">
        <StartupImage
          src={post.image}
          alt={post.title ?? 'Startup'}
          className="w-full h-auto min-h-[200px] rounded-xl object-cover"
        />

        <div className="space-y-5 mt-10 max-w-4xl mx-auto">
          <div className="flex-between gap-5">
            <Link
              href={`/user/${post.author?._id}`}
              className="flex gap-2 items-center mb-3"
            >
              <Image
                src={post.author.image}
                alt="avatar"
                width={64}
                height={64}
                className="rounded-full drop-shadow-lg"
              />

              <div>
                <p className="text-20-medium">{post.author.name}</p>
                <p className="text-16-medium text-black-300">
                  @{post.author.username}
                </p>
              </div>
            </Link>

            <p className="category-tag">{post.category}</p>
          </div>

          <h3 className="text-30-bold">Pitch Details</h3>
          {parsedContent ? (
            <article
              className="prose max-w-4xl font-work-sans break-all"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <p className="no-result">No details provided</p>
          )}
        </div>

        <hr className="divider" />

        {editorPosts && editorPosts.length > 0 && (
          <div className='max-w-4xl mx-auto'>
            <p className='text-30-semibold'>Editor Picks</p>
            <ul className='mt-7 card_grid-sm'>
              {editorPosts.map((post: StartupTypeCard, i: number) => (
                <StartupCard key={i} post={post} />
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <LikeButton
            startupId={id}
            initialLiked={post?.likedByMe}
            initialCount={post?.likeCount}
          />
          <Suspense fallback={<Skeleton className='view-skeleton' />}>
            <View id={id} authorId={post.author?._id} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

export default page