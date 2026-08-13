import { createClient } from 'next-sanity'
export const client = createClient({
  projectId: 'aqwc55lo',
  dataset: 'production',
  apiVersion: '2024-08-13',
  useCdn: false,
})
