import { formatCurrency } from '@/lib/utils'

interface Product {
  productId: string
  name: string
  price: number
  thumbnail?: string
  revenue: number
  quantitySold: number
}

interface TopProductsTableProps {
  products: Product[]
}

const TopProductsTable = ({ products }: TopProductsTableProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No product data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div
          key={product.productId}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-green-600">#{index + 1}</span>
            </div>
            <div className="flex items-center space-x-2">
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(product.price)} each
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-sm text-green-600">
              {formatCurrency(product.revenue)}
            </p>
            <p className="text-xs text-gray-500">
              {product.quantitySold} sold
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TopProductsTable
