import React from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import Ping from './Ping';
import { auth } from '@/auth';
import { client } from '@/sanity/lib/client';
import { STARTUP_VIEWS_QUERY } from '@/sanity/lib/queries';
import { writeClient } from '@/sanity/lib/write-client';
import { after } from 'next/server';

const View = async ({ id, authorId }: { id: string; authorId?: string | null }) => {
  noStore();

  const session = await auth();
  const isAuthor = authorId != null && session?.id === authorId;

  const { views: totalViews } = await client
    .withConfig({ useCdn: false })
    .fetch(STARTUP_VIEWS_QUERY, { id });

  if (!isAuthor) {
    after(async () =>
      writeClient.patch(id).set({ views: totalViews + 1 }).commit()
    );
  }

  return (
    <div className="view-container">
      <div className="absolute -top-2 -right-2">
        <Ping />
      </div>
      <p className="view-text">
        <span className="font-black">Views: {totalViews}</span>
      </p>
    </div>
  );
};

export default View;