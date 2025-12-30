import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchStart,
  fetchSuccess,
  fetchFailure,
} from "../redux/slices/productSlice";
import { productService } from "../services";
import ProductCard from "../components/ProductCard";
import { Plus } from "lucide-react";

const Products = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { filteredProducts, isLoading, pagination } = useSelector(
    (state) => state.products
  );
  const { user } = useSelector((state) => state.auth);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = [
    "All",
    "Vegetables",
    "Fruits",
    "Grains",
    "Greens",
    "Dairy",
    "Other",
  ];
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
  ];

  // Fetch products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        dispatch(fetchStart());
        const sortMap = {
          newest: "-createdAt",
          price_asc: "price",
          price_desc: "-price",
          rating: "-ratings.average",
        };

        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...(selectedCategory !== "All" && { category: selectedCategory }),
          ...(minPrice > 0 && { minPrice }),
          ...(maxPrice < 10000 && { maxPrice }),
          ...(searchTerm && { search: searchTerm }),
          ...(sortMap[sortBy] && { sort: sortMap[sortBy] }),
        };

        const response = await productService.getAllProducts(params);
        dispatch(
          fetchSuccess({
            products: response.data.data,
            pagination: response.data.pagination || {
              page: currentPage,
              pages: 1,
              total: response.data.data.length,
            },
          })
        );
      } catch (error) {
        dispatch(fetchFailure(error.message));
      }
    };

    fetchProducts();
  }, [
    dispatch,
    selectedCategory,
    minPrice,
    maxPrice,
    searchTerm,
    sortBy,
    currentPage,
  ]);

  // Reset to page 1 when filters change (but not page)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, minPrice, maxPrice, searchTerm, sortBy]);

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setMinPrice(0);
    setMaxPrice(10000);
    setSearchTerm("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const totalProducts = pagination?.total || 0;
  const totalPages = pagination?.pages || 1;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalProducts);

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Fresh Products
        </h1>
        <p className="text-gray-600">
          Handpicked fresh produce from our farmers
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64">
          {/* Search */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Search</h3>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Add Product Button (Authenticated users) */}
          {user && (
            <button
              onClick={() => navigate("/add-product")}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold mb-6 flex items-center justify-center gap-2"
            >
              <span>
                <Plus />
              </span>{" "}
              Add Your Product
            </button>
          )}

          {/* Category Filter */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === cat
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              Price Range
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-2">
                  Min: ₹{minPrice}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-2">
                  Max: ₹{maxPrice}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sort */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Clear Filters
          </button>

          {/* My Orders (for users) */}
          {user && (
            <button
              onClick={() => navigate("/orders")}
              className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              My Orders
            </button>
          )}
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Results Counter */}
          {totalProducts > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-700">
                <span className="font-semibold text-green-600">
                  {startIndex}-{endIndex}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-green-600">
                  {totalProducts}
                </span>{" "}
                products
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === page
                            ? "bg-green-600 text-white font-semibold"
                            : "border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No products found</p>
              <button
                onClick={handleClearFilters}
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Clear filters and try again
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;
