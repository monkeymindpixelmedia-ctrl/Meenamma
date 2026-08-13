import { defineField, defineType } from 'sanity'
export const marketing = defineType({
  name: 'marketing',
  title: 'Marketing & Home Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Home Page Configuration' }),
    defineField({ name: 'heroBanners', title: 'Hero Banners', type: 'array', of: [{ type: 'object', fields: [{ name: 'image', type: 'image', options: { hotspot: true } }, { name: 'heading', type: 'string' }, { name: 'subheading', type: 'string' }, { name: 'ctaText', type: 'string' }, { name: 'ctaLink', type: 'string' }] }] }),
    defineField({ name: 'gallery', title: 'Home Page Gallery', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'featuredCategories', title: 'Featured Categories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
  ],
})
