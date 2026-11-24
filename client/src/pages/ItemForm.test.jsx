// Frontend tests for the ItemForm page — THIS is the only frontend file you edit.
// Run with:  npm test --workspace client
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ItemForm from './ItemForm.jsx'
import { api } from '../api'

// Replace the real axios instance with fake (mock) functions — no server needed.
// In a test you decide what each one returns, e.g.
//   api.post.mockResolvedValue({ data: { item: {} } })                                  // success
//   api.post.mockRejectedValue({ response: { status: 409, data: { message: '...' } } }) // failure
// and afterwards check how it was called:
//   expect(api.post).toHaveBeenCalledWith('/items', { ... })
jest.mock('../api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() }
}))

// Helper: renders ItemForm at `path`. "/items/new" = report mode, "/items/<id>" = edit mode.
// After a successful save the page navigates to /items, which renders the text "Items page".
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id" element={<ItemForm />} />
        <Route path="/items" element={<div>Items page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// Reset every mock's calls and return values before each test.
beforeEach(() => jest.clearAllMocks())

describe('ItemForm — report mode (/items/new)', () => {
  // Worked example — read it, then write the two tests below in the same style.
  test('renders all fields with their default values', () => {
    renderAt('/items/new')
    expect(screen.getByRole('heading', { name: /report item/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/title/i)).toHaveValue('')
    const [status, category] = screen.getAllByRole('combobox') // the two <select>s
    expect(status).toHaveValue('lost')
    expect(category).toHaveValue('other')
  })

  test('submitting POSTs the five form fields and navigates to /items', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({ data: { item: {} } })
    renderAt('/items/new')

    const [status, category] = screen.getAllByRole('combobox')
    await user.type(screen.getByPlaceholderText(/title/i), 'Blue jacket')
    await user.selectOptions(status, 'found')
    await user.selectOptions(category, 'clothing')
    await user.type(screen.getByPlaceholderText(/location/i), 'Library')
    await user.type(screen.getByPlaceholderText(/description/i), 'Left by the entrance')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(api.post).toHaveBeenCalledWith('/items', {
      title: 'Blue jacket',
      status: 'found',
      category: 'clothing',
      location: 'Library',
      description: 'Left by the entrance'
    })
    expect(await screen.findByText('Items page')).toBeInTheDocument()
  })

  test('shows the server error and stays on the report page', async () => {
    const user = userEvent.setup()
    const message = 'Duplicate item at this location'
    api.post.mockRejectedValueOnce({ response: { data: { message } } })
    renderAt('/items/new')

    await user.type(screen.getByPlaceholderText(/title/i), 'Black backpack')
    await user.type(screen.getByPlaceholderText(/location/i), 'Library')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /report item/i })).toBeInTheDocument()
    expect(screen.queryByText('Items page')).not.toBeInTheDocument()
  })
})
