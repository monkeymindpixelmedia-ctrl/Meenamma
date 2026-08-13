import { defineField, defineType } from 'sanity'
export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({ name: 'orderNumber', title: 'Order Number', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'customer', title: 'Customer', type: 'reference', to: [{ type: 'customer' }], validation: (Rule) => Rule.required() }),
    defineField({ name: 'products', title: 'Products', type: 'array', of: [{ type: 'object', fields: [{ name: 'product', type: 'reference', to: [{ type: 'product' }] }, { name: 'quantity', type: 'number' }, { name: 'price', type: 'number' }] }] }),
    defineField({ name: 'totalAmount', title: 'Total Amount (INR)', type: 'number', validation: (Rule) => Rule.required().min(0) }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [{ title: 'Pending', value: 'pending' }, { title: 'Paid', value: 'paid' }, { title: 'Shipped', value: 'shipped' }, { title: 'Delivered', value: 'delivered' }, { title: 'Cancelled', value: 'cancelled' }] }, initialValue: 'pending' }),
    defineField({ name: 'orderDate', title: 'Order Date', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
})
