import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: React.ReactNode
  description?: string
  format?: 'currency' | 'number' | 'percentage'
}

const MetricCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  format = 'number',
}: MetricCardProps) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val)
    }
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'neutral':
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 bg-green-50'
      case 'decrease':
        return 'text-red-600 bg-red-50'
      case 'neutral':
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-gray-600">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-1 mt-1">
            <Badge className={getChangeColor()}>
              <div className="flex items-center space-x-1">
                {getChangeIcon()}
                <span className="text-xs">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            </Badge>
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default MetricCard
