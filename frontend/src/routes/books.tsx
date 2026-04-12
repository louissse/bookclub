import { createRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Route as rootRoute } from './__root';
import { authClient } from '../lib/auth-client';

type Book = {
  id: number;
  title: string;
  author: string;
  rating: number;
  review: string | null;
  createdAt: string;
};

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/books',
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data?.session) {
      throw redirect({ to: '/login' });
    }
  },
  component: BooksPage,
});

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

function BooksPage() {
  const navigate = Route.useNavigate();
  const {
    data: books,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  });

  async function handleSignOut() {
    await authClient.signOut();
    navigate({ to: '/login' });
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>Books</h1>
        <button onClick={handleSignOut}>Sign out</button>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Failed to load books</p>}
      {books && books.length === 0 && <p>No books yet.</p>}
      {books && books.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {books.map((book) => (
            <li
              key={book.id}
              style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}
            >
              <strong>{book.title}</strong> by {book.author}
              <span style={{ marginLeft: 12 }}>{'★'.repeat(book.rating)}</span>
              {book.review && (
                <p style={{ margin: '4px 0 0', color: '#666' }}>
                  {book.review}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
