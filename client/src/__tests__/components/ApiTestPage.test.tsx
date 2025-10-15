import ApiTestPage from '@/app/api-test/page'
import { render, screen, waitFor } from '@testing-library/react'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedGenericFunction<typeof fetch>

describe('ApiTestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ApiTestPage />)

    expect(screen.getByText('Loading products...')).toBeInTheDocument()
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Spinner
  })

  it('should display products when API call succeeds', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        description: 'Test description',
        category: { name: 'Electronics' },
        _count: { reviews: 5 },
      },
      {
        id: '2',
        name: 'Another Product',
        price: 149.99,
        description: 'Another description',
        category: { name: 'Clothing' },
        _count: { reviews: 3 },
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProducts,
      }),
    } as Response)

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText('API Test Successful!')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Another Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('$149.99')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Clothing')).toBeInTheDocument()
  })

  it('should display error message when API call fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: { message: 'Database connection failed' },
      }),
    } as Response)

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText('API Test Failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Database connection failed')).toBeInTheDocument()
    expect(screen.getByText('Make sure the database is running and seeded with data.')).toBeInTheDocument()
  })

  it('should display network error message when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText('API Test Failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error occurred')).toBeInTheDocument()
  })

  it('should display no products message when API returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    } as Response)

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText('No Products Found')).toBeInTheDocument()
    })

    expect(screen.getByText('The database is connected but no products were found.')).toBeInTheDocument()
    expect(screen.getByText(/Run.*npm run db:seed.*to populate the database/)).toBeInTheDocument()
  })

  it('should display product count in success message', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 10, description: 'Desc 1', category: { name: 'Cat 1' }, _count: { reviews: 0 } },
      { id: '2', name: 'Product 2', price: 20, description: 'Desc 2', category: { name: 'Cat 2' }, _count: { reviews: 0 } },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProducts,
      }),
    } as Response)

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText(/Database connection is working and 2 products were fetched/)).toBeInTheDocument()
    })
  })

  it('should display review counts for products', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Product with Reviews',
        price: 99.99,
        description: 'Test description',
        category: { name: 'Electronics' },
        _count: { reviews: 5 },
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProducts,
      }),
    } as Response)

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText('5 reviews')).toBeInTheDocument()
    })
  })

  it('should handle malformed API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        // Missing success field
        data: [],
      }),
    } as Response)

    render(<ApiTestPage />)

    await waitFor(() => {
      expect(screen.getByText('API Test Failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to fetch products')).toBeInTheDocument()
  })
})
