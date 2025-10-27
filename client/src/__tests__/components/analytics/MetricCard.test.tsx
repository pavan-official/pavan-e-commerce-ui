import MetricCard from '@/components/analytics/MetricCard'
import { render, screen } from '@testing-library/react'
import { DollarSign } from 'lucide-react'

describe('MetricCard', () => {
  it('renders basic metric card', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value={1000}
        icon={<DollarSign />}
      />
    )

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('1,000')).toBeInTheDocument()
  })

  it('formats currency values correctly', () => {
    render(
      <MetricCard
        title="Revenue"
        value={1234.56}
        format="currency"
      />
    )

    expect(screen.getByText('$1,234.56')).toBeInTheDocument()
  })

  it('formats percentage values correctly', () => {
    render(
      <MetricCard
        title="Growth"
        value={15.5}
        format="percentage"
      />
    )

    expect(screen.getByText('15.5%')).toBeInTheDocument()
  })

  it('shows increase trend', () => {
    render(
      <MetricCard
        title="Sales"
        value={1000}
        change={12.5}
        changeType="increase"
      />
    )

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('shows decrease trend', () => {
    render(
      <MetricCard
        title="Sales"
        value={1000}
        change={-5.2}
        changeType="decrease"
      />
    )

    expect(screen.getByText('-5.2%')).toBeInTheDocument()
  })

  it('shows description when provided', () => {
    render(
      <MetricCard
        title="Users"
        value={500}
        description="Total registered users"
      />
    )

    expect(screen.getByText('Total registered users')).toBeInTheDocument()
  })

  it('handles string values', () => {
    render(
      <MetricCard
        title="Status"
        value="Active"
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
