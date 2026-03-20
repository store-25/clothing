import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit, Trash2, X, Package } from 'lucide-react'
import { api, type Product } from '../services/api'
import ProductService from '../services/productService'
import CartService from '../services/cartService'

const API_BASE_URL = 'http://localhost:5001';

interface ProductManagementProps {
  setCurrentPage?: (page: string) => void
}

export default function ProductManagement({ setCurrentPage }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    mrp: '',
    category: 'T-Shirts',
    gender: 'unisex' as 'male' | 'female' | 'unisex',
    description: '',
    stock: '',
    status: 'active' as 'active' | 'inactive',
    images: [] as Array<{url: string, alt: string, isPrimary: boolean}>,
    sizes: ['M'],
    colors: ['Black'],
    tags: ''
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
  const availableColors = ['Black', 'White', 'Gray', 'Navy', 'Red', 'Blue', 'Green', 'Brown', 'Pink', 'Yellow', 'Purple', 'Orange', 'Khaki', 'Maroon', 'Olive', 'Teal']

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading products...')
      const productsData = await api.getProducts()
      console.log('📊 Products loaded from API:', productsData)
      console.log('📊 Products count:', productsData?.length || 0)
      setProducts(productsData)
      setFilteredProducts(productsData)
      console.log('📊 Products set in state:', productsData)
      console.log('📊 Filtered products set in state:', productsData)
    } catch (error) {
      console.error('❌ Error loading products:', error)
      // Show more detailed error
      console.log(`Error loading products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    let filtered = products
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }, [products, searchTerm])

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // Validate files
      const validFiles = files.filter(file => {
        // Check file type
        if (!file.type.startsWith('image/')) {
          console.log(`${file.name} is not an image file. Please select only images.`);
          return false
        }
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          console.log(`${file.name} is too large. Maximum size is 5MB.`);
          return false
        }
        
        return true
      })
      
      if (validFiles.length === 0) {
        return // No valid files to process
      }
      
      const newImages = [...selectedImages]
      const newPreviews = [...imagePreviews]
      
      validFiles.forEach((file) => {
        if (newImages.length < 4) { // Limit to 4 images
          newImages.push(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            newPreviews.push(reader.result as string)
            if (newPreviews.length === newImages.length) {
              setImagePreviews([...newPreviews])
            }
          }
          reader.readAsDataURL(file)
        } else {
          console.log('Maximum 4 images allowed');
        }
      })
      
      setSelectedImages(newImages)
    }
  }

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleAddProduct = async () => {
    if (submitting) return; // Prevent multiple submissions
    
    console.log('🔍 Form Data Before Validation:', formData);
    console.log('📏 Sizes:', formData.sizes, 'Length:', formData.sizes.length);
    console.log('🎨 Colors:', formData.colors, 'Length:', formData.colors.length);
    
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      console.log('❌ Please fill in all required fields');
      console.log('   Name:', !!formData.name);
      console.log('   Price:', !!formData.price);
      console.log('   Stock:', !!formData.stock);
      console.log('   Category:', !!formData.category);
      return
    }
    
    if (formData.sizes.length === 0) {
      console.log('❌ Please select at least one size');
      return
    }
    
    if (formData.colors.length === 0) {
      console.log('❌ Please select at least one color');
      return
    }

    try {
      setSubmitting(true);
      console.log('🔄 Submitting state set to true');
      
      // Create FormData for product submission
      const formDataToSend = new FormData();
      
      // Append all product fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("mrp", formData.mrp || formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("description", formData.description || 'Product description');
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("tags", formData.tags);
      
      // Append sizes and colors as JSON strings
      formDataToSend.append("sizes", JSON.stringify(formData.sizes));
      formDataToSend.append("colors", JSON.stringify(formData.colors));
      
      // Create variants array
      const variants = [{
        size: formData.sizes[0],
        color: formData.colors[0],
        stock: parseInt(formData.stock),
        sku: `${formData.category}-${formData.name}`.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(formData.price)
      }];
      formDataToSend.append("variants", JSON.stringify(variants));
      
      // Append images if selected
      if (selectedImages.length > 0) {
        console.log('📸 Appending images to FormData:', selectedImages.length, 'files');
        selectedImages.forEach((image, index) => {
          console.log(`   📎 Appending image ${index + 1}:`, image.name);
          formDataToSend.append("images", image);
        });
      }
      
      console.log('📞 Sending product creation request with FormData...');
      
      // Send FormData request
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header - let browser set it with boundary
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });
      
      console.log('📥 Response received:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Product creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Product creation failed: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Product created successfully:', result);
      
      // Reset form after successful submission
      console.log('🔄 Resetting form state...');
      setFormData({
        name: '',
        price: '',
        mrp: '',
        category: 'T-Shirts',
        gender: 'unisex',
        description: '',
        stock: '',
        status: 'active',
        images: [],
        sizes: ['M'],
        colors: ['Black'],
        tags: ''
      });
      setSelectedImages([]);
      setImagePreviews([]);
      setShowAddForm(false);
      
      console.log('📋 Refreshing product list...');
      ProductService.clearCache(); // Clear cache to show new products
      await loadProducts();
      console.log('✅ Product added successfully!');
    } catch (error) {
      console.error('❌ Error adding product:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log(`Error adding product: ${errorMessage}`);
      
      // Show error to user (you could add a toast notification here)
      alert(`Failed to add product: ${errorMessage}`);
    } finally {
      console.log('🔄 Resetting submitting state to false');
      setSubmitting(false);
    }
  }

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProduct = await api.updateProduct(id, updates);
      if (updatedProduct) {
        setProducts(products.map(product =>
          product._id === id ? updatedProduct : product
        ));
        console.log('Product updated successfully!');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      console.log('Error updating product. Please try again.');
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        ProductService.clearCache(); // Clear cache to reflect deletion
        setProducts(products.filter(product => product._id !== id));
        console.log('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        console.log('Error deleting product. Please try again.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage?.('admin-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            </div>
            <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row">
            <div className="mb-6 flex-1">
              <div className="relative">
                <Search size={20} className="text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    console.log('🎨 Rendering filtered products:', filteredProducts);
                    return null;
                  })()}
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      console.log('📦 Rendering product:', product.name, product._id);
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 flex items-center justify-center overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `${API_BASE_URL}/api/placeholder-product.jpg`
                                }}
                              />
                            ) : (
                              <Package size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(product.mrp || product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.stock > 50 ? 'bg-green-100 text-green-800' :
                          product.stock > 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateProduct(product._id, { status: product.status === 'active' ? 'inactive' : 'active' })}
                            className="text-blue-600 hover:text-blue-900 transition"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-900 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* MRP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MRP *
                  </label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({...formData, mrp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Mens, Womens, Hoodies, Oversized, Accessories"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female' | 'unisex'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images (up to 4)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                      id="images-upload"
                    />
                    <label
                      htmlFor="images-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {imagePreviews.length > 0 ? (
                        <div className="w-full">
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => document.getElementById('images-upload')?.click()}
                            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Add More Images
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600">Click to upload images</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each (max 4 images)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Enter product description"
                  />
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="new, trending, sale"
                  />
                </div>

                {/* Sizes Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Sizes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <label key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, sizes: [...formData.sizes, size]})
                            } else {
                              setFormData({...formData, sizes: formData.sizes.filter(s => s !== size)})
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Colors Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Colors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <label key={color} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.colors.includes(color)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, colors: [...formData.colors, color]})
                            } else {
                              setFormData({...formData, colors: formData.colors.filter(c => c !== color)})
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    submitting 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Total Products</h3>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Active Products</h3>
            <p className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Low Stock Items</h3>
            <p className="text-2xl font-bold text-red-600">
              {products.filter(p => p.stock < 20).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
