"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { parseServerActionResponse } from "./utils";
import slugify from 'slugify'
import { writeClient } from "@/sanity/lib/write-client";
import { clientFresh } from "@/sanity/lib/client";

async function getImageUrl(form: FormData): Promise<{ url: string } | { error: string }> {
  const file = form.get("imageFile") as File | null
  const link = (form.get("link") as string)?.trim()

  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const asset = await writeClient.assets.upload("image", buffer, {
        filename: file.name || "image",
      })
      return { url: asset.url ?? asset.href ?? "" }
    } catch (e) {
      console.error(e)
      return { error: "Image upload failed. Try using an image URL instead." }
    }
  }

  if (link) return { url: link }
  return { error: "Please provide an image URL or upload an image." }
}

export const createPitch = async (state: any, form: FormData, pitch: string) => {
  const session = await auth()
  if (!session) return parseServerActionResponse({ error: "Not Signed in", status: "ERROR" })

  const imageResult = await getImageUrl(form)
  if ("error" in imageResult) {
    return parseServerActionResponse({ error: imageResult.error, status: "ERROR" })
  }
  const imageUrl = imageResult.url

  const { title, description, category } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch" && key !== "imageFile"),
  )

  const slug = slugify(title as string, { lower: true, strict: true })

  try {
    const startup = {
        title,description,category,image: imageUrl,slug:{
            _type: slug,
            current: slug,
        },
        author: {
            _type: 'reference',
            _ref: session?.id
        },
        views: 0,
        likes: [],
        pitch
    }

    const result = await writeClient.create({ _type: "startup", ...startup })
    // Invalidate homepage and current user's profile so new startup appears
    revalidatePath("/");
    if (session?.id) revalidatePath(`/user/${session.id}`);
    const secret = process.env.REVALIDATION_SECRET;
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.REVALIDATE_ORIGIN;
    if (secret && origin) {
      try {
        await fetch(
          `${origin}/api/revalidate?secret=${encodeURIComponent(secret)}&path=/`
        );
        if (session?.id) {
          await fetch(
            `${origin}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(`/user/${session.id}`)}`
          );
        }
      } catch {
        // ignore network errors; revalidatePath already ran for current env
      }
    }
    return parseServerActionResponse({
        ...result,
        error: '',
        status: 'SUCCESS'
        
    })
    
} catch (error) {
    console.log(error);
    return parseServerActionResponse({
        error: JSON.stringify(error),
        status: 'ERROR',
    })
    
}

}

export const toggleLike = async (startupId: string) => {
  const session = await auth()
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not Signed in", status: "ERROR" })
  }

  const userId = session.id

  const current = await clientFresh
    .withConfig({ useCdn: false })
    .fetch(
      `*[_type == "startup" && _id == $id][0]{ "liked": $userId in likes[]._ref, "likeCount": count(likes) }`,
      { id: startupId, userId }
    )

  const liked = Boolean(current?.liked)

  let patch = writeClient.patch(startupId).setIfMissing({ likes: [] })
  if (liked) {
    patch = patch.unset([`likes[_ref=="${userId}"]`])
  } else {
    patch = patch.insert("after", "likes[-1]", [{ _type: "reference", _ref: userId }])
  }
  await patch.commit({ autoGenerateArrayKeys: true })

  const updated = await clientFresh
    .withConfig({ useCdn: false })
    .fetch(
      `*[_type == "startup" && _id == $id][0]{ "liked": $userId in likes[]._ref, "likeCount": count(likes) }`,
      { id: startupId, userId }
    )

  // Revalidate pages that show like counts
  revalidatePath("/")
  revalidatePath(`/startup/${startupId}`)

  const secret = process.env.REVALIDATION_SECRET
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.REVALIDATE_ORIGIN
  if (secret && origin) {
    try {
      await fetch(
        `${origin}/api/revalidate?secret=${encodeURIComponent(secret)}&path=/`
      )
      await fetch(
        `${origin}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(`/startup/${startupId}`)}`
      )
    } catch {
      // ignore
    }
  }

  return parseServerActionResponse({
    status: "SUCCESS",
    liked: Boolean(updated?.liked),
    likeCount: Number(updated?.likeCount ?? 0),
  })
}

export const getEngagement = async (startupId: string) => {
  const session = await auth()
  const userId = session?.id ?? null
  const data = await clientFresh
    .withConfig({ useCdn: false })
    .fetch(
      `*[_type == "startup" && _id == $id][0]{
        "views": coalesce(views, 0),
        "likeCount": count(likes),
        "likedByMe": defined($userId) && $userId in likes[]._ref
      }`,
      { id: startupId, userId }
    )
  return parseServerActionResponse({
    status: "SUCCESS",
    views: Number(data?.views ?? 0),
    likeCount: Number(data?.likeCount ?? 0),
    likedByMe: Boolean(data?.likedByMe),
  })
}

export const incrementView = async (startupId: string, authorId?: string | null) => {
  const session = await auth()
  const isAuthor = authorId != null && session?.id === authorId
  if (isAuthor) return parseServerActionResponse({ status: "SKIPPED" })

  const current = await clientFresh
    .withConfig({ useCdn: false })
    .fetch(`*[_type == "startup" && _id == $id][0]{ "views": coalesce(views, 0) }`, { id: startupId })

  await writeClient.patch(startupId).set({ views: Number(current?.views ?? 0) + 1 }).commit()

  // Revalidate pages that show view counts
  revalidatePath("/")
  revalidatePath(`/startup/${startupId}`)

  const secret = process.env.REVALIDATION_SECRET
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.REVALIDATE_ORIGIN
  if (secret && origin) {
    try {
      await fetch(`${origin}/api/revalidate?secret=${encodeURIComponent(secret)}&path=/`)
      await fetch(`${origin}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(`/startup/${startupId}`)}`)
    } catch {
      // ignore
    }
  }

  return parseServerActionResponse({ status: "SUCCESS" })
}
