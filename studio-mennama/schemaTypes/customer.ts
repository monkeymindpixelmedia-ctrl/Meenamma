import { defineField, defineType } from 'sanity'
export const customer = defineType({
  name: 'customer',
  title: 'Customer',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (Rule) => Rule.required().email() }),
    defineField({ name: 'phone', title: 'Phone Number', type: 'string' }),
    defineField({ name: 'orderHistory', title: 'Order History', type: 'array', of: [{ type: 'reference', to: [{ type: 'order' }] }] }),
    defineField({ name: 'favorites', title: 'Favorite Products', type: 'array', of: [{ type: 'reference', to: [{ type: 'product' }] }] }),
  ],
})
