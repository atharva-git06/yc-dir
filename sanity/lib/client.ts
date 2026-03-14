import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})

// No CDN: used only for homepage list so after revalidatePath we get fresh data (new startups show on live)
export const clientFresh = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})
