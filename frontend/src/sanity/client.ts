import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'aqwc55lo',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2024-08-13',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_API_READ_TOKEN,
})
