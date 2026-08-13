import { defineField, defineType } from 'sanity'
export const review = defineType({
  name: 'review',
  title: 'Customer Review',
  type: 'document',
  fields: [
    defineField({ name: 'product', title: 'Product', type: 'reference', to: [{ type: 'product' }], validation: (Rule) => Rule.required() }),
    defineField({ name: 'customerName', title: 'Customer Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'rating', title: 'Rating (1-5)', type: 'number', validation: (Rule) => Rule.required().min(1).max(5) }),
    defineField({ name: 'comment', title: 'Comment', type: 'text' }),
    defineField({ name: 'approved', title: 'Approved', type: 'boolean', initialValue: false }),
  ],
})
