import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from './generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { auth } from './auth'

// Load environment variables
dotenv.config()

// Initialize Prisma
const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Initialize Hono app
const app = new Hono()

// CORS — allow requests from the frontend
app.use('*', cors({
  origin: process.env.FRONTEND_URL!,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Mount better-auth handler
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// Basic health check
app.get('/', (c) => {
  return c.json({
    message: 'Bookclub API is running!',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// BOOK ROUTES
// Get all books
app.get('/api/books', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const books = await prisma.book.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
    return c.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return c.json({ error: 'Failed to fetch books' }, 500)
  }
})

// Get book by ID
app.get('/api/books/:id', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const id = parseInt(c.req.param('id'))
    const book = await prisma.book.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }

    return c.json(book)
  } catch (error) {
    console.error('Error fetching book:', error)
    return c.json({ error: 'Failed to fetch book' }, 500)
  }
})

// Create new book
app.post('/api/books', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { title, author, rating, review } = body

    if (!title || !author || !rating) {
      return c.json({ error: 'Title, author, and rating are required' }, 400)
    }

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400)
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        rating: parseInt(rating),
        review,
        userId: session.user.id,
      },
      include: { user: true }
    })

    return c.json(book, 201)
  } catch (error) {
    console.error('Error creating book:', error)
    return c.json({ error: 'Failed to create book' }, 500)
  }
})

// Update book
app.put('/api/books/:id', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json()
    const { title, author, rating, review } = body

    if (rating && (rating < 1 || rating > 5)) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400)
    }

    const existing = await prisma.book.findUnique({ where: { id } })
    if (!existing) {
      return c.json({ error: 'Book not found' }, 404)
    }
    if (existing.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (author) updateData.author = author
    if (rating) updateData.rating = parseInt(rating)
    if (review !== undefined) updateData.review = review

    const book = await prisma.book.update({
      where: { id },
      data: updateData,
      include: { user: true }
    })

    return c.json(book)
  } catch (error: any) {
    console.error('Error updating book:', error)
    if (error.code === 'P2025') {
      return c.json({ error: 'Book not found' }, 404)
    }
    return c.json({ error: 'Failed to update book' }, 500)
  }
})

// Delete book
app.delete('/api/books/:id', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const id = parseInt(c.req.param('id'))

    const existing = await prisma.book.findUnique({ where: { id } })
    if (!existing) {
      return c.json({ error: 'Book not found' }, 404)
    }
    if (existing.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await prisma.book.delete({ where: { id } })

    return c.json({ message: 'Book deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting book:', error)
    return c.json({ error: 'Failed to delete book' }, 500)
  }
})

// Start server
const port = 3000
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Bookclub API running on http://localhost:${info.port}`)
})
